'use client';

import { Component, ReactNode, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Toast from '../../components/Toast';

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
  
        // 🔥 Correct place to reset toast
        setTimeout(() => {
          setCopied(false);
          setToastVisible(false); // ✅ This line was missing!
        }, 2500);
      });
    }
  };
  
  const handleCreateAnotherMeet = () => {
    router.push('/');
  };

  return (
    <div className="success-page">
     <main className="success-page-main relative">
        {/* ✅ Always render Toast */}
        <Toast
          visible={toastVisible}
          message="Invite link copied to clipboard!"
          onClose={() => setToastVisible(false)}
          type="success"
          position="top"
        />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="card-wide"
        >
          <motion.div
            initial={{ rotate: -15 }}
            animate={{ rotate: [0, 20, -20, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-5xl"
          >
            🎉
          </motion.div>

          <div className="flex flex-col items-center text-center mb-8">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
              className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600 leading-tight"
            >
              Great Meet Created!
            </motion.h1>

            <p className="text-gray-600 text-lg font-normal mt-2">
              Your invite was successfully sent.
            </p>
          </div>

          <div className="w-full max-w-md mx-auto flex flex-col gap-4">
            <motion.button
              onClick={handleCopyLink}
              className="w-full bg-teal-500 text-white font-bold py-4 rounded-full transition-all duration-300 hover:bg-gradient-to-r hover:from-teal-400 hover:to-teal-600 focus:ring-4 focus:ring-teal-300 shadow-md text-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {copied ? 'Link Copied!' : 'Copy Invite Link'}
            </motion.button>

            <motion.button
              onClick={handleCreateAnotherMeet}
              className="w-full border border-teal-500 text-teal-500 font-semibold py-4 rounded-full hover:bg-teal-50 focus:outline-none focus:border-teal-700 shadow-md text-center"
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
    </div>
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
