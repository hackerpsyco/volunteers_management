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
  console.log('Fetching all task feedback records to re-sequence IDs...');
  
  const { data: tasks, error } = await supabase
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
      ),
      sessions:session_id(
        class_batch
      )
    `);
    
  if (error) {
    console.error('Error fetching tasks:', error);
    return;
  }
  
  console.log(`Retrieved ${tasks?.length} tasks. Building prefixes...`);
  
  // Group tasks by their prefix: YYYY-MM-ClassBatch-
  const groups = {};
  
  tasks?.forEach(task => {
    const date = new Date(task.created_at || new Date());
    const yearStr = date.getFullYear();
    const monthStr = String(date.getMonth() + 1).padStart(2, '0');
    
    // Resolve class batch name
    const classBatch = task.sessions?.class_batch || task.students?.classes?.name || 'Class';
    const classBatchStr = classBatch.replace(/\s+/g, '');
    
    const prefix = `${yearStr}-${monthStr}-${classBatchStr}-`;
    
    if (!groups[prefix]) groups[prefix] = [];
    groups[prefix].push(task);
  });
  
  console.log(`Found ${Object.keys(groups).length} unique prefixes. Re-sequencing...`);
  
  // Process each prefix group
  for (const prefix of Object.keys(groups)) {
    const prefixTasks = groups[prefix];
    
    // Group tasks under this prefix by task_name to find earliest created_at for each task
    const taskNameMap = {};
    prefixTasks.forEach(task => {
      const name = task.task_name;
      const createdAtTime = new Date(task.created_at).getTime();
      
      if (!taskNameMap[name]) {
        taskNameMap[name] = {
          name,
          earliestCreatedAt: createdAtTime,
          rows: []
        };
      }
      
      taskNameMap[name].rows.push(task);
      if (createdAtTime < taskNameMap[name].earliestCreatedAt) {
        taskNameMap[name].earliestCreatedAt = createdAtTime;
      }
    });
    
    // Sort the task groups by earliestCreatedAt in ascending order (oldest first)
    const sortedTaskGroups = Object.values(taskNameMap).sort((a, b) => a.earliestCreatedAt - b.earliestCreatedAt);
    
    console.log(`Prefix "${prefix}": found ${sortedTaskGroups.length} unique tasks.`);
    
    // Assign sequential numbers 001, 002, 003... and update rows
    for (let i = 0; i < sortedTaskGroups.length; i++) {
      const taskGroup = sortedTaskGroups[i];
      const seqStr = String(i + 1).padStart(3, '0');
      const newTaskId = `${prefix}${seqStr}`;
      
      const idsToUpdate = taskGroup.rows.map(r => r.id);
      
      // Let's check if they actually need an update to save writes
      const sampleRow = taskGroup.rows[0];
      if (sampleRow.task_id === newTaskId) {
        // Already matches, skip
        continue;
      }
      
      console.log(`  Updating "${taskGroup.name}" from "${sampleRow.task_id || 'null'}" to "${newTaskId}"`);
      
      const { error: updateError } = await supabase
        .from('student_task_feedback')
        .update({ task_id: newTaskId })
        .in('id', idsToUpdate);
        
      if (updateError) {
        console.error(`Error updating task "${taskGroup.name}":`, updateError.message);
      }
    }
  }
  
  console.log('Re-sequencing completed successfully!');
}

run();
