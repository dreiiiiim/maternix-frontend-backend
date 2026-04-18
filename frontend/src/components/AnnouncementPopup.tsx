'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Bell } from 'lucide-react'

type PopupAnnouncement = {
  id: string
  title: string
  instructor: string
  date: string
  preview?: string
  content?: string
  category: string
}

interface AnnouncementPopupProps {
  announcements: PopupAnnouncement[]
  onViewAll: () => void
}

export function AnnouncementPopup({ announcements, onViewAll }: AnnouncementPopupProps) {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const hasShown = sessionStorage.getItem('announcementPopupShown')
    if (hasShown || announcements.length === 0) return

    const timer = setTimeout(() => {
      setIsOpen(true)
      sessionStorage.setItem('announcementPopupShown', 'true')
    }, 500)

    return () => clearTimeout(timer)
  }, [announcements])

  const recentAnnouncements = announcements.slice(0, 2).map((announcement) => ({
    ...announcement,
    preview:
      announcement.preview ??
      ((announcement.content ?? '').length > 120
        ? `${(announcement.content ?? '').slice(0, 120)}...`
        : (announcement.content ?? '')),
  }))

  const handleViewAll = () => {
    setIsOpen(false)
    onViewAll()
  }

  if (!isOpen || recentAnnouncements.length === 0) return null

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
