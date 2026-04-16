'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Users, BookOpen, UserCheck, Settings, LogOut, Plus, Edit2, Trash2, Check, X, ArrowLeft, ArrowRightLeft } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

// ── Types ──────────────────────────────────────────────────────────────────

type Section = {
  id: string;
  name: string;
  semester: string;
  schedule: string;
  instructor: string | null;
  instructor_id: string | null;
  studentCount: number;
};

type Student = {
  id: string;
  name: string;
  email: string;
  studentId: string;
  sectionId: string;
};

type Instructor = {
  id: string;
  name: string;
  email: string;
  employeeId: string;
  department: string;
  assignedSections: string[];
};

type PendingUser = {
  id: string;
  name: string;
  email: string;
  role: 'instructor' | 'student';
  requestedDate: string;
  section?: string;
};

type InstructorOption = {
  id: string;
  name: string;
};

// ── Helper ─────────────────────────────────────────────────────────────────

const asArray = <T,>(v: T | T[] | null | undefined): T[] =>
  !v ? [] : Array.isArray(v) ? v : [v];

// ── Component ──────────────────────────────────────────────────────────────

export function AdminDashboard() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [activeTab, setActiveTab] = useState<'sections' | 'instructors' | 'approvals'>('sections');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showAddSection, setShowAddSection] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [editingInstructor, setEditingInstructor] = useState<Instructor | null>(null);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [movingStudent, setMovingStudent] = useState<Student | null>(null);
  const [targetSectionId, setTargetSectionId] = useState<string | null>(null);

  const [sections, setSections] = useState<Section[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [instructorOptions, setInstructorOptions] = useState<InstructorOption[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<PendingUser[]>([]);

  const [approvalsLoading, setApprovalsLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);

  const [newSection, setNewSection] = useState({
    name: '',
    semester: 'Spring 2026',
    schedule: '',
    instructor_id: '',
  });

  // ── Fetch helpers ──────────────────────────────────────────────────────

  const fetchInstructorOptions = useCallback(async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'instructor')
      .eq('status', 'approved');
    setInstructorOptions((data ?? []).map((p: any) => ({ id: p.id, name: p.full_name })));
  }, [supabase]);

  const fetchSections = useCallback(async () => {
    const { data, error } = await supabase
      .from('sections')
      .select('id, name, semester, schedule, instructor_id, profiles!instructor_id(full_name)')
      .order('name');
    if (error) { toast.error(error.message); return; }

    // Fetch student counts separately to avoid nested-count syntax issues
    const { data: studentsData } = await supabase
      .from('students')
      .select('section_id');
    const countMap = new Map<string, number>();
    for (const s of (studentsData ?? []) as any[]) {
      countMap.set(s.section_id, (countMap.get(s.section_id) ?? 0) + 1);
    }

    setSections(((data ?? []) as any[]).map(s => {
      const profile = asArray(s.profiles)[0];
      return {
        id: s.id,
        name: s.name,
        semester: s.semester,
        schedule: s.schedule ?? '',
        instructor: profile?.full_name ?? null,
        instructor_id: s.instructor_id ?? null,
        studentCount: countMap.get(s.id) ?? 0,
      };
    }));
  }, [supabase]);

  const fetchStudents = useCallback(async () => {
    const { data, error } = await supabase
      .from('students')
      .select('id, student_no, section_id, profiles(full_name, email)');
    if (error) { toast.error(error.message); return; }
    setStudents(((data ?? []) as any[]).map(s => {
      const profile = asArray(s.profiles)[0];
      return {
        id: s.id,
        name: profile?.full_name ?? 'Unnamed',
        email: profile?.email ?? 'No email',
        studentId: s.student_no,
        sectionId: s.section_id,
      };
    }));
  }, [supabase]);

  const fetchInstructors = useCallback(async () => {
    const { data, error } = await supabase
      .from('instructors')
      .select('id, employee_id, department, profiles(full_name, email), sections(id)');
    if (error) { toast.error(error.message); return; }
    setInstructors(((data ?? []) as any[]).map(i => {
      const profile = asArray(i.profiles)[0];
      return {
        id: i.id,
        name: profile?.full_name ?? 'Unnamed',
        email: profile?.email ?? 'No email',
        employeeId: i.employee_id ?? '',
        department: i.department ?? '',
        assignedSections: asArray(i.sections).map((s: any) => s.id),
      };
    }));
  }, [supabase]);

  const fetchPendingApprovals = useCallback(async () => {
    setApprovalsLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select(`id, full_name, email, role, created_at, students ( student_no, sections ( name ) )`)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (!error && data) {
      setPendingApprovals(
        data.map((p: any) => {
          const studentRow = asArray(p.students)[0];
          const sectionRow = studentRow ? asArray(studentRow.sections)[0] : null;
          return {
            id: p.id,
            name: p.full_name,
            email: p.email,
            role: p.role as 'student' | 'instructor',
            requestedDate: new Date(p.created_at).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            }),
            section: sectionRow?.name ?? undefined,
          };
        })
      );
    }
    setApprovalsLoading(false);
  }, [supabase]);

  // Initial load
  useEffect(() => {
    async function loadAll() {
      setDataLoading(true);
      await Promise.all([
        fetchSections(),
        fetchStudents(),
        fetchInstructors(),
        fetchInstructorOptions(),
        fetchPendingApprovals(),
      ]);
      setDataLoading(false);
    }
    loadAll();
  }, [fetchSections, fetchStudents, fetchInstructors, fetchInstructorOptions, fetchPendingApprovals]);

  // ── Section CRUD ───────────────────────────────────────────────────────

  const handleAddSection = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('sections').insert({
      name: newSection.name,
      semester: newSection.semester,
      schedule: newSection.schedule,
      instructor_id: newSection.instructor_id || null,
    });
    if (error) { toast.error(error.message); return; }
    setNewSection({ name: '', semester: 'Spring 2026', schedule: '', instructor_id: '' });
    setShowAddSection(false);
    await fetchSections();
    toast.success('Section added.');
  };

  const handleDeleteSection = async (id: string) => {
    if (!confirm('Are you sure you want to delete this section?')) return;
    const { error } = await supabase.from('sections').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    await fetchSections();
    toast.success('Section deleted.');
  };

  const handleUpdateSection = async (section: Section) => {
    const { error } = await supabase
      .from('sections')
      .update({
        name: section.name,
        schedule: section.schedule,
        instructor_id: section.instructor_id || null,
      })
      .eq('id', section.id);
    if (error) { toast.error(error.message); return; }
    setEditingSection(null);
    await fetchSections();
    toast.success('Section updated.');
  };

  // ── Student operations ─────────────────────────────────────────────────

  const getSectionStudents = (sectionId: string) =>
    students.filter(s => s.sectionId === sectionId);

  const handleRemoveStudent = () => {
    toast.info('Students cannot be deleted from the admin panel. Remove the account from the Supabase auth dashboard.');
  };

  const handleMoveStudent = async () => {
    if (!movingStudent || !targetSectionId) return;
    const { error } = await supabase
      .from('students')
      .update({ section_id: targetSectionId })
      .eq('id', movingStudent.id);
    if (error) { toast.error(error.message); return; }
    setShowMoveModal(false);
    setMovingStudent(null);
    setTargetSectionId(null);
    await Promise.all([fetchSections(), fetchStudents()]);
    toast.success('Student moved.');
  };

  // ── Instructor CRUD ────────────────────────────────────────────────────

  const handleUpdateInstructor = async (instructor: Instructor) => {
    const [{ error: profileErr }, { error: instrErr }] = await Promise.all([
      supabase.from('profiles').update({ full_name: instructor.name }).eq('id', instructor.id),
      supabase.from('instructors').update({ employee_id: instructor.employeeId, department: instructor.department }).eq('id', instructor.id),
    ]);
    if (profileErr || instrErr) {
      toast.error(profileErr?.message ?? instrErr?.message ?? 'Update failed');
      return;
    }
    setEditingInstructor(null);
    await Promise.all([fetchInstructors(), fetchInstructorOptions()]);
    toast.success('Instructor updated.');
  };

  // ── Approval actions ───────────────────────────────────────────────────

  const handleApprove = async (userId: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId, action: 'approve' }),
      });
      if (!res.ok) throw new Error((await res.json()).message ?? 'Failed');
      toast.success('User approved — approval email sent.');
      await fetchPendingApprovals();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not approve user.');
    }
  };

  const handleReject = async (userId: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId, action: 'reject' }),
      });
      if (!res.ok) throw new Error((await res.json()).message ?? 'Failed');
      toast.success('User rejected — notification email sent.');
      await fetchPendingApprovals();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not reject user.');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  // ── Derived stats ──────────────────────────────────────────────────────

  const totalStudents = students.length;

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/admin/dashboard" className="flex items-center gap-3">
            <Image src="/images/LOGO-removebg-preview.png" alt="Maternix Track" width={120} height={48} className="h-12 w-auto" />
          </Link>

          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-3 px-4 py-2 rounded-lg transition-all hover:shadow-md"
                style={{ backgroundColor: 'var(--brand-green-dark)20' }}
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--brand-green-dark)' }}>
                  <Settings className="w-4 h-4 text-white" />
                </div>
                <div className="text-sm">
                  <div className="font-medium text-foreground">Admin</div>
                  <div className="text-muted-foreground text-xs">System Administrator</div>
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
          <h1 className="text-5xl font-bold text-foreground mb-3">Admin Dashboard</h1>
          <p className="text-xl text-muted-foreground">Manage sections, instructors, and user approvals</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Total Sections', value: sections.length, icon: BookOpen, color: 'var(--brand-green-dark)' },
            { label: 'Total Instructors', value: instructors.length, icon: UserCheck, color: 'var(--brand-green-medium)' },
            { label: 'Total Students', value: totalStudents, icon: Users, color: 'var(--brand-pink-dark)' },
            { label: 'Pending Approvals', value: pendingApprovals.length, icon: UserCheck, color: 'var(--brand-pink-medium)' },
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white border border-border rounded-2xl p-6"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${stat.color}20` }}>
                  <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
                </div>
                <div>
                  <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          {(['sections', 'instructors', 'approvals'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2"
              style={{
                backgroundColor: activeTab === tab ? 'var(--brand-green-dark)' : 'transparent',
                color: activeTab === tab ? 'white' : 'var(--foreground)',
                border: activeTab === tab ? 'none' : '1px solid var(--border)',
              }}
            >
              {tab === 'sections' ? 'Section Management' : tab === 'instructors' ? 'Instructor Management' : 'User Approvals'}
              {tab === 'approvals' && pendingApprovals.length > 0 && (
                <span className="px-2 py-1 rounded-full text-xs bg-red-500 text-white">
                  {pendingApprovals.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Section Management Tab ─────────────────────────────────────── */}
        {activeTab === 'sections' && !selectedSection && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">Manage Sections</h2>
              <button
                onClick={() => setShowAddSection(!showAddSection)}
                className="px-6 py-3 text-white rounded-lg transition-all hover:scale-105 flex items-center gap-2"
                style={{ backgroundColor: 'var(--brand-green-dark)' }}
              >
                <Plus className="w-5 h-5" />
                Add Section
              </button>
            </div>

            {/* Add Section Form */}
            {showAddSection && (
              <div className="bg-white border border-border rounded-xl p-6 mb-6">
                <h3 className="text-xl font-bold text-foreground mb-4">Add New Section</h3>
                <form onSubmit={handleAddSection} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-foreground">Section Name</label>
                      <input
                        type="text"
                        value={newSection.name}
                        onChange={(e) => setNewSection({ ...newSection, name: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-border bg-input-background"
                        placeholder="e.g., BSN 2D"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-foreground">Semester</label>
                      <input
                        type="text"
                        value={newSection.semester}
                        onChange={(e) => setNewSection({ ...newSection, semester: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-border bg-input-background"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-foreground">Schedule</label>
                      <input
                        type="text"
                        value={newSection.schedule}
                        onChange={(e) => setNewSection({ ...newSection, schedule: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-border bg-input-background"
                        placeholder="e.g., Mon/Wed 8:00 AM – 12:00 PM"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-foreground">Instructor (Optional)</label>
                      <select
                        value={newSection.instructor_id}
                        onChange={(e) => setNewSection({ ...newSection, instructor_id: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-border bg-input-background"
                      >
                        <option value="">— No instructor assigned —</option>
                        {instructorOptions.map(opt => (
                          <option key={opt.id} value={opt.id}>{opt.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button type="submit" className="px-6 py-2 text-white rounded-lg" style={{ backgroundColor: 'var(--brand-green-dark)' }}>
                      Add Section
                    </button>
                    <button type="button" onClick={() => setShowAddSection(false)} className="px-6 py-2 border border-border rounded-lg">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Sections List */}
            {dataLoading ? (
              <div className="bg-white border border-border rounded-xl p-8 text-center text-muted-foreground">Loading…</div>
            ) : sections.length === 0 ? (
              <div className="bg-white border border-border rounded-xl p-12 text-center text-muted-foreground">No sections yet.</div>
            ) : (
              <div className="space-y-4">
                {sections.map((section) => (
                  <div key={section.id} className="bg-white border border-border rounded-xl p-6">
                    {editingSection?.id === section.id ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">Section Name</label>
                            <input
                              type="text"
                              value={editingSection.name}
                              onChange={(e) => setEditingSection({ ...editingSection, name: e.target.value })}
                              className="w-full px-4 py-2 rounded-lg border border-border"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Schedule</label>
                            <input
                              type="text"
                              value={editingSection.schedule}
                              onChange={(e) => setEditingSection({ ...editingSection, schedule: e.target.value })}
                              className="w-full px-4 py-2 rounded-lg border border-border"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-sm font-medium mb-2">Instructor</label>
                            <select
                              value={editingSection.instructor_id ?? ''}
                              onChange={(e) => setEditingSection({ ...editingSection, instructor_id: e.target.value || null, instructor: instructorOptions.find(o => o.id === e.target.value)?.name ?? null })}
                              className="w-full px-4 py-2 rounded-lg border border-border"
                            >
                              <option value="">— No instructor assigned —</option>
                              {instructorOptions.map(opt => (
                                <option key={opt.id} value={opt.id}>{opt.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleUpdateSection(editingSection)}
                            className="px-4 py-2 text-white rounded-lg"
                            style={{ backgroundColor: 'var(--brand-green-dark)' }}
                          >
                            Save
                          </button>
                          <button onClick={() => setEditingSection(null)} className="px-4 py-2 border border-border rounded-lg">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex-1 cursor-pointer" onClick={() => setSelectedSection(section)}>
                          <h3 className="text-xl font-bold text-foreground mb-2 hover:underline">{section.name}</h3>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>Schedule: {section.schedule || '—'}</p>
                            <p>Instructor: {section.instructor || 'Not assigned'}</p>
                            <p>Students: {section.studentCount}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); setEditingSection(section); }}
                            className="p-2 rounded-lg hover:bg-gray-100"
                          >
                            <Edit2 className="w-5 h-5" style={{ color: 'var(--brand-green-dark)' }} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteSection(section.id); }}
                            className="p-2 rounded-lg hover:bg-gray-100"
                          >
                            <Trash2 className="w-5 h-5" style={{ color: 'var(--brand-pink-dark)' }} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── Student Management View (within section) ─────────────────── */}
        {activeTab === 'sections' && selectedSection && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <button
              onClick={() => setSelectedSection(null)}
              className="inline-flex items-center gap-2 mb-6 text-sm transition-colors"
              style={{ color: 'var(--brand-green-dark)' }}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Sections
            </button>

            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">{selectedSection.name} — Students</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedSection.schedule} • Instructor: {selectedSection.instructor || 'Not assigned'}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {getSectionStudents(selectedSection.id).length === 0 ? (
                <div className="bg-white border border-border rounded-xl p-12 text-center">
                  <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg text-muted-foreground">No students in this section</p>
                  <p className="text-sm text-muted-foreground mt-2">Students join via the signup flow and are assigned here upon registration.</p>
                </div>
              ) : (
                getSectionStudents(selectedSection.id).map((student) => (
                  <div key={student.id} className="bg-white border border-border rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-foreground mb-2">{student.name}</h3>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>Email: {student.email}</p>
                          <p>Student ID: {student.studentId}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setMovingStudent(student);
                            setTargetSectionId(null);
                            setShowMoveModal(true);
                          }}
                          className="px-4 py-2 text-white rounded-lg flex items-center gap-2 hover:scale-105 transition-all"
                          style={{ backgroundColor: 'var(--brand-green-dark)' }}
                        >
                          <ArrowRightLeft className="w-5 h-5" />
                          Move
                        </button>
                        <button
                          onClick={handleRemoveStudent}
                          className="px-4 py-2 text-white rounded-lg flex items-center gap-2 hover:scale-105 transition-all"
                          style={{ backgroundColor: 'var(--brand-pink-dark)' }}
                        >
                          <Trash2 className="w-5 h-5" />
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Move Student Modal */}
            {showMoveModal && movingStudent && (
              <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6"
                onClick={() => { setShowMoveModal(false); setMovingStudent(null); setTargetSectionId(null); }}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white rounded-2xl max-w-lg w-full p-8"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 className="text-2xl font-bold text-foreground mb-2">Move Student to Another Section</h3>
                  <p className="text-muted-foreground mb-6">Select a section to move {movingStudent.name} to</p>

                  <div className="space-y-3 mb-6">
                    <div className="p-4 bg-gray-50 rounded-lg border border-border">
                      <p className="text-sm text-muted-foreground mb-1">Current Section:</p>
                      <p className="font-bold text-foreground">{sections.find(s => s.id === movingStudent.sectionId)?.name ?? '—'}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-3 text-foreground">Move to Section:</label>
                      <div className="space-y-2">
                        {sections
                          .filter(section => section.id !== movingStudent.sectionId)
                          .map((section) => (
                            <button
                              key={section.id}
                              onClick={() => setTargetSectionId(section.id)}
                              className="w-full p-4 rounded-lg border-2 text-left transition-all"
                              style={{
                                borderColor: targetSectionId === section.id ? 'var(--brand-green-dark)' : 'var(--border)',
                                backgroundColor: targetSectionId === section.id ? 'rgba(69,117,88,0.06)' : 'white',
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-bold text-foreground">{section.name}</p>
                                  <p className="text-sm text-muted-foreground">{section.schedule}</p>
                                  <p className="text-sm text-muted-foreground">Instructor: {section.instructor || 'Not assigned'}</p>
                                </div>
                                {targetSectionId === section.id && (
                                  <Check className="w-6 h-6" style={{ color: 'var(--brand-green-dark)' }} />
                                )}
                              </div>
                            </button>
                          ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => { setShowMoveModal(false); setMovingStudent(null); setTargetSectionId(null); }}
                      className="px-6 py-3 border border-border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleMoveStudent}
                      disabled={!targetSectionId}
                      className="px-6 py-3 text-white rounded-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                      style={{ backgroundColor: 'var(--brand-green-dark)' }}
                    >
                      Move Student
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </motion.div>
        )}

        {/* ── Instructor Management Tab ─────────────────────────────────── */}
        {activeTab === 'instructors' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">Manage Instructors</h2>
            </div>

            {dataLoading ? (
              <div className="bg-white border border-border rounded-xl p-8 text-center text-muted-foreground">Loading…</div>
            ) : instructors.length === 0 ? (
              <div className="bg-white border border-border rounded-xl p-12 text-center">
                <UserCheck className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg text-muted-foreground">No approved instructors yet.</p>
                <p className="text-sm text-muted-foreground mt-2">Instructors register via the signup flow and appear here after approval.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {instructors.map((instructor) => (
                  <div key={instructor.id} className="bg-white border border-border rounded-xl p-6">
                    {editingInstructor?.id === instructor.id ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">Instructor Name</label>
                            <input
                              type="text"
                              value={editingInstructor.name}
                              onChange={(e) => setEditingInstructor({ ...editingInstructor, name: e.target.value })}
                              className="w-full px-4 py-2 rounded-lg border border-border"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Employee ID</label>
                            <input
                              type="text"
                              value={editingInstructor.employeeId}
                              onChange={(e) => setEditingInstructor({ ...editingInstructor, employeeId: e.target.value })}
                              className="w-full px-4 py-2 rounded-lg border border-border"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Department</label>
                            <input
                              type="text"
                              value={editingInstructor.department}
                              onChange={(e) => setEditingInstructor({ ...editingInstructor, department: e.target.value })}
                              className="w-full px-4 py-2 rounded-lg border border-border"
                            />
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleUpdateInstructor(editingInstructor)}
                            className="px-4 py-2 text-white rounded-lg"
                            style={{ backgroundColor: 'var(--brand-green-dark)' }}
                          >
                            Save
                          </button>
                          <button onClick={() => setEditingInstructor(null)} className="px-4 py-2 border border-border rounded-lg">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-foreground mb-2">{instructor.name}</h3>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>Email: {instructor.email}</p>
                            <p>Employee ID: {instructor.employeeId || '—'}</p>
                            <p>Department: {instructor.department || '—'}</p>
                            <p>
                              Assigned Sections:{' '}
                              {instructor.assignedSections.length > 0
                                ? instructor.assignedSections
                                    .map(sId => sections.find(s => s.id === sId)?.name)
                                    .filter(Boolean)
                                    .join(', ')
                                : 'None'}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => setEditingInstructor(instructor)} className="p-2 rounded-lg hover:bg-gray-100">
                            <Edit2 className="w-5 h-5" style={{ color: 'var(--brand-green-dark)' }} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── User Approvals Tab ────────────────────────────────────────── */}
        {activeTab === 'approvals' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl font-bold text-foreground mb-6">Pending User Approvals</h2>

            {approvalsLoading ? (
              <div className="bg-white border border-border rounded-xl p-12 text-center">
                <p className="text-muted-foreground">Loading…</p>
              </div>
            ) : pendingApprovals.length === 0 ? (
              <div className="bg-white border border-border rounded-xl p-12 text-center">
                <UserCheck className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg text-muted-foreground">No pending approvals</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingApprovals.map((user) => (
                  <div key={user.id} className="bg-white border border-border rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-foreground">{user.name}</h3>
                          <span
                            className="px-3 py-1 rounded-full text-xs text-white"
                            style={{
                              backgroundColor: user.role === 'instructor' ? 'var(--brand-green-dark)' : 'var(--brand-pink-dark)',
                            }}
                          >
                            {user.role === 'instructor' ? 'Instructor' : 'Student'}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>Email: {user.email}</p>
                          <p>Requested: {user.requestedDate}</p>
                          {user.section && <p>Section: {user.section}</p>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(user.id)}
                          className="px-4 py-2 text-white rounded-lg flex items-center gap-2"
                          style={{ backgroundColor: 'var(--brand-green-dark)' }}
                        >
                          <Check className="w-5 h-5" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(user.id)}
                          className="px-4 py-2 text-white rounded-lg flex items-center gap-2"
                          style={{ backgroundColor: 'var(--brand-pink-dark)' }}
                        >
                          <X className="w-5 h-5" />
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
