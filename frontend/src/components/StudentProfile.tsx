'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, User, Mail, Phone, Calendar, Edit, Home, Camera, Upload } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';

export function StudentProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: 'Emily Rodriguez',
    email: 'emily.rodriguez@nursing.edu',
    phone: '(555) 123-4567',
    enrollmentDate: 'January 15, 2026',
    studentId: 'NS-2026-001',
    section: 'BSN 2A',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditing(false);
    console.log('Profile updated:', formData);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getInitials = () => {
    return formData.fullName
      .split(' ')
      .map((name) => name[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
              <div
                className="flex items-center gap-3 px-4 py-2 rounded-lg"
                style={{ backgroundColor: 'var(--brand-pink-light)' }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'var(--brand-pink-dark)' }}
                >
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="text-sm">
                  <div className="font-medium text-foreground">{formData.fullName}</div>
                  <div className="text-muted-foreground text-xs">Nursing Student</div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Back Button */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Link
            href="/student/dashboard"
            className="inline-flex items-center gap-2 mb-8 transition-colors"
            style={{ color: 'var(--brand-green-dark)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--brand-green-medium)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--brand-green-dark)')}
          >
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
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = 'var(--brand-green-medium)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = 'var(--brand-green-dark)')
                }
              >
                <Edit className="w-5 h-5" />
                <span>Edit Profile</span>
              </button>
            )}
          </div>
        </motion.div>

        {/* Profile Content */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white border border-border rounded-2xl p-8"
        >
          {/* Profile Picture Section */}
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
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-foreground mb-1">{formData.fullName}</h2>
              <p className="text-muted-foreground mb-3">
                Nursing Student • {formData.studentId}
              </p>
              {isEditing && (
                <label
                  htmlFor="photo-upload"
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg border-2 cursor-pointer transition-all hover:scale-105"
                  style={{
                    borderColor: 'var(--brand-green-dark)',
                    color: 'var(--brand-green-dark)',
                    backgroundColor: 'white',
                  }}
                >
                  <Upload className="w-4 h-4" />
                  <span>{profilePhoto ? 'Change Photo' : 'Upload Photo'}</span>
                </label>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-xl font-bold text-foreground mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-foreground flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Full Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2"
                        style={
                          { '--tw-ring-color': 'var(--brand-green-medium)' } as React.CSSProperties
                        }
                      />
                    ) : (
                      <div className="px-4 py-3 rounded-lg bg-gray-50 text-foreground">
                        {formData.fullName}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-foreground flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email Address
                    </label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2"
                        style={
                          { '--tw-ring-color': 'var(--brand-green-medium)' } as React.CSSProperties
                        }
                      />
                    ) : (
                      <div className="px-4 py-3 rounded-lg bg-gray-50 text-foreground">
                        {formData.email}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-foreground flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Phone Number
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2"
                        style={
                          { '--tw-ring-color': 'var(--brand-green-medium)' } as React.CSSProperties
                        }
                      />
                    ) : (
                      <div className="px-4 py-3 rounded-lg bg-gray-50 text-foreground">
                        {formData.phone}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-foreground flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Enrollment Date
                    </label>
                    <div className="px-4 py-3 rounded-lg bg-gray-50 text-foreground">
                      {formData.enrollmentDate}
                    </div>
                  </div>
                </div>
              </div>

              {/* Academic Information */}
              <div className="pt-6 border-t border-border">
                <h3 className="text-xl font-bold text-foreground mb-4">Academic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-foreground">
                      Student ID
                    </label>
                    <div className="px-4 py-3 rounded-lg bg-gray-50 text-foreground">
                      {formData.studentId}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-foreground">
                      Class Section
                    </label>
                    <div className="px-4 py-3 rounded-lg bg-gray-50 text-foreground">
                      {formData.section}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {isEditing && (
                <div className="flex gap-3 pt-6 border-t border-border">
                  <button
                    type="submit"
                    className="px-6 py-3 text-white rounded-lg transition-all hover:scale-105"
                    style={{ backgroundColor: 'var(--brand-green-dark)' }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = 'var(--brand-green-medium)')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = 'var(--brand-green-dark)')
                    }
                  >
                    Save Changes
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
  );
}
