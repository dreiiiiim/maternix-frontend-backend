'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';

export function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const supabase = createClient();

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !data.user) {
      setError(authError?.message ?? 'Invalid email or password.');
      setIsLoading(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, status')
      .eq('id', data.user.id)
      .single();

    if (profileError || !profile) {
      setError(
        profileError?.code === 'PGRST116'
          ? 'No profile found for this account. Please contact support.'
          : `Profile error: ${profileError?.message ?? 'Unknown error'}`
      );
      await supabase.auth.signOut();
      setIsLoading(false);
      return;
    }

    if (profile.status === 'pending') {
      router.push('/pending-approval');
      return;
    }

    if (profile.status === 'rejected') {
      setError('Your account registration was not approved. Please contact your institution.');
      await supabase.auth.signOut();
      setIsLoading(false);
      return;
    }

    // approved — route to role dashboard
    sessionStorage.removeItem('announcementPopupShown');
    router.push(`/${profile.role}/dashboard`);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <motion.div
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 bg-white"
      >
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="inline-flex items-center gap-2 mb-8 text-sm transition-colors"
            style={{ color: 'var(--brand-green-dark)' }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <h1 className="text-4xl font-bold text-foreground mb-2">Welcome Back</h1>
          <p className="text-muted-foreground mb-8">Sign in to continue your clinical journey</p>

          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm mb-2 text-foreground">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm mb-2 text-foreground">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2"
                placeholder="Enter your password"
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-border"
                  style={{ accentColor: 'var(--brand-pink-dark)' }}
                />
                <span className="text-sm text-muted-foreground">Remember me</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-sm transition-colors"
                style={{ color: 'var(--brand-green-dark)' }}
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 text-white rounded-lg transition-all hover:scale-105 disabled:opacity-60 disabled:hover:scale-100"
              style={{ backgroundColor: 'var(--brand-pink-dark)' }}
              onMouseEnter={(e) => {
                if (!isLoading) e.currentTarget.style.backgroundColor = 'var(--brand-green-dark)'
              }}
              onMouseLeave={(e) => {
                if (!isLoading) e.currentTarget.style.backgroundColor = 'var(--brand-pink-dark)'
              }}
            >
              {isLoading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="mt-8 text-center text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link
              href="/signup"
              className="font-medium transition-colors"
              style={{ color: 'var(--brand-green-dark)' }}
            >
              Sign up
            </Link>
          </p>
        </div>
      </motion.div>

      {/* Right Side - Visual */}
      <motion.div
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/login-signup.JPG"
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, rgba(255,200,218,0.30), rgba(190,70,105,0.68))' }}
        />
        <div className="relative z-10 flex items-center justify-center p-12">
          <div className="text-white max-w-lg">
            <h2 className="text-5xl font-bold mb-6">Continue Your Clinical Excellence</h2>
            <p className="text-xl text-white/90">
              Access your clinical tracking, patient logs, and instructor feedback all in one place.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
