import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function create() {
  console.log("Creating Patient...");
  const { data: d1, error: e1 } = await supabase.auth.signUp({
    email: 'patient@example.com',
    password: 'password123',
  });
  if (e1 && !e1.message.includes('already registered')) console.error(e1);
  else console.log("Patient created.");

  console.log("Creating ASHA...");
  const { data: d2, error: e2 } = await supabase.auth.signUp({
    email: 'asha@example.com',
    password: 'password123',
  });
  if (e2 && !e2.message.includes('already registered')) console.error(e2);
  else console.log("ASHA created.");
  
  if (d1?.user) {
    await supabase.from('profiles').update({ role: 'patient' }).eq('id', d1.user.id);
  }
  if (d2?.user) {
    await supabase.from('profiles').update({ role: 'asha' }).eq('id', d2.user.id);
  }
}
create();
