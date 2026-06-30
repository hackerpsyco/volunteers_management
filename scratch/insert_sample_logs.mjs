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
  console.log('Inserting sample logs into activity_logs...');
  
  const sampleLogs = [
    {
      user_email: 'admin@wes.org',
      user_name: 'System Admin',
      action: 'UPDATE',
      module: 'Students',
      details: 'Renamed student designations to CCC, Junior Fellow, and Senior Fellow.'
    },
    {
      user_email: 'admin@wes.org',
      user_name: 'System Admin',
      action: 'LOCK',
      module: 'Students',
      details: 'Locked profile editing for Aafreen Bee.'
    },
    {
      user_email: 'admin@wes.org',
      user_name: 'System Admin',
      action: 'CREATE',
      module: 'Classes',
      details: 'Created new class CCC EMP Fellow.'
    }
  ];

  const { data, error } = await supabase
    .from('activity_logs')
    .insert(sampleLogs);

  if (error) {
    console.error('Error inserting logs:', error);
  } else {
    console.log('Successfully inserted sample logs!');
  }
}

run();
