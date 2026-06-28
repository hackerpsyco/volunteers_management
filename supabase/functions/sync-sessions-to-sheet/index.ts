import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.0";
import { JWT } from "npm:google-auth-library@9.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Authenticate Request (must match service role key if service role is set)
    const authHeader = req.headers.get('Authorization');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (serviceRoleKey && authHeader !== `Bearer ${serviceRoleKey}`) {
      console.warn("Unauthorized attempt to trigger Google Sheet sync");
      return new Response(JSON.stringify({ error: "Unauthorized" }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // 2. Fetch Google credentials from environment variables
    const email = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_EMAIL') || Deno.env.get('GOOGLE_SERVICE_ACCOUNT_EMAIL2');
    let key = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY') || Deno.env.get('GOOGLE_PRIVATE_KEY') || Deno.env.get('GOOGLE_PRIVATE_KEY2');
    const sheetId = Deno.env.get('GOOGLE_SHEET_ID') || Deno.env.get('GOOGLE_SPREADSHEET_ID');

    if (!email || !key) {
      throw new Error("Missing Google Service Account credentials (GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_PRIVATE_KEY) in environment variables");
    }

    if (!sheetId) {
      throw new Error("Missing Google Sheet ID (GOOGLE_SHEET_ID) in environment variables");
    }

    // 3. Determine current academic year (June 1st to May 31st)
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0 = Jan, 5 = June
    
    const selectedYear = currentMonth >= 5 
      ? `${currentYear}-${String(currentYear + 1).slice(-2)}`
      : `${currentYear - 1}-${String(currentYear).slice(-2)}`;

    const [startYearStr] = selectedYear.split('-');
    const startYear = parseInt(startYearStr);
    const startDate = new Date(startYear, 5, 1); // June 1st
    const endDate = new Date(startYear + 1, 4, 31, 23, 59, 59); // May 31st

    console.log(`Syncing curriculum session status for Academic Year: ${selectedYear}`);
    console.log(`Sessions range: ${startDate.toISOString()} to ${endDate.toISOString()}`);

    // 4. Initialize Supabase Client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 5. Fetch Curriculum and Classes Info
    const { data: curriculumData, error: curriculumError } = await supabase
      .from('curriculum')
      .select(`*, classes:class_id(name)`)
      .order('content_category', { ascending: true })
      .order('module_no', { ascending: true });

    if (curriculumError) throw curriculumError;

    // 6. Fetch Actual Session Executions for current academic year
    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .select('id, topics_covered, status, volunteer_name, class_batch, session_date')
      .gte('session_date', startDate.toISOString().split('T')[0])
      .lte('session_date', endDate.toISOString().split('T')[0]);

    if (sessionError) throw sessionError;

    // 7. Map Sessions to Topics by Class (matching UI's logical keys)
    const topicSessions = new Map<string, any[]>();
    (sessionData || []).forEach(session => {
      if (!session.topics_covered || !session.class_batch) return;
      const key = `${session.class_batch.trim()}||${session.topics_covered.trim()}`;
      const existing = topicSessions.get(key) || [];
      existing.push(session);
      topicSessions.set(key, existing);
    });

    // 8. Construct Google Sheets Data Rows
    const values: any[][] = [
      [
        'Class Name',
        'Content Category',
        'Module No',
        'Module Name',
        'Topic Title',
        'Videos',
        'Quiz/Content/PPT',
        'Fresh Session',
        'Revision Session',
        'Status',
        'Latest Date',
        'Volunteer'
      ]
    ];

    const formatDate = (dateStr: string) => {
      if (!dateStr) return '-';
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '-';
      const day = String(d.getDate()).padStart(2, '0');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[d.getMonth()];
      const year = d.getFullYear();
      return `${day} ${month} ${year}`;
    };

    (curriculumData || []).forEach(item => {
      const className = item.classes?.name || 'Unknown';
      const cleanModuleTitle = item.module_name?.replace(/^-\s+/, '') || '';
      const topic = item.topics_covered || '';
      const key = `${className.trim()}||${topic.trim()}`;
      const sessions = topicSessions.get(key) || [];
      
      let status = 'Not Started';
      let volunteerName = '-';
      let latestDate = '-';

      if (sessions.length > 0) {
        // Sort sessions by date descending
        sessions.sort((a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime());
        
        // Find if there's any completed session
        const completedSession = sessions.find(s => s.status === 'completed');
        
        if (completedSession) {
          status = 'Completed';
          volunteerName = completedSession.volunteer_name || 'Unknown';
          latestDate = formatDate(completedSession.session_date);
        } else {
          // Use latest session status
          const latestSession = sessions[0];
          status = latestSession.status 
            ? (latestSession.status.charAt(0).toUpperCase() + latestSession.status.slice(1).replace('_', ' ')) 
            : 'In Progress';
          volunteerName = latestSession.volunteer_name || '-';
          latestDate = formatDate(latestSession.session_date);
        }
      }

      values.push([
        className,
        item.content_category || '-',
        item.module_no || '-',
        cleanModuleTitle || '-',
        topic || '-',
        item.videos || '',
        item.quiz_content_ppt || '',
        '', // Matches UI manual export placeholders
        '',
        status,
        latestDate,
        volunteerName
      ]);
    });

    // 9. Authenticate with Google
    key = key.replace(/\\n/g, '\n');
    const auth = new JWT({
      email: email,
      key: key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const accessTokenObj = await auth.getAccessToken();
    const token = accessTokenObj.token;

    if (!token) {
      throw new Error("Failed to retrieve Google access token");
    }

    // 10. Fetch first sheet title dynamically
    const sheetInfoRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=sheets.properties.title`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!sheetInfoRes.ok) {
      const errText = await sheetInfoRes.text();
      throw new Error(`Google Sheets API metadata error: ${sheetInfoRes.statusText} - ${errText}`);
    }

    const sheetInfo = await sheetInfoRes.json();
    const firstSheetName = sheetInfo.sheets?.[0]?.properties?.title || 'Sheet1';
    console.log(`Syncing data to Google Sheet Tab: "${firstSheetName}"`);

    // 11. Clear existing sheet contents
    const clearRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(firstSheetName)}:clear`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    if (!clearRes.ok) {
      const errText = await clearRes.text();
      throw new Error(`Google Sheets API clear error: ${clearRes.statusText} - ${errText}`);
    }

    // 12. Overwrite sheet with updated values
    const writeRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(firstSheetName)}?valueInputOption=USER_ENTERED`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: firstSheetName,
        majorDimension: 'ROWS',
        values: values,
      })
    });

    if (!writeRes.ok) {
      const errText = await writeRes.text();
      throw new Error(`Google Sheets API write error: ${writeRes.statusText} - ${errText}`);
    }

    console.log(`Sync complete. Transferred ${values.length - 1} rows successfully.`);

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Google Sheet synchronized successfully",
      academicYear: selectedYear,
      rowsSynced: values.length - 1
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('Error in sync-sessions-to-sheet:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
