'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import {
  CheckCircle,
  Clock,
  FileText,
  TrendingUp,
  ExternalLink,
  Download,
  Link as LinkIcon,
  X,
  LogOut,
  Settings,
  Bell,
  Lock,
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AnnouncementPopup } from './AnnouncementPopup';
import { createClient } from '@/lib/supabase/client';
import { getApiBaseUrl } from '@/lib/api-base-url';
import { UserAvatar } from './UserAvatar';

type EvaluationData = {
  overallScore: number | null;
  maxScore: number | null;
  competencyStatus: string | null;
  evaluationDate: string | null;
  evaluatorName: string | null;
  feedback: string | null;
  rubric: { criterion: string; score: number; maxScore: number; description: string }[];
};

type Procedure = {
  id: string;
  procedureId: string;
  name: string;
  category: string;
  description: string | null;
  allowedBy: string | null;
  allowedDate: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'evaluated' | 'locked';
  completedDate: string | null;
  notes: string | null;
  evaluation: EvaluationData | null;
  resources: { type: 'file' | 'link'; name: string; url: string }[];
};

type DashboardAnnouncement = {
  id: string;
  title: string;
  instructor: string;
  role: string;
  date: string;
  content: string;
  category: string;
};

type DashboardResponse = {
  student: {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    role: string;
    avatarUrl: string | null;
  };
  stats: {
    totalAllowed: number;
    evaluated: number;
    inProgress: number;
    completed: number;
    locked: number;
  };
  procedures: Procedure[];
  announcements: DashboardAnnouncement[];
};

const categoryColors: Record<string, string> = {
  Academic: 'var(--brand-green-dark)',
  Schedule: 'var(--brand-pink-dark)',
  Assessment: 'var(--brand-green-medium)',
  Event: 'var(--brand-pink-medium)',
  Policy: 'var(--brand-green-dark)',
};

