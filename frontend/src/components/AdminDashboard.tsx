'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Users, BookOpen, UserCheck, UserPlus, Settings, LogOut, Plus, Edit2, Trash2, Check, X, ArrowLeft, ArrowRightLeft } from 'lucide-react';
import Image from 'next/image';

type Section = {
  id: number;
  name: string;
  semester: string;
  schedule: string;
  instructor: string | null;
  studentCount: number;
};

type Student = {
  id: number;
  name: string;
  email: string;
  studentId: string;
  sectionId: number;
};

type Instructor = {
  id: number;
  name: string;
  email: string;
  specialization: string;
  assignedSections: number[];
};

type PendingUser = {
  id: number;
  name: string;
  email: string;
  role: 'instructor' | 'student';
  requestedDate: string;
  section?: string;
};

export function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'sections' | 'instructors' | 'approvals'>('sections');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showAddSection, setShowAddSection] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showAddInstructor, setShowAddInstructor] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState<Instructor | null>(null);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [movingStudent, setMovingStudent] = useState<Student | null>(null);
  const [targetSectionId, setTargetSectionId] = useState<number | null>(null);

  const [sections, setSections] = useState<Section[]>([
    { id: 1, name: 'BSN 2A', semester: 'Spring 2026', schedule: 'Mon/Wed 8:00 AM - 12:00 PM', instructor: 'Dr. Sarah Mitchell', studentCount: 6 },
    { id: 2, name: 'BSN 2B', semester: 'Spring 2026', schedule: 'Tue/Thu 1:00 PM - 5:00 PM', instructor: 'Prof. Jennifer Lopez', studentCount: 5 },
    { id: 3, name: 'BSN 2C', semester: 'Spring 2026', schedule: 'Fri 8:00 AM - 4:00 PM', instructor: null, studentCount: 4 }
  ]);

  const [students, setStudents] = useState<Student[]>([
    { id: 1, name: 'Maria Rodriguez', email: 'maria.rodriguez@nursing.edu', studentId: 'NSG-2024-001', sectionId: 1 },
    { id: 2, name: 'James Chen', email: 'james.chen@nursing.edu', studentId: 'NSG-2024-002', sectionId: 1 },
    { id: 3, name: 'Sarah Thompson', email: 'sarah.thompson@nursing.edu', studentId: 'NSG-2024-003', sectionId: 1 },
    { id: 4, name: 'David Kim', email: 'david.kim@nursing.edu', studentId: 'NSG-2024-004', sectionId: 1 },
    { id: 5, name: 'Emily Martinez', email: 'emily.martinez@nursing.edu', studentId: 'NSG-2024-005', sectionId: 1 },
    { id: 6, name: 'Michael Johnson', email: 'michael.johnson@nursing.edu', studentId: 'NSG-2024-006', sectionId: 1 },
    { id: 7, name: 'Lisa Anderson', email: 'lisa.anderson@nursing.edu', studentId: 'NSG-2024-007', sectionId: 2 },
    { id: 8, name: 'Robert Taylor', email: 'robert.taylor@nursing.edu', studentId: 'NSG-2024-008', sectionId: 2 },
    { id: 9, name: 'Jennifer White', email: 'jennifer.white@nursing.edu', studentId: 'NSG-2024-009', sectionId: 2 },
    { id: 10, name: 'Christopher Lee', email: 'christopher.lee@nursing.edu', studentId: 'NSG-2024-010', sectionId: 2 },
    { id: 11, name: 'Amanda Garcia', email: 'amanda.garcia@nursing.edu', studentId: 'NSG-2024-011', sectionId: 2 },
    { id: 12, name: 'Daniel Brown', email: 'daniel.brown@nursing.edu', studentId: 'NSG-2024-012', sectionId: 3 },
    { id: 13, name: 'Jessica Davis', email: 'jessica.davis@nursing.edu', studentId: 'NSG-2024-013', sectionId: 3 },
    { id: 14, name: 'Matthew Wilson', email: 'matthew.wilson@nursing.edu', studentId: 'NSG-2024-014', sectionId: 3 },
    { id: 15, name: 'Ashley Miller', email: 'ashley.miller@nursing.edu', studentId: 'NSG-2024-015', sectionId: 3 }
  ]);

  const [instructors, setInstructors] = useState<Instructor[]>([
    { id: 1, name: 'Dr. Sarah Mitchell', email: 'sarah.mitchell@nursing.edu', specialization: 'Maternal Health', assignedSections: [1] },
    { id: 2, name: 'Prof. Jennifer Lopez', email: 'jennifer.lopez@nursing.edu', specialization: 'Pediatric Care', assignedSections: [2] }
  ]);

  const [pendingApprovals, setPendingApprovals] = useState<PendingUser[]>([
    { id: 1, name: 'Dr. Maria Santos', email: 'maria.santos@nursing.edu', role: 'instructor', requestedDate: 'April 10, 2026' },
    { id: 2, name: 'John Smith', email: 'john.smith@nursing.edu', role: 'student', requestedDate: 'April 12, 2026', section: 'BSN 2A' },
    { id: 3, name: 'Emma Wilson', email: 'emma.wilson@nursing.edu', role: 'student', requestedDate: 'April 13, 2026', section: 'BSN 2B' },
    { id: 4, name: 'Dr. Robert Chen', email: 'robert.chen@nursing.edu', role: 'instructor', requestedDate: 'April 14, 2026' }
  ]);

  const [newSection, setNewSection] = useState({
    name: '',
    semester: 'Spring 2026',
    schedule: '',
    instructor: ''
  });

  const [newStudent, setNewStudent] = useState({
    name: '',
    email: '',
    studentId: ''
  });

  const [newInstructor, setNewInstructor] = useState({
    name: '',
    email: '',
    specialization: ''
  });

  const handleLogout = () => {
    console.log('Logging out...');
    router.push('/');
  };

  const handleAddSection = (e: React.FormEvent) => {
    e.preventDefault();
    const section: Section = {
      id: Math.max(...sections.map(s => s.id)) + 1,
      name: newSection.name,
      semester: newSection.semester,
      schedule: newSection.schedule,
      instructor: newSection.instructor || null,
      studentCount: 0
    };
    setSections([...sections, section]);
    setNewSection({ name: '', semester: 'Spring 2026', schedule: '', instructor: '' });
    setShowAddSection(false);
  };

  const handleDeleteSection = (id: number) => {
    if (confirm('Are you sure you want to delete this section?')) {
      setSections(sections.filter(s => s.id !== id));
    }
  };

  const handleUpdateSection = (section: Section) => {
    setSections(sections.map(s => s.id === section.id ? section : s));
    setEditingSection(null);
  };

  const handleApprove = (userId: number) => {
    const user = pendingApprovals.find(u => u.id === userId);
    if (!user) return;

    if (user.role === 'student' && user.section) {
      // Find the section ID by name
      const section = sections.find(s => s.name === user.section);
      if (section) {
        // Add student to students array
        const newStudentEntry: Student = {
          id: Math.max(...students.map(s => s.id), 0) + 1,
          name: user.name,
          email: user.email,
          studentId: `NSG-2026-${String(Math.max(...students.map(s => s.id), 0) + 1).padStart(3, '0')}`,
          sectionId: section.id
        };
        setStudents([...students, newStudentEntry]);

        // Update section student count
        setSections(sections.map(s =>
          s.id === section.id ? { ...s, studentCount: s.studentCount + 1 } : s
        ));
      }
    } else if (user.role === 'instructor') {
      // Add instructor to instructors array
      const newInstructorEntry: Instructor = {
        id: Math.max(...instructors.map(i => i.id), 0) + 1,
        name: user.name,
        email: user.email,
        specialization: 'Maternal Health',
        assignedSections: []
      };
      setInstructors([...instructors, newInstructorEntry]);
    }

    // Remove from pending approvals
    setPendingApprovals(pendingApprovals.filter(u => u.id !== userId));
  };

  const handleReject = (userId: number) => {
    setPendingApprovals(pendingApprovals.filter(u => u.id !== userId));
  };

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSection) return;

    const student: Student = {
      id: Math.max(...students.map(s => s.id), 0) + 1,
      name: newStudent.name,
      email: newStudent.email,
      studentId: newStudent.studentId,
      sectionId: selectedSection.id
    };

    setStudents([...students, student]);
    setSections(sections.map(s =>
      s.id === selectedSection.id ? { ...s, studentCount: s.studentCount + 1 } : s
    ));
    setNewStudent({ name: '', email: '', studentId: '' });
    setShowAddStudent(false);
  };

  const handleRemoveStudent = (studentId: number) => {
    if (confirm('Are you sure you want to remove this student?')) {
      const student = students.find(s => s.id === studentId);
      if (student) {
        setStudents(students.filter(s => s.id !== studentId));
        setSections(sections.map(s =>
          s.id === student.sectionId ? { ...s, studentCount: s.studentCount - 1 } : s
        ));
      }
    }
  };

  const getSectionStudents = (sectionId: number) => {
    return students.filter(s => s.sectionId === sectionId);
  };

  const handleAddInstructor = (e: React.FormEvent) => {
    e.preventDefault();
    const instructor: Instructor = {
      id: Math.max(...instructors.map(i => i.id), 0) + 1,
      name: newInstructor.name,
      email: newInstructor.email,
      specialization: newInstructor.specialization,
      assignedSections: []
    };
    setInstructors([...instructors, instructor]);
    setNewInstructor({ name: '', email: '', specialization: '' });
    setShowAddInstructor(false);
  };

  const handleUpdateInstructor = (instructor: Instructor) => {
    setInstructors(instructors.map(i => i.id === instructor.id ? instructor : i));
    setEditingInstructor(null);
  };

  const handleDeleteInstructor = (id: number) => {
    if (confirm('Are you sure you want to delete this instructor?')) {
      const instructor = instructors.find(i => i.id === id);
      if (instructor) {
        instructor.assignedSections.forEach(sectionId => {
          setSections(sections.map(s =>
            s.id === sectionId ? { ...s, instructor: null } : s
          ));
        });
      }
      setInstructors(instructors.filter(i => i.id !== id));
    }
  };

  const handleMoveStudent = () => {
    if (!movingStudent || !targetSectionId) return;

    // Update student's section
    setStudents(students.map(s =>
      s.id === movingStudent.id ? { ...s, sectionId: targetSectionId } : s
    ));

    // Update student counts for both sections
    setSections(sections.map(s => {
      if (s.id === movingStudent.sectionId) {
        return { ...s, studentCount: s.studentCount - 1 };
      } else if (s.id === targetSectionId) {
        return { ...s, studentCount: s.studentCount + 1 };
      }
      return s;
    }));

    // Close modal and reset
    setShowMoveModal(false);
    setMovingStudent(null);
    setTargetSectionId(null);
  };

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
          <h1 className="text-5xl font-bold text-foreground mb-3">
            Admin Dashboard
          </h1>
          <p className="text-xl text-muted-foreground">
            Manage sections, instructors, and user approvals
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-white border border-border rounded-2xl p-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--brand-green-dark)20' }}>
                <BookOpen className="w-6 h-6" style={{ color: 'var(--brand-green-dark)' }} />
              </div>
              <div>
                <div className="text-3xl font-bold text-foreground">{sections.length}</div>
                <div className="text-sm text-muted-foreground">Total Sections</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white border border-border rounded-2xl p-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--brand-green-medium)20' }}>
                <UserCheck className="w-6 h-6" style={{ color: 'var(--brand-green-medium)' }} />
              </div>
              <div>
                <div className="text-3xl font-bold text-foreground">{instructors.length}</div>
                <div className="text-sm text-muted-foreground">Total Instructors</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white border border-border rounded-2xl p-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--brand-pink-dark)20' }}>
                <Users className="w-6 h-6" style={{ color: 'var(--brand-pink-dark)' }} />
              </div>
              <div>
                <div className="text-3xl font-bold text-foreground">{sections.reduce((sum, s) => sum + s.studentCount, 0)}</div>
                <div className="text-sm text-muted-foreground">Total Students</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white border border-border rounded-2xl p-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--brand-pink-medium)20' }}>
                <UserCheck className="w-6 h-6" style={{ color: 'var(--brand-pink-medium)' }} />
              </div>
              <div>
                <div className="text-3xl font-bold text-foreground">{pendingApprovals.length}</div>
                <div className="text-sm text-muted-foreground">Pending Approvals</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('sections')}
            className="px-6 py-3 rounded-lg font-medium transition-all"
            style={{
              backgroundColor: activeTab === 'sections' ? 'var(--brand-green-dark)' : 'transparent',
              color: activeTab === 'sections' ? 'white' : 'var(--foreground)',
              border: activeTab === 'sections' ? 'none' : '1px solid var(--border)'
            }}
          >
            Section Management
          </button>
          <button
            onClick={() => setActiveTab('instructors')}
            className="px-6 py-3 rounded-lg font-medium transition-all"
            style={{
              backgroundColor: activeTab === 'instructors' ? 'var(--brand-green-dark)' : 'transparent',
              color: activeTab === 'instructors' ? 'white' : 'var(--foreground)',
              border: activeTab === 'instructors' ? 'none' : '1px solid var(--border)'
            }}
          >
            Instructor Management
          </button>
          <button
            onClick={() => setActiveTab('approvals')}
            className="px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2"
            style={{
              backgroundColor: activeTab === 'approvals' ? 'var(--brand-green-dark)' : 'transparent',
              color: activeTab === 'approvals' ? 'white' : 'var(--foreground)',
              border: activeTab === 'approvals' ? 'none' : '1px solid var(--border)'
            }}
          >
            User Approvals
            {pendingApprovals.length > 0 && (
              <span className="px-2 py-1 rounded-full text-xs bg-red-500 text-white">
                {pendingApprovals.length}
              </span>
            )}
          </button>
        </div>

        {/* Section Management Tab */}
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
                        placeholder="e.g., Mon/Wed 8:00 AM - 12:00 PM"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-foreground">Instructor (Optional)</label>
                      <input
                        type="text"
                        value={newSection.instructor}
                        onChange={(e) => setNewSection({ ...newSection, instructor: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-border bg-input-background"
                        placeholder="e.g., Dr. John Doe"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="px-6 py-2 text-white rounded-lg"
                      style={{ backgroundColor: 'var(--brand-green-dark)' }}
                    >
                      Add Section
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddSection(false)}
                      className="px-6 py-2 border border-border rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Sections List */}
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
                          <input
                            type="text"
                            value={editingSection.instructor || ''}
                            onChange={(e) => setEditingSection({ ...editingSection, instructor: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-border"
                            placeholder="No instructor assigned"
                          />
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
                        <button
                          onClick={() => setEditingSection(null)}
                          className="px-4 py-2 border border-border rounded-lg"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => setSelectedSection(section)}
                      >
                        <h3 className="text-xl font-bold text-foreground mb-2 hover:underline">{section.name}</h3>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>Schedule: {section.schedule}</p>
                          <p>Instructor: {section.instructor || 'Not assigned'}</p>
                          <p>Students: {section.studentCount}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingSection(section);
                          }}
                          className="p-2 rounded-lg hover:bg-gray-100"
                        >
                          <Edit2 className="w-5 h-5" style={{ color: 'var(--brand-green-dark)' }} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSection(section.id);
                          }}
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
          </motion.div>
        )}

        {/* Student Management View */}
        {activeTab === 'sections' && selectedSection && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <button
              onClick={() => {
                setSelectedSection(null);
                setShowAddStudent(false);
              }}
              className="inline-flex items-center gap-2 mb-6 text-sm transition-colors"
              style={{ color: 'var(--brand-green-dark)' }}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Sections
            </button>

            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">{selectedSection.name} - Students</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedSection.schedule} • Instructor: {selectedSection.instructor || 'Not assigned'}
                </p>
              </div>
              <button
                onClick={() => setShowAddStudent(!showAddStudent)}
                className="px-6 py-3 text-white rounded-lg transition-all hover:scale-105 flex items-center gap-2"
                style={{ backgroundColor: 'var(--brand-green-dark)' }}
              >
                <UserPlus className="w-5 h-5" />
                Add Student
              </button>
            </div>

            {/* Add Student Form */}
            {showAddStudent && (
              <div className="bg-white border border-border rounded-xl p-6 mb-6">
                <h3 className="text-xl font-bold text-foreground mb-4">Add New Student</h3>
                <form onSubmit={handleAddStudent} className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-foreground">Student Name</label>
                      <input
                        type="text"
                        value={newStudent.name}
                        onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-border bg-input-background"
                        placeholder="e.g., John Doe"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-foreground">Email</label>
                      <input
                        type="email"
                        value={newStudent.email}
                        onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-border bg-input-background"
                        placeholder="e.g., john.doe@nursing.edu"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-foreground">Student ID</label>
                      <input
                        type="text"
                        value={newStudent.studentId}
                        onChange={(e) => setNewStudent({ ...newStudent, studentId: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-border bg-input-background"
                        placeholder="e.g., NSG-2024-001"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="px-6 py-2 text-white rounded-lg"
                      style={{ backgroundColor: 'var(--brand-green-dark)' }}
                    >
                      Add Student
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddStudent(false)}
                      className="px-6 py-2 border border-border rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Students List */}
            <div className="space-y-4">
              {getSectionStudents(selectedSection.id).length === 0 ? (
                <div className="bg-white border border-border rounded-xl p-12 text-center">
                  <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg text-muted-foreground">No students in this section</p>
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
                          onClick={() => handleRemoveStudent(student.id)}
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
                onClick={() => {
                  setShowMoveModal(false);
                  setMovingStudent(null);
                  setTargetSectionId(null);
                }}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white rounded-2xl max-w-lg w-full p-8"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 className="text-2xl font-bold text-foreground mb-2">
                    Move Student to Another Section
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Select a section to move {movingStudent.name} to
                  </p>

                  <div className="space-y-3 mb-6">
                    <div className="p-4 bg-gray-50 rounded-lg border border-border">
                      <p className="text-sm text-muted-foreground mb-1">Current Section:</p>
                      <p className="font-bold text-foreground">{sections.find(s => s.id === movingStudent.sectionId)?.name}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-3 text-foreground">
                        Move to Section:
                      </label>
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
                                backgroundColor: targetSectionId === section.id ? 'var(--brand-green-dark)10' : 'white'
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
                      onClick={() => {
                        setShowMoveModal(false);
                        setMovingStudent(null);
                        setTargetSectionId(null);
                      }}
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

        {/* Instructor Management Tab */}
        {activeTab === 'instructors' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">Manage Instructors</h2>
              <button
                onClick={() => setShowAddInstructor(!showAddInstructor)}
                className="px-6 py-3 text-white rounded-lg transition-all hover:scale-105 flex items-center gap-2"
                style={{ backgroundColor: 'var(--brand-green-dark)' }}
              >
                <UserPlus className="w-5 h-5" />
                Add Instructor
              </button>
            </div>

            {/* Add Instructor Form */}
            {showAddInstructor && (
              <div className="bg-white border border-border rounded-xl p-6 mb-6">
                <h3 className="text-xl font-bold text-foreground mb-4">Add New Instructor</h3>
                <form onSubmit={handleAddInstructor} className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-foreground">Instructor Name</label>
                      <input
                        type="text"
                        value={newInstructor.name}
                        onChange={(e) => setNewInstructor({ ...newInstructor, name: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-border bg-input-background"
                        placeholder="e.g., Dr. Jane Smith"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-foreground">Email</label>
                      <input
                        type="email"
                        value={newInstructor.email}
                        onChange={(e) => setNewInstructor({ ...newInstructor, email: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-border bg-input-background"
                        placeholder="e.g., jane.smith@nursing.edu"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-foreground">Specialization</label>
                      <input
                        type="text"
                        value={newInstructor.specialization}
                        onChange={(e) => setNewInstructor({ ...newInstructor, specialization: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-border bg-input-background"
                        placeholder="e.g., Maternal Health"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="px-6 py-2 text-white rounded-lg"
                      style={{ backgroundColor: 'var(--brand-green-dark)' }}
                    >
                      Add Instructor
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddInstructor(false)}
                      className="px-6 py-2 border border-border rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Instructors List */}
            <div className="space-y-4">
              {instructors.length === 0 ? (
                <div className="bg-white border border-border rounded-xl p-12 text-center">
                  <UserCheck className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg text-muted-foreground">No instructors added yet</p>
                </div>
              ) : (
                instructors.map((instructor) => (
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
                            <label className="block text-sm font-medium mb-2">Email</label>
                            <input
                              type="email"
                              value={editingInstructor.email}
                              onChange={(e) => setEditingInstructor({ ...editingInstructor, email: e.target.value })}
                              className="w-full px-4 py-2 rounded-lg border border-border"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Specialization</label>
                            <input
                              type="text"
                              value={editingInstructor.specialization}
                              onChange={(e) => setEditingInstructor({ ...editingInstructor, specialization: e.target.value })}
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
                          <button
                            onClick={() => setEditingInstructor(null)}
                            className="px-4 py-2 border border-border rounded-lg"
                          >
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
                            <p>Specialization: {instructor.specialization}</p>
                            <p>Assigned Sections: {instructor.assignedSections.length > 0
                              ? instructor.assignedSections.map(sId => sections.find(s => s.id === sId)?.name).filter(Boolean).join(', ')
                              : 'None'}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingInstructor(instructor)}
                            className="p-2 rounded-lg hover:bg-gray-100"
                          >
                            <Edit2 className="w-5 h-5" style={{ color: 'var(--brand-green-dark)' }} />
                          </button>
                          <button
                            onClick={() => handleDeleteInstructor(instructor.id)}
                            className="p-2 rounded-lg hover:bg-gray-100"
                          >
                            <Trash2 className="w-5 h-5" style={{ color: 'var(--brand-pink-dark)' }} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}

        {/* User Approvals Tab */}
        {activeTab === 'approvals' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl font-bold text-foreground mb-6">Pending User Approvals</h2>

            {pendingApprovals.length === 0 ? (
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
                              backgroundColor: user.role === 'instructor' ? 'var(--brand-green-dark)' : 'var(--brand-pink-dark)'
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
