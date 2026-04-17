'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, Bell } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type AnnouncementRow = {
  id: string
  title: string
  content: string
  category: string
  created_at: string
  profiles:
    | {
        first_name: string | null
        last_name: string | null
        role: string | null
      }
    | Array<{
        first_name: string | null
        last_name: string | null
        role: string | null
      }>
    | null
}

type AnnouncementItem = {
  id: string
  title: string
  instructor: string
  role: string
  date: string
  content: string
  category: string
}

const categoryColors: Record<string, string> = {
  Academic: 'var(--brand-green-dark)',
  Schedule: 'var(--brand-pink-dark)',
  Assessment: 'var(--brand-green-medium)',
  Event: 'var(--brand-pink-medium)',
  Policy: 'var(--brand-green-dark)',
}

const asArray = <T,>(value: T | T[] | null | undefined): T[] =>
  !value ? [] : Array.isArray(value) ? value : [value]

export function AnnouncementsPage() {
  const supabase = useMemo(() => createClient(), [])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([])

  useEffect(() => {
    async function fetchAnnouncements() {
      setLoading(true)
      setError('')

      const {
        data: { user },
      } = await supabase.auth.getUser()

      let query = supabase
        .from('announcements')
        .select(
          'id, title, content, category, created_at, profiles!announcements_created_by_fkey(first_name, last_name, role)'
        )
        .order('created_at', { ascending: false })

      if (!user) {
        query = query.eq('target_role', 'all')
      } else {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (profile?.role) {
          query = query.or(`target_role.eq.all,target_role.eq.${profile.role}`)
        } else {
          query = query.eq('target_role', 'all')
        }
      }

      const { data, error: fetchError } = await query

      if (fetchError) {
        setError(fetchError.message)
        setAnnouncements([])
        setLoading(false)
        return
      }

      const mapped = ((data ?? []) as AnnouncementRow[]).map((row) => {
        const creator = asArray(row.profiles)[0]
        const authorName = creator ? `${creator.first_name || ''} ${creator.last_name || ''}`.trim() : 'Maternix'
        return {
          id: row.id,
          title: row.title,
          instructor: authorName || 'Maternix',
          role: creator?.role ?? 'instructor',
          date: new Date(row.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          content: row.content,
          category: row.category,
        }
      })

      setAnnouncements(mapped)
      setLoading(false)
    }

    fetchAnnouncements()
  }, [supabase])

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Link href="/" className="inline-flex items-center gap-2 mb-8 transition-colors" style={{ color: 'var(--brand-green-dark)' }}>
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>

          <div className="flex items-center gap-4 mb-3">
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--brand-pink-light)' }}>
              <Bell className="w-7 h-7" style={{ color: 'var(--brand-pink-dark)' }} />
            </div>
            <h1 className="text-5xl font-bold text-foreground">Announcements</h1>
          </div>
          <p className="text-lg text-muted-foreground mb-12">Stay updated with the latest course and clinical updates</p>
        </motion.div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="bg-white border border-border rounded-2xl p-8 text-center text-muted-foreground">
            Loading announcements...
          </div>
        ) : announcements.length === 0 ? (
          <div className="bg-white border border-border rounded-2xl p-8 text-center text-muted-foreground">
            No announcements available.
          </div>
        ) : (
          <div className="space-y-6">
            {announcements.map((announcement, index) => (
              <motion.article
                key={announcement.id}
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className="bg-white border border-border rounded-2xl p-8 hover:shadow-lg transition-all"
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
                    style={{ backgroundColor: categoryColors[announcement.category] ?? 'var(--brand-green-dark)' }}
                  >
                    {announcement.category}
                  </span>
                </div>
                <p className="text-foreground leading-relaxed">{announcement.content}</p>
              </motion.article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
