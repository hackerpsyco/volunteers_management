// Mock localStorage globally for Node.js environment
if (typeof globalThis.localStorage === 'undefined') {
  (globalThis as any).localStorage = {
    getItem: () => null,
    setItem: () => null,
    removeItem: () => null,
    clear: () => null,
  };
}

async function checkDatabase() {
  const { supabase } = await import('./src/integrations/supabase/client');

  console.log("--- Checking reward_configurations ---");
  const { data: configs, error: configError } = await supabase
    .from('reward_configurations')
    .select('*');
  if (configError) console.error("Config error:", configError);
  else console.log("Configs:", configs);

  console.log("\n--- Checking student_task_feedback (completed tasks) ---");
  const { data: tasks, error: taskError } = await supabase
    .from('student_task_feedback')
    .select('id, task_name, status, earning_amount, student_id, feedback_type, academic_year, updated_at')
    .eq('status', 'completed')
    .order('updated_at', { ascending: false })
    .limit(10);
  if (taskError) console.error("Task error:", taskError);
  else console.log("Completed Tasks:", tasks);

  console.log("\n--- Checking student_earnings ---");
  const { data: earnings, error: earningError } = await supabase
    .from('student_earnings')
    .select('*')
    .order('earned_at', { ascending: false })
    .limit(10);
  if (earningError) console.error("Earning error:", earningError);
  else console.log("Earnings:", earnings);
}

checkDatabase();
