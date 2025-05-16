'use client';

import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function UpgradePage() {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);

    // Use a fallback guest email (you can ignore this later in Stripe)
    const email = localStorage.getItem('participantEmail') || 'guest@greatmeets.ai';

    const res = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();

    if (data.url) {
      window.location.href = data.url;
    } else {
      alert('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-20 bg-white">
      <div className="w-full max-w-xl sm:max-w-2xl bg-white shadow-2xl rounded-2xl px-12 py-14 space-y-8 text-center">
        <motion.div
          initial={{ rotate: -15 }}
          animate={{ rotate: [0, 20, -20, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-5xl"
        >
          🚀
        </motion.div>

        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-indigo-500">
          Go Pro
        </h1>

        <p className="text-gray-600 text-base">
          Unlock premium features like polls, deadlines, reminders, and calendar links.
        </p>

        <div className="bg-gray-50 border border-gray-200 rounded-xl px-6 py-5 space-y-4 text-left">
          <ul className="space-y-3 text-sm text-gray-700">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="text-green-500 w-5 h-5" />
              Unlimited polls
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="text-green-500 w-5 h-5" />
              Zoom integration
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="text-green-500 w-5 h-5" />
              Poll deadlines + reminders
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="text-green-500 w-5 h-5" />
              Add-to-calendar support
            </li>
          </ul>
        </div>

        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 hover:to-indigo-700 text-white rounded-full font-semibold text-lg shadow-md transition-all duration-300"
        >
          {loading ? 'Redirecting to Stripe…' : 'Upgrade for €9/month'}
        </button>

        <p className="text-sm text-gray-400 pt-2">
          Cancel anytime. No commitments.
        </p>
      </div>
    </main>
  );
}
