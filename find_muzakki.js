const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase.from('muzakki').select('id, nama_kk').eq('nama_kk', 'Masjid Makmur').single();
  if (error) {
    console.error('Error:', error);
    return;
  }
  console.log('Muzakki ID:', data.id);
}

run();
