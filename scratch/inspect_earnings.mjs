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
  // Query all students
  const { data: students } = await supabase.from('students').select('id, name, class_id, designation, classes(name)');
  
  console.log('Students in CCC EMP Fellow class:');
  const targetClassId = '67d7f2e2-37bc-4a8a-88e2-96ed0cc0b78c';
  const cccStudents = students?.filter(s => s.class_id === targetClassId) || [];
  console.log(`Count: ${cccStudents.length}`);
  
  cccStudents.forEach(s => {
    console.log(`- ${s.name} (${s.id}), Designation: ${s.designation}`);
  });
  
  console.log('\nWhere are the top earners located?');
  const topEarners = ['Manya Yadav', 'Pranjali Kahar', 'Akanksha Pasi', 'Vrendra Tiwari'];
  students?.filter(s => topEarners.includes(s.name)).forEach(s => {
    console.log(`- ${s.name} (${s.id}), Class ID: ${s.class_id}, Class Name: ${s?.classes?.name || 'None'}, Designation: ${s.designation}`);
  });
}

run();
