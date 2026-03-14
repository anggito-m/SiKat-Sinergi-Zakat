import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase'; // Using the admin client to bypass RLS for server-side updates

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('--- RAW MAYAR WEBHOOK PAYLOAD ---');
    console.log(JSON.stringify(body, null, 2));
    console.log('---------------------------------');

    const isSuccess = body.event === 'payment.received';
    
    if (!isSuccess) {
      console.log('Webhook ignored. Not a successful payment event:', body.event);
      return NextResponse.json({ success: true, message: 'Event ignored' });
    }

    // Extract metadata from description if present
    const description = body.data?.description || '';
    let metadata: any = null;
    const metaMatch = description.match(/\| METADATA:(.*)$/);
    if (metaMatch && metaMatch[1]) {
      try {
        metadata = JSON.parse(metaMatch[1]);
        console.log('Parsed Metadata:', metadata);
      } catch (e) {
        console.error('Failed to parse metadata from description:', e);
      }
    }

    // the payment link ID we saved is actually returned as 'productId' by Mayar in this webhook format
    const paymentId = body.data?.productId || body.data?.id || body.id;

    if (!paymentId) {
      console.error('Webhook payload missing payment ID (productId or id):', body);
      return NextResponse.json({ error: 'Missing payment ID' }, { status: 400 });
    }

    console.log(`Processing successful payment for ID: ${paymentId}`);

    const amount = body.data?.amount || 0;

    // Call the SECURITY DEFINER function to bypass RLS for webhook updates/inserts
    const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc('process_mayar_webhook', {
      p_payment_id: paymentId,
      p_amount: amount,
      p_metadata: metadata
    });

    if (rpcError) {
      console.error('RPC Error processing webhook:', rpcError);
      return NextResponse.json({ error: 'Database update failed', details: rpcError.message }, { status: 500 });
    }

    console.log('Webhook Processed UI Result:', rpcResult);
    return NextResponse.json(rpcResult || { success: true, message: 'Processed via RPC' });

  } catch (error: any) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  return NextResponse.json({
    status: 'active',
    message: 'ZakatDesa Mayar Webhook endpoint is running. This endpoint only accepts POST requests from Mayar.',
  });
}
