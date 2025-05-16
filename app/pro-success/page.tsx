'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';


export default function ProSuccessPage() {
  const [stripeCustomerId, setStripeCustomerId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('isPro', 'true');
    localStorage.setItem('justUpgraded', 'true');

    const fetchStripeCustomerId = async () => {
      const email = localStorage.getItem('participantEmail');
      if (!email) return;

      const userRef = doc(db, 'users', email.toLowerCase());
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        setStripeCustomerId(snap.data().stripeCustomerId || null);
      }
    };

    fetchStripeCustomerId();
  }, []);

  const handleManageClick = async () => {
    if (!stripeCustomerId) return;
    const res = await fetch('/api/create-portal-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId: stripeCustomerId }),
    });

    const data = await res.json();
    if (data?.url) {
      window.location.href = data.url;
    } else {
      alert('Unable to open Stripe Portal');
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-20 bg-white">
      <div className="max-w-xl w-full bg-white rounded-3xl shadow-xl p-10 text-center space-y-8 border border-gray-100">
        
        <motion.div
          initial={{ rotate: -15 }}
          animate={{ rotate: [0, 20, -20, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-5xl"
        >
          🎉
        </motion.div>

        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-emerald-500 via-indigo-500 to-purple-500 bg-clip-text text-transparent">
          You're Pro!
        </h1>

        <p className="text-gray-700 text-lg">
          Thanks for upgrading — premium features are now unlocked.
        </p>

        <ul className="text-left text-base text-gray-700 space-y-3 border-t pt-4 border-gray-200">
          {[
            'Unlimited Polls',
            'Invite Deadlines & Reminders',
            'Add-to-Calendar Support',
            'Add Zoom links',
          ].map((feature) => (
            <li key={feature} className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              {feature}
            </li>
          ))}
        </ul>

        <div className="pt-3">
          <motion.a
            href="https://www.greatmeets.ai/"
            whileTap={{ scale: 0.98 }}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="block w-full py-4 rounded-full transition-transform duration-300 shadow-md text-center text-lg font-semibold bg-gradient-to-r from-purple-500 via-violet-600 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white"
          >
            Back to GreatMeets
          </motion.a>
        </div>

        {stripeCustomerId && (
          <motion.button
            onClick={handleManageClick}
            whileTap={{ scale: 0.98 }}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="block w-full py-4 rounded-full transition-transform duration-300 shadow-md text-center text-lg font-semibold bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white"
          >
            Manage Subscription
          </motion.button>
        )}


      </div>
    </main>
  );
}
