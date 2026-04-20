'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Image from 'next/image';

function VerifyContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [state, setState] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      setState('error');
      setMessage('No verification token found. Please check your email link.');
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
    fetch(`${apiUrl}/auth/verify?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(json?.message ?? 'Verification failed.');
        }
        setState('success');
        setMessage(
          json.alreadyVerified
            ? 'Your account was already verified. You can now log in.'
            : 'Your account is now verified and active!'
        );
      })
      .catch((err) => {
        setState('error');
        setMessage(err instanceof Error ? err.message : 'Verification failed. Please try again.');
      });
  }, [params]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="bg-white rounded-2xl p-12 max-w-md w-full text-center shadow-lg border border-border"
      >
        <div className="mb-8">
          <Image
            src="/images/LOGO-removebg-preview.png"
            alt="Maternix Track"
            width={140}
            height={56}
            className="mx-auto"
          />
        </div>

        {state === 'loading' && (
          <>
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ backgroundColor: 'rgba(211,123,151,0.12)' }}
            >
              <Loader2
                className="w-10 h-10 animate-spin"
                style={{ color: 'var(--brand-pink-dark)' }}
              />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">Verifying your account…</h2>
            <p className="text-muted-foreground">Please wait a moment.</p>
          </>
        )}

        {state === 'success' && (
          <>
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ backgroundColor: 'rgba(69,117,88,0.12)' }}
            >
              <CheckCircle className="w-10 h-10" style={{ color: 'var(--brand-green-dark)' }} />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">Account Verified!</h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">{message}</p>
            <button
              onClick={() => router.push('/login')}
              className="w-full py-3 text-white rounded-lg transition-all hover:scale-105"
              style={{ backgroundColor: 'var(--brand-green-dark)' }}
            >
              Go to Login
            </button>
          </>
        )}

        {state === 'error' && (
          <>
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ backgroundColor: 'rgba(220,38,38,0.1)' }}
            >
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">Verification Failed</h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">{message}</p>
            <button
              onClick={() => router.push('/login')}
              className="w-full py-3 rounded-lg border border-border text-foreground hover:bg-gray-50 transition-colors"
            >
              Back to Login
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--brand-pink-dark)' }} />
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
