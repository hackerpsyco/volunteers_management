import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.0";

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
  coordinatorEmail?: string;
  coordinatorName?: string;
  meetingLink?: string;
}

// Convert PEM private key to DER format
function pemToDer(pem: string): ArrayBuffer {
  const lines = pem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\n/g, "");
  const binaryString = atob(lines);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Simple JWT creation for Service Account
async function createServiceAccountJWT(
  serviceAccountEmail: string,
  privateKey: string,
  userEmail: string
): Promise<string> {
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccountEmail,
    scope: "https://www.googleapis.com/auth/calendar",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
    sub: userEmail,
  };

  const headerEncoded = btoa(JSON.stringify(header))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
  const payloadEncoded = btoa(JSON.stringify(payload))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  const signatureInput = `${headerEncoded}.${payloadEncoded}`;

  // Convert PEM to DER
  const derKey = pemToDer(privateKey);

  // Import crypto for signing
  const key = await crypto.subtle.importKey(
    "pkcs8",
    derKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(signatureInput)
  );

  const signatureEncoded = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  return `${signatureInput}.${signatureEncoded}`;
}

async function getAccessToken(
  serviceAccountEmail: string,
  privateKey: string,
  userEmail: string
): Promise<string> {
  const jwt = await createServiceAccountJWT(
    serviceAccountEmail,
    privateKey,
    userEmail
  );

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }).toString(),
  });

  const data = await response.json();
  
  if (!data.access_token) {
    console.error("Token exchange failed:", data);
    throw new Error(`Failed to get access token: ${JSON.stringify(data)}`);
  }
  
  return data.access_token;
}

async function createCalendarEventWithServiceAccount(
  email: string,
  event: any,
  serviceAccountEmail: string,
  privateKey: string,
  workspaceDomain: string
): Promise<string> {
  try {
    // Check if email is from Workspace domain
    const emailDomain = email.split("@")[1];
    const isWorkspaceEmail = emailDomain === workspaceDomain;

    let accessToken: string;

    if (isWorkspaceEmail) {
      // Use Service Account with domain-wide delegation for Workspace emails
      accessToken = await getAccessToken(
        serviceAccountEmail,
        privateKey,
        email
      );
    } else {
      // For external emails, create event on service account's calendar
      // and add external email as attendee
      accessToken = await getAccessToken(
        serviceAccountEmail,
        privateKey,
        serviceAccountEmail
      );
    }

    // Create calendar event
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?sendNotifications=true`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      try {
        const errorData = JSON.parse(errorText);
        console.warn(`Failed to create event for ${email}:`, errorData);
        
        // Check for specific errors
        if (errorData.error?.message?.includes("Domain-Wide Delegation")) {
          console.warn(`Domain-Wide Delegation not set up for ${email}. Please configure in Google Workspace Admin Console.`);
        }
        if (errorData.error?.message?.includes("not been used in project")) {
          console.warn(`Google Calendar API not enabled. Please enable it in Google Cloud Console.`);
        }
      } catch {
        console.warn(`Failed to create event for ${email}:`, errorText);
      }
      return "";
    }

    const data = await response.json();
    console.log(`Successfully created event for ${email}:`, data.id);
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
    const workspaceDomain = Deno.env.get("GOOGLE_WORKSPACE_DOMAIN");

    if (!serviceAccountEmail || !privateKey || !workspaceDomain) {
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

    // Validate that emails are from Workspace domain
    const calendarEvent = {
      summary: syncData.title,
      description: syncData.description + (syncData.meetingLink ? `\n\n📹 Google Meet: ${syncData.meetingLink}` : ""),
      start: {
        dateTime: syncData.startDateTime,
        timeZone: "UTC",
      },
      end: {
        dateTime: syncData.endDateTime,
        timeZone: "UTC",
      },
      attendees: [
        { email: syncData.volunteerEmail, displayName: syncData.volunteerName, optional: false },
        { email: syncData.facilitatorEmail, displayName: syncData.facilitatorName, optional: false },
        ...(syncData.coordinatorEmail ? [{ email: syncData.coordinatorEmail, displayName: syncData.coordinatorName, optional: false }] : []),
      ],
      conferenceData: {
        createRequest: {
          requestId: crypto.randomUUID(),
          conferenceSolutionKey: {
            type: "hangoutsMeet",
          },
        },
      },
      sendNotifications: true,
    };

    let volunteerEventId = "";
    let facilitatorEventId = "";
    let coordinatorEventId = "";

    // Create events for all emails (both Workspace and external)
    volunteerEventId = await createCalendarEventWithServiceAccount(
      syncData.volunteerEmail,
      calendarEvent,
      serviceAccountEmail,
      privateKey,
      workspaceDomain
    );

    facilitatorEventId = await createCalendarEventWithServiceAccount(
      syncData.facilitatorEmail,
      calendarEvent,
      serviceAccountEmail,
      privateKey,
      workspaceDomain
    );

    // Create event for coordinator if provided
    if (syncData.coordinatorEmail) {
      coordinatorEventId = await createCalendarEventWithServiceAccount(
        syncData.coordinatorEmail,
        calendarEvent,
        serviceAccountEmail,
        privateKey,
        workspaceDomain
      );
    }

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
        coordinatorEventId,
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
