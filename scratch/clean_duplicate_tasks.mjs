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
  const taskName = "How Cloud Infrastructure Works";
  
  // 1. Fetch all records for this task
  const { data: rows, error } = await supabase
    .from('student_task_feedback')
    .select('id, student_id, task_name, status, created_at, students:student_id(name)')
    .eq('task_name', taskName);
    
  if (error) {
    console.error('Error fetching records:', error);
    return;
  }
  
  console.log(`Total rows for "${taskName}": ${rows?.length}`);
  
  // Group by student_id
  const studentMap = {};
  rows?.forEach(row => {
    const sId = row.student_id;
    if (!studentMap[sId]) studentMap[sId] = [];
    studentMap[sId].push(row);
  });
  
  const toDelete = [];
  
  console.log('\nScanning for duplicates where a student has both completed/submitted and pending...');
  Object.keys(studentMap).forEach(sId => {
    const studentRows = studentMap[sId];
    if (studentRows.length > 1) {
      const name = studentRows[0].students?.name;
      const completedRow = studentRows.find(r => r.status === 'completed' || r.status === 'submitted' || r.status === 'approved');
      const pendingRow = studentRows.find(r => r.status === 'pending');
      
      if (completedRow && pendingRow) {
        console.log(`Student: ${name}`);
        console.log(`  - Completed row ID: ${completedRow.id} (Created: ${completedRow.created_at})`);
        console.log(`  - Duplicate pending row ID: ${pendingRow.id} (Created: ${pendingRow.created_at}) -> WILL DELETE`);
        toDelete.push(pendingRow.id);
      }
    }
  });
  
  if (toDelete.length > 0) {
    console.log(`\nDeleting ${toDelete.length} duplicate pending task rows...`);
    const { error: delError } = await supabase
      .from('student_task_feedback')
      .delete()
      .in('id', toDelete);
      
    if (delError) {
      console.error('Error deleting duplicates:', delError);
    } else {
      console.log('Successfully cleaned up all duplicate pending task rows!');
    }
  } else {
    console.log('\nNo duplicate pending rows found to clean up.');
  }
}

run();
