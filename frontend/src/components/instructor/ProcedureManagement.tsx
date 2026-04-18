'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Lock, Plus, Send, Unlock } from 'lucide-react'
import { StudentEvaluationForm } from './StudentEvaluationForm'
import { createClient } from '@/lib/supabase/client'

type Procedure = {
  id: string
  name: string
  category: string
  description: string
}

type Student = {
  id: string
  studentNo: string
  name: string
  email: string
  phone: string
}

type Section = {
  id: string
  name: string
  students: Student[]
}

type StudentProcedure = {
  id: string
  student_id: string
  procedure_id: string
  status: 'pending' | 'in_progress' | 'completed' | 'evaluated'
  notes: string | null
}

type SectionAccess = {
  procedureId: string
  sectionId: string
  createdAt: string
}

type EvaluationPayload = {
  evaluations?: Record<string, 'performed' | 'not-performed' | null>
  feedback?: string
}

export function ProcedureManagement() {
  const supabase = useMemo(() => createClient(), [])
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [procedures, setProcedures] = useState<Procedure[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [spRows, setSpRows] = useState<StudentProcedure[]>([])
  const [sectionAccess, setSectionAccess] = useState<SectionAccess[]>([])

  const [showAdd, setShowAdd] = useState(false)
  const [newProcedure, setNewProcedure] = useState({
    name: '',
    category: 'Clinical Procedure',
    description: '',
  })

  const [selectedProcedure, setSelectedProcedure] = useState<Procedure | null>(null)
  const [selectedStudent, setSelectedStudent] = useState<{
    student: Student
    procedure: Procedure
  } | null>(null)
  const [noteTarget, setNoteTarget] = useState<{
    student: Student
    procedure: Procedure
  } | null>(null)
  const [noteText, setNoteText] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.access_token) {
      setSections([])
      setProcedures([])
      setSpRows([])
      setSectionAccess([])
      setLoading(false)
      return
    }

    const response = await fetch(`${apiUrl}/instructor/dashboard/procedures`, {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    })

    const payload = await response.json().catch(() => null)

    if (!response.ok) {
      setError(payload?.message ?? 'Failed to load procedure data.')
      setSections([])
      setProcedures([])
      setSpRows([])
      setSectionAccess([])
      setLoading(false)
      return
    }

    setSections((payload?.sections ?? []) as Section[])
    setProcedures((payload?.procedures ?? []) as Procedure[])
    setSpRows((payload?.studentProcedures ?? []) as StudentProcedure[])
    setSectionAccess((payload?.sectionAccess ?? []) as SectionAccess[])
    setLoading(false)
  }, [apiUrl, supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const enabledSectionIds = (procedureId: string) =>
    sectionAccess
      .filter((access) => access.procedureId === procedureId)
      .map((access) => access.sectionId)

  const getSp = (studentId: string, procedureId: string) =>
    spRows.find(
      (row) => row.student_id === studentId && row.procedure_id === procedureId
    )

  const toggleSectionAccess = async (procedureId: string, sectionId: string) => {
    const section = sections.find((s) => s.id === sectionId)
    if (!section || section.students.length === 0) return

    setSaving(true)

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.access_token) {
      setError('You must be logged in to update section access.')
      setSaving(false)
      return
    }

    const response = await fetch(
      `${apiUrl}/instructor/dashboard/procedures/${procedureId}/sections/${sectionId}/toggle`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      }
    )

    const payload = await response.json().catch(() => null)
    if (!response.ok) {
      setError(payload?.message ?? 'Failed to update section access.')
    }

    await fetchData()
    setSaving(false)
  }

  const addProcedure = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.access_token) {
      setError('You must be logged in to add a procedure.')
      setSaving(false)
      return
    }

    const response = await fetch(`${apiUrl}/instructor/dashboard/procedures`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        name: newProcedure.name,
        category: newProcedure.category,
        description: newProcedure.description,
      }),
    })

    const payload = await response.json().catch(() => null)
    if (!response.ok) {
      setError(payload?.message ?? 'Failed to add procedure.')
    }

    setShowAdd(false)
    setNewProcedure({ name: '', category: 'Clinical Procedure', description: '' })
    await fetchData()
    setSaving(false)
  }

  const saveEvaluation = async (payload: unknown) => {
    if (!selectedStudent) return
    const data = (payload ?? {}) as EvaluationPayload

    setSaving(true)

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.access_token) {
      setError('You must be logged in to save an evaluation.')
      setSaving(false)
      return
    }

    const response = await fetch(`${apiUrl}/instructor/dashboard/evaluations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        studentId: selectedStudent.student.id,
        procedureId: selectedStudent.procedure.id,
        evaluations: data.evaluations ?? {},
        feedback: data.feedback ?? '',
      }),
    })

    const responsePayload = await response.json().catch(() => null)
    if (!response.ok) {
      setError(responsePayload?.message ?? 'Failed to save evaluation.')
    }

    setSelectedStudent(null)
    await fetchData()
    setSaving(false)
  }

  const saveNote = async () => {
    if (!noteTarget) return
    setSaving(true)

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.access_token) {
      setError('You must be logged in to save notes.')
      setSaving(false)
      return
    }

    const response = await fetch(
      `${apiUrl}/instructor/dashboard/student-procedures/note`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          studentId: noteTarget.student.id,
          procedureId: noteTarget.procedure.id,
          notes: noteText,
        }),
      }
    )

    const payload = await response.json().catch(() => null)
    if (!response.ok) {
      setError(payload?.message ?? 'Failed to save note.')
    }

    setNoteTarget(null)
    setNoteText('')
    await fetchData()
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="bg-white border border-border rounded-xl p-8 text-center text-muted-foreground">
        Loading procedures...
      </div>
    )
  }

  return (
    <div>
      {selectedStudent && (
        <StudentEvaluationForm
          studentName={selectedStudent.student.name}
          procedureName={selectedStudent.procedure.name}
          onClose={() => setSelectedStudent(null)}
          onSave={saveEvaluation}
        />
      )}

      {noteTarget && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6"
          onClick={() => setNoteTarget(null)}
        >
          <div
            className="bg-white rounded-xl p-6 w-full max-w-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-3">Leave a note</h3>
            <textarea
              className="w-full border border-border rounded-lg p-3 min-h-[140px]"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
            />
            <div className="mt-4 flex gap-2 justify-end">
              <button
                className="px-4 py-2 border rounded-lg"
                onClick={() => setNoteTarget(null)}
                suppressHydrationWarning
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 text-white rounded-lg flex items-center gap-2"
                style={{ backgroundColor: 'var(--brand-pink-dark)' }}
                onClick={saveNote}
                suppressHydrationWarning
              >
                <Send className="w-4 h-4" />
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {error}
        </div>
      )}

      {selectedProcedure ? (
        <div>
          <button
            className="mb-4 flex items-center gap-2"
            onClick={() => setSelectedProcedure(null)}
            suppressHydrationWarning
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <h2 className="text-2xl font-bold mb-2">{selectedProcedure.name}</h2>
          <p className="text-muted-foreground mb-6">{selectedProcedure.description}</p>

          <div className="space-y-4">
            {sections
              .filter((section) =>
                enabledSectionIds(selectedProcedure.id).includes(section.id)
              )
              .map((section) => (
                <div key={section.id} className="bg-white border rounded-xl p-4">
                  <h3 className="font-bold mb-3">{section.name}</h3>
                  <div className="grid gap-3">
                    {section.students.map((student) => {
                      const row = getSp(student.id, selectedProcedure.id)
                      if (!row) return null

                      return (
                        <div key={student.id} className="border rounded-lg p-3">
                          <div className="font-medium">{student.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {student.email} | {student.phone}
                          </div>
                          <div className="text-sm mt-2">
                            Status: <b>{row.status}</b>
                          </div>
                          {row.notes && (
                            <div className="text-sm text-muted-foreground mt-1">
                              Note: {row.notes}
                            </div>
                          )}
                          <div className="mt-2 flex gap-2">
                            <button
                              className="px-3 py-1 border rounded-lg text-sm"
                              onClick={() => {
                                setNoteTarget({ student, procedure: selectedProcedure })
                                setNoteText(row.notes ?? '')
                              }}
                              suppressHydrationWarning
                            >
                              Note
                            </button>
                            <button
                              className="px-3 py-1 rounded-lg text-sm text-white"
                              style={{ backgroundColor: 'var(--brand-green-dark)' }}
                              onClick={() =>
                                setSelectedStudent({
                                  student,
                                  procedure: selectedProcedure,
                                })
                              }
                              suppressHydrationWarning
                            >
                              Evaluate
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
          </div>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold">Procedure Management</h2>
            <button
              className="px-4 py-2 text-white rounded-lg flex items-center gap-2"
              style={{ backgroundColor: 'var(--brand-green-dark)' }}
              onClick={() => setShowAdd((v) => !v)}
              suppressHydrationWarning
            >
              <Plus className="w-4 h-4" />
              Add Procedure
            </button>
          </div>

          {showAdd && (
            <form onSubmit={addProcedure} className="bg-white border rounded-xl p-4 mb-6 space-y-3">
              <input
                className="w-full border rounded-lg p-2"
                placeholder="Procedure name"
                value={newProcedure.name}
                onChange={(e) =>
                  setNewProcedure((v) => ({ ...v, name: e.target.value }))
                }
                required
                suppressHydrationWarning
              />
              <input
                className="w-full border rounded-lg p-2"
                placeholder="Category"
                value={newProcedure.category}
                onChange={(e) =>
                  setNewProcedure((v) => ({ ...v, category: e.target.value }))
                }
                required
                suppressHydrationWarning
              />
              <textarea
                className="w-full border rounded-lg p-2"
                placeholder="Description"
                value={newProcedure.description}
                onChange={(e) =>
                  setNewProcedure((v) => ({ ...v, description: e.target.value }))
                }
                suppressHydrationWarning
              />
              <button
                disabled={saving}
                className="px-4 py-2 text-white rounded-lg"
                style={{ backgroundColor: 'var(--brand-green-dark)' }}
                suppressHydrationWarning
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </form>
          )}

          <div className="space-y-3">
            {procedures.map((procedure) => {
              const enabled = enabledSectionIds(procedure.id)

              return (
                <div key={procedure.id} className="bg-white border rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div
                      onClick={() => setSelectedProcedure(procedure)}
                      className="cursor-pointer"
                    >
                      <h3 className="font-bold">{procedure.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {procedure.category} • {procedure.description}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {sections.map((section) => {
                      const has = enabled.includes(section.id)

                      return (
                        <button
                          key={section.id}
                          disabled={saving}
                          onClick={() => toggleSectionAccess(procedure.id, section.id)}
                          className="px-2 py-1 rounded text-sm flex items-center gap-1"
                          style={{
                            backgroundColor: has ? 'var(--brand-green-dark)' : '#E5E7EB',
                            color: has ? '#fff' : '#333',
                          }}
                          suppressHydrationWarning
                        >
                          {has ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                          {section.name}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}
    </div>
  )
}
