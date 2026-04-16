'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Lock,
  Unlock,
  Plus,
  Link as LinkIcon,
  FileText,
  X,
  Users,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  Clock,
  ArrowLeft,
  Send,
} from 'lucide-react';
import { StudentEvaluationForm } from './StudentEvaluationForm';

type Procedure = {
  id: number;
  name: string;
  category: string;
  description: string;
  allowedSections: number[];
  resources?: {
    type: 'file' | 'link';
    name: string;
    url: string;
  }[];
};

type Student = {
  id: number;
  name: string;
  email: string;
  phone: string;
  enrollmentDate: string;
  completedProcedures: number;
  totalProcedures: number;
  hasCompletedCurrentProcedure?: boolean;
};

type ClassSection = {
  id: number;
  name: string;
  semester: string;
  schedule: string;
  studentCount: number;
  students: Student[];
};

const classSections: ClassSection[] = [
  {
    id: 1,
    name: 'BSN 2A',
    semester: 'Spring 2026',
    schedule: 'Mon/Wed 8:00 AM - 12:00 PM',
    studentCount: 6,
    students: [
      { id: 1, name: 'Emily Rodriguez', email: 'emily.rodriguez@nursing.edu', phone: '(555) 123-4567', enrollmentDate: 'January 15, 2026', completedProcedures: 3, totalProcedures: 3, hasCompletedCurrentProcedure: true },
      { id: 2, name: 'Michael Chen', email: 'michael.chen@nursing.edu', phone: '(555) 234-5678', enrollmentDate: 'January 15, 2026', completedProcedures: 3, totalProcedures: 3, hasCompletedCurrentProcedure: true },
      { id: 3, name: 'Sarah Johnson', email: 'sarah.johnson@nursing.edu', phone: '(555) 345-6789', enrollmentDate: 'January 15, 2026', completedProcedures: 1, totalProcedures: 3, hasCompletedCurrentProcedure: false },
      { id: 4, name: 'David Kim', email: 'david.kim@nursing.edu', phone: '(555) 456-7890', enrollmentDate: 'January 15, 2026', completedProcedures: 2, totalProcedures: 3, hasCompletedCurrentProcedure: true },
      { id: 5, name: 'Jessica Martinez', email: 'jessica.martinez@nursing.edu', phone: '(555) 567-8901', enrollmentDate: 'January 15, 2026', completedProcedures: 3, totalProcedures: 3, hasCompletedCurrentProcedure: true },
      { id: 6, name: 'Robert Taylor', email: 'robert.taylor@nursing.edu', phone: '(555) 678-9012', enrollmentDate: 'January 15, 2026', completedProcedures: 2, totalProcedures: 3, hasCompletedCurrentProcedure: true },
    ],
  },
  {
    id: 2,
    name: 'BSN 2B',
    semester: 'Spring 2026',
    schedule: 'Tue/Thu 1:00 PM - 5:00 PM',
    studentCount: 5,
    students: [
      { id: 7, name: 'Natalie Anderson', email: 'natalie.anderson@nursing.edu', phone: '(555) 345-6790', enrollmentDate: 'January 15, 2026', completedProcedures: 3, totalProcedures: 3, hasCompletedCurrentProcedure: true },
      { id: 8, name: 'Brandon Thomas', email: 'brandon.thomas@nursing.edu', phone: '(555) 456-7891', enrollmentDate: 'January 15, 2026', completedProcedures: 1, totalProcedures: 3, hasCompletedCurrentProcedure: false },
      { id: 9, name: 'Olivia Moore', email: 'olivia.moore@nursing.edu', phone: '(555) 567-8902', enrollmentDate: 'January 15, 2026', completedProcedures: 3, totalProcedures: 3, hasCompletedCurrentProcedure: true },
      { id: 10, name: 'Ryan Jackson', email: 'ryan.jackson@nursing.edu', phone: '(555) 678-9013', enrollmentDate: 'January 15, 2026', completedProcedures: 1, totalProcedures: 3, hasCompletedCurrentProcedure: false },
      { id: 11, name: 'Sophia Martin', email: 'sophia.martin@nursing.edu', phone: '(555) 789-0124', enrollmentDate: 'January 15, 2026', completedProcedures: 3, totalProcedures: 3, hasCompletedCurrentProcedure: true },
    ],
  },
  {
    id: 3,
    name: 'BSN 2C',
    semester: 'Spring 2026',
    schedule: 'Fri 8:00 AM - 4:00 PM',
    studentCount: 4,
    students: [
      { id: 12, name: 'Victoria Rodriguez', email: 'victoria.rodriguez@nursing.edu', phone: '(555) 345-6791', enrollmentDate: 'January 15, 2026', completedProcedures: 3, totalProcedures: 3, hasCompletedCurrentProcedure: true },
      { id: 13, name: 'Nicholas Lewis', email: 'nicholas.lewis@nursing.edu', phone: '(555) 456-7892', enrollmentDate: 'January 15, 2026', completedProcedures: 1, totalProcedures: 3, hasCompletedCurrentProcedure: false },
      { id: 14, name: 'Abigail Walker', email: 'abigail.walker@nursing.edu', phone: '(555) 567-8903', enrollmentDate: 'January 15, 2026', completedProcedures: 3, totalProcedures: 3, hasCompletedCurrentProcedure: true },
      { id: 15, name: 'Tyler Hall', email: 'tyler.hall@nursing.edu', phone: '(555) 678-9014', enrollmentDate: 'January 15, 2026', completedProcedures: 1, totalProcedures: 3, hasCompletedCurrentProcedure: false },
    ],
  },
];

