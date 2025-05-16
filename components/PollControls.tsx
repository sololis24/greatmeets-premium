import React from 'react';
import { motion } from 'framer-motion';

interface PollControlsProps {
  onSubmit: () => void;
  onCantAttend: () => void;
  disabled: boolean;
}

export default function PollControls({ onSubmit, onCantAttend, disabled }: PollControlsProps) {
  return (
    <motion.div className="space-y-2">
    <motion.button
  onClick={onSubmit}
  disabled={false}
        whileTap={{ scale: 0.95 }}
        className="group w-full px-6 py-3 font-bold rounded-full shadow-md transition-all duration-300 border-2 bg-gradient-to-r from-emerald-400 to-emerald-600 text-white border-white hover:bg-white hover:from-white hover:to-white hover:text-emerald-600 hover:border-emerald-600"
      >
        <span className="group-hover:hidden">Submit Vote</span>
        <span className="hidden group-hover:inline text-emerald-600">Submit Vote</span>
      </motion.button>

      <motion.button
        onClick={onCantAttend}
        disabled={disabled}
        className={`group w-full px-6 py-3 font-bold rounded-full shadow-md transition-all duration-300 mt-0 border-2 ${
          disabled
            ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
            : 'bg-transparent hover:bg-gradient-to-r from-red-400 to-pink-500 hover:from-red-500 hover:to-pink-600 text-red-500 border-red-500 hover:border-red-600'
        }`}
        whileTap={{ scale: 0.95 }}
      >
        <span className="group-hover:hidden">Can't Attend?</span>
        <span className="hidden group-hover:inline text-white">I'll Email The Host To Let Them Know!</span>
      </motion.button>
    </motion.div>
  );
}
