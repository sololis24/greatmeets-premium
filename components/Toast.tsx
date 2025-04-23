'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CSSProperties } from 'react';

export type ToastProps = {
  message: string;
  visible: boolean;
  onClose: () => void;
  type?: 'success' | 'error' | 'warning' | 'info';
  position?: 'top' | 'bottom';
  className?: string;
  style?: CSSProperties;
};

export default function Toast({
  message,
  visible,
  onClose,
  type = 'success',
  position = 'top',
  className = '',
  style = {},
}: ToastProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        setTimeout(() => onClose(), 500);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  if (!visible && !show) return null;

  const typeGradients: Record<string, string> = {
    success: 'from-blue-400 to-blue-600',
    error: 'from-red-400 to-red-600',
    warning: 'from-yellow-400 to-yellow-600',
    info: 'from-sky-400 to-blue-500',
  };

  const backgroundGradient = typeGradients[type] || typeGradients.success;

  const positionClasses =
  position === 'bottom'
    ? 'bottom-6 right-6 left-auto'
    : 'top-6 left-1/2 transform -translate-x-1/2';

    return (
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.8 }}
            transition={{ duration: 0.4 }}
            className={`fixed ${position === 'bottom' ? 'bottom-6' : 'top-6'} inset-x-0 mx-auto z-[9999] w-fit max-w-xs px-6 py-3 text-white text-center rounded-xl shadow-2xl bg-gradient-to-r ${backgroundGradient} ${className}`}
            style={{
              ...style,
              pointerEvents: 'none', // prevent blocking clicks
              // border: '2px solid lime', // uncomment for visual debug
            }}
          >
            <div className="text-center font-semibold text-lg tracking-wide">
              {message}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
    
    
}