export function StudentDashboard() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const apiUrl = getApiBaseUrl();

  const [selectedProcedure, setSelectedProcedure] = useState<Procedure | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showAnnouncements, setShowAnnouncements] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [studentAvatarUrl, setStudentAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [announcements, setAnnouncements] = useState<DashboardAnnouncement[]>([]);
  const [stats, setStats] = useState([
    { label: 'Total Procedures Allowed', value: '–', icon: CheckCircle, color: 'var(--brand-green-dark)' },
    { label: 'Evaluated', value: '–', icon: CheckCircle, color: 'var(--brand-green-medium)' },
    { label: 'In Progress', value: '–', icon: Clock, color: 'var(--brand-pink-dark)' },
  ]);

  const orderedProcedures = useMemo(() => {
    return [...procedures].sort((a, b) => {
      const getStatusRank = (status: Procedure['status']) => {
        switch (status) {
          case 'evaluated':
            return 0;
          case 'pending':
          case 'in_progress':
            return 1;
          case 'completed':
            return 2;
          case 'locked':
            return 3;
          default:
            return 4;
        }
      };

      return getStatusRank(a.status) - getStatusRank(b.status);
    });
  }, [procedures]);

  const getVisibleNote = (procedure: Procedure | null) => {
    if (!procedure || procedure.status === 'locked') return null;

    const text =
      procedure.status === 'evaluated'
        ? procedure.evaluation?.feedback
        : procedure.notes;

    const trimmed = text?.trim();
    return trimmed ? trimmed : null;
  };

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');

      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;
        if (!session?.access_token) {
          router.push('/login');
          return;
        }

        const response = await fetch(`${apiUrl}/student/dashboard`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(payload?.message ?? 'Failed to load student dashboard.');
        }

        const data = payload as DashboardResponse;
        setStudentName(data.student.firstName || data.student.fullName || 'Student');
        setStudentAvatarUrl(data.student.avatarUrl ?? null);
        setProcedures(data.procedures);
        setAnnouncements(data.announcements);
        setStats([
          { label: 'Total Procedures Allowed', value: String(data.stats.totalAllowed), icon: CheckCircle, color: 'var(--brand-green-dark)' },
          { label: 'Evaluated', value: String(data.stats.evaluated), icon: CheckCircle, color: 'var(--brand-green-medium)' },
          { label: 'In Progress', value: String(data.stats.inProgress), icon: Clock, color: 'var(--brand-pink-dark)' },
        ]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load student dashboard.');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [router, supabase]);

  return (
    <div className="min-h-screen bg-background">
      <AnnouncementPopup announcements={announcements} onViewAll={() => setShowAnnouncements(true)} />

      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/student/dashboard" className="flex items-center gap-3">
            <Image src="/images/LOGO-removebg-preview.png" alt="Maternix Track" width={64} height={64} className="h-16 w-16" />
          </Link>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowAnnouncements(!showAnnouncements)}
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:scale-105"
              style={{ backgroundColor: showAnnouncements ? '#d4edda' : 'var(--brand-pink-light)' }}
            >
              {showAnnouncements ? (
                <>
                  <FileText className="w-4 h-4" style={{ color: 'var(--brand-green-dark)' }} />
                  <span className="text-sm text-foreground">View Procedures</span>
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4" style={{ color: 'var(--brand-pink-dark)' }} />
                  <span className="text-sm text-foreground">Announcements</span>
                </>
              )}
            </button>

            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-3 px-4 py-2 rounded-lg transition-all hover:shadow-md"
                style={{ backgroundColor: 'var(--brand-pink-light)' }}
              >
                <UserAvatar
                  name={studentName || 'Student'}
                  avatarUrl={studentAvatarUrl}
                  sizeClassName="w-8 h-8"
                  fallbackBackgroundColor="var(--brand-pink-dark)"
                />
                <div className="text-sm">
                  <div className="font-medium text-foreground">{studentName || 'Student'}</div>
                  <div className="text-muted-foreground text-xs">Nursing Student</div>
                </div>
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-border rounded-lg shadow-lg overflow-hidden z-50">
                  <Link
                    href="/student/profile"
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <Settings className="w-4 h-4" style={{ color: 'var(--brand-green-dark)' }} />
                    <span className="text-foreground">Profile Settings</span>
                  </Link>
                  <button
                    onClick={async () => {
                      await supabase.auth.signOut();
                      router.push('/');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-t border-border"
                  >
                    <LogOut className="w-4 h-4" style={{ color: 'var(--brand-pink-dark)' }} />
                    <span className="text-foreground">Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <h1 className="text-5xl font-bold text-foreground mb-3">Welcome back, {studentName || 'Student'}</h1>
          <p className="text-xl text-muted-foreground">
            Track your clinical progress and view procedures approved by your instructors
          </p>
        </motion.div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white border border-border rounded-2xl p-6 hover:shadow-lg transition-all"
              onMouseEnter={(e) =>
                (e.currentTarget.style.borderColor = 'var(--brand-pink-medium)')
              }
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = '')}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${stat.color}20` }}
                >
                  <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
                </div>
                <div>
                  <div className="text-3xl font-bold text-foreground">{loading ? '–' : stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {showAnnouncements ? (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            <div className="flex items-center gap-3 mb-6">
              <Bell className="w-8 h-8" style={{ color: 'var(--brand-pink-dark)' }} />
              <h2 className="text-3xl font-bold text-foreground">Announcements</h2>
            </div>
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
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="bg-white border border-border rounded-2xl p-8 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-2xl font-bold text-foreground mb-2">
                          {announcement.title}
                        </h3>
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
          </motion.div>
        ) : (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <FileText className="w-8 h-8" style={{ color: 'var(--brand-green-dark)' }} />
              <h2 className="text-3xl font-bold text-foreground">Allowed Procedures</h2>
            </div>
            <p className="text-muted-foreground mb-8">
              Procedures you are authorized to perform by your clinical instructors
            </p>

            {loading ? (
              <div className="bg-white border border-border rounded-2xl p-12 text-center text-muted-foreground">
                Loading procedures...
              </div>
            ) : orderedProcedures.length === 0 ? (
              <div className="bg-white border border-border rounded-2xl p-12 text-center text-muted-foreground">
                No procedures assigned yet. Your instructor will unlock procedures for you.
              </div>
            ) : (
              <div className="space-y-4">
                {orderedProcedures.map((procedure, index) => (
                  <motion.div
                    key={procedure.id}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className={`bg-white border-2 border-border rounded-xl p-6 transition-all ${
                      procedure.status === 'locked'
                        ? 'opacity-60 cursor-not-allowed'
                        : 'hover:shadow-lg cursor-pointer'
                    }`}
                    style={{
                      borderLeftWidth: '6px',
                      borderLeftColor:
                        procedure.status === 'locked'
                          ? '#9CA3AF'
                          : procedure.status === 'completed' || procedure.status === 'evaluated'
                          ? 'var(--brand-green-dark)'
                          : 'var(--brand-pink-dark)',
                    }}
                    onClick={() => procedure.status !== 'locked' && setSelectedProcedure(procedure)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4
                          className={`text-xl font-bold mb-1 ${
                            procedure.status === 'locked'
                              ? 'text-muted-foreground'
                              : 'text-foreground'
                          }`}
                        >
                          {procedure.name}
                        </h4>
                        <span
                          className="inline-block px-3 py-1 rounded-full text-xs text-white"
                          style={{
                            backgroundColor:
                              procedure.status === 'locked'
                                ? '#9CA3AF'
                                : 'var(--brand-green-medium)',
                          }}
                        >
                          {procedure.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {procedure.resources.length > 0 && procedure.status !== 'locked' && (
                          <span
                            className="px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1"
                            style={{
                              backgroundColor: 'rgba(69,117,88,0.12)',
                              color: 'var(--brand-green-dark)',
                            }}
                          >
                            <FileText className="w-3 h-3" />
                            {procedure.resources.length}
                          </span>
                        )}
                        <span
                          className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 text-white"
                          style={{
                            backgroundColor:
                              procedure.status === 'locked'
                                ? '#9CA3AF'
                                : procedure.status === 'completed' || procedure.status === 'evaluated'
                                ? 'var(--brand-green-dark)'
                                : 'var(--brand-pink-dark)',
                          }}
                        >
                          {procedure.status === 'locked' ? (
                            <><Lock className="w-4 h-4" /> Locked</>
                          ) : procedure.status === 'evaluated' ? (
                            <><CheckCircle className="w-4 h-4" /> Evaluated</>
                          ) : procedure.status === 'completed' ? (
                            <><CheckCircle className="w-4 h-4" /> Completed</>
                          ) : (
                            <><Clock className="w-4 h-4" /> In Progress</>
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                      <div>
                        <span className="text-muted-foreground">
                          {procedure.status === 'locked' ? 'Instructor:' : 'Allowed by:'}
                        </span>
                        <span
                          className={`ml-2 font-medium ${
                            procedure.status === 'locked' ? 'text-muted-foreground' : 'text-foreground'
                          }`}
                        >
                          {procedure.allowedBy ?? '—'}
                        </span>
                      </div>
                      {procedure.status !== 'locked' && (
                        <div>
                          <span className="text-muted-foreground">
                            {procedure.status === 'evaluated'
                              ? 'Evaluated:'
                              : procedure.status === 'completed'
                              ? 'Completed:'
                              : 'Date Allowed:'}
                          </span>
                          <span className="ml-2 font-medium text-foreground">
                            {procedure.status === 'evaluated'
                              ? procedure.evaluation?.evaluationDate
                              : procedure.status === 'completed'
                              ? procedure.completedDate
                              : procedure.allowedDate}
                          </span>
                        </div>
                      )}
                    </div>

                    {getVisibleNote(procedure) && (
                      <div
                        className="p-3 rounded-lg"
                        style={{
                          backgroundColor:
                            procedure.status === 'locked'
                              ? '#F3F4F6'
                              : procedure.status === 'completed' || procedure.status === 'evaluated'
                              ? '#d4edda'
                              : 'var(--brand-pink-light)',
                        }}
                      >
                        <p
                          className={`text-sm ${
                            procedure.status === 'locked' ? 'text-muted-foreground' : 'text-foreground'
                          }`}
                        >
                          <span className="font-medium">
                            {procedure.status === 'evaluated'
                              ? 'Evaluator Feedback:'
                              : 'Instructor Notes:'}
                          </span>{' '}
                          {getVisibleNote(procedure)}
                        </p>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {selectedProcedure && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          onClick={() => setSelectedProcedure(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <h3 className="text-3xl font-bold text-foreground mb-2">
                    {selectedProcedure.name}
                  </h3>
                  <div className="flex items-center gap-3">
                    <span
                      className="px-3 py-1 rounded-full text-xs text-white"
                      style={{ backgroundColor: 'var(--brand-green-medium)' }}
                    >
                      {selectedProcedure.category}
                    </span>
                    <span
                      className="px-3 py-1 rounded-lg text-xs font-medium text-white"
                      style={{
                        backgroundColor:
                          selectedProcedure.status === 'completed' ||
                          selectedProcedure.status === 'evaluated'
                            ? 'var(--brand-green-dark)'
                            : 'var(--brand-pink-dark)',
                      }}
                    >
                      {selectedProcedure.status === 'evaluated'
                        ? 'Evaluated'
                        : selectedProcedure.status === 'completed'
                        ? 'Completed'
                        : 'In Progress'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedProcedure(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-muted-foreground" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-border">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Allowed by</div>
                  <div className="font-medium text-foreground">{selectedProcedure.allowedBy ?? '—'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Date Allowed</div>
                  <div className="font-medium text-foreground">{selectedProcedure.allowedDate ?? '—'}</div>
                </div>
                {(selectedProcedure.status === 'completed' ||
                  selectedProcedure.status === 'evaluated') && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Completed Date</div>
                    <div className="font-medium text-foreground">
                      {selectedProcedure.completedDate ?? '—'}
                    </div>
                  </div>
                )}
                {selectedProcedure.status === 'evaluated' && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Evaluation Date</div>
                    <div className="font-medium text-foreground">
                      {selectedProcedure.evaluation?.evaluationDate ?? '—'}
                    </div>
                  </div>
                )}
              </div>

              {getVisibleNote(selectedProcedure) && (
                <div className="mb-6">
                  <h4 className="font-medium text-foreground mb-2">
                    {selectedProcedure.status === 'evaluated'
                      ? 'Evaluator Feedback'
                      : 'Instructor Notes'}
                  </h4>
                  <div
                    className="p-4 rounded-lg"
                    style={{
                      backgroundColor:
                        selectedProcedure.status === 'completed' ||
                        selectedProcedure.status === 'evaluated'
                          ? '#d4edda'
                          : 'var(--brand-pink-light)',
                    }}
                  >
                    <p className="text-foreground">
                      {getVisibleNote(selectedProcedure)}
                    </p>
                  </div>
                </div>
              )}

              {selectedProcedure.status === 'evaluated' && selectedProcedure.evaluation && (
                <div className="mb-6 border-t border-border pt-6">
                  <h4 className="font-medium text-foreground mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" style={{ color: 'var(--brand-green-dark)' }} />
                    Performance Evaluation
                  </h4>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div
                      className="p-6 rounded-xl border-2"
                      style={{ backgroundColor: '#d4edda', borderColor: 'var(--brand-green-dark)' }}
                    >
                      <div className="text-sm text-muted-foreground mb-2">Overall Score</div>
                      <div
                        className="text-4xl font-bold"
                        style={{ color: 'var(--brand-green-dark)' }}
                      >
                        {selectedProcedure.evaluation.overallScore ?? '–'}/
                        {selectedProcedure.evaluation.maxScore ?? '–'}
                      </div>
                    </div>
                    <div
                      className="p-6 rounded-xl border-2"
                      style={{
                        backgroundColor: '#d4edda',
                        borderColor: 'var(--brand-green-medium)',
                      }}
                    >
                      <div className="text-sm text-muted-foreground mb-2">Competency Status</div>
                      <div className="flex items-center gap-2">
                        <CheckCircle
                          className="w-6 h-6"
                          style={{ color: 'var(--brand-green-medium)' }}
                        />
                        <div className="text-2xl font-bold text-foreground">
                          {selectedProcedure.evaluation.competencyStatus ?? '—'}
                        </div>
                      </div>
                    </div>
                  </div>
                  {selectedProcedure.evaluation.rubric.length > 0 && (
                    <div className="space-y-3">
                      {selectedProcedure.evaluation.rubric.map((item, index) => (
                        <div
                          key={index}
                          className="border border-border rounded-lg p-4 hover:shadow-md transition-all"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="font-medium text-foreground mb-1">{item.criterion}</div>
                              <div className="text-sm text-muted-foreground">{item.description}</div>
                            </div>
                            <div className="text-right ml-4">
                              <div
                                className="text-2xl font-bold"
                                style={{ color: 'var(--brand-green-dark)' }}
                              >
                                {item.score}/{item.maxScore}
                              </div>
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                            <div
                              className="h-2 rounded-full transition-all"
                              style={{
                                width: `${(item.score / item.maxScore) * 100}%`,
                                backgroundColor:
                                  item.score / item.maxScore >= 0.9
                                    ? 'var(--brand-green-dark)'
                                    : item.score / item.maxScore >= 0.7
                                    ? 'var(--brand-green-medium)'
                                    : 'var(--brand-pink-dark)',
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {selectedProcedure.resources.length > 0 && (
                <div>
                  <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5" style={{ color: 'var(--brand-green-dark)' }} />
                    Attached Resources
                  </h4>
                  <div className="space-y-3">
                    {selectedProcedure.resources.map((resource, index) => (
                      <a
                        key={index}
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-4 p-4 rounded-lg border-2 border-border hover:shadow-md transition-all group"
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.borderColor = 'var(--brand-green-medium)')
                        }
                        onMouseLeave={(e) => (e.currentTarget.style.borderColor = '')}
                      >
                        <div
                          className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{
                            backgroundColor:
                              resource.type === 'file'
                                ? 'var(--brand-pink-light)'
                                : 'rgba(69,117,88,0.12)',
                          }}
                        >
                          {resource.type === 'file' ? (
                            <Download className="w-6 h-6" style={{ color: 'var(--brand-pink-dark)' }} />
                          ) : (
                            <LinkIcon className="w-6 h-6" style={{ color: 'var(--brand-green-dark)' }} />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-foreground">{resource.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {resource.type === 'file' ? 'Download file' : 'Open link'}
                          </div>
                        </div>
                        <ExternalLink className="w-5 h-5 text-muted-foreground" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
