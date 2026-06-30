import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envLocalPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envLocalPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let val = match[2] || '';
    if (val.startsWith('"') && val.endsWith('"')) val = val.substring(1, val.length - 1);
    env[match[1]] = val;
  }
});

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: students, error } = await supabase
    .from('students')
    .select('id, name')
    .eq('designation', '1 Certified computer course');
    
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log(`Checking ${students.length} students with designation "1"...`);
  
  for (const student of students) {
    const { count: taskCount } = await supabase
      .from('student_task_feedback')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', student.id);
      
    const { count: earningCount } = await supabase
      .from('student_earnings')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', student.id);
      
    console.log(`Student "${student.name}": Tasks = ${taskCount}, Earnings = ${earningCount}`);
  }
}

run();
