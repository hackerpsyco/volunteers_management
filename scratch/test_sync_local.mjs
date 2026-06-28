import { createClient } from '@supabase/supabase-js';
import { JWT } from 'google-auth-library';
import fs from 'fs';
import path from 'path';

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

// Get Google credentials
const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL2;
let key = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || process.env.GOOGLE_PRIVATE_KEY || process.env.GOOGLE_PRIVATE_KEY2;
// Check if they supplied a GOOGLE_SHEET_ID for testing
const sheetId = process.env.GOOGLE_SHEET_ID || process.env.GOOGLE_SPREADSHEET_ID || process.argv[2];

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  try {
    console.log('--- STARTING VERIFICATION TEST ---');
    
    // 1. Determine current academic year (June 1st to May 31st)
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

    console.log(`Target Academic Year: ${selectedYear}`);
    console.log(`Session Range: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`);

    // 2. Fetch Curriculum
    console.log('Fetching curriculum records...');
    const { data: curriculumData, error: curriculumError } = await supabase
      .from('curriculum')
      .select(`*, classes:class_id(name)`)
      .order('content_category', { ascending: true })
      .order('module_no', { ascending: true });

    if (curriculumError) throw curriculumError;
    console.log(`Found ${curriculumData.length} curriculum items.`);

    // 3. Fetch Sessions
    console.log('Fetching session records...');
    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .select('id, topics_covered, status, volunteer_name, class_batch, session_date')
      .gte('session_date', startDate.toISOString().split('T')[0])
      .lte('session_date', endDate.toISOString().split('T')[0]);

    if (sessionError) throw sessionError;
    console.log(`Found ${sessionData.length} sessions for this academic year.`);

    // 4. Map Sessions to Topics by Class
    const topicSessions = new Map();
    (sessionData || []).forEach(session => {
      if (!session.topics_covered || !session.class_batch) return;
      const key = `${session.class_batch.trim()}||${session.topics_covered.trim()}`;
      const existing = topicSessions.get(key) || [];
      existing.push(session);
      topicSessions.set(key, existing);
    });

    // 5. Construct Data Rows
    const values = [
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

    const formatDate = (dateStr) => {
      if (!dateStr) return '-';
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '-';
      const day = String(d.getDate()).padStart(2, '0');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[d.getMonth()];
      const year = d.getFullYear();
      return `${day} ${month} ${year}`;
    };

    let completedCount = 0;
    let notStartedCount = 0;
    let otherCount = 0;

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
        sessions.sort((a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime());
        const completedSession = sessions.find(s => s.status === 'completed');
        
        if (completedSession) {
          status = 'Completed';
          volunteerName = completedSession.volunteer_name || 'Unknown';
          latestDate = formatDate(completedSession.session_date);
          completedCount++;
        } else {
          const latestSession = sessions[0];
          status = latestSession.status 
            ? (latestSession.status.charAt(0).toUpperCase() + latestSession.status.slice(1).replace('_', ' ')) 
            : 'In Progress';
          volunteerName = latestSession.volunteer_name || '-';
          latestDate = formatDate(latestSession.session_date);
          otherCount++;
        }
      } else {
        notStartedCount++;
      }

      values.push([
        className,
        item.content_category || '-',
        item.module_no || '-',
        cleanModuleTitle || '-',
        topic || '-',
        item.videos || '',
        item.quiz_content_ppt || '',
        '',
        '',
        status,
        latestDate,
        volunteerName
      ]);
    });

    console.log(`\n--- Compilation Summary ---`);
    console.log(`Total Compiled Rows: ${values.length - 1}`);
    console.log(`- Completed Topics: ${completedCount}`);
    console.log(`- In Progress / Checked: ${otherCount}`);
    console.log(`- Not Started: ${notStartedCount}`);
    console.log(`Sample Row #1:`, values[1]);

    // 6. Test write if sheet ID is provided
    if (sheetId && email && key) {
      console.log(`\nAttempting to write to Google Sheet ID: ${sheetId}`);
      key = key.replace(/\\n/g, '\n');
      const auth = new JWT({
        email: email,
        key: key,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      const accessTokenObj = await auth.getAccessToken();
      const token = accessTokenObj.token;

      if (!token) throw new Error("Failed to get Google Sheets access token");

      const sheetInfoRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=sheets.properties.title`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!sheetInfoRes.ok) {
        const errText = await sheetInfoRes.text();
        throw new Error(`Google Sheets Metadata Error: ${errText}`);
      }

      const sheetInfo = await sheetInfoRes.json();
      const firstSheetName = sheetInfo.sheets?.[0]?.properties?.title || 'Sheet1';
      console.log(`Clearing tab: "${firstSheetName}"...`);

      const clearRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(firstSheetName)}:clear`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!clearRes.ok) throw new Error("Failed to clear sheet");

      console.log(`Writing ${values.length - 1} rows to "${firstSheetName}"...`);
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
        throw new Error(`Write Error: ${errText}`);
      }
      
      console.log('SUCCESS: Written to Google Sheet successfully!');
    } else {
      console.log('\nGoogle Sheet ID or credentials not provided. Skipping Sheet write test.');
      console.log('To run Sheets test, configure GOOGLE_SHEET_ID in .env.local, or pass it as an argument: node scratch/test_sync_local.mjs <SHEET_ID>');
    }

  } catch (err) {
    console.error('Error during verification test:', err);
  }
}

run();
