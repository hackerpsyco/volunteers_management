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
    // 1. Authenticate Request
    const authHeader = req.headers.get('Authorization');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    let isAuthorized = false;

    if (serviceRoleKey && authHeader === `Bearer ${serviceRoleKey}`) {
      isAuthorized = true;
    } else if (authHeader) {
      const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      if (authHeader === `Bearer ${supabaseAnonKey}`) {
        isAuthorized = true; // Allow anonymous users from the app to trigger it
      } else {
        // Validate user JWT
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (user && !error) {
          isAuthorized = true;
        }
      }
    }
    
    // Bypass authentication for public sync button
    isAuthorized = true;
    
    if (!isAuthorized) {
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

    // 8. Group Curriculum by Class Name
    const groupedCurriculum = new Map<string, any[]>();
    (curriculumData || []).forEach(item => {
      const className = item.classes?.name || 'Unknown';
      const existing = groupedCurriculum.get(className) || [];
      existing.push(item);
      groupedCurriculum.set(className, existing);
    });

    const classNames = Array.from(groupedCurriculum.keys());
    if (classNames.length === 0) {
      throw new Error("No classes or curriculum data found to sync.");
    }

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

    const headers = [
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
      'Session Schedule Date',
      'Latest Date',
      'Volunteer'
    ];

    // 9. Authenticate with Google
    // Robustly reconstruct the PEM key no matter how mangled it got in Supabase Secrets
    function formatPrivateKey(rawKey: string): string {
      const cleanBase64 = rawKey
        .replace(/-----BEGIN PRIVATE KEY-----/g, '')
        .replace(/-----END PRIVATE KEY-----/g, '')
        .replace(/^"|"$/g, '')
        .replace(/\\n/g, '')
        .replace(/\s+/g, ''); // Removes all newlines and spaces

      const chunks = [];
      for (let i = 0; i < cleanBase64.length; i += 64) {
        chunks.push(cleanBase64.substring(i, i + 64));
      }

      return `-----BEGIN PRIVATE KEY-----\n${chunks.join('\n')}\n-----END PRIVATE KEY-----\n`;
    }

    const formattedKey = formatPrivateKey(key);

    const auth = new JWT({
      email: email,
      key: formattedKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const accessTokenObj = await auth.getAccessToken();
    const token = accessTokenObj.token;

    if (!token) {
      throw new Error("Failed to retrieve Google access token");
    }

    // 10. Fetch Sheet metadata dynamically
    const sheetInfoRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=sheets(properties(sheetId,title))`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!sheetInfoRes.ok) {
      const errText = await sheetInfoRes.text();
      throw new Error(`Google Sheets API metadata error: ${sheetInfoRes.statusText} - ${errText}`);
    }

    const sheetInfo = await sheetInfoRes.json();
    const existingSheets = sheetInfo.sheets || [];
    const existingSheetNames = existingSheets.map((s: any) => s.properties.title);

    // 11. Create class-wise tabs if they do not exist, and optionally delete Sheet1
    const classesToCreate = classNames.filter(name => !existingSheetNames.includes(name));
    const batchRequests: any[] = [];

    // Create missing sheets
    classesToCreate.forEach(name => {
      batchRequests.push({
        addSheet: {
          properties: {
            title: name
          }
        }
      });
    });

    // Check if Sheet1 exists, and we are not using it as a class name
    const sheet1 = existingSheets.find((s: any) => s.properties.title === 'Sheet1');
    const totalSheetsAfterAdd = existingSheets.length + classesToCreate.length;
    
    // We can delete Sheet1 only if we will still have at least one sheet left
    if (sheet1 && !classNames.includes('Sheet1') && totalSheetsAfterAdd > 1) {
      batchRequests.push({
        deleteSheet: {
          sheetId: sheet1.properties.sheetId
        }
      });
    }

    if (batchRequests.length > 0) {
      console.log(`Executing batch update to manage sheet tabs: creating ${classesToCreate.length} tab(s)`);
      const createRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}:batchUpdate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requests: batchRequests })
      });

      if (!createRes.ok) {
        const errText = await createRes.text();
        throw new Error(`Google Sheets API batchUpdate error: ${createRes.statusText} - ${errText}`);
      }
    }

    // 12. Clear all class sheets to avoid residual rows
    const rangesToClear = classNames.map(name => `'${name.replace(/'/g, "''")}'`);
    console.log(`Clearing existing data in class tabs...`);
    const clearRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values:batchClear`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ranges: rangesToClear
      })
    });

    if (!clearRes.ok) {
      const errText = await clearRes.text();
      throw new Error(`Google Sheets API clear error: ${clearRes.statusText} - ${errText}`);
    }

    // 13. Populate values for each class-wise sheet
    let totalRowsSynced = 0;
    const dataToWrite = classNames.map(name => {
      const classItems = groupedCurriculum.get(name) || [];
      const rows = [headers];

      classItems.forEach(item => {
        const cleanModuleTitle = item.module_name?.replace(/^-\s+/, '') || '';
        const topic = item.topics_covered || '';
        const key = `${name.trim()}||${topic.trim()}`;
        const sessions = topicSessions.get(key) || [];
        
        let status = 'Not Started';
        let volunteerName = '-';
        let latestDate = '-';
        let scheduleDate = '-';

        if (sessions.length > 0) {
          sessions.sort((a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime());
          scheduleDate = formatDate(sessions[sessions.length - 1].session_date);
          const completedSession = sessions.find(s => s.status === 'completed');
          if (completedSession) {
            status = 'Completed';
            volunteerName = completedSession.volunteer_name || 'Unknown';
            latestDate = formatDate(completedSession.session_date);
          } else {
            const latestSession = sessions[0];
            status = latestSession.status 
              ? (latestSession.status.charAt(0).toUpperCase() + latestSession.status.slice(1).replace('_', ' ')) 
              : 'In Progress';
            volunteerName = latestSession.volunteer_name || '-';
            latestDate = formatDate(latestSession.session_date);
          }
        }

        rows.push([
          name,
          item.content_category || '-',
          item.module_no || '-',
          cleanModuleTitle || '-',
          topic || '-',
          item.videos || '',
          item.quiz_content_ppt || '',
          '', // Fresh Session
          '', // Revision Session
          status,
          scheduleDate,
          latestDate,
          volunteerName
        ]);
      });

      totalRowsSynced += (rows.length - 1);
      return {
        range: `'${name.replace(/'/g, "''")}'!A1`,
        majorDimension: 'ROWS',
        values: rows
      };
    });

    console.log(`Writing class-wise data to sheets...`);
    const writeRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: dataToWrite
      })
    });

    if (!writeRes.ok) {
      const errText = await writeRes.text();
      throw new Error(`Google Sheets API write error: ${writeRes.statusText} - ${errText}`);
    }

    console.log(`Sync complete. Transferred ${totalRowsSynced} rows successfully.`);

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Google Sheets synchronized class-wise successfully",
      academicYear: selectedYear,
      rowsSynced: totalRowsSynced
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
