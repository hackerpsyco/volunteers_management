import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.0";
import { JWT } from "https://esm.sh/google-auth-library@9";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface CalendarSyncRequest {
  sessionId: string;
  title: string;
  description: string;
  startDateTime: string;
  endDateTime: string;
  volunteerEmail: string;
  volunteerName: string;
  facilitatorEmail: string;
  facilitatorName: string;
}

async function createCalendarEventWithServiceAccount(
  email: string,
  event: any,
  serviceAccountEmail: string,
  privateKey: string
): Promise<string> {
  try {
    // Create JWT client for domain-wide delegation
    const client = new JWT({
      email: serviceAccountEmail,
      key: privateKey,
      scopes: ["https://www.googleapis.com/auth/calendar"],
      subject: email, // Impersonate the user
    });

    // Get access token
    const { access_token } = await client.authorize();

    // Create calendar event
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.warn(`Failed to create event for ${email}:`, error);
      return "";
    }

    const data = await response.json();
    return data.id || "";
  } catch (error) {
    console.warn(`Error creating calendar event for ${email}:`, error);
    return "";
  }
}

serve(async (req: Request) => {
  // Preflight (CORS)
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // Verify request has required data (basic validation instead of auth)
  let syncData: CalendarSyncRequest;
  try {
    syncData = await req.json();

    if (
      !syncData.sessionId ||
      !syncData.title ||
      !syncData.startDateTime ||
      !syncData.endDateTime ||
      !syncData.volunteerEmail ||
      !syncData.facilitatorEmail
    ) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const serviceAccountEmail = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_EMAIL");
    const privateKey = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY");

    if (!serviceAccountEmail || !privateKey) {
      return new Response(
        JSON.stringify({
          error: "Google Service Account not configured",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const calendarEvent = {
      summary: syncData.title,
      description: syncData.description || "",
      start: {
        dateTime: syncData.startDateTime,
        timeZone: "UTC",
      },
      end: {
        dateTime: syncData.endDateTime,
        timeZone: "UTC",
      },
      attendees: [
        { email: syncData.volunteerEmail, displayName: syncData.volunteerName },
        { email: syncData.facilitatorEmail, displayName: syncData.facilitatorName },
      ],
      sendNotifications: true,
    };

    let volunteerEventId = "";
    let facilitatorEventId = "";

    // Create events for both volunteer and facilitator using Service Account
    volunteerEventId = await createCalendarEventWithServiceAccount(
      syncData.volunteerEmail,
      calendarEvent,
      serviceAccountEmail,
      privateKey
    );

    facilitatorEventId = await createCalendarEventWithServiceAccount(
      syncData.facilitatorEmail,
      calendarEvent,
      serviceAccountEmail,
      privateKey
    );

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      await supabase.from("calendar_syncs").insert([
        {
          session_id: syncData.sessionId,
          google_event_id: volunteerEventId || facilitatorEventId,
          synced_at: new Date().toISOString(),
        },
      ]);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Calendar invitations sent",
        volunteerEventId,
        facilitatorEventId,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
