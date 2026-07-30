const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const startDate = '2026-07-01';
  const endDate = '2026-07-31';

  const { data: manyaStudent } = await supabase.from('students').select('id').ilike('name', '%Manya%').single();
  const manyaId = manyaStudent.id;

  const { data: perf } = await supabase
    .from('student_performance')
    .select('id, session_id, student_id, student_name, attendance_status, created_at, sessions!inner(id, session_date, title, class_batch)')
    .eq('student_id', manyaId)
    .eq('attendance_status', 'Present')
    .gte('sessions.session_date', startDate)
    .lte('sessions.session_date', endDate);

  console.log('Manya Present records in July:', perf ? perf.length : 0);

  const sessionCounts = {};
  (perf || []).forEach(p => {
    sessionCounts[p.session_id] = (sessionCounts[p.session_id] || 0) + 1;
  });

  const duplicateSessionIds = Object.keys(sessionCounts).filter(sId => sessionCounts[sId] > 1);
  console.log('Duplicate session IDs count for Manya:', duplicateSessionIds.length);
  duplicateSessionIds.forEach(sId => {
    const dupes = perf.filter(p => p.session_id === sId);
    console.log('Duplicate session record details:', dupes);
  });
}

run();
