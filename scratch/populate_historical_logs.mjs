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
  console.log('Generating historical logs for existing database records...');
  
  const logsToInsert = [];

  // 1. Fetch Classes
  console.log('Fetching classes...');
  const { data: classes, error: classErr } = await supabase
    .from('classes')
    .select('name, created_at');
    
  if (classes) {
    classes.forEach(c => {
      logsToInsert.push({
        user_email: 'database_system@wes.org',
        user_name: 'Database System (Historical)',
        action: 'CREATE',
        module: 'Classes',
        details: `Initial setup of class: "${c.name}"`,
        created_at: c.created_at || new Date().toISOString()
      });
    });
  }

  // 2. Fetch Students
  console.log('Fetching students...');
  const { data: students, error: studentErr } = await supabase
    .from('students')
    .select('name, email, created_at');
    
  if (students) {
    students.forEach(s => {
      logsToInsert.push({
        user_email: 'database_system@wes.org',
        user_name: 'Database System (Historical)',
        action: 'CREATE',
        module: 'Students',
        details: `Initial registration of student: ${s.name} (Email: ${s.email || 'N/A'})`,
        created_at: s.created_at || new Date().toISOString()
      });
    });
  }

  // 3. Fetch Sessions
  console.log('Fetching sessions...');
  const { data: sessions, error: sessionErr } = await supabase
    .from('sessions')
    .select('title, session_date, class_batch, created_at');
    
  if (sessions) {
    sessions.forEach(se => {
      const dateStr = se.session_date || 'N/A';
      logsToInsert.push({
        user_email: 'database_system@wes.org',
        user_name: 'Database System (Historical)',
        action: 'CREATE',
        module: 'Sessions',
        details: `Initial setup of session: "${se.title}" (Date: ${dateStr}, Class: ${se.class_batch})`,
        created_at: se.created_at || new Date().toISOString()
      });
    });
  }

  console.log(`Prepared ${logsToInsert.length} historical logs. Inserting in batches of 100...`);
  
  // Insert in batches of 100 to prevent payload size issues
  const batchSize = 100;
  for (let i = 0; i < logsToInsert.length; i += batchSize) {
    const batch = logsToInsert.slice(i, i + batchSize);
    const { error } = await supabase
      .from('activity_logs')
      .insert(batch);
      
    if (error) {
      console.error(`Error inserting batch ${i / batchSize}:`, error);
    } else {
      console.log(`Inserted batch ${(i / batchSize) + 1}/${Math.ceil(logsToInsert.length / batchSize)}`);
    }
  }

  console.log('Historical logs generation completed successfully!');
}

run();
