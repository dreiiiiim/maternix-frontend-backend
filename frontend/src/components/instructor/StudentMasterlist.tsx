'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, ChevronDown, ChevronUp, Mail, Phone, Calendar, CheckCircle, Clock } from 'lucide-react';

type Student = {
  id: number;
  name: string;
  email: string;
  phone: string;
  enrollmentDate: string;
  completedProcedures: number;
  totalProcedures: number;
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
      { id: 1, name: 'Emily Rodriguez', email: 'emily.rodriguez@nursing.edu', phone: '(555) 123-4567', enrollmentDate: 'January 15, 2026', completedProcedures: 2, totalProcedures: 3 },
      { id: 2, name: 'Michael Chen', email: 'michael.chen@nursing.edu', phone: '(555) 234-5678', enrollmentDate: 'January 15, 2026', completedProcedures: 2, totalProcedures: 3 },
      { id: 3, name: 'Sarah Johnson', email: 'sarah.johnson@nursing.edu', phone: '(555) 345-6789', enrollmentDate: 'January 15, 2026', completedProcedures: 1, totalProcedures: 3 },
      { id: 4, name: 'David Kim', email: 'david.kim@nursing.edu', phone: '(555) 456-7890', enrollmentDate: 'January 15, 2026', completedProcedures: 2, totalProcedures: 3 },
      { id: 5, name: 'Jessica Martinez', email: 'jessica.martinez@nursing.edu', phone: '(555) 567-8901', enrollmentDate: 'January 15, 2026', completedProcedures: 1, totalProcedures: 3 },
      { id: 6, name: 'Robert Taylor', email: 'robert.taylor@nursing.edu', phone: '(555) 678-9012', enrollmentDate: 'January 15, 2026', completedProcedures: 2, totalProcedures: 3 },
    ],
  },
  {
    id: 2,
    name: 'BSN 2B',
    semester: 'Spring 2026',
    schedule: 'Tue/Thu 1:00 PM - 5:00 PM',
    studentCount: 5,
    students: [
      { id: 7, name: 'Natalie Anderson', email: 'natalie.anderson@nursing.edu', phone: '(555) 345-6790', enrollmentDate: 'January 15, 2026', completedProcedures: 2, totalProcedures: 3 },
      { id: 8, name: 'Brandon Thomas', email: 'brandon.thomas@nursing.edu', phone: '(555) 456-7891', enrollmentDate: 'January 15, 2026', completedProcedures: 1, totalProcedures: 3 },
      { id: 9, name: 'Olivia Moore', email: 'olivia.moore@nursing.edu', phone: '(555) 567-8902', enrollmentDate: 'January 15, 2026', completedProcedures: 2, totalProcedures: 3 },
      { id: 10, name: 'Ryan Jackson', email: 'ryan.jackson@nursing.edu', phone: '(555) 678-9013', enrollmentDate: 'January 15, 2026', completedProcedures: 1, totalProcedures: 3 },
      { id: 11, name: 'Sophia Martin', email: 'sophia.martin@nursing.edu', phone: '(555) 789-0124', enrollmentDate: 'January 15, 2026', completedProcedures: 2, totalProcedures: 3 },
    ],
  },
  {
    id: 3,
    name: 'BSN 2C',
    semester: 'Spring 2026',
    schedule: 'Fri 8:00 AM - 4:00 PM',
    studentCount: 4,
    students: [
      { id: 12, name: 'Victoria Rodriguez', email: 'victoria.rodriguez@nursing.edu', phone: '(555) 345-6791', enrollmentDate: 'January 15, 2026', completedProcedures: 2, totalProcedures: 3 },
      { id: 13, name: 'Nicholas Lewis', email: 'nicholas.lewis@nursing.edu', phone: '(555) 456-7892', enrollmentDate: 'January 15, 2026', completedProcedures: 1, totalProcedures: 3 },
      { id: 14, name: 'Abigail Walker', email: 'abigail.walker@nursing.edu', phone: '(555) 567-8903', enrollmentDate: 'January 15, 2026', completedProcedures: 2, totalProcedures: 3 },
      { id: 15, name: 'Tyler Hall', email: 'tyler.hall@nursing.edu', phone: '(555) 678-9014', enrollmentDate: 'January 15, 2026', completedProcedures: 1, totalProcedures: 3 },
    ],
  },
];

