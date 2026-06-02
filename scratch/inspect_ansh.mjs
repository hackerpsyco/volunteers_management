import fs from 'fs';

const SUPABASE_URL = "https://bkafweywaswykowzrhmx.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrYWZ3ZXl3YXN3eWtvd3pyaG14Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTI3NDczNCwiZXhwIjoyMDg0ODUwNzM0fQ.fTluY0mP6RwFpTuZ_yXq6nXH3nQ0PSIssEldYMuT-RU";

async function inspectAnsh() {
  console.log("Checking students table...");
  const studentsRes = await fetch(`${SUPABASE_URL}/rest/v1/students?select=*`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
  });
  const students = await studentsRes.json();
  
  const anshStudents = students.filter(s => 
    (s.email && s.email.toLowerCase().includes('ansh')) || 
    (s.name && s.name.toLowerCase().includes('ansh'))
  );
  
  console.log("Found matching students:", anshStudents);
  
  if (anshStudents.length > 0) {
    const studentIds = anshStudents.map(s => s.id);
    console.log("Checking student_task_feedback for these students...");
    const feedbackRes = await fetch(`${SUPABASE_URL}/rest/v1/student_task_feedback?select=*&student_id=in.(${studentIds.join(',')})`, {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    });
    const feedback = await feedbackRes.json();
    console.log("Feedback records:", feedback);
  }

  // Also check tasks table and academic year settings
  console.log("Checking all active academic years/tasks...");
  const tasksRes = await fetch(`${SUPABASE_URL}/rest/v1/tasks?select=*&limit=10`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
  });
  const tasks = await tasksRes.json();
  console.log("Sample tasks:", tasks);
}

inspectAnsh().catch(console.error);
