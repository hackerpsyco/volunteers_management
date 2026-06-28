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
  const { data: students, error } = await supabase
    .from('students')
    .select('*')
    .limit(10);
    
  if (error) {
    console.error('Error fetching students:', error);
    return;
  }
  
  console.log('Sample students details with all columns:');
  students?.forEach(s => {
    console.log(`Name: ${s.name}`);
    console.log(`  Bio: ${s.bio}`);
    console.log(`  Location: ${s.location}`);
    console.log(`  Email: ${s.email}`);
    console.log(`  Phone: ${s.phone_number}`);
  });
}

run();
