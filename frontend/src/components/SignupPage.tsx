'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type SignupRole = 'student' | 'instructor'

type SectionOption = {
  id: string
  name: string
}

export function SignupPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [userType, setUserType] = useState<SignupRole>('student')
  const [isLoading, setIsLoading] = useState(false)
  const [sectionsLoading, setSectionsLoading] = useState(true)
  const [sections, setSections] = useState<SectionOption[]>([])
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    studentNo: '',
    sectionId: '',
    employeeId: '',
    department: '',
  })

  useEffect(() => {
    async function fetchSections() {
      setSectionsLoading(true)
      const { data, error: fetchError } = await supabase
        .from('sections')
        .select('id, name')
        .order('name', { ascending: true })

      if (fetchError) {
        setError('Unable to load sections. Please refresh the page.')
      } else {
        const mapped = (data ?? []) as SectionOption[]
        setSections(mapped)
        if (mapped.length > 0) {
          setFormData((prev) => ({ ...prev, sectionId: prev.sectionId || mapped[0].id }))
        }
      }

      setSectionsLoading(false)
    }

    fetchSections()
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    if (userType === 'student' && (!formData.studentNo || !formData.sectionId)) {
      setError('Student number and section are required.')
      return
    }

    if (userType === 'instructor' && (!formData.employeeId || !formData.department)) {
      setError('Employee ID and department are required.')
      return
    }

    setIsLoading(true)

    const { error: signupError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          full_name: formData.fullName,
          role: userType,
          student_no: userType === 'student' ? formData.studentNo : null,
          section_id: userType === 'student' ? formData.sectionId : null,
          year_level: userType === 'student' ? '2nd Year' : null,
          employee_id: userType === 'instructor' ? formData.employeeId : null,
          department: userType === 'instructor' ? formData.department : null,
        },
      },
    })

    if (signupError) {
      setError(signupError.message)
      setIsLoading(false)
      return
    }

    setSuccessMessage(
      'Signup successful. Please check your email and click the confirmation link to continue.'
    )
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex">
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

          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}
          {successMessage && (
            <div className="mb-5 p-3 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm">
              {successMessage}
            </div>
          )}

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
                      backgroundColor: userType === type ? 'rgba(69,117,88,0.06)' : 'transparent',
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
                    value={formData.sectionId}
                    onChange={(e) => setFormData({ ...formData, sectionId: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2"
                    disabled={sectionsLoading}
                    required
                  >
                    {sectionsLoading && <option value="">Loading sections...</option>}
                    {!sectionsLoading && sections.length === 0 && (
                      <option value="">No sections available</option>
                    )}
                    {sections.map((section) => (
                      <option key={section.id} value={section.id}>
                        {section.name}
                      </option>
                    ))}
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
                    placeholder="e.g., Nursing"
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
                placeholder="Min. 8 characters"
                required
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm mb-2 text-foreground">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2"
                placeholder="Repeat your password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 text-white rounded-lg transition-all hover:scale-105 disabled:opacity-60 disabled:hover:scale-100"
              style={{ backgroundColor: 'var(--brand-pink-dark)' }}
            >
              {isLoading ? 'Submitting...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-8 text-center text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="font-medium transition-colors" style={{ color: 'var(--brand-green-dark)' }}>
              Sign in
            </Link>
          </p>

          {successMessage && (
            <p className="mt-3 text-center text-sm text-muted-foreground">
              You can return to login after verifying your email.
              {' '}
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="underline"
                style={{ color: 'var(--brand-green-dark)' }}
              >
                Go to login
              </button>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  )
}
