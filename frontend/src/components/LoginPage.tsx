'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';

export function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState<'student' | 'instructor' | 'admin'>('student');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sessionStorage.removeItem('announcementPopupShown');
    if (userType === 'instructor') {
      router.push('/instructor/dashboard');
    } else if (userType === 'admin') {
      router.push('/admin/dashboard');
    } else {
      router.push('/student/dashboard');
    }
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

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm mb-3 text-foreground">I am a</label>
              <div className="flex gap-3">
                {(['student', 'instructor', 'admin'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setUserType(type)}
                    className="flex-1 px-4 py-3 rounded-lg border-2 transition-all"
                    style={{
                      borderColor: userType === type ? 'var(--brand-green-dark)' : 'var(--border)',
                      backgroundColor:
                        userType === type ? 'rgba(69,117,88,0.06)' : 'transparent',
                      color: userType === type ? 'var(--brand-green-dark)' : 'var(--foreground)',
                    }}
                  >
                    {type === 'student' ? 'Nursing Student' : type === 'instructor' ? 'Clinical Instructor' : 'Admin'}
                  </button>
                ))}
              </div>
            </div>

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
              <a
                href="#"
                className="text-sm transition-colors"
                style={{ color: 'var(--brand-green-dark)' }}
              >
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              className="w-full py-3 text-white rounded-lg transition-all hover:scale-105"
              style={{ backgroundColor: 'var(--brand-pink-dark)' }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = 'var(--brand-green-dark)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = 'var(--brand-pink-dark)')
              }
            >
              Sign In
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
