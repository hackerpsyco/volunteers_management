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
  console.log('Starting student designations database update...');

  // Update '1 Certified computer course' and '2 Certified computer course_EMP' to '1. CCC'
  console.log('Updating 1 and 2 to "1. CCC"...');
  const { count: c1, error: e1 } = await supabase
    .from('students')
    .update({ designation: '1. CCC' })
    .in('designation', ['1 Certified computer course', '2 Certified computer course_EMP']);
    
  if (e1) console.error('Error updating to 1. CCC:', e1);
  
  // Update '3 WES Intern/Junior Fellow' to '2. Junior Fellow'
  console.log('Updating 3 to "2. Junior Fellow"...');
  const { count: c2, error: e2 } = await supabase
    .from('students')
    .update({ designation: '2. Junior Fellow' })
    .eq('designation', '3 WES Intern/Junior Fellow');
    
  if (e2) console.error('Error updating to 2. Junior Fellow:', e2);

  // Update '4 WES Senior Fellow' to '3. Senior Fellow'
  console.log('Updating 4 to "3. Senior Fellow"...');
  const { count: c3, error: e3 } = await supabase
    .from('students')
    .update({ designation: '3. Senior Fellow' })
    .eq('designation', '4 WES Senior Fellow');
    
  if (e3) console.error('Error updating to 3. Senior Fellow:', e3);

  console.log('Database update completed successfully!');
}

run();
