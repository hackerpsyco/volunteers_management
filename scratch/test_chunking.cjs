const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const startDate = '2026-04-01';
  const endDate = '2027-03-31';

  // Fetch all sessions for CCC EMP Fellow in date range
  const { data: sessions } = await supabase
    .from('sessions')
    .select('id, session_date')
    .ilike('class_batch', '%CCC EMP Fellow%')
    .gte('session_date', startDate)
    .lte('session_date', endDate);

  const sessionIds = (sessions || []).map(s => s.id);
  console.log('Total session IDs found for class:', sessionIds.length);

  // Unchunked query (like old StudentDashboard.tsx)
  const { data: unchunkedData } = await supabase
    .from('student_performance')
    .select('student_id, session_id, attendance_status, student_name')
    .in('session_id', sessionIds)
    .eq('attendance_status', 'Present');

  console.log('Unchunked perfData total rows returned:', unchunkedData ? unchunkedData.length : 0);

  // Chunked query (with chunkSize = 20)
  let chunkedData = [];
  const chunkSize = 20;
  for (let i = 0; i < sessionIds.length; i += chunkSize) {
    const chunk = sessionIds.slice(i, i + chunkSize);
    const { data } = await supabase
      .from('student_performance')
      .select('student_id, session_id, attendance_status, student_name')
      .in('session_id', chunk)
      .eq('attendance_status', 'Present');
    if (data) chunkedData = chunkedData.concat(data);
  }

  console.log('Chunked perfData total rows returned:', chunkedData.length);

  // Count for Manya Yadav in unchunked vs chunked
  const { data: manyaStudent } = await supabase.from('students').select('id').ilike('name', '%Manya%').single();
  const manyaId = manyaStudent.id;

  const unchunkedManyaCount = unchunkedData.filter(p => p.student_id === manyaId || (p.student_name && p.student_name.toLowerCase().includes('manya'))).length;
  const chunkedManyaCount = chunkedData.filter(p => p.student_id === manyaId || (p.student_name && p.student_name.toLowerCase().includes('manya'))).length;

  console.log('Manya count UNCHUNKED:', unchunkedManyaCount);
  console.log('Manya count CHUNKED:', chunkedManyaCount);
}

run();
