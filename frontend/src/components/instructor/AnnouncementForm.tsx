'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Plus, CheckCircle, Trash2 } from 'lucide-react';

export function AnnouncementForm() {
  const [formData, setFormData] = useState({ title: '', content: '', category: 'Academic' });
  const [showSuccess, setShowSuccess] = useState(false);
  const [announcements, setAnnouncements] = useState([
    { id: 1, title: 'New Clinical Modules Available', category: 'Academic', date: 'April 12, 2026' },
    { id: 2, title: 'Clinical Rotation Schedule Update', category: 'Schedule', date: 'April 10, 2026' },
  ]);

  const categories = ['Academic', 'Schedule', 'Assessment', 'Event', 'Policy'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newAnnouncement = {
      id: Math.max(...announcements.map((a) => a.id), 0) + 1,
      title: formData.title,
      category: formData.category,
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    };
    setAnnouncements([newAnnouncement, ...announcements]);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
    setFormData({ title: '', content: '', category: 'Academic' });
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this announcement?')) {
      setAnnouncements(announcements.filter((a) => a.id !== id));
    }
  };

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
            <span className="font-medium text-foreground">Announcement posted successfully!</span>
          </motion.div>
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
                  <option key={cat} value={cat}>{cat}</option>
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
              className="w-full py-3 text-white rounded-lg transition-all hover:scale-105 flex items-center justify-center gap-2"
              style={{ backgroundColor: 'var(--brand-green-dark)' }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = 'var(--brand-green-medium)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = 'var(--brand-green-dark)')
              }
            >
              <Send className="w-5 h-5" />
              <span>Post Announcement</span>
            </button>
          </div>
        </form>

        <div className="mt-8">
          <h3 className="text-xl font-bold text-foreground mb-4">Recent Announcements</h3>
          {announcements.length === 0 ? (
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
                    <p className="text-sm text-muted-foreground">{announcement.date}</p>
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
  );
}
