'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

export function AboutUs() {
  const [aboutImgError, setAboutImgError] = useState(false);
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-24">
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-end justify-center max-w-5xl mx-auto">
          {/* Left Side - Logo and Description */}
          <div className="space-y-6">
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="flex justify-center"
            >
              <Image
                src="/images/image-11.png"
                alt="Maternix Track Logo"
                width={128}
                height={128}
                className="h-32 w-auto"
              />
            </motion.div>

            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="rounded-3xl p-10"
              style={{ backgroundColor: 'var(--brand-pink-light)' }}
            >
              <p className="text-lg leading-relaxed text-foreground">
                Maternix Track is a website monitoring system designed to track and manage
                students&apos; performance in Return Demonstrations (RETDEMs) under the course RLE
                107: Care of Mother, Child, and Adolescent (Well Client). It allows students and
                instructors to document checklists, materials, grades, and feedback in one organized
                platform, enabling real-time monitoring of key skills such as Leopold Maneuver,
                EINC, Labor and Delivery, Intramuscular and Intradermal injections, and NICU
                procedures.
              </p>
            </motion.div>
          </div>

          {/* Right Side - Image */}
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex items-center justify-start"
          >
            {!aboutImgError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src="/images/46fc3091-e4be-4dd7-9e2c-b3f1297217a5.png"
                alt="Maternal Care"
                className="w-full max-w-xs h-auto rounded-3xl object-cover"
                onError={() => setAboutImgError(true)}
              />
            ) : (
              <div
                className="w-full max-w-xs h-80 rounded-3xl flex items-center justify-center"
                style={{ backgroundColor: 'var(--brand-pink-light)' }}
              >
                <Image
                  src="/images/image-11.png"
                  alt="Maternix Track"
                  width={160}
                  height={160}
                  className="h-40 w-auto opacity-60"
                />
              </div>
            )}
          </motion.div>
        </div>

        {/* Key Features Section */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-20"
        >
          <h2
            className="text-4xl font-bold text-center mb-12"
            style={{ color: 'var(--brand-green-dark)' }}
          >
            Key Features
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: '📋',
                title: 'Performance Tracking',
                description:
                  'Monitor and document student performance in return demonstrations with detailed checklists and evaluations.',
                bg: 'var(--brand-pink-light)',
              },
              {
                icon: '👥',
                title: 'Instructor-Student Collaboration',
                description:
                  'Seamless communication between instructors and students with real-time feedback and guidance.',
                bg: 'rgba(69,117,88,0.12)',
              },
              {
                icon: '📊',
                title: 'Organized Platform',
                description:
                  'All materials, grades, and feedback in one centralized system for easy access and management.',
                bg: 'var(--brand-pink-light)',
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-white border border-border rounded-2xl p-8 hover:shadow-lg transition-all"
              >
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
                  style={{ backgroundColor: feature.bg }}
                >
                  <span className="text-3xl">{feature.icon}</span>
                </div>
                <h3 className="text-xl font-bold text-foreground text-center mb-4">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-center">{feature.description}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-20 text-center"
        >
          <h2 className="text-3xl font-bold text-foreground mb-6">Start Your Clinical Journey</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Create your account to track your progress, access learning materials, and collaborate
            with your instructors throughout your clinical rotations.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/signup"
              className="px-8 py-4 text-white rounded-lg text-lg transition-all hover:scale-105"
              style={{ backgroundColor: 'var(--brand-pink-dark)' }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = 'var(--brand-green-dark)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = 'var(--brand-pink-dark)')
              }
            >
              Sign Up Now
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 border-2 rounded-lg text-lg transition-all hover:scale-105"
              style={{ borderColor: 'var(--brand-green-dark)', color: 'var(--brand-green-dark)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--brand-green-dark)';
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--brand-green-dark)';
              }}
            >
              Login
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
