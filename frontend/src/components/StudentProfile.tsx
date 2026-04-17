'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  Edit,
  Home,
  Camera,
  Upload,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

type ProfileForm = {
  firstName: string
  lastName: string
  email: string
  phone: string
  enrollmentDate: string
  studentId: string
  section: string
}

export function StudentProfile() {
  const supabase = useMemo(() => createClient(), [])
  const [userId, setUserId] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const [profilePhoto, setProfilePhoto] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)

  const [formData, setFormData] = useState<ProfileForm>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    enrollmentDate: '',
    studentId: '',
    section: '',
  })

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true)
      setError('')

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        setError('Unable to load user session.')
        setLoading(false)
        return
      }

      setUserId(user.id)

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('first_name, last_name, full_name, email, phone_number, avatar_url, created_at')
        .eq('id', user.id)
        .single()

      if (profileError || !profile) {
        setError(profileError?.message ?? 'Profile not found.')
        setLoading(false)
        return
      }

      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('student_no, year_level, sections(name)')
        .eq('id', user.id)
        .single()

      if (studentError || !student) {
        setError(studentError?.message ?? 'Student record not found.')
        setLoading(false)
        return
      }

      const section = Array.isArray(student.sections) ? student.sections[0] : student.sections

      setProfilePhoto(profile.avatar_url ?? null)
      setFormData({
        firstName: profile.first_name ?? '',
        lastName: profile.last_name ?? '',
        email: profile.email,
        phone: profile.phone_number ?? '',
        enrollmentDate: new Date(profile.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        studentId: student.student_no,
        section: section?.name ?? '',
      })

      setLoading(false)
    }

    fetchProfile()
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return

    setSaving(true)
    setError('')
    setInfo('')

    let avatarUrl = profilePhoto

    if (photoFile) {
      const ext = photoFile.name.split('.').pop() ?? 'jpg'
      const path = `${userId}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, photoFile, { upsert: true })

      if (!uploadError) {
        const { data } = supabase.storage.from('avatars').getPublicUrl(path)
        avatarUrl = data.publicUrl
      } else {
        setInfo('Profile saved, but avatar upload failed. Check if avatars bucket exists.')
      }
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        first_name: formData.firstName,
        last_name: formData.lastName,
        full_name: `${formData.firstName} ${formData.lastName}`.trim(),
        phone_number: formData.phone,
        avatar_url: avatarUrl,
      })
      .eq('id', userId)

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    setProfilePhoto(avatarUrl ?? null)
    setPhotoFile(null)
    setIsEditing(false)
    if (!info) setInfo('Profile updated successfully.')
    setSaving(false)
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setProfilePhoto(URL.createObjectURL(file))
  }

  const getInitials = () => {
    const fn = formData.firstName[0] || ''
    const ln = formData.lastName[0] || ''
    return (fn + ln).toUpperCase() || 'ST'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
        Loading profile...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/student/dashboard" className="flex items-center gap-3">
            <Image
              src="/images/LOGO-removebg-preview.png"
              alt="Maternix Track"
              width={120}
              height={48}
              className="h-12 w-auto"
            />
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/student/dashboard"
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:scale-105"
              style={{ backgroundColor: 'var(--brand-green-dark)20' }}
            >
              <Home className="w-4 h-4" style={{ color: 'var(--brand-green-dark)' }} />
              <span className="text-sm text-foreground">Home</span>
            </Link>
            <Link href="/student/dashboard">
              <div className="flex items-center gap-3 px-4 py-2 rounded-lg" style={{ backgroundColor: 'var(--brand-pink-light)' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--brand-pink-dark)' }}>
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="text-sm">
                  <div className="font-medium text-foreground">{formData.firstName} {formData.lastName}</div>
                  <div className="text-muted-foreground text-xs">Nursing Student</div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
          <Link href="/student/dashboard" className="inline-flex items-center gap-2 mb-8 transition-colors" style={{ color: 'var(--brand-green-dark)' }}>
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>

          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-5xl font-bold text-foreground mb-3">Profile Settings</h1>
              <p className="text-xl text-muted-foreground">Manage your account information</p>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-6 py-3 text-white rounded-lg transition-all hover:scale-105 flex items-center gap-2"
                style={{ backgroundColor: 'var(--brand-green-dark)' }}
              >
                <Edit className="w-5 h-5" />
                <span>Edit Profile</span>
              </button>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white border border-border rounded-2xl p-8"
        >
          {error && <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700">{error}</div>}
          {info && <div className="mb-5 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700">{info}</div>}

          <div className="flex items-center gap-6 mb-8 pb-8 border-b border-border">
            <div className="relative">
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white overflow-hidden"
                style={{ backgroundColor: 'var(--brand-pink-dark)' }}
              >
                {profilePhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  getInitials()
                )}
              </div>
              {isEditing && (
                <label
                  htmlFor="photo-upload"
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all hover:scale-110"
                  style={{ backgroundColor: 'var(--brand-green-dark)' }}
                >
                  <Camera className="w-4 h-4 text-white" />
                  <input id="photo-upload" type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </label>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-foreground mb-1">{formData.firstName} {formData.lastName}</h2>
              <p className="text-muted-foreground mb-3">Nursing Student • {formData.studentId}</p>
              {isEditing && (
                <label
                  htmlFor="photo-upload"
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg border-2 cursor-pointer transition-all hover:scale-105"
                  style={{ borderColor: 'var(--brand-green-dark)', color: 'var(--brand-green-dark)' }}
                >
                  <Upload className="w-4 h-4" />
                  <span>{profilePhoto ? 'Change Photo' : 'Upload Photo'}</span>
                </label>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-foreground mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-foreground flex items-center gap-2">
                      <User className="w-4 h-4" /> First Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2"
                      />
                    ) : (
                      <div className="px-4 py-3 rounded-lg bg-gray-50 text-foreground">{formData.firstName}</div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-foreground flex items-center gap-2">
                      <User className="w-4 h-4" /> Last Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2"
                      />
                    ) : (
                      <div className="px-4 py-3 rounded-lg bg-gray-50 text-foreground">{formData.lastName}</div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-foreground flex items-center gap-2">
                      <Mail className="w-4 h-4" /> Email Address
                    </label>
                    <div className="px-4 py-3 rounded-lg bg-gray-50 text-foreground">{formData.email}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-foreground flex items-center gap-2">
                      <Phone className="w-4 h-4" /> Phone Number
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2"
                      />
                    ) : (
                      <div className="px-4 py-3 rounded-lg bg-gray-50 text-foreground">{formData.phone || 'Not set'}</div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-foreground flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> Enrollment Date
                    </label>
                    <div className="px-4 py-3 rounded-lg bg-gray-50 text-foreground">{formData.enrollmentDate}</div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-border">
                <h3 className="text-xl font-bold text-foreground mb-4">Academic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-foreground">Student ID</label>
                    <div className="px-4 py-3 rounded-lg bg-gray-50 text-foreground">{formData.studentId}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-foreground">Class Section</label>
                    <div className="px-4 py-3 rounded-lg bg-gray-50 text-foreground">{formData.section || 'Unassigned'}</div>
                  </div>
                </div>
              </div>

              {isEditing && (
                <div className="flex gap-3 pt-6 border-t border-border">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-3 text-white rounded-lg transition-all hover:scale-105 disabled:opacity-60"
                    style={{ backgroundColor: 'var(--brand-green-dark)' }}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-3 border border-border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
