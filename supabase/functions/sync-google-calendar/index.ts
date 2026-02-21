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

  classEmail?: string;     // ✅ NEW
  centreEmail?: string;    // ✅ NEW

  googleEventId?: string;
}

/* -------------------- HELPERS -------------------- */

// ✅ Safe attendee builder
function buildAttendees(body: CalendarSyncRequest) {
  const emails = [
    ...(body.volunteerEmails || []),
    body.volunteerEmail,
    body.facilitatorEmail,
    body.coordinatorEmail,
    body.classEmail,      // ✅ NEW
    body.centreEmail,     // ✅ NEW
  ];

  return emails
    .filter(email => email && typeof email === 'string' && email.trim().length > 0)   // ✅ Skip NULL / empty / undefined
    .map(email => ({
      email: email.trim(),
      responseStatus: "needsAction",
    }));
}

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

// JWT
async function createJWT(serviceAccountEmail: string, privateKey: string) {
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);

  const payload = {
    iss: serviceAccountEmail,
    sub: ORGANIZER_EMAIL,
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

async function getAccessToken(serviceAccountEmail: string, privateKey: string) {
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
    throw new Error(JSON.stringify(data));
  }

  return data.access_token;
}

async function createCalendarEvent(event: any, serviceAccountEmail: string, privateKey: string) {
  const token = await getAccessToken(serviceAccountEmail, privateKey);

  // Validate attendees before sending
  if (event.attendees && Array.isArray(event.attendees)) {
    event.attendees = event.attendees.filter((attendee: any) => {
      const isValid = attendee.email && typeof attendee.email === 'string' && attendee.email.includes('@');
      if (!isValid) {
        console.warn(`Skipping invalid attendee email: ${attendee.email}`);
      }
      return isValid;
    });
  }

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
    const errorText = await res.text();
    console.error(`Calendar API error (${res.status}):`, errorText);
    throw new Error(`Calendar API error: ${res.status} - ${errorText}`);
  }

  const data = await res.json();
  return data.id;
}

/* -------------------- SERVER -------------------- */

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body: CalendarSyncRequest = await req.json();

    const serviceAccountEmail = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_EMAIL");
    const privateKey = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY")?.replace(/\\n/g, "\n");

    if (!serviceAccountEmail || !privateKey) {
      console.error("Missing required environment variables");
      return new Response(
        JSON.stringify({ error: "Missing GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate required fields
    if (!body.title || !body.startDateTime || !body.endDateTime) {
      console.error("Missing required fields:", { title: body.title, startDateTime: body.startDateTime, endDateTime: body.endDateTime });
      return new Response(
        JSON.stringify({ error: "Missing required fields: title, startDateTime, endDateTime" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const attendees = buildAttendees(body);   // ✅ NEW LOGIC

    const event = {
      summary: body.title,
      description: body.description,
      start: { dateTime: body.startDateTime, timeZone: "UTC" },
      end: { dateTime: body.endDateTime, timeZone: "UTC" },

      attendees,   // ✅ SAFE

      conferenceData: {
        createRequest: {
          requestId: crypto.randomUUID(),
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
    };

    const eventId = await createCalendarEvent(
      event,
      serviceAccountEmail,
      privateKey
    );

    console.log(`Successfully created calendar event: ${eventId}`);

    // ✅ UPDATE SESSION WITH GOOGLE EVENT ID
    if (body.sessionId) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

      if (!supabaseUrl || !supabaseServiceRoleKey) {
        console.error("Missing Supabase environment variables");
        return new Response(
          JSON.stringify({ 
            error: "Server configuration error",
            warning: "Calendar event created but couldn't update session with eventId"
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

      const { error: updateError } = await supabase
        .from("sessions")
        .update({ google_event_id: eventId })
        .eq("id", body.sessionId);

      if (updateError) {
        console.error("Error updating session with google_event_id:", updateError);
        return new Response(
          JSON.stringify({ 
            error: "Failed to update session with eventId",
            details: updateError.message,
            warning: "Calendar event created but couldn't link to session"
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Successfully updated session ${body.sessionId} with google_event_id: ${eventId}`);
    }

    return new Response(
      JSON.stringify({ success: true, eventId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("Calendar sync error:", errorMessage);
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
