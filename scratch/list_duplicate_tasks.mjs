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
  
  // Fetch all records for this task
  const { data: rows, error } = await supabase
    .from('student_task_feedback')
    .select('id, student_id, task_name, status, created_at, students:student_id(name)')
    .eq('task_name', taskName);
    
  if (error) {
    console.error('Error fetching records:', error);
    return;
  }
  
  // Group by student_id
  const studentMap = {};
  rows?.forEach(row => {
    const sId = row.student_id;
    if (!studentMap[sId]) studentMap[sId] = [];
    studentMap[sId].push(row);
  });
  
  console.log(`--- Duplicate Report for Task: "${taskName}" ---`);
  let duplicateCount = 0;
  Object.keys(studentMap).forEach(sId => {
    const studentRows = studentMap[sId];
    if (studentRows.length > 1) {
      const name = studentRows[0].students?.name;
      const completedRow = studentRows.find(r => r.status === 'completed' || r.status === 'submitted' || r.status === 'approved');
      const pendingRow = studentRows.find(r => r.status === 'pending');
      
      if (completedRow && pendingRow) {
        duplicateCount++;
        console.log(`Student: ${name}`);
        console.log(`  - COMPLETED Row: ID=${completedRow.id}, Created At=${completedRow.created_at}`);
        console.log(`  - PENDING Row:   ID=${pendingRow.id}, Created At=${pendingRow.created_at}`);
      }
    }
  });
  console.log(`--- End of Report (Total duplicate pairs found: ${duplicateCount}) ---`);
}

run();
