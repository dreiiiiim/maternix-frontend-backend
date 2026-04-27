'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Edit2, Lock, Send, Unlock } from 'lucide-react'
import { StudentEvaluationForm } from './StudentEvaluationForm'
import { createClient } from '@/lib/supabase/client'
import { getApiBaseUrl } from '@/lib/api-base-url'
import { sortProceduresByName } from '@/lib/procedure-order'

type Procedure = {
  id: string
  name: string
  category: string
  description: string
  resources: { type: 'file' | 'link'; name: string; url: string }[]
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

type ToggleSection = {
  id: string
  name: string
  studentCount: number
}

type SectionAccessRecord = {
  sectionId: string
  procedureId: string
}

type StudentProcedure = {
  id: string
  student_id: string
  procedure_id: string
  status: 'pending' | 'in_progress' | 'completed' | 'evaluated'
  notes: string | null
  profiles?: { first_name: string; last_name: string }
}

type EvaluationRecord = {
  id: string
  student_id: string
  procedure_id: string
  overall_score: number | null
  max_score: number | null
  competency_status: string | null
  feedback: string | null
  evaluation_date: string | null
  profiles?: { first_name: string; last_name: string }
}

type EvaluationPayload = {
  evaluations?: Record<string, 'performed' | 'not-performed' | null>
  feedback?: string
}

export function ProcedureManagement() {
  const supabase = useMemo(() => createClient(), [])
  const apiUrl = getApiBaseUrl()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [procedures, setProcedures] = useState<Procedure[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [toggleSections, setToggleSections] = useState<ToggleSection[]>([])
  const [sectionAccessRows, setSectionAccessRows] = useState<SectionAccessRecord[]>([])
  const [spRows, setSpRows] = useState<StudentProcedure[]>([])
  const [evaluationRows, setEvaluationRows] = useState<EvaluationRecord[]>([])

  const [editingProcedureId, setEditingProcedureId] = useState<string | null>(null)
  const [procedureForm, setProcedureForm] = useState({
    name: '',
    category: 'Clinical Procedure',
    description: '',
  })
  const [resourceFile, setResourceFile] = useState<File | null>(null)
  const [resourceLabel, setResourceLabel] = useState('Retdem with rationale')

  const [selectedProcedure, setSelectedProcedure] = useState<Procedure | null>(null)
  const [selectedStudent, setSelectedStudent] = useState<{
    student: Student
    procedure: Procedure
    mode?: 'create' | 'edit'
    existingFeedback?: string
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
      setToggleSections([])
      setSectionAccessRows([])
      setProcedures([])
      setSpRows([])
      setEvaluationRows([])
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
      setToggleSections([])
      setSectionAccessRows([])
      setProcedures([])
      setSpRows([])
      setEvaluationRows([])
      setLoading(false)
      return
    }

    setSections((payload?.sections ?? []) as Section[])
    setToggleSections((payload?.toggleSections ?? []) as ToggleSection[])
    setSectionAccessRows((payload?.sectionAccess ?? []) as SectionAccessRecord[])
    setProcedures((payload?.procedures ?? []) as Procedure[])
    setSpRows((payload?.studentProcedures ?? []) as StudentProcedure[])
    setEvaluationRows((payload?.evaluations ?? []) as EvaluationRecord[])
    setLoading(false)
  }, [apiUrl, supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const enabledSectionIds = (procedureId: string) =>
    sections
      .filter((section) =>
        section.students.some((student) =>
          spRows.some(
            (row) => row.student_id === student.id && row.procedure_id === procedureId
          )
        )
      )
      .map((section) => section.id)

  const getSp = (studentId: string, procedureId: string) =>
    spRows.find(
      (row) => row.student_id === studentId && row.procedure_id === procedureId
    )

  const getEvaluation = (studentId: string, procedureId: string) =>
    evaluationRows.find(
      (row) => row.student_id === studentId && row.procedure_id === procedureId
    )

  const sectionAccessLookup = useMemo(
    () => new Set(sectionAccessRows.map((row) => `${row.procedureId}:${row.sectionId}`)),
    [sectionAccessRows]
  )
  const orderedProcedures = useMemo(
    () => sortProceduresByName(procedures, (procedure) => procedure.name),
    [procedures]
  )
  const gradeFormatter = useMemo(
    () =>
      new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }),
    []
  )

  const isProcedureEnabledForSection = (procedureId: string, sectionId: string) =>
    sectionAccessLookup.has(`${procedureId}:${sectionId}`)

  const formatGrade = (value: number | null | undefined) =>
    value === null || value === undefined ? 'N/A' : gradeFormatter.format(Number(value))

  const formatEvaluationDate = (value: string | null | undefined) =>
    value
      ? new Date(value).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : null

  const toggleSectionAccess = async (procedureId: string, sectionId: string) => {
    const section = toggleSections.find((s) => s.id === sectionId)
    if (!section || section.studentCount === 0) return

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

  const openEditProcedure = (procedure: Procedure) => {
    setEditingProcedureId(procedure.id)
    setProcedureForm({
      name: procedure.name,
      category: procedure.category || 'Clinical Procedure',
      description: procedure.description || '',
    })
    setResourceFile(null)
    setResourceLabel(procedure.resources[0]?.name || 'Retdem with rationale')
    setError('')
  }

  const resetProcedureEditor = () => {
    setEditingProcedureId(null)
    setProcedureForm({
      name: '',
      category: 'Clinical Procedure',
      description: '',
    })
    setResourceFile(null)
    setResourceLabel('Retdem with rationale')
  }

  const saveProcedure = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProcedureId) return

    setSaving(true)
    setError('')

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.access_token) {
      setError('You must be logged in to update a procedure.')
      setSaving(false)
      return
    }

    let resources: Array<{ type: 'file' | 'link'; name: string; url: string }> = []

    if (resourceFile) {
      const safeName = resourceFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const path = `procedures/${Date.now()}-${safeName}`
      const { error: uploadError } = await supabase.storage
        .from('procedure-resources')
        .upload(path, resourceFile, { upsert: true })

      if (uploadError) {
        setError(
          'Procedure saved was stopped because file upload failed. Check if the procedure-resources bucket exists.'
        )
        setSaving(false)
        return
      }

      const { data } = supabase.storage
        .from('procedure-resources')
        .getPublicUrl(path)

      resources = [
        {
          type: 'file',
          name: resourceLabel.trim() || resourceFile.name,
          url: data.publicUrl,
        },
      ]
    }

    const response = await fetch(`${apiUrl}/instructor/dashboard/procedures/${editingProcedureId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        name: procedureForm.name,
        category: procedureForm.category,
        description: procedureForm.description,
        resources,
      }),
    })

    const payload = await response.json().catch(() => null)
    if (!response.ok) {
      setError(payload?.message ?? 'Failed to update procedure.')
    }

    resetProcedureEditor()
    await fetchData()
    setSaving(false)
  }

  const saveEvaluation = async (payload: unknown) => {
    if (!selectedStudent) return false
    const data = (payload ?? {}) as EvaluationPayload

    setSaving(true)
    setError('')

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.access_token) {
      setError('You must be logged in to save an evaluation.')
      setSaving(false)
      return false
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
      setSaving(false)
      return false
    }

    await fetchData()
    setSaving(false)
    return true
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
          initialFeedback={selectedStudent.existingFeedback}
          saveLabel={
            selectedStudent.mode === 'edit' ? 'Update Evaluation' : 'Save Evaluation'
          }
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
                      const evaluation = getEvaluation(student.id, selectedProcedure.id)

                      return (
                        <div key={student.id} className="border rounded-lg p-3">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="font-medium">{student.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {student.email} | {student.phone}
                              </div>
                            </div>
                            {row.status === 'evaluated' && (
                              <button
                                className="px-3 py-1 rounded-lg text-sm text-white"
                                style={{ backgroundColor: 'var(--brand-green-dark)' }}
                                onClick={() =>
                                  setSelectedStudent({
                                    student,
                                    procedure: selectedProcedure,
                                    mode: 'edit',
                                    existingFeedback: evaluation?.feedback ?? '',
                                  })
                                }
                                suppressHydrationWarning
                              >
                                Edit
                              </button>
                            )}
                          </div>
                          <div className="text-sm mt-2 text-muted-foreground">
                            Status: <b className="text-foreground">{row.status}</b>
                            {row.profiles && (
                              <span className="ml-2">
                                • Unlocked by: <b>{row.profiles.first_name} {row.profiles.last_name}</b>
                              </span>
                            )}
                            {evaluation?.profiles && (
                              <span className="ml-2">
                                • Evaluated by: <b>{evaluation.profiles.first_name} {evaluation.profiles.last_name}</b>
                              </span>
                            )}
                          </div>
                          {row.notes && (
                            <div className="text-sm text-muted-foreground mt-1">
                              Note: {row.notes}
                            </div>
                          )}
                          {row.status === 'evaluated' && evaluation && (
                            <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
                              <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-foreground">
                                Final Grade:{' '}
                                <b>
                                  {formatGrade(evaluation.overall_score)} /{' '}
                                  {formatGrade(evaluation.max_score ?? 100)}
                                </b>
                              </div>
                              <div className="rounded-lg border border-border bg-gray-50 px-3 py-2 text-foreground">
                                Result: <b>{evaluation.competency_status ?? 'Pending'}</b>
                                {formatEvaluationDate(evaluation.evaluation_date) && (
                                  <span className="ml-2 text-muted-foreground">
                                    ({formatEvaluationDate(evaluation.evaluation_date)})
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                          <div className="mt-2 flex gap-2">
                            {row.status !== 'evaluated' && (
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
                            )}
                            {row.status !== 'evaluated' && (
                              <button
                                className="px-3 py-1 rounded-lg text-sm text-white"
                                style={{ backgroundColor: 'var(--brand-green-dark)' }}
                                onClick={() =>
                                  setSelectedStudent({
                                    student,
                                    procedure: selectedProcedure,
                                    mode: 'create',
                                  })
                                }
                                suppressHydrationWarning
                              >
                                Evaluate
                              </button>
                            )}
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
          </div>

          <div className="space-y-3">
            {orderedProcedures.map((procedure) => {
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
                    <button
                      type="button"
                      onClick={() => openEditProcedure(procedure)}
                      className="px-4 py-2 border border-border rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                      suppressHydrationWarning
                    >
                      <span className="flex items-center gap-2">
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </span>
                    </button>
                  </div>
                  {editingProcedureId === procedure.id && (
                    <form onSubmit={saveProcedure} className="mt-4 border-t border-border pt-4 space-y-3">
                      <input
                        className="w-full border rounded-lg p-2"
                        placeholder="Procedure name"
                        value={procedureForm.name}
                        onChange={(e) =>
                          setProcedureForm((value) => ({ ...value, name: e.target.value }))
                        }
                        required
                        suppressHydrationWarning
                      />
                      <input
                        className="w-full border rounded-lg p-2"
                        placeholder="Category"
                        value={procedureForm.category}
                        onChange={(e) =>
                          setProcedureForm((value) => ({ ...value, category: e.target.value }))
                        }
                        required
                        suppressHydrationWarning
                      />
                      <textarea
                        className="w-full border rounded-lg p-2"
                        placeholder="Description"
                        value={procedureForm.description}
                        onChange={(e) =>
                          setProcedureForm((value) => ({ ...value, description: e.target.value }))
                        }
                        suppressHydrationWarning
                      />
                      <input
                        className="w-full border rounded-lg p-2"
                        placeholder="Attachment label"
                        value={resourceLabel}
                        onChange={(e) => setResourceLabel(e.target.value)}
                        suppressHydrationWarning
                      />
                      <input
                        type="file"
                        className="w-full border rounded-lg p-2 bg-white"
                        onChange={(e) => setResourceFile(e.target.files?.[0] ?? null)}
                        suppressHydrationWarning
                      />
                      <div className="flex gap-3">
                        <button
                          disabled={saving}
                          className="px-4 py-2 text-white rounded-lg"
                          style={{ backgroundColor: 'var(--brand-green-dark)' }}
                          suppressHydrationWarning
                        >
                          {saving ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          type="button"
                          className="px-4 py-2 border border-border rounded-lg hover:bg-gray-50 transition-colors"
                          onClick={resetProcedureEditor}
                          suppressHydrationWarning
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {toggleSections.map((section) => {
                      const has = isProcedureEnabledForSection(procedure.id, section.id)
                      const disabled = saving || section.studentCount === 0

                      return (
                        <button
                          key={section.id}
                          disabled={disabled}
                          onClick={() => toggleSectionAccess(procedure.id, section.id)}
                          className="px-2 py-1 rounded text-sm flex items-center gap-1"
                          style={{
                            backgroundColor: has ? 'var(--brand-green-dark)' : '#E5E7EB',
                            color: has ? '#fff' : '#333',
                            opacity: section.studentCount === 0 ? 0.55 : 1,
                            cursor: disabled ? 'not-allowed' : 'pointer',
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
