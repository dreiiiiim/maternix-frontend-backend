'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  Clock,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type StudentRecord = {
  id: string
  studentNo: string
  name: string
  email: string
  phone: string
  completedProcedures: number
  totalProcedures: number
}

type SectionRecord = {
  id: string
  name: string
  semester: string
  schedule: string
  students: StudentRecord[]
}

export function StudentMasterlist() {
  const supabase = useMemo(() => createClient(), [])
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

  const [expandedSections, setExpandedSections] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sections, setSections] = useState<SectionRecord[]>([])

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId) ? prev.filter((id) => id !== sectionId) : [...prev, sectionId]
    )
  }

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session?.access_token) {
      setSections([])
      setLoading(false)
      return
    }

    const response = await fetch(`${apiUrl}/instructor/dashboard/masterlist`, {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    })

    const payload = await response.json().catch(() => null)

    if (!response.ok) {
      setError(payload?.message ?? 'Failed to load student masterlist.')
      setSections([])
      setLoading(false)
      return
    }

    setSections((payload?.sections ?? []) as SectionRecord[])
    setLoading(false)
  }, [apiUrl, supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const totalStudents = sections.reduce((sum, section) => sum + section.students.length, 0)
  const allCompletionRatios = sections
    .flatMap((section) => section.students)
    .map((student) =>
      student.totalProcedures > 0
        ? (student.completedProcedures / student.totalProcedures) * 100
        : 0
    )
  const avgCompletion = allCompletionRatios.length
    ? Math.round(
        allCompletionRatios.reduce((sum, value) => sum + value, 0) /
          allCompletionRatios.length
      )
    : 0

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Student Masterlist</h2>
          <p className="text-muted-foreground">View students across all sections</p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            {
              label: 'Total Students',
              value: totalStudents,
              icon: Users,
              color: 'var(--brand-green-dark)',
            },
            {
              label: 'Class Sections',
              value: sections.length,
              icon: Users,
              color: 'var(--brand-pink-dark)',
            },
            {
              label: 'Avg. Completion',
              value: `${avgCompletion}%`,
              icon: CheckCircle,
              color: 'var(--brand-green-medium)',
            },
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

        {loading ? (
          <div className="bg-white border border-border rounded-xl p-8 text-center text-muted-foreground">
            Loading student masterlist...
          </div>
        ) : sections.length === 0 ? (
          <div className="bg-white border border-border rounded-xl p-8 text-center text-muted-foreground">
            No sections available yet.
          </div>
        ) : (
          <div className="space-y-4">
            {sections.map((section, index) => {
              const isExpanded = expandedSections.includes(section.id)
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
                    suppressHydrationWarning
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
                          <span className="font-medium text-foreground">
                            {section.students.length} students
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4">
                      {isExpanded ? (
                        <ChevronUp
                          className="w-6 h-6"
                          style={{ color: 'var(--brand-green-dark)' }}
                        />
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
                            const pct =
                              student.totalProcedures > 0
                                ? Math.round(
                                    (student.completedProcedures /
                                      student.totalProcedures) *
                                      100
                                  )
                                : 0

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
                                        <a
                                          href={`mailto:${student.email}`}
                                          className="hover:underline"
                                          style={{ color: 'var(--brand-green-dark)' }}
                                        >
                                          {student.email}
                                        </a>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Phone className="w-4 h-4" /> {student.phone}
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4" /> Student No:{' '}
                                        {student.studentNo}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div
                                      className="text-2xl font-bold mb-1"
                                      style={{
                                        color:
                                          pct >= 70
                                            ? 'var(--brand-green-dark)'
                                            : 'var(--brand-pink-dark)',
                                      }}
                                    >
                                      {pct}%
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      Completion
                                    </div>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border">
                                  <div className="text-center">
                                    <div className="flex items-center justify-center gap-1 mb-1">
                                      <CheckCircle
                                        className="w-4 h-4"
                                        style={{ color: 'var(--brand-green-dark)' }}
                                      />
                                      <span className="font-bold text-foreground">
                                        {student.completedProcedures}
                                      </span>
                                      <span className="text-muted-foreground">
                                        / {student.totalProcedures}
                                      </span>
                                    </div>
                                    <div className="text-xs text-muted-foreground">Procedures</div>
                                  </div>
                                  <div className="text-center border-l border-border">
                                    <div className="flex items-center justify-center gap-1 mb-1">
                                      <Clock
                                        className="w-4 h-4"
                                        style={{ color: 'var(--brand-pink-dark)' }}
                                      />
                                      <span className="font-bold text-foreground">
                                        {Math.max(
                                          student.totalProcedures -
                                            student.completedProcedures,
                                          0
                                        )}
                                      </span>
                                    </div>
                                    <div className="text-xs text-muted-foreground">Pending</div>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}
      </motion.div>
    </div>
  )
}
