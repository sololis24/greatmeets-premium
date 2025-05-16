'use client';

export default function TestEnvPage() {
  return (
    <div className="p-4">
      <p className="text-red-600 text-sm font-mono">
        NEXT_PUBLIC_GOOGLE_REDIRECT_URI:{' '}
        {process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI || '❌ undefined'}
      </p>
    </div>
  );
}
