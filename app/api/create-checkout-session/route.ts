import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/firebase/firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export async function POST() {
  console.log('⚙️ Starting Stripe checkout session creation');
  console.log('🔐 ENV CHECKS:', {
    STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
    STRIPE_PRICE_ID: process.env.STRIPE_PRICE_ID,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  });

  try {
    // 👤 Replace this with your auth/session logic to get user email
    const userEmail = 'replace-this@example.com';
    if (!userEmail) {
      return NextResponse.json({ error: 'Missing user email' }, { status: 400 });
    }

    // 🔍 Check Firestore to see if user has already used a trial
    const userRef = doc(db, 'users', userEmail.toLowerCase().trim());
    const userSnap = await getDoc(userRef);
    const alreadyUsedTrial = userSnap.exists() && userSnap.data()?.trialUsed === true;

    console.log(`📦 Firestore trialUsed: ${alreadyUsedTrial}`);

    // 🔧 Create (or reuse) Stripe customer
    const customerList = await stripe.customers.list({ email: userEmail, limit: 1 });
    const existingCustomer = customerList.data[0];
    const customer = existingCustomer || await stripe.customers.create({
      email: userEmail,
    });

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer: customer.id,
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID!,
          quantity: 1,
        },
      ],
      allow_promotion_codes: true,
      subscription_data: {
        trial_period_days: alreadyUsedTrial ? undefined : 7,
      },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/pro-success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/upgrade`,
    });

    // ✅ Mark trial as used in Firestore if it wasn't
    if (!alreadyUsedTrial) {
      await setDoc(userRef, { trialUsed: true }, { merge: true });
      console.log(`✅ Firestore trialUsed set for ${userEmail}`);
    }

    console.log('✅ Session created:', session.id);
    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('❌ Stripe error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
