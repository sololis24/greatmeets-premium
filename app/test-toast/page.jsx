'use client';

import { useState } from 'react';
import Toast from '@/components/Toast';  // Correct path (not @/componenets/Toast)



export default function TestToastPage() {
  const [visible, setVisible] = useState(false);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8 bg-gray-100 gap-6">
      <h1 className="text-3xl font-bold">Test Toast Page</h1>

      <button
        onClick={() => setVisible(true)}
        className="bg-emerald-400 hover:bg-emerald-500 text-white font-bold py-3 px-6 rounded-full shadow-md transition-all"
      >
        Show Toast
      </button>

      <Toast
        message="🎉 Toast is working!"
        visible={visible}
        onClose={() => setVisible(false)}
        type="success"
        position="top"
      />
    </main>
  );
}
