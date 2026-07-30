const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  // Check academic year dates (e.g. 2026-04-01 to 2027-03-31 or 2025-04-01 to 2026-03-31)
  const startDate = '2026-04-01';
  const endDate = '2027-03-31';

  // Query 1: sessions with class_batch = 'CCC EMP Fellow'
  const { data: sessionsEq } = await supabase
    .from('sessions')
    .select('id, session_date, class_batch')
    .eq('class_batch', 'CCC EMP Fellow')
    .gte('session_date', startDate)
    .lte('session_date', endDate);

  console.log('Sessions with eq("class_batch", "CCC EMP Fellow"):', sessionsEq ? sessionsEq.length : 0);

  // Query 2: sessions with ilike class_batch
  const { data: sessionsIlike } = await supabase
    .from('sessions')
    .select('id, session_date, class_batch')
    .ilike('class_batch', '%CCC EMP Fellow%')
    .gte('session_date', startDate)
    .lte('session_date', endDate);

  console.log('Sessions with ilike("class_batch", "%CCC EMP Fellow%"):', sessionsIlike ? sessionsIlike.length : 0);

  // Query 3: ALL sessions in that date range regardless of class_batch
  const { data: allSessions } = await supabase
    .from('sessions')
    .select('id, session_date, class_batch')
    .gte('session_date', startDate)
    .lte('session_date', endDate);

  console.log('ALL sessions in date range:', allSessions ? allSessions.length : 0);

  // Query 4: Manya Yadav's present sessions in that date range
  const { data: manyaPerf } = await supabase
    .from('student_performance')
    .select('id, session_id, student_id, student_name, attendance_status, sessions!inner(id, session_date, class_batch)')
    .ilike('student_name', '%Manya%')
    .eq('attendance_status', 'Present')
    .gte('sessions.session_date', startDate)
    .lte('sessions.session_date', endDate);

  console.log('Manya Present sessions in date range:', manyaPerf ? manyaPerf.length : 0);
  
  // Show distinct class_batch values in Manya's present sessions
  const ManyaClassBatches = {};
  (manyaPerf || []).forEach(m => {
    const cb = m.sessions?.class_batch;
    ManyaClassBatches[cb] = (ManyaClassBatches[cb] || 0) + 1;
  });
  console.log('Manya Present sessions class_batch breakdown:', ManyaClassBatches);
}

run();
