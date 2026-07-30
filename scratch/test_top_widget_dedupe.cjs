const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const startDate = '2026-07-01';
  const endDate = '2026-07-31';

  // 1. Fetch sessions
  let sessionsQuery = supabase
    .from('sessions')
    .select('id')
    .gte('session_date', startDate)
    .lte('session_date', endDate);

  const { data: sessionsData } = await sessionsQuery;
  const sessionIds = (sessionsData || []).map(s => s.id);

  // 2. Fetch student_performance with session_id
  let attendanceData = [];
  const chunkSize = 15;
  for (let i = 0; i < sessionIds.length; i += chunkSize) {
    const chunk = sessionIds.slice(i, i + chunkSize);
    const { data } = await supabase
      .from('student_performance')
      .select('student_id, session_id, attendance_status, student_name')
      .in('session_id', chunk)
      .eq('attendance_status', 'Present');
    if (data) attendanceData = attendanceData.concat(data);
  }

  // Find Manya Yadav student
  const { data: manyaStudent } = await supabase.from('students').select('id, name').ilike('name', '%Manya%').single();

  // Test WITHOUT deduplication (old TopStudentsWidget)
  let countWithoutDedupe = 0;
  attendanceData.forEach(r => {
    if (r.student_id === manyaStudent.id || (r.student_name && r.student_name.toLowerCase().includes('manya'))) {
      countWithoutDedupe++;
    }
  });

  // Test WITH deduplication (new TopStudentsWidget)
  let countWithDedupe = 0;
  const counted = new Set();
  attendanceData.forEach(r => {
    if (r.student_id === manyaStudent.id || (r.student_name && r.student_name.toLowerCase().includes('manya'))) {
      const key = `${r.student_id || r.student_name}_${r.session_id}`;
      if (!counted.has(key)) {
        counted.add(key);
        countWithDedupe++;
      }
    }
  });

  console.log('Manya count WITHOUT deduplication:', countWithoutDedupe);
  console.log('Manya count WITH deduplication:', countWithDedupe);
}

run();
