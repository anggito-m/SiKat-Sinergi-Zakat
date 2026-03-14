import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const MAYAR_API_URL = 'https://api.mayar.id/hl/v1/payment';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: paymentId } = await params;
    const mayarApiKey = process.env.MAYAR_API_KEY;

    if (!mayarApiKey || !paymentId) {
      return NextResponse.json({ error: 'Missing API key or payment ID' }, { status: 400 });
    }

    // 1. Check with Mayar API
    const response = await fetch(`${MAYAR_API_URL}/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${mayarApiKey}`,
      },
      // Ensure we don't cache this request
      cache: 'no-store'
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch payment status from Mayar' }, { status: response.status });
    }

    const mayarData = await response.json();
    const isPaid = mayarData?.data?.status === 'paid';

    if (!isPaid) {
      return NextResponse.json({ success: true, status: mayarData?.data?.status || 'pending', updated: false });
    }

    // 2. If Paid in Mayar, update our Database using the same RPC function as the webhook
    // This bypasses RLS issues for the anonymous check-status call
    const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc('process_mayar_webhook', {
      p_payment_id: paymentId,
      p_amount: mayarData?.data?.amount || 0,
      p_metadata: null // Metadata update not needed during manual sync if pending record exists
    });

    if (rpcError) {
      console.error('RPC Error during check status:', rpcError);
      return NextResponse.json({ error: 'Failed to update database', details: rpcError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      status: 'selesai', 
      updated: true // Always true if RPC succeeded for a 'paid' invoice
    });

  } catch (error: any) {
    console.error('Check Payment Error:', error);
    return NextResponse.json({ error: 'Check payment failed' }, { status: 500 });
  }
}
