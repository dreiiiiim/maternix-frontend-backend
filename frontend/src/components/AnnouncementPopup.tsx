'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Bell } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type PopupAnnouncement = {
  id: string
  title: string
  instructor: string
  date: string
  preview: string
  category: string
}

type AnnouncementRow = {
  id: string
  title: string
  content: string
  category: string
  created_at: string
  profiles:
    | {
        full_name: string | null
      }
    | Array<{
        full_name: string | null
      }>
    | null
}

interface AnnouncementPopupProps {
  onViewAll: () => void
}

const asArray = <T,>(value: T | T[] | null | undefined): T[] =>
  !value ? [] : Array.isArray(value) ? value : [value]

export function AnnouncementPopup({ onViewAll }: AnnouncementPopupProps) {
  const supabase = useMemo(() => createClient(), [])
  const [isOpen, setIsOpen] = useState(false)
  const [recentAnnouncements, setRecentAnnouncements] = useState<PopupAnnouncement[]>([])

  useEffect(() => {
    const hasShown = sessionStorage.getItem('announcementPopupShown')
    if (hasShown) return

    async function fetchAnnouncements() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (!profile?.role) return

        const { data } = await supabase
          .from('announcements')
          .select('id, title, content, category, created_at, profiles!announcements_created_by_fkey(full_name)')
          .or(`target_role.eq.all,target_role.eq.${profile.role}`)
          .order('created_at', { ascending: false })
          .limit(2)

        const mapped = ((data ?? []) as AnnouncementRow[]).map((row) => {
          const creator = asArray(row.profiles)[0]
          return {
            id: row.id,
            title: row.title,
            instructor: creator?.full_name ?? 'Maternix',
            date: new Date(row.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }),
            preview: row.content.length > 120 ? `${row.content.slice(0, 120)}...` : row.content,
            category: row.category,
          }
        })

        if (mapped.length) {
          setRecentAnnouncements(mapped)
          setTimeout(() => {
            setIsOpen(true)
            sessionStorage.setItem('announcementPopupShown', 'true')
          }, 500)
        }
      } catch {
        // Graceful no-popup fallback for session/network issues.
      }
    }

    fetchAnnouncements()
  }, [supabase])

  const handleViewAll = () => {
    setIsOpen(false)
    onViewAll()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl"
        >
          <div
            className="p-6 border-b border-border flex items-center justify-between"
            style={{ background: 'linear-gradient(to right, var(--brand-pink-light), white)' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--brand-pink-dark)' }}>
                <Bell className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">New Announcements</h2>
                <p className="text-sm text-muted-foreground">Updates from your instructors</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/50 rounded-lg transition-colors">
              <X className="w-6 h-6 text-muted-foreground" />
            </button>
          </div>

          <div className="p-6 max-h-[60vh] overflow-y-auto">
            <div className="space-y-4">
              {recentAnnouncements.map((announcement, index) => (
                <motion.div
                  key={announcement.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="p-4 rounded-xl border-2 border-border hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-bold text-foreground">{announcement.title}</h3>
                    <span className="px-3 py-1 rounded-full text-xs text-white" style={{ backgroundColor: 'var(--brand-green-dark)' }}>
                      {announcement.category}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">
                    {announcement.instructor} • {announcement.date}
                  </div>
                  <p className="text-foreground">{announcement.preview}</p>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="p-6 border-t border-border bg-gray-50 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {recentAnnouncements.length} new announcement
              {recentAnnouncements.length > 1 ? 's' : ''}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setIsOpen(false)} className="px-6 py-2 border border-border rounded-lg hover:bg-gray-100 transition-colors">
                Close
              </button>
              <button onClick={handleViewAll} className="px-6 py-2 text-white rounded-lg transition-all hover:scale-105" style={{ backgroundColor: 'var(--brand-green-dark)' }}>
                View All
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
