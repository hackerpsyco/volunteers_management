import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load env local variables
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
  const taskName = '"How Cloud and Datacenters Power Our Digital World"';
  const { data, error } = await supabase
    .from('student_task_feedback')
    .select('id, student_id, task_name, task_id, status, created_at')
    .eq('task_name', taskName);
    
  if (error) {
    console.error('Error fetching records:', error);
    return;
  }
  
  console.log(`Total rows found: ${data?.length}`);
  data?.forEach((row, i) => {
    console.log(`Row ${i + 1}:`);
    console.log(`  ID: ${row.id}`);
    console.log(`  Task Name: ${row.task_name}`);
    console.log(`  Task ID: ${row.task_id}`);
    console.log(`  Status: ${row.status}`);
    console.log(`  Created At: ${row.created_at}`);
  });
}

run();
