const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const startDate = '2026-07-01';
  const endDate = '2026-07-31';

  // 1. All sessions in July 2026 (like TopStudentsWidget.tsx)
  const { data: allJulySessions } = await supabase
    .from('sessions')
    .select('id, session_date, class_batch, title')
    .gte('session_date', startDate)
    .lte('session_date', endDate);

  console.log('Total sessions in July 2026 (all classes):', allJulySessions ? allJulySessions.length : 0);

  // 2. Pushpa Lodhi present sessions in July 2026 (all classes)
  const { data: pushpaStudents } = await supabase.from('students').select('id').ilike('name', '%Pushpa%').single();
  const pushpaId = pushpaStudents.id;

  const sessionIds = (allJulySessions || []).map(s => s.id);
  const { data: pushpaPerf } = await supabase
    .from('student_performance')
    .select('id, session_id, attendance_status, sessions(id, session_date, class_batch, title)')
    .eq('student_id', pushpaId)
    .in('session_id', sessionIds)
    .eq('attendance_status', 'Present');

  console.log('Pushpa Lodhi Present count in July 2026 (ALL classes):', pushpaPerf ? pushpaPerf.length : 0);

  // Show breakdown by class_batch
  const batchBreakdown = {};
  (pushpaPerf || []).forEach(p => {
    const cb = p.sessions?.class_batch || 'EMPTY_OR_OTHER';
    batchBreakdown[cb] = (batchBreakdown[cb] || 0) + 1;
  });
  console.log('Pushpa Lodhi class_batch breakdown in July:', batchBreakdown);
}

run();
