'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Bell, FileText, Users, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { AnnouncementForm } from './instructor/AnnouncementForm';
import { ProcedureManagement } from './instructor/ProcedureManagement';
import { StudentMasterlist } from './instructor/StudentMasterlist';

type TabType = 'announcements' | 'procedures' | 'students';

export function InstructorDashboard() {
  const router = useRouter();
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<TabType>('announcements');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [instructorName, setInstructorName] = useState('Clinical Instructor');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', data.user.id)
        .single()
        .then(({ data: profile }) => {
          if (profile) {
              const name = `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim() || 'Clinical Instructor';
              setInstructorName(name);
          }
        });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const tabs = [
    { id: 'announcements' as TabType, label: 'Announcements', icon: Bell },
    { id: 'procedures' as TabType, label: 'Procedures', icon: FileText },
    { id: 'students' as TabType, label: 'Student Masterlist', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Dashboard Header */}
      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/instructor/dashboard" className="flex items-center gap-3">
            <Image
              src="/images/LOGO-removebg-preview.png"
              alt="Maternix Track"
              width={120}
              height={48}
              className="h-12 w-auto"
            />
          </Link>

          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-3 px-4 py-2 rounded-lg transition-all hover:shadow-md"
              style={{ backgroundColor: 'var(--brand-pink-light)' }}
              suppressHydrationWarning
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'var(--brand-green-dark)' }}
              >
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="text-sm">
                <div className="font-medium text-foreground">{instructorName}</div>
                <div className="text-muted-foreground text-xs">Clinical Instructor</div>
              </div>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-border rounded-lg shadow-lg overflow-hidden z-50">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" style={{ color: 'var(--brand-pink-dark)' }} />
                  <span className="text-foreground">Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Welcome Section */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <h1 className="text-5xl font-bold text-foreground mb-3">Instructor Dashboard</h1>
          <p className="text-xl text-muted-foreground">
            Manage announcements, procedures, and track student progress
          </p>
        </motion.div>

        {/* Tab Navigation */}
        <div className="mb-8 border-b border-border">
          <div className="flex gap-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-2 px-6 py-4 font-medium transition-all relative"
                  style={{
                    color: isActive ? 'var(--brand-green-dark)' : 'var(--muted-foreground)',
                    borderBottom: isActive
                      ? '3px solid var(--brand-green-dark)'
                      : '3px solid transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.color = 'var(--brand-green-medium)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.color = 'var(--muted-foreground)';
                  }}
                  suppressHydrationWarning
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'announcements' && <AnnouncementForm />}
          {activeTab === 'procedures' && <ProcedureManagement />}
          {activeTab === 'students' && <StudentMasterlist />}
        </motion.div>
      </div>
    </div>
  );
}
