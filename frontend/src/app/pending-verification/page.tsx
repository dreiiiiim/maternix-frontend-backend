'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, LogOut } from 'lucide-react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { signOutAndClearRememberedSession } from '@/lib/supabase/remember-me';

export default function PendingVerificationPage() {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await signOutAndClearRememberedSession(supabase);
    router.push('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-lg text-center"
      >
        <div className="mb-8">
          <Image
            src="/images/LOGO-removebg-preview.png"
            alt="Maternix Track"
            width={160}
            height={64}
            className="mx-auto"
          />
        </div>

        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ backgroundColor: 'var(--brand-pink-light)' }}
        >
          <Mail className="w-10 h-10" style={{ color: 'var(--brand-pink-dark)' }} />
        </div>

        <h1 className="text-3xl font-bold text-foreground mb-3">Check Your Email</h1>
        <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
          Your account has been approved! We sent a verification link to your registered email
          address. Click the link in that email to activate your account.
        </p>

        <div
          className="flex items-start gap-4 p-5 rounded-xl mb-8 text-left"
          style={{ backgroundColor: 'var(--brand-pink-light)' }}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ backgroundColor: 'var(--brand-pink-dark)' }}
          >
            <Mail className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-medium text-foreground mb-1">Didn&apos;t receive the email?</p>
            <p className="text-sm text-muted-foreground">
              Check your spam or junk folder. If you still can&apos;t find it, contact your
              administrator.
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-border text-foreground hover:bg-gray-50 transition-colors"
        >
          <LogOut className="w-4 h-4" style={{ color: 'var(--brand-pink-dark)' }} />
          Sign out
        </button>
      </motion.div>
    </div>
  );
}
