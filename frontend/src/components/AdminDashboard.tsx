'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Users, BookOpen, UserCheck, LogOut, Plus, Edit2, Trash2, Check, X, ArrowLeft, ArrowRightLeft, ChevronDown, ChevronUp } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { getApiBaseUrl } from '@/lib/api-base-url';
import { UserAvatar } from './UserAvatar';

const STUDENT_ID_REGEX = /^NSG-\d{4}-\d{5}$/;
const EMPLOYEE_ID_REGEX = /^EMP-\d{4}-\d{4}$/;

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
  firstName: string;
  lastName: string;
  email: string;
  studentId: string;
  sectionId: string;
};

type Instructor = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  employeeId: string;
  department: string;
  assignedSections: string[];
};

type PendingUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'instructor' | 'student';
  requestedDate: string;
  section?: string;
};

type InstructorOption = {
  id: string;
  firstName: string;
  lastName: string;
};

// ── Helper ─────────────────────────────────────────────────────────────────

const asArray = <T,>(v: T | T[] | null | undefined): T[] =>
  !v ? [] : Array.isArray(v) ? v : [v];

// ── Component ──────────────────────────────────────────────────────────────

export function AdminDashboard() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const apiUrl = getApiBaseUrl();

  const [activeTab, setActiveTab] = useState<'sections' | 'instructors' | 'approvals' | 'unassigned'>('sections');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [adminName, setAdminName] = useState('Admin');
  const [adminAvatarUrl, setAdminAvatarUrl] = useState<string | null>(null);
  const [showAddSection, setShowAddSection] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [expandedSectionId, setExpandedSectionId] = useState<string | null>(null);
  const [editingInstructor, setEditingInstructor] = useState<Instructor | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [movingStudent, setMovingStudent] = useState<Student | null>(null);
  const [targetSectionId, setTargetSectionId] = useState<string | null>(null);
  const [showRemoveAllModal, setShowRemoveAllModal] = useState<Section | null>(null);

  const [sections, setSections] = useState<Section[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [instructorOptions, setInstructorOptions] = useState<InstructorOption[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<PendingUser[]>([]);
  const [selectedUnassignedStudents, setSelectedUnassignedStudents] = useState<string[]>([]);
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);

  const [approvalsLoading, setApprovalsLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);

  const [newSection, setNewSection] = useState({
    name: '',
    semester: 'Spring 2026',
  });

  // ── Fetch helpers ──────────────────────────────────────────────────────

  const fetchInstructorOptions = useCallback(async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .eq('role', 'instructor')
      .eq('status', 'approved');
    setInstructorOptions((data ?? []).map((p: any) => ({ 
      id: p.id, 
      firstName: p.first_name, 
      lastName: p.last_name 
    })));
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
      .select('id, student_no, section_id, profiles(first_name, last_name, email)');
    if (error) { toast.error(error.message); return; }
    setStudents(((data ?? []) as any[]).map(s => {
      const profile = asArray(s.profiles)[0];
      return {
        id: s.id,
        firstName: profile?.first_name ?? 'Unnamed',
        lastName: profile?.last_name ?? '',
        email: profile?.email ?? 'No email',
        studentId: s.student_no,
        sectionId: s.section_id,
      };
    }));
  }, [supabase]);

  const fetchInstructors = useCallback(async () => {
    // We cannot join sections(id) directly from instructors because sections references profiles(id).
    // So we fetch approved instructors and their profiles first.
    const { data, error } = await supabase
      .from('instructors')
      .select('id, employee_id, department, profiles!inner(first_name, last_name, email, status)')
      .eq('profiles.status', 'approved');
      
    if (error) { toast.error(error.message); return; }

    // Fetch the assigned sections manually from the sections table
    const { data: sectionData } = await supabase
      .from('sections')
      .select('id, instructor_id')
      .not('instructor_id', 'is', null);

    const sectionMap = new Map<string, string[]>();
    for (const s of (sectionData ?? []) as any[]) {
      if (!sectionMap.has(s.instructor_id)) sectionMap.set(s.instructor_id, []);
      sectionMap.get(s.instructor_id)!.push(s.id);
    }

    setInstructors(((data ?? []) as any[]).map(i => {
      const profile = asArray(i.profiles)[0];
      return {
        id: i.id,
        firstName: profile?.first_name ?? 'Unnamed',
        lastName: profile?.last_name ?? '',
        email: profile?.email ?? 'No email',
        employeeId: i.employee_id ?? '',
        department: i.department ?? '',
        assignedSections: sectionMap.get(i.id) ?? [],
      };
    }));
  }, [supabase]);

  const fetchPendingApprovals = useCallback(async () => {
    setApprovalsLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select(`id, first_name, last_name, email, role, created_at, students ( student_no, sections ( name ) )`)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (!error && data) {
      setPendingApprovals(
        data.map((p: any) => {
          const studentRow = asArray(p.students)[0];
          const sectionRow = studentRow ? asArray(studentRow.sections)[0] : null;
          return {
            id: p.id,
            firstName: p.first_name,
            lastName: p.last_name,
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

  const fetchCurrentAdminProfile = useCallback(async () => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('first_name, last_name, full_name, avatar_url')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError || !profile) {
      return;
    }

    const fullName =
      profile.full_name ??
      `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim();

    setAdminName(fullName || 'Admin');
    setAdminAvatarUrl(profile.avatar_url ?? null);
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
        fetchCurrentAdminProfile(),
      ]);
      setDataLoading(false);
    }
    loadAll();
  }, [
    fetchSections,
    fetchStudents,
    fetchInstructors,
    fetchInstructorOptions,
    fetchPendingApprovals,
    fetchCurrentAdminProfile,
  ]);

  // ── Section CRUD ───────────────────────────────────────────────────────

  const handleAddSection = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('sections').insert({
      name: newSection.name,
      semester: newSection.semester,
    });
    if (error) { toast.error(error.message); return; }
    setNewSection({ name: '', semester: 'Spring 2026' });
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
      .update({ name: section.name })
      .eq('id', section.id);
    if (error) { toast.error(error.message); return; }
    setEditingSection(null);
    await fetchSections();
    toast.success('Section updated.');
  };

  const handleRemoveAllStudents = async (section: Section) => {
    const sectionStudents = getSectionStudents(section.id);
    if (sectionStudents.length === 0) { toast.info('No students in this section.'); return; }
    const { error } = await supabase
      .from('students')
      .update({ section_id: null })
      .in('id', sectionStudents.map(s => s.id));
    if (error) { toast.error(error.message); return; }
    setShowRemoveAllModal(null);
    await Promise.all([fetchSections(), fetchStudents()]);
    toast.success(`All students removed from ${section.name}.`);
  };

  const handleUnassignStudent = async (studentId: string) => {
    if (!confirm('Remove this student from the section?')) return;
    const { error } = await supabase
      .from('students')
      .update({ section_id: null })
      .eq('id', studentId);
    if (error) { toast.error(error.message); return; }
    await Promise.all([fetchSections(), fetchStudents()]);
    toast.success('Student unassigned from section.');
  };

  // ── Student operations ─────────────────────────────────────────────────

  const getSectionStudents = (sectionId: string) =>
    students.filter(s => s.sectionId === sectionId);

  const handleUpdateStudent = async (student: Student) => {
    if (!STUDENT_ID_REGEX.test(student.studentId)) {
      toast.error('Invalid Student ID format. Expected: NSG-0000-00000');
      return;
    }

    const [{ error: profileErr }, { error: studentErr }] = await Promise.all([
      supabase.from('profiles').update({ 
        first_name: student.firstName,
        last_name: student.lastName,
        full_name: `${student.firstName} ${student.lastName}`.trim()
      }).eq('id', student.id),
      supabase.from('students').update({ student_no: student.studentId }).eq('id', student.id),
    ]);

    if (profileErr || studentErr) {
      toast.error(profileErr?.message ?? studentErr?.message ?? 'Update failed');
      return;
    }
    setEditingStudent(null);
    await Promise.all([fetchStudents(), fetchSections()]);
    toast.success('Student updated successfully.');
  };

  const handleRemoveStudent = () => {
    toast.info('Students cannot be deleted from the admin panel. Remove the account from the Supabase auth dashboard.');
  };

  const handleMoveStudent = async () => {
    if (!movingStudent || !targetSectionId) return;

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      toast.error('You must be logged in.');
      return;
    }

    const response = await fetch(`${apiUrl}/admin/students/move`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        studentId: movingStudent.id,
        targetSectionId,
      }),
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      toast.error(payload?.message ?? 'Failed to move student.');
      return;
    }

    setShowMoveModal(false);
    setMovingStudent(null);
    setTargetSectionId(null);
    await Promise.all([fetchSections(), fetchStudents()]);
    toast.success('Student moved.');
  };

  const handleBulkAssignStudents = async (targetId: string) => {
    if (selectedUnassignedStudents.length === 0 || !targetId) return;

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      toast.error('You must be logged in.');
      return;
    }

    const response = await fetch(`${apiUrl}/admin/students/bulk-assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        studentIds: selectedUnassignedStudents,
        targetSectionId: targetId,
      }),
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      toast.error(payload?.message ?? 'Bulk assign failed.');
      return;
    }

    toast.success(`Succesfully assigned ${selectedUnassignedStudents.length} students.`);
    setSelectedUnassignedStudents([]);
    setShowBulkAssignModal(false);
    await Promise.all([fetchSections(), fetchStudents()]);
  };

  const toggleStudentSelection = (id: string) => {
    setSelectedUnassignedStudents(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // ── Instructor CRUD ────────────────────────────────────────────────────

  const handleUpdateInstructor = async (instructor: Instructor) => {
    if (!EMPLOYEE_ID_REGEX.test(instructor.employeeId)) {
      toast.error('Invalid Employee ID format. Expected: EMP-0000-0000');
      return;
    }

    const [{ error: profileErr }, { error: instrErr }] = await Promise.all([
      supabase.from('profiles').update({ 
        first_name: instructor.firstName,
        last_name: instructor.lastName,
        full_name: `${instructor.firstName} ${instructor.lastName}`.trim()
      }).eq('id', instructor.id),
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
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${apiUrl}/auth/approve`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ userId, action: 'approve' }),
      });
      if (!res.ok) throw new Error((await res.json()).message ?? 'Failed');
      toast.success('User approved — approval email sent.');
      await Promise.all([
        fetchPendingApprovals(),
        fetchStudents(),
        fetchInstructors(),
        fetchSections()
      ]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not approve user.');
    }
  };

  const handleReject = async (userId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${apiUrl}/auth/approve`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
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

  const handleRemoveUser = async (userId: string) => {
    if (!confirm('Are you sure you want to permanently delete this user account? This action cannot be undone.')) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${apiUrl}/auth/remove`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) throw new Error((await res.json()).message ?? 'Failed');
      toast.success('User account permanently deleted.');
      await Promise.all([
        fetchPendingApprovals(),
        fetchStudents(),
        fetchInstructors(),
        fetchSections()
      ]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not remove user.');
    }
  };

  // ── Derived stats ──────────────────────────────────────────────────────

  const totalStudents = students.length;
  const unassignedStudents = students.filter(s => !s.sectionId);

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/admin/dashboard" className="flex items-center gap-3">
            <Image src="/images/LOGO-removebg-preview.png" alt="Maternix Track" width={64} height={64} className="h-16 w-16" />
          </Link>

          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-3 px-4 py-2 rounded-lg transition-all hover:shadow-md"
                style={{ backgroundColor: 'var(--brand-green-dark)20' }}
              >
                <UserAvatar
                  name={adminName}
                  avatarUrl={adminAvatarUrl}
                  sizeClassName="w-8 h-8"
                  fallbackBackgroundColor="var(--brand-green-dark)"
                />
                <div className="text-sm">
                  <div className="font-medium text-foreground">{adminName}</div>
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
            { label: 'Total Sections', value: sections.length, icon: BookOpen, color: 'var(--brand-green-dark)', tab: 'sections' as const },
            { label: 'Total Instructors', value: instructors.length, icon: UserCheck, color: 'var(--brand-green-medium)', tab: 'instructors' as const },
            { label: 'Total Students', value: totalStudents, icon: Users, color: 'var(--brand-pink-dark)', tab: 'sections' as const },
            { label: 'Unassigned', value: unassignedStudents.length, icon: ArrowRightLeft, color: 'var(--brand-pink-medium)', tab: 'unassigned' as const },
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              onClick={() => setActiveTab(stat.tab)}
              className="bg-white border border-border p-8 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-4">
                <div 
                  className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110"
                  style={{ backgroundColor: `${stat.color}15` }}
                >
                  <stat.icon className="w-7 h-7" style={{ color: stat.color }} />
                </div>
                <div>
                  <div className="text-3xl font-bold text-foreground mb-1">{stat.value}</div>
                  <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          {(['sections', 'instructors', 'unassigned', 'approvals'] as const).map((tab) => (
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
              {tab === 'sections' ? 'Sections' : 
               tab === 'instructors' ? 'Instructors' : 
               tab === 'unassigned' ? 'Unassigned Students' :
               'User Approvals'}
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
                        suppressHydrationWarning
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
                        suppressHydrationWarning
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button type="submit" className="px-6 py-2 text-white rounded-lg" style={{ backgroundColor: 'var(--brand-green-dark)' }} suppressHydrationWarning>
                      Add Section
                    </button>
                    <button type="button" onClick={() => setShowAddSection(false)} className="px-6 py-2 border border-border rounded-lg" suppressHydrationWarning>
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
                {sections.map((section) => {
                  const isExpanded = expandedSectionId === section.id;
                  const sectionStudents = getSectionStudents(section.id);
                  return (
                    <div key={section.id} className="bg-white border border-border rounded-xl overflow-hidden">
                      {editingSection?.id === section.id ? (
                        <div className="p-6 space-y-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">Section Name</label>
                            <input
                              type="text"
                              value={editingSection.name}
                              onChange={(e) => setEditingSection({ ...editingSection, name: e.target.value })}
                              className="w-full px-4 py-2 rounded-lg border border-border"
                              suppressHydrationWarning
                            />
                          </div>
                          <div className="flex gap-3">
                            <button
                              onClick={() => handleUpdateSection(editingSection)}
                              className="px-4 py-2 text-white rounded-lg"
                              style={{ backgroundColor: 'var(--brand-green-dark)' }}
                              suppressHydrationWarning
                            >
                              Save
                            </button>
                            <button onClick={() => setEditingSection(null)} className="px-4 py-2 border border-border rounded-lg" suppressHydrationWarning>
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Section header row — click to expand/collapse */}
                          <div
                            className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors cursor-pointer"
                            onClick={() => setExpandedSectionId(isExpanded ? null : section.id)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                setExpandedSectionId(isExpanded ? null : section.id);
                              }
                            }}
                            suppressHydrationWarning
                          >
                            <div className="flex-1">
                              <h3 className="text-xl font-bold text-foreground mb-1">{section.name}</h3>
                              <div className="text-sm text-muted-foreground space-y-0.5">
                                <p>Students: {section.studentCount}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <button
                                onClick={(e) => { e.stopPropagation(); setEditingSection(section); }}
                                className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
                                suppressHydrationWarning
                              >
                                <Edit2 className="w-5 h-5" style={{ color: 'var(--brand-green-dark)' }} />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteSection(section.id); }}
                                className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
                                suppressHydrationWarning
                              >
                                <Trash2 className="w-5 h-5" style={{ color: 'var(--brand-pink-dark)' }} />
                              </button>
                              {isExpanded
                                ? <ChevronUp className="w-5 h-5 text-muted-foreground" />
                                : <ChevronDown className="w-5 h-5 text-muted-foreground" />
                              }
                            </div>
                          </div>

                          {/* Expanded students panel */}
                          {isExpanded && (
                            <div className="border-t border-border p-6 bg-gray-50">
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="font-semibold text-foreground">Students in {section.name}</h4>
                                {sectionStudents.length > 0 && (
                                  <button
                                    onClick={() => setShowRemoveAllModal(section)}
                                    className="px-4 py-2 text-white rounded-lg flex items-center gap-2 text-sm hover:scale-105 transition-all"
                                    style={{ backgroundColor: 'var(--brand-pink-dark)' }}
                                    suppressHydrationWarning
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    Remove All Students
                                  </button>
                                )}
                              </div>
                              {sectionStudents.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">No students in this section.</p>
                              ) : (
                                <div className="space-y-3">
                                  {sectionStudents.map((student) => (
                                    <div key={student.id} className="bg-white border border-border rounded-lg p-4 flex items-center justify-between">
                                      <div className="flex-1">
                                        <p className="font-bold text-foreground">{student.firstName} {student.lastName}</p>
                                        <p className="text-sm text-muted-foreground">ID: {student.studentId} • {student.email}</p>
                                      </div>
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() => setEditingStudent(student)}
                                          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                          title="Edit Student Information"
                                          suppressHydrationWarning
                                        >
                                          <Edit2 className="w-4 h-4" style={{ color: 'var(--brand-green-dark)' }} />
                                        </button>
                                        <button
                                          onClick={() => { setMovingStudent(student); setTargetSectionId(null); setShowMoveModal(true); }}
                                          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                          title="Move to Another Section"
                                          suppressHydrationWarning
                                        >
                                          <ArrowRightLeft className="w-4 h-4" style={{ color: 'var(--brand-green-dark)' }} />
                                        </button>
                                        <button
                                          onClick={() => handleUnassignStudent(student.id)}
                                          className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                                          title="Remove from Section"
                                          suppressHydrationWarning
                                        >
                                          <X className="w-4 h-4" style={{ color: 'var(--brand-pink-dark)' }} />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* ── Unassigned Students Tab ───────────────────────────────────── */}
        {activeTab === 'unassigned' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-amber-100 text-amber-600">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Unassigned Students</h2>
                  <p className="text-sm text-muted-foreground">Manage students without a section assignment</p>
                </div>
              </div>
              {selectedUnassignedStudents.length > 0 && (
                <button
                  onClick={() => setShowBulkAssignModal(true)}
                  className="px-6 py-3 text-white rounded-lg transition-all hover:scale-105 flex items-center gap-2"
                  style={{ backgroundColor: 'var(--brand-green-dark)' }}
                  suppressHydrationWarning
                >
                  <ArrowRightLeft className="w-5 h-5" />
                  Assign Selected ({selectedUnassignedStudents.length})
                </button>
              )}
            </div>

            {unassignedStudents.length === 0 ? (
              <div className="bg-white border border-border rounded-2xl p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-50 flex items-center justify-center">
                  <Check className="w-8 h-8 text-green-500" />
                </div>
                <p className="text-lg font-medium text-foreground">All students are assigned</p>
                <p className="text-sm text-muted-foreground mt-1">There are no unassigned students at the moment.</p>
              </div>
            ) : (
              <div className="bg-white border border-border rounded-xl overflow-hidden shadow-sm">
                <div className="p-4 bg-gray-50 border-b border-border flex items-center gap-4">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 rounded border-gray-300"
                    checked={selectedUnassignedStudents.length === unassignedStudents.length && unassignedStudents.length > 0}
                    onChange={() => {
                      if (selectedUnassignedStudents.length === unassignedStudents.length) {
                        setSelectedUnassignedStudents([]);
                      } else {
                        setSelectedUnassignedStudents(unassignedStudents.map(s => s.id));
                      }
                    }}
                  />
                  <span className="text-sm font-medium text-foreground">Select All Unassigned</span>
                </div>
                <div className="divide-y divide-border">
                  {unassignedStudents.map((student) => (
                    <div key={student.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 rounded border-gray-300"
                        checked={selectedUnassignedStudents.includes(student.id)}
                        onChange={() => toggleStudentSelection(student.id)}
                      />
                      <div className="flex-1">
                        <p className="font-bold text-foreground">{student.firstName} {student.lastName}</p>
                        <p className="text-sm text-muted-foreground">ID: {student.studentId} • {student.email}</p>
                      </div>
                      <div className="flex gap-2">
                         <button
                          onClick={() => setEditingStudent(student)}
                          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                          suppressHydrationWarning
                        >
                          <Edit2 className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ── Remove All Students Confirmation Modal ────────────────────── */}
        {showRemoveAllModal && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => setShowRemoveAllModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl max-w-md w-full p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-bold text-foreground mb-2">Remove All Students</h3>
              <p className="text-muted-foreground mb-6">
                This will unassign all <strong>{getSectionStudents(showRemoveAllModal.id).length}</strong> student(s) from <strong>{showRemoveAllModal.name}</strong>. Their accounts will remain active but they will no longer be in this section.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowRemoveAllModal(null)}
                  className="px-6 py-3 border border-border rounded-lg hover:bg-gray-50 transition-colors"
                  suppressHydrationWarning
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRemoveAllStudents(showRemoveAllModal)}
                  className="px-6 py-3 text-white rounded-lg transition-all hover:scale-105"
                  style={{ backgroundColor: 'var(--brand-pink-dark)' }}
                  suppressHydrationWarning
                >
                  Yes, Remove All
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* ── Move Student Modal (global, used from expanded section panels) ── */}
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
              <p className="text-muted-foreground mb-6">Select a section to move <strong>{movingStudent.firstName} {movingStudent.lastName}</strong> to</p>

              <div className="space-y-3 mb-6">
                <div className="p-4 bg-gray-50 rounded-lg border border-border">
                  <p className="text-sm text-muted-foreground mb-1">Current Section:</p>
                  <p className="font-bold text-foreground">{sections.find(s => s.id === movingStudent.sectionId)?.name ?? '—'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-3 text-foreground">Move to Section:</label>
                  <div className="space-y-2">
                    {sections
                      .filter(s => s.id !== movingStudent.sectionId)
                      .map((section) => (
                        <button
                          key={section.id}
                          onClick={() => setTargetSectionId(section.id)}
                          className="w-full p-4 rounded-lg border-2 text-left transition-all"
                          style={{
                            borderColor: targetSectionId === section.id ? 'var(--brand-green-dark)' : 'var(--border)',
                            backgroundColor: targetSectionId === section.id ? 'rgba(69,117,88,0.06)' : 'white',
                          }}
                          suppressHydrationWarning
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-bold text-foreground">{section.name}</p>
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
                  suppressHydrationWarning
                >
                  Cancel
                </button>
                <button
                  onClick={handleMoveStudent}
                  disabled={!targetSectionId}
                  className="px-6 py-3 text-white rounded-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  style={{ backgroundColor: 'var(--brand-green-dark)' }}
                  suppressHydrationWarning
                >
                  Move Student
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* ── Edit Student Modal ─────────────────────────────────────────── */}
        {editingStudent && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => setEditingStudent(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl max-w-md w-full p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-bold text-foreground mb-6">Edit Student Information</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-foreground">First Name</label>
                    <input
                      type="text"
                      value={editingStudent.firstName}
                      onChange={(e) => setEditingStudent({ ...editingStudent, firstName: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-border bg-input-background"
                      placeholder="e.g. Maria"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-foreground">Last Name</label>
                    <input
                      type="text"
                      value={editingStudent.lastName}
                      onChange={(e) => setEditingStudent({ ...editingStudent, lastName: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-border bg-input-background"
                      placeholder="e.g. Santos"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">Student ID</label>
                  <input
                    type="text"
                    value={editingStudent.studentId}
                    onChange={(e) => setEditingStudent({ ...editingStudent, studentId: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-input-background"
                    placeholder="NSG-0000-00000"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">Format: NSG-YYYY-NNNNN (e.g., NSG-2024-12345)</p>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    onClick={() => handleUpdateStudent(editingStudent)}
                    className="flex-1 px-4 py-3 text-white rounded-lg transition-all hover:scale-105"
                    style={{ backgroundColor: 'var(--brand-green-dark)' }}
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => setEditingStudent(null)}
                    className="flex-1 px-4 py-3 border border-border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* ── Bulk Assign Modal ─────────────────────────────────────────── */}
        {showBulkAssignModal && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => setShowBulkAssignModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl max-w-lg w-full p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-bold text-foreground mb-2">Assign {selectedUnassignedStudents.length} Students</h3>
              <p className="text-muted-foreground mb-6">Select a target section to assign the selected students to.</p>

              <div className="space-y-2 max-h-[40vh] overflow-y-auto mb-6">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => handleBulkAssignStudents(section.id)}
                    className="w-full p-4 rounded-lg border-2 text-left transition-all hover:border-brand-green-dark"
                    style={{
                      borderColor: 'var(--border)',
                      backgroundColor: 'white',
                    }}
                    suppressHydrationWarning
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-foreground">{section.name}</p>
                        <p className="text-sm text-muted-foreground">Semester: {section.semester}</p>
                      </div>
                      <ArrowRightLeft className="w-5 h-5 text-muted-foreground opacity-20" />
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowBulkAssignModal(false)}
                  className="px-6 py-3 border border-border rounded-lg hover:bg-gray-100 transition-colors"
                  suppressHydrationWarning
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
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
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">First Name</label>
                            <input
                              type="text"
                              value={editingInstructor.firstName}
                              onChange={(e) => setEditingInstructor({ ...editingInstructor, firstName: e.target.value })}
                              className="w-full px-4 py-2 rounded-lg border border-border"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Last Name</label>
                            <input
                              type="text"
                              value={editingInstructor.lastName}
                              onChange={(e) => setEditingInstructor({ ...editingInstructor, lastName: e.target.value })}
                              className="w-full px-4 py-2 rounded-lg border border-border"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">Employee ID</label>
                             <input
                               type="text"
                               name="employeeId"
                               value={editingInstructor.employeeId}
                               onChange={(e) => setEditingInstructor({ ...editingInstructor, employeeId: e.target.value })}
                               className="w-full px-4 py-2 rounded-lg border border-border"
                               placeholder="EMP-0000-0000"
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
                          <h3 className="text-xl font-bold text-foreground mb-2">{instructor.firstName} {instructor.lastName}</h3>
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
                          <button onClick={() => setEditingInstructor(instructor)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                            <Edit2 className="w-5 h-5" style={{ color: 'var(--brand-green-dark)' }} />
                          </button>
                          <button 
                            onClick={() => handleRemoveUser(instructor.id)} 
                            className="p-2 rounded-lg hover:bg-red-50 transition-colors"
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
                          <h3 className="text-xl font-bold text-foreground">{user.firstName} {user.lastName}</h3>
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
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleApprove(user.id)}
                          className="px-4 py-2 text-white rounded-lg flex items-center gap-2 shadow-sm"
                          style={{ backgroundColor: 'var(--brand-green-dark)' }}
                        >
                          <Check className="w-5 h-5" />
                          Approve
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleReject(user.id)}
                          className="px-4 py-2 text-white rounded-lg flex items-center gap-2 shadow-sm"
                          style={{ backgroundColor: 'var(--brand-pink-dark)' }}
                        >
                          <X className="w-5 h-5" />
                          Reject
                        </motion.button>
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
