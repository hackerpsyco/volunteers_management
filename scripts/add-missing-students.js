#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const missingStudents = [
  { id: 'EMP2514', name: 'Saroj Panika', email: 'Sarojpanika.ccc2526@gmail.com' },
  { id: 'EMP2515', name: 'Shivam Dahiya', email: 'Shivamdahiya.ccc2526@gmail.com' },
];

function generatePassword(name) {
  return `${name.split(' ')[0]}+123`;
}

async function run() {
  console.log('\n🚀 Adding Missing WES Fellow Students\n');

  const { data: role, error: roleError } = await supabase
    .from('roles')
    .select('id')
    .eq('name', 'Student')
    .single();

  if (roleError) {
    console.error('❌ Error fetching Student role:', roleError.message);
    return;
  }

  const { data: classData, error: classError } = await supabase
    .from('classes')
    .select('id')
    .eq('name', 'WES Fellow')
    .single();

  if (classError) {
    console.error('❌ Error fetching WES Fellow class:', classError.message);
    return;
  }

  console.log(`✅ Found Student role: ${role.id}`);
  console.log(`✅ Found WES Fellow class: ${classData.id}\n`);

  for (const student of missingStudents) {
    const password = generatePassword(student.name);

    process.stdout.write(`Processing ${student.name}... `);

    // Create auth user
    const { data: authUser, error: authError } =
      await supabase.auth.admin.createUser({
        email: student.email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: student.name,
          student_id: student.id,
        },
      });

    if (authError) {
      if (authError.message.toLowerCase().includes('already')) {
        console.log(`⚠️ Already registered - skipping`);
        continue;
      } else {
        console.log(`❌ Auth Error: ${authError.message}`);
        continue;
      }
    }

    const userId = authUser.user.id;
    process.stdout.write('Auth Created ✅ → ');

    // Create profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        id: userId,
        email: student.email,
        full_name: student.name,
        role_id: role.id,
        class_id: classData.id,
        is_active: true,
      });

    if (profileError) {
      console.log(`❌ Profile Error: ${profileError.message}`);
    } else {
      console.log('Profile ✅');
    }
  }

  console.log('\n✅ Missing Students Added\n');
}

run();
