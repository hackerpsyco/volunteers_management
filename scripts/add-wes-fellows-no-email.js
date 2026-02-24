#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const Students = [
  { id: 'EMP2501', name: 'Narghis Khan', email: 'nargish.ccc2526@gmail.com' },
  { id: 'EMP2502', name: 'Mohammad Ittehad', email: 'ittehad.ccc2526@gmail.com' },
  { id: 'EMP2503', name: 'Mahak Khan', email: 'mahakkhan.ccc2526@gmail.com' },
  { id: 'EMP2504', name: 'Anjali Morya', email: 'anjali.ccc2526@gmail.com' },
  { id: 'EMP2505', name: 'Akash Verma', email: 'akashverma.ccc2526@gmail.com' },
  { id: 'EMP2506', name: 'Paras Barman', email: 'parasbarman.ccc2526@gmail.com' },
  { id: 'EMP2507', name: 'Nasreen Bano', email: 'nashreen.ccc2526@gmail.com' },
  { id: 'EMP2510', name: 'Sonali Malaiya', email: 'sonali.ccc2526@gmail.com' },
  { id: 'EMP2512', name: 'Harsita Panika', email: 'harshita.ccc2526@gmail.com' },
  { id: 'EMP2513', name: 'Anchal Singh Gond', email: 'anchal.ccc2526@gmail.com' },
  { id: 'EMP2514', name: 'Saroj Panika', email: 'Sarojpanika.ccc2526@gmail.com' },
  { id: 'EMP2515', name: 'Shivam Dahiya', email: 'Shivamdahiya.ccc2526@gmail.com' },
  { id: 'EMP2517', name: 'Aarzoo Khanam', email: 'arzoo.ccc2526@gmail.com' },
  { id: 'EMP2519', name: 'Vaishnavi Varman', email: 'vaishnavi.ccc2526@gmail.com' },
  { id: 'EMP2521', name: 'Aasifa Begam', email: 'aasifa.ccc2526@gmail.com' },
  { id: 'EMP2523', name: 'Minakshi Barman', email: 'minakshibarmanccc@gmail.com' },
  { id: 'EMP2525', name: 'Alkama Bee', email: 'alkamabeeccc@gmail.com' },
  { id: 'EMP2526', name: 'Warisun', email: 'varsunnishaccc@gmail.com' },
];

function generatePassword(name) {
  return `${name.split(' ')[0]}+123`;
}

async function run() {
  console.log('\n🚀 Rebuilding Students Safely\n');

  const { data: role } = await supabase
    .from('roles')
    .select('id')
    .eq('name', 'Student')
    .single();

  const { data: classData } = await supabase
    .from('classes')
    .select('id')
    .eq('name', 'WES Fellow')
    .single();

  for (const Student of Students) {
    const password = generatePassword(Student.name);
    process.stdout.write(`Processing ${Student.name}... `);

    // ✅ Create auth user (safe)
    const { data: authUser, error: authError } =
      await supabase.auth.admin.createUser({
        email: Student.email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: Student.name,
          student_id: Student.id,
        },
      });

    let userId;
    if (authError) {
      if (authError.message.includes('already registered')) {
        // Get existing user by email
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) {
          console.log(`❌ List Error: ${listError.message}`);
          continue;
        }
        const found = users.find(u => u.email === Student.email);
        if (found) {
          userId = found.id;
          console.log('Auth Exists ✅');
        } else {
          console.log(`❌ User not found in list`);
          continue;
        }
      } else {
        console.log(`❌ ${authError.message}`);
        continue;
      }
    } else {
      userId = authUser.user.id;
      console.log('Auth Created ✅');
    }

    // ✅ Create profile (safe)
    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        id: userId,
        email: Student.email,
        full_name: Student.name,
        role_id: role.id,
        class_id: classData.id,
        is_active: true,
      });

    if (profileError) {
      console.log(`❌ Profile Error: ${profileError.message}`);
    } else {
      console.log('Profile Upserted ✅');
    }
  }

  console.log('\n✅ Rebuild Complete\n');
}

run();
