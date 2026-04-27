'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState } from 'react';

export function LandingPage() {
  const [heroVisible, setHeroVisible] = useState(true);
  const [stethoVisible, setStethoVisible] = useState(true);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section
        className="relative h-screen flex items-center overflow-hidden"
        style={{ backgroundColor: '#2a3a2e' }}
      >
        <motion.div
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className="absolute inset-0"
        >
          {heroVisible && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src="/images/Hawak_Baby.jpg"
              alt="Newborn care"
              className="w-full h-full object-cover"
              onError={() => setHeroVisible(false)}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
        </motion.div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
          <div className="max-w-xl">
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <h1 className="text-6xl font-bold text-white mb-6 leading-tight">
                Empowering the Next Generation of Maternal Care
              </h1>
              <p className="text-xl text-white/90 mb-8">
                Advanced clinical tracking for nursing students and instructors in maternal health
                education.
              </p>
              <div className="flex gap-4">
                <Link
                  href="/signup"
                  className="px-8 py-4 text-white rounded-lg transition-all hover:scale-105 text-lg"
                  style={{ backgroundColor: 'var(--brand-pink-dark)' }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = 'var(--brand-green-dark)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = 'var(--brand-pink-dark)')
                  }
                >
                  Get Started
                </Link>
                <Link
                  href="/login"
                  className="px-8 py-4 bg-white/20 backdrop-blur-sm text-white border-2 border-white/30 rounded-lg hover:bg-white/30 transition-all text-lg"
                >
                  Login
                </Link>
              </div>
            </motion.div>
          </div>
        </div>

        {stethoVisible && (
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="absolute bottom-20 right-20 hidden lg:block"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/stetos-removebg-preview.png"
              alt="Stethoscope"
              className="w-32 h-auto opacity-80"
              onError={() => setStethoVisible(false)}
            />
          </motion.div>
        )}
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Your Clinical Rotation Companion
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-justify">
              Keep track of your procedures, access learning resources, and get feedback from your
              instructors all in one place.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Track Your Progress',
                description:
                  "See which procedures you've completed, what's currently allowed, and what's coming next in your training.",
                delay: 0.1,
              },
              {
                title: 'Get Real-Time Feedback',
                description:
                  'Receive evaluations and notes from your clinical instructors right after completing each procedure.',
                delay: 0.2,
              },
              {
                title: 'Access Learning Materials',
                description:
                  'Find procedure guides, video tutorials, and resources shared by your instructors whenever you need them.',
                delay: 0.3,
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ y: 40, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: feature.delay }}
                className="p-8 rounded-2xl border border-border transition-colors"
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor = 'var(--brand-pink-medium)')
                }
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = '')}
              >
                <h3 className="text-2xl font-bold text-foreground mb-3">{feature.title}</h3>
                <p className="text-muted-foreground text-justify">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        className="py-24"
        style={{ background: 'linear-gradient(to bottom right, var(--brand-pink-light), white)' }}
      >
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold text-foreground mb-6">
              Begin Your Clinical Training
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Track your procedures, monitor your progress, and stay connected with your instructors
              throughout your maternal health rotations.
            </p>
            <Link
              href="/signup"
              className="inline-block px-10 py-4 text-white rounded-lg transition-all hover:scale-105 text-lg"
              style={{ backgroundColor: 'var(--brand-pink-dark)' }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = 'var(--brand-green-dark)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = 'var(--brand-pink-dark)')
              }
            >
              Create Your Account
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
