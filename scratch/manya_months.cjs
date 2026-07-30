const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  // Query Manya's present sessions month by month
  const { data: manyaPerf } = await supabase
    .from('student_performance')
    .select('id, attendance_status, session_id, sessions!inner(id, session_date, class_batch)')
    .ilike('student_name', '%Manya%')
    .eq('attendance_status', 'Present');

  const monthCounts = {};
  (manyaPerf || []).forEach(p => {
    const month = p.sessions?.session_date ? p.sessions.session_date.slice(0, 7) : 'UNKNOWN';
    monthCounts[month] = (monthCounts[month] || 0) + 1;
  });

  console.log('Manya Yadav Present Sessions month-by-month breakdown:', monthCounts);
}

run();
