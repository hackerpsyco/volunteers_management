const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  console.log('=== DIAGNOSING ATTENDANCE DATA ===');

  // 1. Find Manya Yadav in students table
  const { data: manyaStudents } = await supabase
    .from('students')
    .select('id, name, email, class_id, classes(name)')
    .ilike('name', '%Manya%');

  console.log('Manya Yadav student records:', manyaStudents);
  const studentIds = (manyaStudents || []).map(s => s.id);

  // 2. Find attendance in student_performance for Manya Yadav by student_id
  const { data: perfById } = await supabase
    .from('student_performance')
    .select('id, student_id, student_name, attendance_status, session_id, created_at, sessions(id, session_date, class_batch)')
    .in('student_id', studentIds);

  console.log('Total perf records by student_id:', perfById ? perfById.length : 0);
  const presentById = (perfById || []).filter(p => p.attendance_status === 'Present');
  console.log('Present perf records by student_id:', presentById.length);

  // 3. Find attendance by student_name ILIKE '%Manya%'
  const { data: perfByName } = await supabase
    .from('student_performance')
    .select('id, student_id, student_name, attendance_status, session_id, created_at, sessions(id, session_date, class_batch)')
    .ilike('student_name', '%Manya%');

  console.log('Total perf records by student_name:', perfByName ? perfByName.length : 0);
  const presentByName = (perfByName || []).filter(p => p.attendance_status === 'Present');
  console.log('Present perf records by student_name:', presentByName.length);

  // Check records with NULL student_id
  const nullStudentIdRecords = (perfByName || []).filter(p => !p.student_id);
  console.log('Records matching Manya with NULL student_id:', nullStudentIdRecords.length);

  // Compare sessions.class_batch values for Manya's present sessions
  const classBatches = {};
  presentByName.forEach(p => {
    const cb = p.sessions?.class_batch || 'NO_CLASS_BATCH';
    classBatches[cb] = (classBatches[cb] || 0) + 1;
  });
  console.log('Breakdown of Present sessions by class_batch:', classBatches);

  // Also check Pushpa Lodhi and Avantika Sen
  const { data: pushpaStudents } = await supabase
    .from('students')
    .select('id, name, email')
    .ilike('name', '%Pushpa%');
  const pushpaIds = (pushpaStudents || []).map(s => s.id);
  const { data: pushpaPerf } = await supabase
    .from('student_performance')
    .select('id, attendance_status')
    .in('student_id', pushpaIds)
    .eq('attendance_status', 'Present');
  console.log('Pushpa Lodhi Present count by student_id:', pushpaPerf ? pushpaPerf.length : 0);

  const { data: pushpaNamePerf } = await supabase
    .from('student_performance')
    .select('id, attendance_status')
    .ilike('student_name', '%Pushpa%')
    .eq('attendance_status', 'Present');
  console.log('Pushpa Lodhi Present count by student_name:', pushpaNamePerf ? pushpaNamePerf.length : 0);
}

run();
