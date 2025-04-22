'use client';

import { Component, ReactNode, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Toast from '@/components/Toast';

export const dynamic = 'force-dynamic';

export default function SuccessPage() {
  return (
    <RealErrorBoundary>
      <ClientSuccessPage />
    </RealErrorBoundary>
  );
}

function ClientSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [inviteId, setInviteId] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const id = searchParams.get('inviteId');
    if (id) {
      setInviteId(id);

      if (typeof window !== 'undefined') {
        setInviteLink(`${window.location.origin}/invite/${id}`);
      }
    }
  }, [searchParams]);

  const handleCopyLink = () => {
    if (inviteLink && navigator.clipboard) {
      navigator.clipboard.writeText(inviteLink).then(() => {
        setCopied(true);
        setToastVisible(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const handleCreateAnotherMeet = () => {
    router.push('/');
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 space-y-8 bg-gradient-to-b from-teal-100 via-white to-white">
      {toastVisible && (
        <Toast
          visible={true}
          message="Invite link copied to clipboard!"
          onClose={() => setToastVisible(false)}
        />
      )}

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="bg-white rounded-3xl shadow-2xl p-10 max-w-2xl w-full text-center space-y-8"
      >
        <motion.div
          initial={{ rotate: -15 }}
          animate={{ rotate: [0, 20, -20, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-5xl"
        >
          🎉
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600 leading-tight mb-1"
        >
          Great Meet Created!
        </motion.h1>

        <p className="text-gray-600 text-lg mt-1">
          Your invite was successfully sent.
        </p>

        <div className="flex flex-col gap-4">
          <motion.button
            onClick={handleCopyLink}
            className="w-full min-w-[220px] px-6 py-3 bg-teal-500 text-white font-bold rounded-full transition-all duration-300 hover:bg-gradient-to-r hover:from-teal-400 hover:to-teal-600 focus:ring-4 focus:ring-teal-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="inline-block w-full text-center">
              {copied ? 'Link Copied!' : 'Copy Invite Link'}
            </span>
          </motion.button>

          <motion.button
            onClick={handleCreateAnotherMeet}
            className="w-full px-6 py-3 border border-teal-500 text-teal-500 font-semibold rounded-full transition-all duration-300 hover:bg-teal-50 focus:outline-none focus:border-teal-700 focus:ring-0 active:bg-teal-100"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Create Another Great Meet
          </motion.button>
        </div>

        <p className="text-sm text-gray-400 pt-6">
          Powered by <span className="font-bold text-teal-500">GreatMeets.ai</span> – Fast and Human Scheduling © 2025
        </p>
      </motion.div>
    </main>
  );
}

// Real React ErrorBoundary using class
class RealErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, info: any) {
    console.error('🔥 Error caught in boundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center text-center text-red-600 font-bold">
          Something went wrong on this page. Check the console for more details.
        </div>
      );
    }

    return this.props.children;
  }
}
