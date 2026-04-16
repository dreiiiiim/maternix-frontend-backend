'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';

export function SignupPage() {
  const router = useRouter();
  const [userType, setUserType] = useState<'student' | 'instructor'>('student');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    studentNo: '',
    section: 'BSN 2A',
    employeeId: '',
    department: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userType === 'instructor') {
      router.push('/instructor/dashboard');
    } else {
      router.push('/student/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Visual */}
      <motion.div
        initial={{ x: -50, opacity: 0 }}
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
            <h2 className="text-5xl font-bold mb-6">Start Your Journey in Maternal Care</h2>
            <p className="text-xl text-white/90">
              Join thousands of nursing students and clinical instructors transforming maternal
              healthcare education.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Right Side - Form */}
      <motion.div
        initial={{ x: 50, opacity: 0 }}
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

          <h1 className="text-4xl font-bold text-foreground mb-2">Create Account</h1>
          <p className="text-muted-foreground mb-8">Begin your clinical education journey today</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm mb-3 text-foreground">I am a</label>
              <div className="flex gap-3">
                {(['student', 'instructor'] as const).map((type) => (
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
                    {type === 'student' ? 'Nursing Student' : 'Clinical Instructor'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="fullName" className="block text-sm mb-2 text-foreground">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2"
                placeholder="John Doe"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm mb-2 text-foreground">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2"
                placeholder="you@example.com"
                required
              />
            </div>

            {userType === 'student' && (
              <>
                <div>
                  <label htmlFor="studentNo" className="block text-sm mb-2 text-foreground">
                    Student No.
                  </label>
                  <input
                    id="studentNo"
                    type="text"
                    value={formData.studentNo}
                    onChange={(e) => setFormData({ ...formData, studentNo: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2"
                    placeholder="e.g., NSG-2024-001"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="section" className="block text-sm mb-2 text-foreground">
                    Section
                  </label>
                  <select
                    id="section"
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2"
                    required
                  >
                    <option value="BSN 2A">BSN 2A</option>
                    <option value="BSN 2B">BSN 2B</option>
                    <option value="BSN 2C">BSN 2C</option>
                  </select>
                </div>
              </>
            )}

            {userType === 'instructor' && (
              <>
                <div>
                  <label htmlFor="employeeId" className="block text-sm mb-2 text-foreground">
                    Employee ID
                  </label>
                  <input
                    id="employeeId"
                    type="text"
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2"
                    placeholder="e.g., EMP-2024-001"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="department" className="block text-sm mb-2 text-foreground">
                    Department
                  </label>
                  <input
                    id="department"
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2"
                    placeholder="e.g., Maternal Health"
                    required
                  />
                </div>
              </>
            )}

            <div>
              <label htmlFor="password" className="block text-sm mb-2 text-foreground">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2"
                placeholder="Create a strong password"
                required
              />
            </div>

            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                className="w-4 h-4 mt-1 rounded border-border"
                style={{ accentColor: 'var(--brand-pink-dark)' }}
                required
              />
              <span className="text-sm text-muted-foreground">
                I agree to the Terms of Service and Privacy Policy
              </span>
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
              Create Account
            </button>
          </form>

          <p className="mt-8 text-center text-muted-foreground">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-medium transition-colors"
              style={{ color: 'var(--brand-green-dark)' }}
            >
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
