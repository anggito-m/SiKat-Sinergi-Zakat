import { NextResponse } from 'next/server';

const MAYAR_API_URL = 'https://api.mayar.id/hl/v1/payment/create';

export async function POST(req: Request) {
  try {
    const { amount, title, description, customer_name, customer_email, customer_mobile, metadata } = await req.json();

    const mayarApiKey = process.env.MAYAR_API_KEY;

    if (!mayarApiKey) {
      return NextResponse.json({ error: 'MAYAR_API_KEY is not configured.' }, { status: 500 });
    }

    // Calculate expiration: 24 hours from now
    const expiredAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    
    // Embed metadata inside the description so the webhook can extract it
    const finalDescription = metadata ? `${description || title} | METADATA:${JSON.stringify(metadata)}` : (description || title || 'Pembayaran Zakat');

    const response = await fetch(MAYAR_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mayarApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: customer_name || 'Muzakki',
        email: customer_email || 'noemail@zakatdesa.id',
        amount: Math.round(amount),
        mobile: customer_mobile || '08000000000',
        redirectURL: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/?payment=success`,
        description: finalDescription,
        expiredAt,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Mayar API error response:', data);
      return NextResponse.json(
        { error: data?.message || 'Gagal membuat link pembayaran Mayar.', details: data },
        { status: response.status }
      );
    }

    // Mayar returns the payment link in data.data.link or data.link
    const paymentLink = data?.data?.link || data?.link || data?.data?.url || data?.url;

    if (!paymentLink) {
      console.error('Mayar response missing link:', data);
      return NextResponse.json(
        { error: 'Link pembayaran tidak ditemukan dalam respons Mayar.', details: data },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      payment_link: paymentLink,
      payment_id: data?.data?.id || data?.id,
    });

  } catch (error: any) {
    console.error('Mayar Payment API Error:', error);
    return NextResponse.json({ error: 'Gagal menghubungi server pembayaran Mayar.' }, { status: 500 });
  }
}
