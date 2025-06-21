'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Crown } from 'lucide-react';
import { useIsPro } from '../components/isPro';
import { useEffect, useState } from 'react';
import { getTrialDaysRemaining } from '../app/utils/isTrialActive';

export default function UpgradeToPro() {
  const router = useRouter();
  const isPro = useIsPro(); // true | false | null
  const [daysLeft, setDaysLeft] = useState<number | null>(null);

  useEffect(() => {
    const days = getTrialDaysRemaining();
    setDaysLeft(days);
  }, []);

  // 🧠 Don’t render anything until we know the Pro status
  if (isPro === null) {
    return (
      <motion.div
        initial={{ y: -5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 18 }}
        className="flex items-center gap-2 text-sm bg-gray-200 text-gray-500 font-medium py-2 px-4 rounded-full shadow-inner animate-pulse"
      >
        <Crown className="w-4 h-4 text-gray-400" />
        Checking...
      </motion.div>
    );
  }

  // 🟢 Pro user banner
 if (isPro) {
  return (
    <motion.div
      initial={{ y: -5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 18 }}
      className="flex items-center gap-2 text-sm bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white font-medium py-2 px-4 rounded-full shadow-md"
    >
      <Crown className="w-4 h-4 text-yellow-300" />
      Pro
    </motion.div>
  );
}


  // 🟣 Free/trial user banner
  return (
    <div className="flex flex-col items-end space-y-1">
      <motion.button
        onClick={() => {
          console.log('🧭 Top-right Upgrade button clicked');
          router.push('/upgrade');
        }}
        whileTap={{ scale: 0.97 }}
        initial={{ y: -5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 18 }}
        className="flex items-center gap-2 text-sm bg-gradient-to-r from-purple-500 via-violet-600 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-medium py-2 px-4 rounded-full shadow-md transition-all duration-300"
      >
        <Crown className="w-4 h-4 text-yellow-300" />
        Upgrade to Pro
      </motion.button>

      {daysLeft !== null && (
        <span className="text-xs text-blue-800 bg-blue-100 px-3 py-0.5 rounded-full">
          ⏳ {daysLeft} day{daysLeft !== 1 ? 's' : ''} left in your trial
        </span>
      )}
    </div>
  );
}