export function StudentMasterlist() {
  const [expandedSections, setExpandedSections] = useState<number[]>([]);

  const toggleSection = (sectionId: number) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId) ? prev.filter((id) => id !== sectionId) : [...prev, sectionId]
    );
  };

  const totalStudents = classSections.reduce((sum, s) => sum + s.studentCount, 0);

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Student Masterlist</h2>
          <p className="text-muted-foreground">View all students organized by class section</p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { label: 'Total Students', value: totalStudents, icon: Users, color: 'var(--brand-green-dark)' },
            { label: 'Class Sections', value: classSections.length, icon: Users, color: 'var(--brand-pink-dark)' },
            { label: 'Avg. Completion', value: '53%', icon: CheckCircle, color: 'var(--brand-green-medium)' },
          ].map((stat, i) => (
            <div key={i} className="bg-white border border-border rounded-xl p-6">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${stat.color}20` }}
                >
                  <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
                </div>
                <div>
                  <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Class Sections */}
        <div className="space-y-4">
          {classSections.map((section, index) => {
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
                      style={{ backgroundColor: 'rgba(69,117,88,0.12)' }}
                    >
                      <Users className="w-7 h-7" style={{ color: 'var(--brand-green-dark)' }} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-foreground mb-1">{section.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" /> {section.semester}
                        </span>
                        <span>•</span>
                        <span>{section.schedule}</span>
                        <span>•</span>
                        <span className="font-medium text-foreground">{section.studentCount} students</span>
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
                  <div className="border-t border-border">
                    <div className="p-6 bg-gray-50">
                      <div className="grid gap-4">
                        {section.students.map((student) => {
                          const pct = Math.round(
                            (student.completedProcedures / student.totalProcedures) * 100
                          );
                          return (
                            <div
                              key={student.id}
                              className="bg-white border border-border rounded-lg p-5 hover:shadow-md transition-all"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <h4 className="text-lg font-bold text-foreground mb-1">{student.name}</h4>
                                  <div className="space-y-1 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                      <Mail className="w-4 h-4" />
                                      <a href={`mailto:${student.email}`} className="hover:underline" style={{ color: 'var(--brand-green-dark)' }}>
                                        {student.email}
                                      </a>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Phone className="w-4 h-4" /> {student.phone}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Calendar className="w-4 h-4" /> Enrolled: {student.enrollmentDate}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-2xl font-bold mb-1" style={{ color: pct >= 70 ? 'var(--brand-green-dark)' : 'var(--brand-pink-dark)' }}>
                                    {pct}%
                                  </div>
                                  <div className="text-xs text-muted-foreground">Completion</div>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border">
                                <div className="text-center">
                                  <div className="flex items-center justify-center gap-1 mb-1">
                                    <CheckCircle className="w-4 h-4" style={{ color: 'var(--brand-green-dark)' }} />
                                    <span className="font-bold text-foreground">{student.completedProcedures}</span>
                                    <span className="text-muted-foreground">/ {student.totalProcedures}</span>
                                  </div>
                                  <div className="text-xs text-muted-foreground">Procedures</div>
                                </div>
                                <div className="text-center border-l border-border">
                                  <div className="flex items-center justify-center gap-1 mb-1">
                                    <Clock className="w-4 h-4" style={{ color: 'var(--brand-pink-dark)' }} />
                                    <span className="font-bold text-foreground">
                                      {student.totalProcedures - student.completedProcedures}
                                    </span>
                                  </div>
                                  <div className="text-xs text-muted-foreground">Pending</div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
