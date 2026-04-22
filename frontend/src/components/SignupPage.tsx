'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { ArrowLeft, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { getApiBaseUrl } from '@/lib/api-base-url'

type SignupRole = 'student' | 'instructor'

type SectionOption = {
  id: string
  name: string
}

export function SignupPage() {
  const router = useRouter()
  const apiUrl = getApiBaseUrl()

  const [userType, setUserType] = useState<SignupRole>('student')
  const [isLoading, setIsLoading] = useState(false)
  const [sectionsLoading, setSectionsLoading] = useState(true)
  const [sections, setSections] = useState<SectionOption[]>([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    studentNo: '',
    sectionId: '',
    employeeId: '',
    department: '',
  })

  // Fetch sections from backend API (uses service-role key → bypasses RLS)
  // so unauthenticated visitors on the signup page can see the section list.
  useEffect(() => {
    async function fetchSections() {
      setSectionsLoading(true)
      try {
        const res = await fetch(`${apiUrl}/auth/sections`)
        if (!res.ok) throw new Error(`Status ${res.status}`)
        const data: SectionOption[] = await res.json()
        setSections(data)
        if (data.length > 0) {
          setFormData((prev) => ({ ...prev, sectionId: prev.sectionId || data[0].id }))
        }
      } catch (err) {
        console.error('Failed to load sections:', err)
      } finally {
        setSectionsLoading(false)
      }
    }

    fetchSections()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Client-side validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (userType === 'student') {
      if (!formData.studentNo || !formData.sectionId) {
        setError('Student number and section are required.')
        return
      }
      if (!/^NSG-\d{4}-\d{5}$/.test(formData.studentNo)) {
        setError('Student ID must follow the format NSG-0000-00000 (digits only).')
        return
      }
    }
    if (userType === 'instructor') {
      if (!formData.employeeId || !formData.department) {
        setError('Employee ID and department are required.')
        return
      }
      if (!/^EMP-\d{4}-\d{4}$/.test(formData.employeeId)) {
        setError('Instructor ID must follow the format EMP-0000-0000 (digits only).')
        return
      }
    }

    setIsLoading(true)

    try {
      const body: Record<string, string> = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        role: userType,
      }

      if (userType === 'student') {
        body.studentNo = formData.studentNo
        body.sectionId = formData.sectionId
      } else {
        body.employeeId = formData.employeeId
        body.department = formData.department
      }

      const res = await fetch(`${apiUrl}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const json = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(json?.message ?? `Server error: ${res.status}`)
      }

      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // ── Success screen ────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-2xl p-12 max-w-md w-full text-center shadow-lg border border-border"
        >
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: 'rgba(69,117,88,0.12)' }}
          >
            <CheckCircle className="w-10 h-10" style={{ color: 'var(--brand-green-dark)' }} />
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-3">Account Created!</h2>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Your account has been submitted for admin approval. You will receive an email once your
            account has been reviewed. This usually takes 1–2 business days.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="w-full py-3 text-white rounded-lg transition-all hover:scale-105"
            style={{ backgroundColor: 'var(--brand-green-dark)' }}
            suppressHydrationWarning
          >
            Back to Login
          </button>
        </motion.div>
      </div>
    )
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex">
      {/* Left illustration panel */}
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
          style={{
            background: 'linear-gradient(to bottom, rgba(255,200,218,0.30), rgba(190,70,105,0.68))',
          }}
        />
        <div className="relative z-10 flex items-center justify-center p-12">
          <div className="text-white max-w-lg">
            <h2 className="text-5xl font-bold mb-6">Start Your Journey in Maternal Care</h2>
            <p className="text-xl text-white/90">
              Join the Maternix Track platform for clinical skills development and assessment.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Right form panel */}
      <motion.div
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 bg-white overflow-y-auto"
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

          {/* Error banner */}
          {error && (
            <div className="mb-5 p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role selector */}
            <div>
              <label className="block text-sm font-medium mb-3 text-foreground">I am a</label>
              <div className="flex gap-3">
                {(['student', 'instructor'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setUserType(type)}
                    className="flex-1 px-4 py-3 rounded-lg border-2 transition-all font-medium"
                    style={{
                      borderColor: userType === type ? 'var(--brand-green-dark)' : 'var(--border)',
                      backgroundColor: userType === type ? 'rgba(69,117,88,0.06)' : 'transparent',
                      color: userType === type ? 'var(--brand-green-dark)' : 'var(--foreground)',
                    }}
                    suppressHydrationWarning
                  >
                    {type === 'student' ? 'Nursing Student' : 'Clinical Instructor'}
                  </button>
                ))}
              </div>
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium mb-2 text-foreground">
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2"
                  placeholder="e.g. Maria"
                  required
                  suppressHydrationWarning
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium mb-2 text-foreground">
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2"
                  placeholder="e.g. Santos"
                  required
                  suppressHydrationWarning
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2 text-foreground">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2"
                placeholder="you@example.com"
                required
                suppressHydrationWarning
              />
            </div>

            {/* Student-specific fields */}
            {userType === 'student' && (
              <>
                <div>
                  <label htmlFor="studentNo" className="block text-sm font-medium mb-2 text-foreground">
                    Student No.
                  </label>
                  <input
                    id="studentNo"
                    name="studentNo"
                    type="text"
                    value={formData.studentNo}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2"
                    placeholder="NSG-0000-00000"
                    required
                    suppressHydrationWarning
                  />
                </div>
                <div>
                  <label htmlFor="sectionId" className="block text-sm font-medium mb-2 text-foreground">
                    Section
                  </label>
                  {sectionsLoading ? (
                    <div className="flex items-center gap-2 text-muted-foreground text-sm py-3">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading sections…
                    </div>
                  ) : sections.length === 0 ? (
                    <p className="text-sm text-red-600 py-2">
                      No sections available. Please contact your administrator.
                    </p>
                  ) : (
                    <select
                      id="sectionId"
                      name="sectionId"
                      value={formData.sectionId}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2"
                      required
                      suppressHydrationWarning
                    >
                      <option value="">— Select your section —</option>
                      {sections.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </>
            )}

            {/* Instructor-specific fields */}
            {userType === 'instructor' && (
              <>
                <div>
                  <label htmlFor="employeeId" className="block text-sm font-medium mb-2 text-foreground">
                    Employee ID
                  </label>
                  <input
                    id="employeeId"
                    name="employeeId"
                    type="text"
                    value={formData.employeeId}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2"
                    placeholder="EMP-0000-0000"
                    required
                    suppressHydrationWarning
                  />
                </div>
                <div>
                  <label htmlFor="department" className="block text-sm font-medium mb-2 text-foreground">
                    Department
                  </label>
                  <input
                    id="department"
                    name="department"
                    type="text"
                    value={formData.department}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2"
                    placeholder="e.g. Nursing"
                    required
                    suppressHydrationWarning
                  />
                </div>
              </>
            )}

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2 text-foreground">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2"
                placeholder="Min. 8 characters"
                required
                suppressHydrationWarning
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2 text-foreground">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2"
                placeholder="Repeat your password"
                required
                suppressHydrationWarning
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading || (userType === 'student' && sectionsLoading)}
              className="w-full py-3 text-white rounded-lg transition-all hover:scale-105 disabled:opacity-60 disabled:hover:scale-100 flex items-center justify-center gap-2"
              style={{ backgroundColor: 'var(--brand-pink-dark)' }}
              suppressHydrationWarning
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating Account…
                </>
              ) : (
                'Create Account'
              )}
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
  )
}
