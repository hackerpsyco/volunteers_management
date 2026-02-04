import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.0";

/* -------------------- CONFIG -------------------- */

const ORGANIZER_EMAIL = "gtsession@wazireducationsociety.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, DELETE, PATCH, OPTIONS",
};

/* -------------------- TYPES -------------------- */

interface CalendarSyncRequest {
  sessionId: string;
  title?: string;
  description?: string;
  startDateTime?: string;
  endDateTime?: string;
  volunteerEmail?: string;
  volunteerEmails?: string[];
  facilitatorEmail?: string;
  coordinatorEmail?: string;
  googleEventId?: string;
  volunteerName?: string;
  facilitatorName?: string;
  coordinatorName?: string;
  contentCategory?: string;
  moduleName?: string;
  topicsCovered?: string;
  videos?: string;
  quizContentPpt?: string;
  meetingLink?: string;
}

/* -------------------- HELPERS -------------------- */

// PEM → DER
function pemToDer(pem: string): ArrayBuffer {
  const clean = pem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\n/g, "");
  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Create JWT
async function createJWT(
  serviceAccountEmail: string,
  privateKey: string
): Promise<string> {
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);

  const payload = {
    iss: serviceAccountEmail,
    sub: ORGANIZER_EMAIL, // 🔥 ALWAYS impersonate ONE USER
    scope: "https://www.googleapis.com/auth/calendar",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const encode = (obj: any) =>
    btoa(JSON.stringify(obj))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");

  const data = `${encode(header)}.${encode(payload)}`;

  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToDer(privateKey),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(data)
  );

  const sig = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  return `${data}.${sig}`;
}

// Exchange JWT → Access Token
async function getAccessToken(
  serviceAccountEmail: string,
  privateKey: string
): Promise<string> {
  const jwt = await createJWT(serviceAccountEmail, privateKey);

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  const data = await res.json();
  if (!data.access_token) {
    throw new Error(`Token error: ${JSON.stringify(data)}`);
  }
  return data.access_token;
}

// Create calendar event
async function createCalendarEvent(
  event: any,
  serviceAccountEmail: string,
  privateKey: string
): Promise<string> {
  const token = await getAccessToken(serviceAccountEmail, privateKey);

  const res = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&sendNotifications=true",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }

  const data = await res.json();
  return data.id;
}

// Delete calendar event
async function deleteCalendarEvent(
  eventId: string,
  serviceAccountEmail: string,
  privateKey: string
): Promise<void> {
  const token = await getAccessToken(serviceAccountEmail, privateKey);

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}?sendNotifications=true`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok && res.status !== 404) {
    const err = await res.text();
    throw new Error(err);
  }
}

// Update calendar event
async function updateCalendarEvent(
  eventId: string,
  event: any,
  serviceAccountEmail: string,
  privateKey: string
): Promise<void> {
  const token = await getAccessToken(serviceAccountEmail, privateKey);

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}?conferenceDataVersion=1&sendNotifications=true`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
}

/* -------------------- SERVER -------------------- */

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST" && req.method !== "DELETE" && req.method !== "PATCH") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body: CalendarSyncRequest = await req.json();

    const serviceAccountEmail =
      Deno.env.get("GOOGLE_SERVICE_ACCOUNT_EMAIL");
    const privateKey =
      Deno.env.get("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY")?.replace(
        /\\n/g,
        "\n"
      );

    if (!serviceAccountEmail || !privateKey) {
      throw new Error("Service Account ENV missing");
    }

    // Handle DELETE request
    if (req.method === "DELETE") {
      // Get the Google event ID from the database
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data: syncData } = await supabase
          .from("calendar_syncs")
          .select("google_event_id")
          .eq("session_id", body.sessionId)
          .single();

        if (syncData?.google_event_id) {
          await deleteCalendarEvent(
            syncData.google_event_id,
            serviceAccountEmail,
            privateKey
          );

          // Delete from sync table
          await supabase
            .from("calendar_syncs")
            .delete()
            .eq("session_id", body.sessionId);
        }
      }

      return new Response(
        JSON.stringify({ success: true, message: "Event deleted" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle PATCH request (update event)
    if (req.method === "PATCH") {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data: syncData } = await supabase
          .from("calendar_syncs")
          .select("google_event_id")
          .eq("session_id", body.sessionId)
          .single();

        if (syncData?.google_event_id) {
          const event = {
            summary: body.title,
            description: body.description,
            start: { dateTime: body.startDateTime, timeZone: "UTC" },
            end: { dateTime: body.endDateTime, timeZone: "UTC" },
            attendees: [
              // Add all volunteer emails (personal and work)
              ...(body.volunteerEmails && body.volunteerEmails.length > 0
                ? body.volunteerEmails.map(email => ({ email, responseStatus: "needsAction" }))
                : body.volunteerEmail ? [{ email: body.volunteerEmail, responseStatus: "needsAction" }] : []),
              ...(body.facilitatorEmail ? [{ email: body.facilitatorEmail, responseStatus: "needsAction" }] : []),
              ...(body.coordinatorEmail ? [{ email: body.coordinatorEmail, responseStatus: "needsAction" }] : []),
            ].filter(attendee => attendee.email && attendee.email.trim()),
            sendNotifications: true,
          };

          await updateCalendarEvent(
            syncData.google_event_id,
            event,
            serviceAccountEmail,
            privateKey
          );
        }
      }

      return new Response(
        JSON.stringify({ success: true, message: "Event updated" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle POST request (create event)
    const event = {
      summary: body.title,
      description: body.description,
      start: { dateTime: body.startDateTime, timeZone: "UTC" },
      end: { dateTime: body.endDateTime, timeZone: "UTC" },
      attendees: [
        // Add all volunteer emails (personal and work)
        ...(body.volunteerEmails && body.volunteerEmails.length > 0
          ? body.volunteerEmails.map(email => ({ email, responseStatus: "needsAction" }))
          : body.volunteerEmail ? [{ email: body.volunteerEmail, responseStatus: "needsAction" }] : []),
        ...(body.facilitatorEmail ? [{ email: body.facilitatorEmail, responseStatus: "needsAction" }] : []),
        ...(body.coordinatorEmail ? [{ email: body.coordinatorEmail, responseStatus: "needsAction" }] : []),
      ].filter(attendee => attendee.email && attendee.email.trim()),
      conferenceData: {
        createRequest: {
          requestId: crypto.randomUUID(),
          conferenceSolutionKey: { type: "hangoutsMeet" },
          conferenceLevelRecordingSettings: {
            recordingType: "RECORDING_TYPE_UNSPECIFIED",
          },
        },
      },
      sendNotifications: true,
    };

    const eventId = await createCalendarEvent(
      event,
      serviceAccountEmail,
      privateKey
    );

    // Optional: save to Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      await supabase.from("calendar_syncs").insert({
        session_id: body.sessionId,
        google_event_id: eventId,
        synced_at: new Date().toISOString(),
      });
    }

    return new Response(
      JSON.stringify({ success: true, eventId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: corsHeaders }
    );
  }
});
