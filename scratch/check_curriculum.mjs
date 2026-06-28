import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load env variables from .env.local manually
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
  const { data, error } = await supabase
    .from('curriculum')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error fetching curriculum:', error);
  } else {
    console.log('Sample Curriculum Row:', data[0]);
    console.log('Curriculum Columns:', Object.keys(data[0] || {}));
  }

  const { data: classData, error: classError } = await supabase
    .from('classes')
    .select('*')
    .limit(1);

  if (classError) {
    console.error('Error fetching classes:', classError);
  } else {
    console.log('Sample Class Row:', classData[0]);
    console.log('Class Columns:', Object.keys(classData[0] || {}));
  }
}

run();
