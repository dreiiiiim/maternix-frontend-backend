'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { KeyRound, Eye, EyeOff, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setIsLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setIsLoading(false);
    } else {
      setDone(true);
      setTimeout(() => router.push('/login'), 2500);
    }
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
            width={176}
            height={176}
            className="mx-auto h-44 w-44"
          />
        </div>

        {done ? (
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
            <h1 className="text-2xl font-bold text-foreground mb-3">Password updated!</h1>
            <p className="text-muted-foreground">Redirecting you to login…</p>
          </motion.div>
        ) : (
          <>
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ backgroundColor: 'var(--brand-pink-light)' }}
            >
              <KeyRound className="w-7 h-7" style={{ color: 'var(--brand-pink-dark)' }} />
            </div>

            <h1 className="text-3xl font-bold text-foreground mb-2 text-center">
              Set new password
            </h1>
            <p className="text-muted-foreground mb-8 text-center">
              Choose a strong password for your account.
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="password" className="block text-sm mb-2 text-foreground">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-10 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2"
                    placeholder="Min. 8 characters"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm mb-2 text-foreground">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2"
                  placeholder="Repeat your new password"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 text-white rounded-lg transition-all hover:scale-105 disabled:opacity-60 disabled:hover:scale-100"
                style={{ backgroundColor: 'var(--brand-pink-dark)' }}
              >
                {isLoading ? 'Updating…' : 'Update Password'}
              </button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}
