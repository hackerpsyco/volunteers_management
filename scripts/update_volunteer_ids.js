import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://bkafweywaswykowzrhmx.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrYWZ3ZXl3YXN3eWtvd3pyaG14Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTI3NDczNCwiZXhwIjoyMDg0ODUwNzM0fQ.fTluY0mP6RwFpTuZ_yXq6nXH3nQ0PSIssEldYMuT-RU';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export function generateVolunteerId(v) {
  const name = (v.name || 'Volunteer').trim();
  
  let companyCode = 'NA';
  if (v.organization_type === 'individual') {
    companyCode = 'SE';
  } else if (v.organization_name && v.organization_name.trim()) {
    companyCode = v.organization_name.trim().slice(0, 2).toUpperCase();
  }

  let city = (v.city || 'NA').trim();
  city = city ? city.charAt(0).toUpperCase() + city.slice(1) : 'NA';

  let roleShort = 'GT';
  const pref = (v.preference || v.role_session || '').toLowerCase();
  if (pref.includes('speaker')) {
    roleShort = 'GS';
  } else if (pref.includes('local')) {
    roleShort = 'LT';
  } else if (pref.includes('teacher')) {
    roleShort = 'GT';
  }

  return `${name}-${companyCode}-${city}-${roleShort}`;
}

async function run() {
  console.log('Fetching volunteers...');
  const { data: volunteers, error } = await supabase.from('volunteers').select('*');
  if (error) {
    console.error('Error fetching volunteers:', error);
    return;
  }

  console.log(`Found ${volunteers.length} volunteers. Updating volunteer_id...`);

  let updatedCount = 0;
  let errorCount = 0;

  for (const v of volunteers) {
    const vId = generateVolunteerId(v);
    const { error: updateErr } = await supabase
      .from('volunteers')
      .update({ volunteer_id: vId })
      .eq('id', v.id);

    if (updateErr) {
      if (errorCount === 0) {
        console.error('Update error (column might not exist yet):', updateErr);
      }
      errorCount++;
    } else {
      updatedCount++;
    }
  }

  console.log(`Finished updating: ${updatedCount} success, ${errorCount} errors.`);
}

run();
