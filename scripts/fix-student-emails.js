#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const STUDENT_EMAILS = {
  'Narghis Khan': 'nargish.ccc2526@gmail.com',
  'Mohammad Ittehad': 'ittehad.ccc2526@gmail.com',
  'Mahak Khan': 'mahakkhan.ccc2526@gmail.com',
  'Anjali Morya': 'anjali.ccc2526@gmail.com',
  'Akash Verma': 'akashverma.ccc2526@gmail.com',
  'Paras Barman': 'parasbarman.ccc2526@gmail.com',
  'Nasreen Bano': 'nashreen.ccc2526@gmail.com',
  'Sonali Malaiya': 'sonali.ccc2526@gmail.com',
  'Harsita Panika': 'harshita.ccc2526@gmail.com',
  'Anchal Singh Gond': 'anchal.ccc2526@gmail.com',
  'Saroj Panika': 'Sarojpanika.ccc2526@gmail.com',
  'Shivam Dahiya': 'Shivamdahiya.ccc2526@gmail.com',
  'Aarzoo Khanam': 'arzoo.ccc2526@gmail.com',
  'Vaishnavi Varman': 'vaishnavi.ccc2526@gmail.com',
  'Aasifa Begam': 'aasifa.ccc2526@gmail.com',
  'Minakshi Barman': 'minakshibarmanccc@gmail.com',
  'Alkama Bee': 'alkamabeeccc@gmail.com',
  'Warisun': 'varsunnishaccc@gmail.com',
};

async function fixStudentEmails() {
  console.log('\n📧 FIXING STUDENT EMAILS IN STUDENTS TABLE\n');

  try {
    for (const [name, email] of Object.entries(STUDENT_EMAILS)) {
      process.stdout.write(`Updating ${name}... `);

      const { error } = await supabase
        .from('students')
        .update({ email })
        .eq('name', name);

      if (error) {
        console.log(`❌ ${error.message}`);
      } else {
        console.log('✅');
      }
    }

    console.log('\n✅ Email Update Complete\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

fixStudentEmails();
