const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bstqvplfjwtipiuuejac.supabase.co';
const supabaseKey = 'sb_publishable_tEn9D0_4LNyPxVbrDSNzCQ_6swv4GVI'; // This was their NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY from .env.local

const supabase = createClient(supabaseUrl, supabaseKey);

async function signUp() {
  const { data, error } = await supabase.auth.signUp({
    email: 'test@swasthyascan.com',
    password: 'password123',
    options: {
        data: {
            full_name: 'Hackathon Test Patient'
        }
    }
  });
  console.log(error ? error.message : "User created successfully!");
}

signUp();
