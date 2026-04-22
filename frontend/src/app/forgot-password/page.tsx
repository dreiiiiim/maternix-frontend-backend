'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
    });

    if (resetError) {
      setError(resetError.message);
    } else {
      setSent(true);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <Image
            src="/images/LOGO-removebg-preview.png"
            alt="Maternix Track"
            width={160}
            height={64}
            className="mx-auto"
          />
        </div>

        <Link
          href="/login"
          className="inline-flex items-center gap-2 mb-8 text-sm transition-colors"
          style={{ color: 'var(--brand-green-dark)' }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </Link>

        {sent ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="text-center"
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ backgroundColor: 'rgba(69,117,88,0.12)' }}
            >
              <CheckCircle className="w-8 h-8" style={{ color: 'var(--brand-green-dark)' }} />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-3">Check your email</h1>
            <p className="text-muted-foreground leading-relaxed">
              We sent a password reset link to <strong>{email}</strong>. Click the link to
              set a new password.
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              Didn&apos;t receive it?{' '}
              <button
                onClick={() => setSent(false)}
                className="font-medium transition-colors"
                style={{ color: 'var(--brand-green-dark)' }}
              >
                Try again
              </button>
            </p>
          </motion.div>
        ) : (
          <>
            <h1 className="text-3xl font-bold text-foreground mb-2">Forgot password?</h1>
            <p className="text-muted-foreground mb-8">
              Enter your email and we&apos;ll send you a reset link.
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm mb-2 text-foreground">
                  Email Address
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
                  />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 text-white rounded-lg transition-all hover:scale-105 disabled:opacity-60 disabled:hover:scale-100"
                style={{ backgroundColor: 'var(--brand-pink-dark)' }}
              >
                {isLoading ? 'Sending…' : 'Send Reset Link'}
              </button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}
