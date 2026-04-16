'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Bell } from 'lucide-react';

const announcements = [
  {
    id: 1,
    title: 'New Clinical Modules Available',
    instructor: 'Dr. Sarah Mitchell',
    role: 'Clinical Instructor',
    date: 'April 12, 2026',
    content:
      'Exciting news! We have just released new clinical modules focusing on postpartum care and neonatal assessment. These modules include video demonstrations, interactive case studies, and competency checklists.',
    category: 'Academic',
  },
  {
    id: 2,
    title: 'Clinical Rotation Schedule Update',
    instructor: 'Prof. Jennifer Lopez',
    role: 'Lead Clinical Coordinator',
    date: 'April 10, 2026',
    content:
      'Please note that the clinical rotation schedule for Week 6 has been updated. All students assigned to Labor & Delivery should report to the 3rd floor nurse station at 6:45 AM instead of 7:00 AM.',
    category: 'Schedule',
  },
  {
    id: 3,
    title: 'Competency Assessment Reminder',
    instructor: 'Dr. Maria Santos',
    role: 'Clinical Instructor',
    date: 'April 8, 2026',
    content:
      'Reminder: All students must complete their mid-term competency assessments by April 20th. This includes documentation of at least 15 patient encounters and completion of the maternal health skills checklist.',
    category: 'Assessment',
  },
  {
    id: 4,
    title: 'Guest Lecture: Advanced Maternal Care',
    instructor: 'Dr. Robert Chen',
    role: 'Visiting Clinical Instructor',
    date: 'April 5, 2026',
    content:
      'Join us for a special guest lecture on advanced maternal care techniques this Friday at 2:00 PM in Room 305. Dr. Amanda Williams from City General Hospital will share insights on managing high-risk pregnancies.',
    category: 'Event',
  },
  {
    id: 5,
    title: 'Clinical Documentation Guidelines',
    instructor: 'Prof. Linda Anderson',
    role: 'Clinical Instructor',
    date: 'April 3, 2026',
    content:
      'Important update to our clinical documentation guidelines. All patient encounter logs must now include patient consent verification and HIPAA compliance checkmarks. Updated templates are available in the resources section.',
    category: 'Policy',
  },
];

const categoryColors: Record<string, string> = {
  Academic: 'var(--brand-green-dark)',
  Schedule: 'var(--brand-pink-dark)',
  Assessment: 'var(--brand-green-medium)',
  Event: 'var(--brand-pink-medium)',
  Policy: 'var(--brand-green-dark)',
};

export function AnnouncementsPage() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 mb-8 transition-colors"
            style={{ color: 'var(--brand-green-dark)' }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = 'var(--brand-green-medium)')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = 'var(--brand-green-dark)')
            }
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>

          <div className="flex items-center gap-4 mb-3">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'var(--brand-pink-light)' }}
            >
              <Bell className="w-7 h-7" style={{ color: 'var(--brand-pink-dark)' }} />
            </div>
            <h1 className="text-5xl font-bold text-foreground">Announcements</h1>
          </div>

          <p className="text-lg text-muted-foreground mb-12">
            Stay updated with the latest news from your clinical instructors
          </p>
        </motion.div>

        <div className="space-y-6">
          {announcements.map((announcement, index) => (
            <motion.article
              key={announcement.id}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white border border-border rounded-2xl p-8 hover:shadow-lg transition-all"
              onMouseEnter={(e) =>
                (e.currentTarget.style.borderColor = 'var(--brand-pink-medium)')
              }
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = '')}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">{announcement.title}</h2>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{announcement.instructor}</span>
                    <span>•</span>
                    <span>{announcement.role}</span>
                    <span>•</span>
                    <span>{announcement.date}</span>
                  </div>
                </div>
                <span
                  className="px-3 py-1 rounded-full text-sm text-white"
                  style={{ backgroundColor: categoryColors[announcement.category] }}
                >
                  {announcement.category}
                </span>
              </div>
              <p className="text-foreground leading-relaxed">{announcement.content}</p>
            </motion.article>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-12 text-center p-8 rounded-2xl border-2 border-dashed border-border"
        >
          <p className="text-muted-foreground">You&apos;ve reached the end of all announcements</p>
        </motion.div>
      </div>
    </div>
  );
}