export function ProcedureManagement() {
  const [procedures, setProcedures] = useState<Procedure[]>([
    {
      id: 1,
      name: "Leopold's Maneuver",
      category: 'Clinical Procedure',
      description: 'Abdominal palpation technique to determine fetal position and presentation',
      allowedSections: [1, 2, 3],
      resources: [
        { type: 'file', name: "Leopold's Maneuver Guide.pdf", url: '#' },
        { type: 'link', name: 'Video Tutorial', url: 'https://example.com/video' },
      ],
    },
    {
      id: 2,
      name: 'EINC',
      category: 'Newborn Care',
      description: 'Early and Immediate Newborn Care protocol including skin-to-skin contact and immediate breastfeeding',
      allowedSections: [1, 2, 3],
      resources: [{ type: 'file', name: 'EINC Protocol Guidelines.pdf', url: '#' }],
    },
    {
      id: 3,
      name: 'Labor and Delivery',
      category: 'Clinical Procedure',
      description: 'Assisting and monitoring patients through the stages of labor and delivery',
      allowedSections: [1, 2, 3],
      resources: [
        { type: 'file', name: 'Labor and Delivery Procedures.pdf', url: '#' },
        { type: 'link', name: 'Stages of Labor Reference', url: 'https://example.com/labor' },
      ],
    },
    {
      id: 4,
      name: 'Intramuscular Injection',
      category: 'Medication Administration',
      description: 'Proper technique for administering intramuscular injections including site selection and safety',
      allowedSections: [],
      resources: [],
    },
    {
      id: 5,
      name: 'Intradermal Injection',
      category: 'Medication Administration',
      description: 'Technique for administering intradermal injections for diagnostic testing and immunizations',
      allowedSections: [],
      resources: [],
    },
    {
      id: 6,
      name: 'NICU',
      category: 'Specialized Care',
      description: 'Neonatal Intensive Care Unit procedures including monitoring and care of critically ill newborns',
      allowedSections: [],
      resources: [],
    },
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newProcedure, setNewProcedure] = useState({
    name: '',
    category: 'Assessment',
    description: '',
    allowedSections: [] as number[],
  });
  const [resources, setResources] = useState<{ type: 'file' | 'link'; name: string; url: string }[]>([]);
  const [newResource, setNewResource] = useState({ type: 'link' as 'file' | 'link', name: '', url: '' });
  const [selectedProcedure, setSelectedProcedure] = useState<Procedure | null>(null);
  const [expandedSections, setExpandedSections] = useState<number[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<{ student: Student; procedure: Procedure } | null>(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteStudent, setNoteStudent] = useState<{ student: Student; procedure: Procedure } | null>(null);
  const [noteText, setNoteText] = useState('');
  const [evaluatedStudents, setEvaluatedStudents] = useState<Set<string>>(new Set());

  const toggleSectionAccess = (procedureId: number, sectionId: number) => {
    setProcedures(
      procedures.map((proc) => {
        if (proc.id === procedureId) {
          const hasAccess = proc.allowedSections.includes(sectionId);
          return {
            ...proc,
            allowedSections: hasAccess
              ? proc.allowedSections.filter((id) => id !== sectionId)
              : [...proc.allowedSections, sectionId],
          };
        }
        return proc;
      })
    );
  };

  const handleAddProcedure = (e: React.FormEvent) => {
    e.preventDefault();
    const newProc: Procedure = {
      id: Math.max(...procedures.map((p) => p.id)) + 1,
      ...newProcedure,
      resources,
    };
    setProcedures([...procedures, newProc]);
    setNewProcedure({ name: '', category: 'Assessment', description: '', allowedSections: [] });
    setResources([]);
    setShowAddForm(false);
  };

  const handleAddResource = () => {
    if (newResource.name && newResource.url) {
      setResources([...resources, newResource]);
      setNewResource({ type: 'link', name: '', url: '' });
    }
  };

  const handleRemoveResource = (index: number) => {
    setResources(resources.filter((_, i) => i !== index));
  };

  const toggleSection = (sectionId: number) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId) ? prev.filter((id) => id !== sectionId) : [...prev, sectionId]
    );
  };

  const handleEvaluationSave = (data: unknown) => {
    console.log('Evaluation saved:', data);
    if (selectedStudent) {
      const key = `${selectedStudent.student.id}-${selectedStudent.procedure.id}`;
      setEvaluatedStudents((prev) => new Set(prev).add(key));
      setSelectedStudent(null);
    }
  };

  const handleNoteSubmit = () => {
    if (!noteStudent || !noteText.trim()) return;
    console.log('Note saved:', {
      student: noteStudent.student.name,
      procedure: noteStudent.procedure.name,
      note: noteText,
    });
    setShowNoteModal(false);
    setNoteStudent(null);
    setNoteText('');
  };

  const getStudentCountForProcedure = (procedure: Procedure) => {
    return classSections
      .filter((section) => procedure.allowedSections.includes(section.id))
      .reduce((sum, section) => sum + section.studentCount, 0);
  };

  // Procedure detail view
  if (selectedProcedure) {
    return (
      <div>
        {selectedStudent && (
          <StudentEvaluationForm
            studentName={selectedStudent.student.name}
            procedureName={selectedStudent.procedure.name}
            onClose={() => setSelectedStudent(null)}
            onSave={handleEvaluationSave}
          />
        )}

        {/* Leave a Note Modal */}
        {showNoteModal && noteStudent && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => {
              setShowNoteModal(false);
              setNoteStudent(null);
              setNoteText('');
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl max-w-2xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-8">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <h3 className="text-3xl font-bold text-foreground mb-2">Leave a Note</h3>
                    <p className="text-muted-foreground">
                      Add notes for {noteStudent.student.name} - {noteStudent.procedure.name}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowNoteModal(false);
                      setNoteStudent(null);
                      setNoteText('');
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6 text-muted-foreground" />
                  </button>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2 text-foreground">
                    Instructor Notes
                  </label>
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 min-h-[200px]"
                    style={
                      { '--tw-ring-color': 'var(--brand-green-medium)' } as React.CSSProperties
                    }
                    placeholder="Enter your notes for this student's progress..."
                    autoFocus
                  />
                </div>

                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => {
                      setShowNoteModal(false);
                      setNoteStudent(null);
                      setNoteText('');
                    }}
                    className="px-6 py-3 border border-border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleNoteSubmit}
                    disabled={!noteText.trim()}
                    className="px-6 py-3 text-white rounded-lg transition-all hover:scale-105 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: 'var(--brand-pink-dark)' }}
                  >
                    <Send className="w-5 h-5" />
                    <span>Save Note</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <button
            onClick={() => {
              setSelectedProcedure(null);
              setExpandedSections([]);
            }}
            className="flex items-center gap-2 mb-6 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" style={{ color: 'var(--brand-green-dark)' }} />
            <span className="font-medium text-foreground">Back to Procedures</span>
          </button>

          <div className="mb-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-2">
                  {selectedProcedure.name}
                </h2>
                <p className="text-muted-foreground">{selectedProcedure.description}</p>
                <div className="flex items-center gap-3 mt-3">
                  <span
                    className="px-3 py-1 rounded-full text-sm text-white"
                    style={{ backgroundColor: 'var(--brand-green-dark)' }}
                  >
                    {selectedProcedure.category}
                  </span>
                  <span
                    className="px-3 py-1 rounded-lg text-sm font-medium"
                    style={{
                      backgroundColor: 'var(--brand-green-dark)20',
                      color: 'var(--brand-green-dark)',
                    }}
                  >
                    {selectedProcedure.allowedSections.length} / {classSections.length} sections
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Class Sections */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-foreground mb-4">Students by Class Section</h3>
            {classSections
              .filter((section) => selectedProcedure.allowedSections.includes(section.id))
              .map((section, index) => {
                const isExpanded = expandedSections.includes(section.id);

                return (
                  <motion.div
                    key={section.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="bg-white border-2 border-border rounded-xl overflow-hidden"
                  >
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1 text-left">
                        <div
                          className="w-14 h-14 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: 'var(--brand-green-dark)20' }}
                        >
                          <Users className="w-7 h-7" style={{ color: 'var(--brand-green-dark)' }} />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-foreground mb-1">{section.name}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {section.semester}
                            </span>
                            <span>•</span>
                            <span>{section.schedule}</span>
                            <span>•</span>
                            <span className="font-medium text-foreground">
                              {section.studentCount} students
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="ml-4">
                        {isExpanded ? (
                          <ChevronUp className="w-6 h-6" style={{ color: 'var(--brand-green-dark)' }} />
                        ) : (
                          <ChevronDown className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        transition={{ duration: 0.3 }}
                        className="border-t border-border"
                      >
                        <div className="p-6 bg-gray-50">
                          <div className="grid gap-4">
                            {section.students.map((student) => {
                              const completionPercentage = Math.round(
                                (student.completedProcedures / student.totalProcedures) * 100
                              );
                              const isFullyComplete = completionPercentage === 100;
                              const evaluationKey = `${student.id}-${selectedProcedure.id}`;
                              const isEvaluated = evaluatedStudents.has(evaluationKey);

                              return (
                                <div
                                  key={student.id}
                                  className="bg-white border border-border rounded-lg p-5 hover:shadow-md transition-all"
                                >
                                  <div className="flex items-start justify-between mb-3">
                                    <div>
                                      <h4 className="text-lg font-bold text-foreground mb-1">
                                        {student.name}
                                      </h4>
                                      <div className="space-y-1 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                          <Mail className="w-4 h-4" />
                                          <span style={{ color: 'var(--brand-green-dark)' }}>
                                            {student.email}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Phone className="w-4 h-4" />
                                          {student.phone}
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Calendar className="w-4 h-4" />
                                          Enrolled: {student.enrollmentDate}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div
                                        className="text-2xl font-bold mb-1"
                                        style={{
                                          color:
                                            completionPercentage >= 70
                                              ? 'var(--brand-green-dark)'
                                              : 'var(--brand-pink-dark)',
                                        }}
                                      >
                                        {completionPercentage}%
                                      </div>
                                      <div className="text-xs text-muted-foreground">Completion</div>
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between pt-3 border-t border-border">
                                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                                      {isFullyComplete && !isEvaluated ? (
                                        <>
                                          <CheckCircle className="w-4 h-4" style={{ color: 'var(--brand-green-dark)' }} />
                                          <span>Completed</span>
                                        </>
                                      ) : isEvaluated ? (
                                        <>
                                          <CheckCircle className="w-4 h-4" style={{ color: 'var(--brand-green-dark)' }} />
                                          <span>Evaluated</span>
                                        </>
                                      ) : (
                                        <>
                                          <Clock className="w-4 h-4" style={{ color: 'var(--brand-pink-dark)' }} />
                                          <span>In progress</span>
                                        </>
                                      )}
                                    </div>

                                    {isFullyComplete && !isEvaluated ? (
                                      <div className="flex gap-2">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setNoteStudent({ student, procedure: selectedProcedure });
                                            setShowNoteModal(true);
                                          }}
                                          className="px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all hover:scale-105"
                                          style={{
                                            borderColor: 'var(--brand-green-dark)',
                                            color: 'var(--brand-green-dark)',
                                            backgroundColor: 'white',
                                          }}
                                        >
                                          Leave a Note
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedStudent({ student, procedure: selectedProcedure });
                                          }}
                                          className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:scale-105"
                                          style={{ backgroundColor: 'var(--brand-green-dark)' }}
                                        >
                                          Evaluate
                                        </button>
                                      </div>
                                    ) : isEvaluated ? (
                                      <div
                                        className="px-4 py-2 rounded-lg text-sm font-medium text-white flex items-center gap-2"
                                        style={{ backgroundColor: 'var(--brand-green-dark)' }}
                                      >
                                        <CheckCircle className="w-5 h-5" />
                                        <span>Evaluated</span>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setNoteStudent({ student, procedure: selectedProcedure });
                                          setShowNoteModal(true);
                                        }}
                                        className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:scale-105"
                                        style={{ backgroundColor: 'var(--brand-pink-dark)' }}
                                      >
                                        Leave a Note
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Procedure Management</h2>
            <p className="text-muted-foreground">Control which procedures are available to students</p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-6 py-3 text-white rounded-lg transition-all hover:scale-105 flex items-center gap-2"
            style={{ backgroundColor: 'var(--brand-green-dark)' }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = 'var(--brand-green-medium)')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = 'var(--brand-green-dark)')
            }
          >
            <Plus className="w-5 h-5" />
            <span>Add Procedure</span>
          </button>
        </div>

        {/* Add Procedure Form */}
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-white border border-border rounded-2xl p-6 mb-8"
          >
            <h3 className="text-xl font-bold text-foreground mb-4">Add New Procedure</h3>
            <form onSubmit={handleAddProcedure} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">
                  Procedure Name
                </label>
                <input
                  type="text"
                  value={newProcedure.name}
                  onChange={(e) => setNewProcedure({ ...newProcedure, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2"
                  style={
                    { '--tw-ring-color': 'var(--brand-green-medium)' } as React.CSSProperties
                  }
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Category</label>
                <select
                  value={newProcedure.category}
                  onChange={(e) => setNewProcedure({ ...newProcedure, category: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2"
                  style={
                    { '--tw-ring-color': 'var(--brand-green-medium)' } as React.CSSProperties
                  }
                >
                  <option value="Assessment">Assessment</option>
                  <option value="Clinical Procedure">Clinical Procedure</option>
                  <option value="Patient Education">Patient Education</option>
                  <option value="Newborn Care">Newborn Care</option>
                  <option value="Medication Administration">Medication Administration</option>
                  <option value="Specialized Care">Specialized Care</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Description</label>
                <textarea
                  value={newProcedure.description}
                  onChange={(e) =>
                    setNewProcedure({ ...newProcedure, description: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2"
                  style={
                    { '--tw-ring-color': 'var(--brand-green-medium)' } as React.CSSProperties
                  }
                  rows={3}
                  required
                />
              </div>

              <div className="border-t border-border pt-4">
                <label className="block text-sm font-medium mb-3 text-foreground">
                  Select Class Sections
                </label>
                <div className="space-y-2">
                  {classSections.map((section) => (
                    <div key={section.id} className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={newProcedure.allowedSections.includes(section.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewProcedure({
                              ...newProcedure,
                              allowedSections: [...newProcedure.allowedSections, section.id],
                            });
                          } else {
                            setNewProcedure({
                              ...newProcedure,
                              allowedSections: newProcedure.allowedSections.filter(
                                (id) => id !== section.id
                              ),
                            });
                          }
                        }}
                        className="w-4 h-4 rounded"
                        style={{ accentColor: 'var(--brand-green-dark)' }}
                      />
                      <span className="text-sm text-foreground">{section.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({section.studentCount} students)
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resources Section */}
              <div className="border-t border-border pt-4">
                <label className="block text-sm font-medium mb-3 text-foreground">
                  Attach Resources (Files or Links)
                </label>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <select
                      value={newResource.type}
                      onChange={(e) =>
                        setNewResource({ ...newResource, type: e.target.value as 'file' | 'link' })
                      }
                      className="px-3 py-2 rounded-lg border border-border bg-input-background"
                    >
                      <option value="link">Link</option>
                      <option value="file">File</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Resource name"
                      value={newResource.name}
                      onChange={(e) => setNewResource({ ...newResource, name: e.target.value })}
                      className="flex-1 px-3 py-2 rounded-lg border border-border bg-input-background"
                    />
                    <input
                      type="text"
                      placeholder={newResource.type === 'link' ? 'https://...' : 'File path'}
                      value={newResource.url}
                      onChange={(e) => setNewResource({ ...newResource, url: e.target.value })}
                      className="flex-1 px-3 py-2 rounded-lg border border-border bg-input-background"
                    />
                    <button
                      type="button"
                      onClick={handleAddResource}
                      className="px-4 py-2 rounded-lg text-white"
                      style={{ backgroundColor: 'var(--brand-green-dark)' }}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {resources.length > 0 && (
                    <div className="space-y-2">
                      {resources.map((resource, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 rounded-lg border border-border bg-gray-50"
                        >
                          {resource.type === 'file' ? (
                            <FileText
                              className="w-4 h-4"
                              style={{ color: 'var(--brand-pink-dark)' }}
                            />
                          ) : (
                            <LinkIcon
                              className="w-4 h-4"
                              style={{ color: 'var(--brand-green-dark)' }}
                            />
                          )}
                          <div className="flex-1">
                            <div className="text-sm font-medium text-foreground">{resource.name}</div>
                            <div className="text-xs text-muted-foreground truncate">{resource.url}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveResource(index)}
                            className="p-1 hover:bg-gray-200 rounded"
                          >
                            <X className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-6 py-2 text-white rounded-lg transition-all"
                  style={{ backgroundColor: 'var(--brand-green-dark)' }}
                >
                  Add Procedure
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setResources([]);
                  }}
                  className="px-6 py-2 border border-border rounded-lg transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* All Procedures */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5" style={{ color: 'var(--brand-green-dark)' }} />
            <h3 className="text-xl font-bold text-foreground">
              All Procedures ({procedures.length})
            </h3>
          </div>
          <div className="space-y-4">
            {procedures.map((procedure, index) => {
              const studentCount = getStudentCountForProcedure(procedure);
              const hasAnyAccess = procedure.allowedSections.length > 0;

              return (
                <motion.div
                  key={procedure.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="bg-white border-2 border-border rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer"
                  style={{
                    borderLeftWidth: '6px',
                    borderLeftColor: hasAnyAccess ? 'var(--brand-green-dark)' : '#9CA3AF',
                  }}
                  onClick={() => setSelectedProcedure(procedure)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-bold text-foreground">{procedure.name}</h4>
                        <span
                          className="px-3 py-1 rounded-full text-xs text-white"
                          style={{ backgroundColor: 'var(--brand-green-medium)' }}
                        >
                          {procedure.category}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{procedure.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">{studentCount} students</span>
                        <span>•</span>
                        <span>
                          {procedure.allowedSections.length} / {classSections.length} sections
                        </span>
                        {procedure.resources && procedure.resources.length > 0 && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              {procedure.resources.length} resource
                              {procedure.resources.length > 1 ? 's' : ''}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Section Toggle Buttons */}
                  <div className="border-t border-border pt-4">
                    <div className="text-xs font-medium text-muted-foreground mb-2">
                      Class Sections:
                    </div>
                    <div className="flex gap-2">
                      {classSections.map((section) => {
                        const hasAccess = procedure.allowedSections.includes(section.id);
                        return (
                          <button
                            key={section.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSectionAccess(procedure.id, section.id);
                            }}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm"
                            style={{
                              backgroundColor: hasAccess ? 'var(--brand-green-dark)' : '#E5E7EB',
                              color: hasAccess ? 'white' : '#6B7280',
                            }}
                          >
                            {hasAccess ? (
                              <Unlock className="w-4 h-4" />
                            ) : (
                              <Lock className="w-4 h-4" />
                            )}
                            <span>{section.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
