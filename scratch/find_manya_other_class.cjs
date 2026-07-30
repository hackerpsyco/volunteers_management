const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const startDate = '2026-07-01';
  const endDate = '2026-07-31';

  const { data: manyaStudent } = await supabase.from('students').select('id').ilike('name', '%Manya%').single();
  const manyaId = manyaStudent.id;

  // Query 1: Manya's attendance in July with class_batch = 'CCC EMP Fellow'
  const { data: manyaClassPerf } = await supabase
    .from('student_performance')
    .select('id, session_id, attendance_status, sessions!inner(id, session_date, class_batch, title)')
    .eq('student_id', manyaId)
    .eq('attendance_status', 'Present')
    .ilike('sessions.class_batch', '%CCC EMP Fellow%')
    .gte('sessions.session_date', startDate)
    .lte('sessions.session_date', endDate);

  console.log('Manya Present count for class_batch = CCC EMP Fellow:', manyaClassPerf ? manyaClassPerf.length : 0);

  // Query 2: Manya's attendance in July across ALL sessions (regardless of class_batch)
  const { data: manyaAllPerf } = await supabase
    .from('student_performance')
    .select('id, session_id, attendance_status, sessions!inner(id, session_date, class_batch, title)')
    .eq('student_id', manyaId)
    .eq('attendance_status', 'Present')
    .gte('sessions.session_date', startDate)
    .lte('sessions.session_date', endDate);

  console.log('Manya Present count across ALL sessions (regardless of class_batch):', manyaAllPerf ? manyaAllPerf.length : 0);

  // Find sessions where class_batch is NOT CCC EMP Fellow
  const otherClassSessions = (manyaAllPerf || []).filter(p => !p.sessions?.class_batch?.toLowerCase().includes('ccc emp fellow'));
  console.log('Sessions attended by Manya outside CCC EMP Fellow in July:', otherClassSessions);
}

run();
