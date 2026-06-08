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

async function run() {
  const res = await fetch(`${supabaseUrl}/rest/v1/`, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    }
  });
  const data = await res.json();
  if (data.definitions && data.definitions.student_task_feedback) {
    console.log('Columns in student_task_feedback:', Object.keys(data.definitions.student_task_feedback.properties));
  } else {
    console.log('Definitions not found or empty:', Object.keys(data.definitions || {}));
  }
}

run();
