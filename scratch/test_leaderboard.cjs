const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const startDate = '2026-04-01';
  const endDate = '2027-03-31';

  // 1. Get class ID for CCC EMP Fellow
  const { data: classes } = await supabase.from('classes').select('id, name').ilike('name', '%CCC EMP Fellow%');
  console.log('Classes found:', classes);
  const classId = classes[0]?.id;

  // 2. Fetch class students
  const { data: studentsInClass } = await supabase
    .from('students')
    .select('id, name, designation')
    .eq('class_id', classId);

  console.log('Students in CCC EMP Fellow class:', studentsInClass ? studentsInClass.length : 0);

  const statsMap = {};
  const studentNameMap = {};
  (studentsInClass || []).forEach(s => {
    statsMap[s.id] = { id: s.id, name: s.name, attendance: 0 };
    studentNameMap[s.name.toLowerCase().trim().replace(/\s+/g, ' ')] = s.id;
  });

  // 3. Fetch sessions
  const { data: sessions } = await supabase
    .from('sessions')
    .select('id, session_date')
    .ilike('class_batch', '%CCC EMP Fellow%')
    .gte('session_date', startDate)
    .lte('session_date', endDate);

  const sessionIds = (sessions || []).map(s => s.id);
  const validSessionIds = new Set(sessionIds);

  // 4. Chunked query to student_performance
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

  // Deduplicate and aggregate
  const counted = new Set();
  attendanceData.forEach(record => {
    if (!record.session_id || !validSessionIds.has(record.session_id)) return;
    let sId = record.student_id;
    if (!sId && record.student_name) {
      const nameKey = record.student_name.toLowerCase().trim().replace(/\s+/g, ' ');
      sId = studentNameMap[nameKey];
    }
    if (sId && statsMap[sId]) {
      const dedupeKey = `${sId}_${record.session_id}`;
      if (!counted.has(dedupeKey)) {
        counted.add(dedupeKey);
        statsMap[sId].attendance += 1;
      }
    }
  });

  const sortedList = Object.values(statsMap).sort((a, b) => b.attendance - a.attendance);
  console.log('\n=== Top 15 Students By Attendance (All Months) ===');
  sortedList.slice(0, 15).forEach((s, idx) => {
    console.log(`${idx + 1}. ${s.name} - ${s.attendance} PRESENT`);
  });
}

run();
