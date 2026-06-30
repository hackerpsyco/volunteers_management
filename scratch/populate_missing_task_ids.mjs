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
  console.log('Querying task feedback rows with missing task_id...');
  
  // 1. Fetch all rows where task_id is null
  const { data: rows, error } = await supabase
    .from('student_task_feedback')
    .select(`
      id,
      student_id,
      task_name,
      task_id,
      created_at,
      students:student_id(
        class_id,
        classes(name)
      )
    `)
    .is('task_id', null);
    
  if (error) {
    console.error('Error fetching records:', error);
    return;
  }
  
  if (!rows || rows.length === 0) {
    console.log('No records found with missing task_id.');
    return;
  }
  
  console.log(`Found ${rows.length} rows with missing task_id. Grouping by task_name...`);
  
  // Group by task_name
  const taskGroups = {};
  rows.forEach(row => {
    const key = row.task_name;
    if (!taskGroups[key]) taskGroups[key] = [];
    taskGroups[key].push(row);
  });
  
  // 2. Process each task group
  for (const taskName of Object.keys(taskGroups)) {
    const groupRows = taskGroups[taskName];
    const sampleRow = groupRows[0];
    
    // Resolve class name
    const className = sampleRow.students?.classes?.name || 'Class';
    const classNameStr = className.replace(/\s+/g, '');
    
    // Resolve date prefix
    const date = new Date(sampleRow.created_at || new Date());
    const yearStr = date.getFullYear();
    const monthStr = String(date.getMonth() + 1).padStart(2, '0');
    const prefix = `${yearStr}-${monthStr}-${classNameStr}-`;
    
    // Fetch next sequence for this prefix
    const { data: existingTasks } = await supabase
      .from('student_task_feedback')
      .select('task_id')
      .like('task_id', `${prefix}%`)
      .order('task_id', { ascending: false })
      .limit(1);
      
    let nextSeq = 1;
    if (existingTasks && existingTasks.length > 0 && existingTasks[0].task_id) {
      const lastId = existingTasks[0].task_id;
      const lastSeqStr = lastId.split('-').pop();
      if (lastSeqStr) {
        const lastSeqNum = parseInt(lastSeqStr, 10);
        if (!isNaN(lastSeqNum)) {
          nextSeq = lastSeqNum + 1;
        }
      }
    }
    
    const seqStr = String(nextSeq).padStart(3, '0');
    const generatedTaskId = `${prefix}${seqStr}`;
    
    console.log(`Assigning Task ID "${generatedTaskId}" to task group: "${taskName}" (${groupRows.length} rows)`);
    
    // Update all rows in this group
    const ids = groupRows.map(r => r.id);
    const { error: updateError } = await supabase
      .from('student_task_feedback')
      .update({ task_id: generatedTaskId })
      .in('id', ids);
      
    if (updateError) {
      console.error(`Error updating task group "${taskName}":`, updateError);
    } else {
      console.log(`Successfully updated task group "${taskName}".`);
    }
  }
  
  console.log('Cleanup finished!');
}

run();
