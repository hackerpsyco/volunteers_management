import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const mappings = {
  "Nausheen Naaj": "Nausheen Naaz",
  "demo": "demo fellow"
};

async function run() {
  console.log("Starting mapping cleanup for known spelling inconsistencies...");

  for (const [oldName, newName] of Object.entries(mappings)) {
    console.log(`Mapping "${oldName}" to "${newName}"...`);
    
    const { data: records, error: fetchError } = await supabase
      .from('student_performance')
      .select('id')
      .eq('student_name', oldName);

    if (fetchError) {
      console.error(`Error fetching records for "${oldName}":`, fetchError);
      continue;
    }

    console.log(`Found ${records.length} records to update.`);

    if (records.length > 0) {
      const ids = records.map(r => r.id);
      const { error: updateError } = await supabase
        .from('student_performance')
        .update({ student_name: newName })
        .in('id', ids);

      if (updateError) {
        console.error(`Error updating records to "${newName}":`, updateError);
      } else {
        console.log(`Successfully updated ${records.length} records to "${newName}"!`);
      }
    }
  }

  console.log("Mapping cleanup complete.");
}

run();
