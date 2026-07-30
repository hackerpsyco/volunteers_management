const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  // Check sessions on August 1st 2026
  const { data: augSessions } = await supabase
    .from('sessions')
    .select('id, session_date, title, class_batch')
    .eq('session_date', '2026-08-01');

  console.log('Sessions on August 1st 2026:', augSessions);

  if (augSessions && augSessions.length > 0) {
    const augSessionIds = augSessions.map(s => s.id);
    const { data: augPerf } = await supabase
      .from('student_performance')
      .select('student_id, student_name, attendance_status, sessions(session_date, title)')
      .in('session_id', augSessionIds)
      .eq('attendance_status', 'Present');
    console.log('Present records on August 1st:', augPerf);
  }
}

run();
