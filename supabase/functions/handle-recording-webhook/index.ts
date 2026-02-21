import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface RecordingWebhookPayload {
  eventId: string;
  recordingUrl: string;
  recordingDuration: number;
  recordingSize: string;
  status: "available" | "failed" | "pending";
}

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    console.warn(`Invalid method: ${req.method}`);
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: corsHeaders }
    );
  }

  try {
    // Log request details
    const contentType = req.headers.get("content-type") || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";
    console.log("Webhook request received:", {
      method: req.method,
      contentType,
      userAgent,
      url: req.url,
    });

    let body: any;
    let rawBody = "";
    
    try {
      rawBody = await req.clone().text();
      console.log("Raw request body:", rawBody.substring(0, 500)); // Log first 500 chars
      body = JSON.parse(rawBody);
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError);
      console.error("Raw body was:", rawBody);
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        { status: 400, headers: corsHeaders }
      );
    }

    console.log("Parsed request body:", JSON.stringify(body).substring(0, 500));
    
    // Handle Pub/Sub message format
    let payload: RecordingWebhookPayload;
    
    if (body.message && body.message.data) {
      // Pub/Sub format: decode base64 message
      console.log("Detected Pub/Sub format");
      const decodedData = atob(body.message.data);
      payload = JSON.parse(decodedData);
    } else if (body.eventId) {
      // Direct JSON format (for testing or direct webhooks)
      console.log("Detected direct JSON format");
      payload = body;
    } else {
      // Unknown format - log and return error
      console.error("Unknown webhook format. Body keys:", Object.keys(body));
      return new Response(
        JSON.stringify({ 
          error: "Unknown webhook format",
          receivedKeys: Object.keys(body),
          hint: "Expected either Pub/Sub format or direct JSON with eventId"
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    console.log("Recording webhook received:", {
      eventId: payload.eventId,
      status: payload.status,
      duration: payload.recordingDuration,
    });

    // Validate payload
    if (!payload.eventId) {
      console.error("Missing eventId in payload:", JSON.stringify(payload));
      // Return 200 OK to prevent Google from retrying
      return new Response(
        JSON.stringify({ 
          error: "Missing eventId",
          warning: "Webhook received but eventId is missing. Check logs for details."
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error("Missing Supabase environment variables");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: corsHeaders }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Find session by google_event_id
    const { data: sessions, error: fetchError } = await supabase
      .from("sessions")
      .select("id, topics_covered, content_category")
      .eq("google_event_id", payload.eventId)
      .limit(1);

    if (fetchError) {
      console.error("Error fetching session:", fetchError);
      // Return 200 OK to prevent Google from retrying
      return new Response(
        JSON.stringify({ 
          error: "Database error", 
          details: fetchError.message,
          warning: "Webhook received but database query failed. Check logs for details."
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!sessions || sessions.length === 0) {
      console.warn(`No session found for eventId: ${payload.eventId}`);
      // Return 200 OK to prevent Google from retrying
      return new Response(
        JSON.stringify({ 
          warning: "No session found for this event",
          eventId: payload.eventId,
          hint: "Session may not have been created yet or google_event_id was not stored"
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const session = sessions[0];
    console.log(`Found session: ${session.id} for topic: ${session.topics_covered}`);

    // Update session with recording metadata
    const updateData: any = {
      recording_status: payload.status,
      recording_created_at: new Date().toISOString(),
    };

    // Only update URL and duration if status is available
    if (payload.status === "available") {
      updateData.recording_url = payload.recordingUrl;
      updateData.recording_duration = payload.recordingDuration;
      updateData.recording_size = payload.recordingSize;
    }

    const { error: updateError } = await supabase
      .from("sessions")
      .update(updateData)
      .eq("id", session.id);

    if (updateError) {
      console.error("Error updating session:", updateError);
      // Return 200 OK to prevent Google from retrying
      return new Response(
        JSON.stringify({ 
          error: "Failed to update session", 
          details: updateError.message,
          warning: "Webhook received and session found, but update failed. Check logs for details."
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Successfully updated session ${session.id} with recording status: ${payload.status}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Recording metadata updated",
        sessionId: session.id,
        status: payload.status,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Webhook handler error:", errorMessage);
    console.error("Request body:", await req.clone().text());
    
    // Return 200 OK to prevent Google from retrying
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        details: errorMessage,
        warning: "Webhook received but handler crashed. Check logs for details."
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
