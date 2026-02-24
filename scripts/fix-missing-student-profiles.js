#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const MISSING_STUDENTS = [
  { name: 'Shivam Dahiya', email: 'shivamdahiya.ccc2526@gmail.com' },
  { name: 'Saroj Panika', email: 'sarojpanika.ccc2526@gmail.com' }
];

async function fixMissingProfiles() {
  console.log('\n🔧 FIXING MISSING STUDENT PROFILES\n');

  try {
    // Get Student role
    const { data: studentRole, error: roleError } = await supabase
      .from('roles')
      .select('id')
      .eq('name', 'Student')
      .single();

    if (roleError) {
      console.log(`❌ Error fetching Student role: ${roleError.message}`);
      return;
    }

    // Get WES Fellow class
    const { data: wesFellowClass, error: classError } = await supabase
      .from('classes')
      .select('id')
      .eq('name', 'WES Fellow')
      .single();

    if (classError) {
      console.log(`❌ Error fetching WES Fellow class: ${classError.message}`);
      return;
    }

    // Get auth users for missing students
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      console.log(`❌ Error listing auth users: ${listError.message}`);
      return;
    }

    // Create profiles for missing students
    for (const student of MISSING_STUDENTS) {
      const authUser = users.find(u => u.email === student.email);
      
      if (!authUser) {
        console.log(`❌ ${student.name}: Auth user not found`);
        continue;
      }

      process.stdout.write(`Creating profile for ${student.name}... `);

      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          id: authUser.id,
          email: student.email,
          full_name: student.name,
          role_id: studentRole.id,
          class_id: wesFellowClass.id,
          is_active: true,
        });

      if (profileError) {
        console.log(`❌ ${profileError.message}`);
      } else {
        console.log('✅ Profile Created');
      }
    }

    console.log('\n✅ Fix Complete\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

fixMissingProfiles();
