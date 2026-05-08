import { supabase } from './src/integrations/supabase/client';

async function checkEarningsJoin() {
  const { data, error } = await supabase
    .from('student_earnings')
    .select(`
      id,
      amount,
      earned_at,
      student_task_feedback(
        id,
        task_name,
        deadline,
        sessions(title)
      )
    `)
    .limit(5);

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Data:', JSON.stringify(data, null, 2));
  }
}

checkEarningsJoin();
