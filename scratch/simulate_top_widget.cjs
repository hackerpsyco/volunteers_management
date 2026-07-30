const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const startDate = '2026-07-01';
  const endDate = '2026-07-31';

  // 1. Fetch sessions like TopStudentsWidget.tsx
  let sessionsQuery = supabase
    .from('sessions')
    .select('id')
    .gte('session_date', startDate)
    .lte('session_date', endDate);

  const { data: sessionsData } = await sessionsQuery;
  const sessionIds = (sessionsData || []).map(s => s.id);

  // 2. Fetch student_performance in chunks like TopStudentsWidget.tsx
  let attendanceData = [];
  const chunkSize = 5;
  for (let i = 0; i < sessionIds.length; i += chunkSize) {
    const chunk = sessionIds.slice(i, i + chunkSize);
    const { data } = await supabase
      .from('student_performance')
      .select('student_id, attendance_status, student_name')
      .in('session_id', chunk)
      .eq('attendance_status', 'Present');
    if (data) attendanceData = attendanceData.concat(data);
  }

  // Find Manya Yadav student records
  const { data: manyaStudents } = await supabase.from('students').select('id, name, academic_year, class_id').ilike('name', '%Manya%');
  const manyaStudent = manyaStudents[0];

  const manyaPerf = attendanceData.filter(a => a.student_id === manyaStudent.id || (a.student_name && a.student_name.toLowerCase().includes('manya')));
  console.log('TopStudentsWidget Manya attendance records count:', manyaPerf.length);

  // Check if there are any records with student_name matching Manya but DIFFERENT student_id or NULL student_id!
  console.log('Manya records details in TopStudentsWidget:', manyaPerf);
}

run();
