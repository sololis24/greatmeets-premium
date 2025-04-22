'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

type FinalButtonsProps = {
  selectedTimes: string[];
  handleSendDirectInvite: () => void;
};

export default function FinalButtons({
  selectedTimes,
  handleSendDirectInvite,
}: FinalButtonsProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  if (selectedTimes.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col gap-6 mt-14 pb-14 relative"
    >
      <motion.button
        type="button"
        onClick={handleSendDirectInvite}
        whileTap={{ scale: 0.98 }}
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="group w-full bg-gradient-to-r from-purple-500 via-violet-600 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold py-4 rounded-full transition-transform duration-300 shadow-md text-center"
      >
        <span className="group-hover:hidden transition-opacity duration-300">
          Send Your GreatMeet
        </span>
        <span className="hidden group-hover:inline transition-opacity duration-300">
          Let’s Go 🚀
        </span>
      </motion.button>
    </motion.div>
  );
}
