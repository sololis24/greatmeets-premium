'use client';

import { useEffect } from 'react';
import { Poppins } from 'next/font/google';
import { v4 as uuidv4 } from 'uuid';
import './globals.css';

const poppins = Poppins({
  variable: '--font-poppins',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export default function RootLayout({ children }) {
  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('userToken')) {
      const newToken = uuidv4();
      localStorage.setItem('userToken', newToken);
    }
  }, []);

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <html lang="en" className={poppins.variable}>
      <body className="antialiased min-h-screen flex flex-col bg-gray-100 text-black font-sans">
        <main className="flex-grow">
          {/* 🔥 Toast container anchor */}
          <div className="relative max-w-4xl mx-auto w-full px-4">
            {children}
          </div>
        </main>

        <footer className="py-8 text-center text-sm text-gray-400">
          <p className="text-sm text-gray-500">
            Your local time zone: {timeZone}
          </p>
          <p>
            Powered by{' '}
            <span className="font-semibold text-cyan-600">GreatMeets.ai</span> – Fast and Human Scheduling © 2025
          </p>
        </footer>
      </body>
    </html>
  );
}
