'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Send, Plus, CheckCircle, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type AnnouncementItem = {
  id: string
  title: string
  category: string
  created_at: string
}

export function AnnouncementForm() {
  const supabase = useMemo(() => createClient(), [])

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([])

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'Academic',
  })

  const categories = ['Academic', 'Schedule', 'Assessment', 'Event', 'Policy']

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true)
    setError('')

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      setAnnouncements([])
      setLoading(false)
      return
    }

    const { data, error: fetchError } = await supabase
      .from('announcements')
      .select('id, title, category, created_at')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false })

    if (fetchError) {
      setError(fetchError.message)
      setAnnouncements([])
    } else {
      setAnnouncements((data ?? []) as AnnouncementItem[])
    }

    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchAnnouncements()
  }, [fetchAnnouncements])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      setError('You must be logged in to post announcements.')
      setSubmitting(false)
      return
    }

    const { error: insertError } = await supabase.from('announcements').insert({
      title: formData.title,
      content: formData.content,
      category: formData.category,
      target_role: 'student',
      created_by: user.id,
    })

    if (insertError) {
      setError(insertError.message)
      setSubmitting(false)
      return
    }

    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 2500)
    setFormData({ title: '', content: '', category: 'Academic' })
    await fetchAnnouncements()
    setSubmitting(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return
    setError('')

    const { error: deleteError } = await supabase.from('announcements').delete().eq('id', id)
    if (deleteError) {
      setError(deleteError.message)
      return
    }

    setAnnouncements((prev) => prev.filter((item) => item.id !== id))
  }

  return (
    <div className="max-w-3xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'var(--brand-pink-light)' }}
          >
            <Plus className="w-6 h-6" style={{ color: 'var(--brand-pink-dark)' }} />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-foreground">Post Announcement</h2>
            <p className="text-muted-foreground">Share important updates with your students</p>
          </div>
        </div>

        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-lg flex items-center gap-3"
            style={{
              backgroundColor: 'rgba(69,117,88,0.12)',
              borderLeft: '4px solid var(--brand-green-dark)',
            }}
          >
            <CheckCircle className="w-5 h-5" style={{ color: 'var(--brand-green-dark)' }} />
            <span className="font-medium text-foreground">Announcement posted successfully.</span>
          </motion.div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-lg border border-red-200 bg-red-50 text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white border border-border rounded-2xl p-8">
          <div className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-2 text-foreground">
                Announcement Title
              </label>
              <input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2"
                placeholder="e.g., New Clinical Modules Available"
                required
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium mb-2 text-foreground">
                Category
              </label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="content" className="block text-sm font-medium mb-2 text-foreground">
                Content
              </label>
              <textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 min-h-[200px]"
                placeholder="Write your announcement here..."
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 text-white rounded-lg transition-all hover:scale-105 flex items-center justify-center gap-2 disabled:opacity-70"
              style={{ backgroundColor: 'var(--brand-green-dark)' }}
            >
              <Send className="w-5 h-5" />
              <span>{submitting ? 'Posting...' : 'Post Announcement'}</span>
            </button>
          </div>
        </form>

        <div className="mt-8">
          <h3 className="text-xl font-bold text-foreground mb-4">Recent Announcements</h3>
          {loading ? (
            <div className="bg-white border border-border rounded-lg p-8 text-center">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : announcements.length === 0 ? (
            <div className="bg-white border border-border rounded-lg p-8 text-center">
              <p className="text-muted-foreground">No announcements posted yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className="bg-white border border-border rounded-lg p-4 flex items-center justify-between hover:shadow-md transition-all"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground">{announcement.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {new Date(announcement.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className="px-3 py-1 rounded-full text-xs text-white"
                      style={{ backgroundColor: 'var(--brand-green-medium)' }}
                    >
                      {announcement.category}
                    </span>
                    <button
                      onClick={() => handleDelete(announcement.id)}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" style={{ color: 'var(--brand-pink-dark)' }} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
