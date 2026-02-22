import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface EmailData {
  from?: string;
  sender_email?: string;
  from_email?: string;
  subject: string;
  body?: string;
  plain_text_body?: string;
  html?: string;
  html_body?: string;
  messageId?: string;
}

// Extract recording URL from email body
function extractRecordingUrl(emailBody: string, htmlBody?: string): string | null {
  // Try HTML first (more reliable)
  if (htmlBody) {
    // Look for Google Drive links in href attributes
    const driveMatch = htmlBody.match(/href="(https:\/\/drive\.google\.com\/file\/d\/[^"]+)"/);
    if (driveMatch) return driveMatch[1];
    
    // Look for direct links in text
    const directMatch = htmlBody.match(/(https:\/\/drive\.google\.com\/file\/d\/[^\s<"]+)/);
    if (directMatch) return directMatch[1];
  }

  // Try plain text
  const textMatch = emailBody.match(/(https:\/\/drive\.google\.com\/file\/d\/[^\s]+)/);
  if (textMatch) return textMatch[1];

  return null;
}

// Extract session info from email subject or body
function extractSessionInfo(subject: string, body: string): { title?: string; eventId?: string } {
  const info: { title?: string; eventId?: string } = {};

  // Try to extract from subject
  // Subject format: "WES GT Session - Class 7 - by piyush tamoli - 32. Data Visualization"
  const subjectMatch = subject.match(/WES GT Session - (.+)/);
  if (subjectMatch) {
    info.title = subjectMatch[1];
  }

  // Try to extract eventId from body (if included)
  const eventIdMatch = body.match(/eventId[:\s]+([a-zA-Z0-9]+)/i);
  if (eventIdMatch) {
    info.eventId = eventIdMatch[1];
  }

  return info;
}

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: corsHeaders }
    );
  }

  try {
    const emailData: EmailData = await req.json();

    // Normalize field names (Zapier uses different field names)
    const from = emailData.from || emailData.sender_email || emailData.from_email || "";
    const subject = emailData.subject || "";
    const body = emailData.body || emailData.plain_text_body || "";
    const html = emailData.html || emailData.html_body;

    console.log("Email received:", {
      from,
      subject,
      hasHtml: !!html,
    });

    // Verify it's from Google or your organization
    const isFromGoogle = from.includes("google.com");
    const isFromOrganization = from.includes("wazireducationsociety.com");
    
    if (!isFromGoogle && !isFromOrganization) {
      console.warn("Email not from Google or organization, ignoring");
      return new Response(
        JSON.stringify({ warning: "Email not from Google or organization" }),
        { status: 200, headers: corsHeaders }
      );
    }

    // Verify it's a recording notification
    if (!subject.includes("recording") && !subject.includes("Meet")) {
      console.warn("Email not about recording, ignoring");
      return new Response(
        JSON.stringify({ warning: "Email not about recording" }),
        { status: 200, headers: corsHeaders }
      );
    }

    // Extract recording URL
    const recordingUrl = extractRecordingUrl(body, html);
    if (!recordingUrl) {
      console.error("Could not extract recording URL from email");
      return new Response(
        JSON.stringify({ error: "No recording URL found in email" }),
        { status: 400, headers: corsHeaders }
      );
    }

    console.log("Recording URL extracted:", recordingUrl);

    // Extract session info
    const sessionInfo = extractSessionInfo(subject, body);
    console.log("Session info extracted:", sessionInfo);

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

    // Find session by title or eventId
    let session = null;

    // Try to find by eventId first
    if (sessionInfo.eventId) {
      const { data, error } = await supabase
        .from("sessions")
        .select("id, title, topics_covered")
        .eq("google_event_id", sessionInfo.eventId)
        .limit(1);

      if (data && data.length > 0) session = data[0];
    }

    // If not found, try to find by title
    if (!session && sessionInfo.title) {
      const { data, error } = await supabase
        .from("sessions")
        .select("id, title, topics_covered")
        .ilike("title", `%${sessionInfo.title}%`)
        .order("created_at", { ascending: false })
        .limit(1);

      if (data && data.length > 0) session = data[0];
    }

    // If still not found, find most recent session
    if (!session) {
      const { data, error } = await supabase
        .from("sessions")
        .select("id, title, topics_covered")
        .order("created_at", { ascending: false })
        .limit(1);

      if (data && data.length > 0) session = data[0];
    }

    if (!session) {
      console.warn("No session found to update");
      return new Response(
        JSON.stringify({ warning: "No session found" }),
        { status: 404, headers: corsHeaders }
      );
    }

    console.log(`Found session: ${session.id} - ${session.title}`);

    // Update session with recording URL
    const { error: updateError } = await supabase
      .from("sessions")
      .update({
        recording_url: recordingUrl,
        recording_status: "available",
        recording_created_at: new Date().toISOString(),
      })
      .eq("id", session.id);

    if (updateError) {
      console.error("Error updating session:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update session", details: updateError.message }),
        { status: 500, headers: corsHeaders }
      );
    }

    console.log(`Successfully updated session ${session.id} with recording URL`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Recording URL extracted and session updated",
        sessionId: session.id,
        recordingUrl: recordingUrl,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Email parser error:", errorMessage);

    return new Response(
      JSON.stringify({ error: "Internal server error", details: errorMessage }),
      { status: 500, headers: corsHeaders }
    );
  }
});
