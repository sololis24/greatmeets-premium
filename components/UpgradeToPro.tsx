'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Crown } from 'lucide-react'; // ✅ import crown icon

export default function UpgradeToPro() {
  const router = useRouter();

  return (
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
  );
}

// trigger redeploy