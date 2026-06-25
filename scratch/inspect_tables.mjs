import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envLocalPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envLocalPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.substring(1, value.length - 1);
    }
    env[key] = value;
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('--- Inspecting students table ---');
  const { data: students, error: err1 } = await supabase.from('students').select('*').limit(1);
  if (err1) console.error(err1);
  else console.log('students row:', students[0], '\nkeys:', Object.keys(students[0] || {}));

  console.log('\n--- Inspecting student_earnings table ---');
  const { data: earnings, error: err2 } = await supabase.from('student_earnings').select('*').limit(1);
  if (err2) console.error(err2);
  else console.log('earnings row:', earnings[0], '\nkeys:', Object.keys(earnings[0] || {}));

  console.log('\n--- Inspecting user_profiles table ---');
  const { data: profiles, error: err3 } = await supabase.from('user_profiles').select('*').limit(1);
  if (err3) console.error(err3);
  else console.log('profiles row:', profiles[0], '\nkeys:', Object.keys(profiles[0] || {}));
}

run();
