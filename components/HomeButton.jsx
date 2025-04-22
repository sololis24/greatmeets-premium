'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function HomeButton({ className = '' }) {
  const router = useRouter();

  const handleBackHome = () => {
    router.push('/');
  };

  return (
    <motion.button
      onClick={handleBackHome}
      className={`w-full px-4 py-2 bg-[#0E9F9A] text-white font-semibold rounded-full hover:bg-[#0C8A86] transition ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      ← Back to Home
    </motion.button>
  );
}
