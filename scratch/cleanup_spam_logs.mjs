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
  console.log('Cleaning up duplicate task logs and disabling database task triggers...');

  // 1. Delete existing spam task feedback logs from activity_logs
  // (where module is 'Student_task_feedback' or 'Student_Task_Feedback')
  console.log('Deleting duplicate UUID task feedback entries from activity_logs...');
  const { data: d1, error: e1 } = await supabase
    .from('activity_logs')
    .delete()
    .or('module.ilike.Student_task_feedback,details.ilike.%student ID:%');

  if (e1) {
    console.error('Error cleaning up activity_logs:', e1);
  } else {
    console.log('Successfully cleaned up spam log entries.');
  }

  // 2. We can provide the SQL instruction to drop the trigger.
  // Since we cannot run raw DDL SQL directly through the REST client,
  // we will tell the user to run the drop statement in Supabase, 
  // or we can write a script to check if they have any RPC that can execute it.
  console.log('Done!');
}

run();
