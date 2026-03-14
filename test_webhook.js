const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'masjidmakmurbbkn@gmail.com',
    password: 'password123',
  });

  if (authError) {
    console.error('Auth Error:', authError.message);
    return;
  }

  const userId = authData.user.id;
  
  const { data: muzakkiData, error: muzakkiError } = await supabase
    .from('muzakki')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (muzakkiError) {
    console.error('Muzakki Query Error:', muzakkiError.message);
    return;
  }

  console.log('Valid Muzakki ID:', muzakkiData.id);

  // Now let's trigger the local webhook API
  const body = {
    event: 'payment.received',
    data: {
      productId: 'testing-infaq-12345',
      amount: 15000,
      description: `Pembayaran via AI | METADATA:{"jenis_pembayaran":"infaq","muzakki_id":"${muzakkiData.id}"}`
    }
  };

  try {
    const res = await fetch('http://localhost:3000/api/webhook/mayar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    
    const json = await res.json();
    console.log('Webhook Response:', res.status, json);
    
    // Check if it inserted into infaq_sedekah
    const { data: checkData, error: checkError } = await supabase
      .from('infaq_sedekah')
      .select('id, nominal, status')
      .eq('mayar_payment_id', 'testing-infaq-12345');
      
    console.log('Database Record:', checkData);
    
  } catch (err) {
    console.error('Fetch error:', err.message);
  }
}

run();
