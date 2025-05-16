import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/firebase/firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    console.error('❌ Missing Stripe signature header');
    return new Response('Missing Stripe signature', { status: 400 });
  }

  const rawBody = await req.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('❌ Stripe webhook verification failed:', err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // 🎯 Handle successful subscription
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const email = session.customer_email;
    console.log('✅ Stripe session object:', session);
    if (email) {
      try {
        const userRef = doc(db, 'users', email.toLowerCase().trim());
        await setDoc(userRef, {
          isPro: true,
          upgradedAt: new Date().toISOString(),
          stripeCustomerId: session.customer,
          trialUsed: true, // ✅ now tracked from webhook too
        }, { merge: true });

        console.log(`✅ Marked ${email} as Pro in Firestore`);
      } catch (err) {
        console.error('❌ Firestore write error:', err);
        return new Response('Failed to save user status', { status: 500 });
      }
    } else {
      console.warn('⚠️ No customer_email found in session');
    }
  } else {
    console.log(`ℹ️ Received unhandled event type: ${event.type}`);
  }
  

  return NextResponse.json({ received: true });
}
