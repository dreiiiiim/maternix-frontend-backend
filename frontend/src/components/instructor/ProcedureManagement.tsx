'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, CheckCircle, FileText, Lock, Plus, Send, Unlock } from 'lucide-react'
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

type EvaluationPayload = {
  evaluations?: Record<string, 'performed' | 'not-performed' | null>
  feedback?: string
}

const asArray = <T,>(value: T | T[] | null | undefined): T[] =>
  !value ? [] : Array.isArray(value) ? value : [value]

export function ProcedureManagement() {
  const supabase = useMemo(() => createClient(), [])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [currentUserId, setCurrentUserId] = useState('')

  const [procedures, setProcedures] = useState<Procedure[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [spRows, setSpRows] = useState<StudentProcedure[]>([])

  const [showAdd, setShowAdd] = useState(false)
  const [newProcedure, setNewProcedure] = useState({ name: '', category: 'Clinical Procedure', description: '' })

  const [selectedProcedure, setSelectedProcedure] = useState<Procedure | null>(null)
  const [selectedStudent, setSelectedStudent] = useState<{ student: Student; procedure: Procedure } | null>(null)
  const [noteTarget, setNoteTarget] = useState<{ student: Student; procedure: Procedure } | null>(null)
  const [noteText, setNoteText] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setSections([])
      setProcedures([])
      setSpRows([])
      setLoading(false)
      return
    }
    setCurrentUserId(user.id)

    const { data: secData, error: secErr } = await supabase
      .from('sections')
      .select('id,name,students(id,student_no,profiles(first_name,last_name,email,phone_number))')
      .eq('instructor_id', user.id)
      .order('name')
    if (secErr) {
      setError(secErr.message)
      setLoading(false)
      return
    }

    const mappedSections: Section[] = ((secData ?? []) as Array<{
      id: string
      name: string
      students: Array<{
        id: string
        student_no: string
        profiles:
          | { first_name: string | null; last_name: string | null; email: string | null; phone_number: string | null }
          | Array<{ first_name: string | null; last_name: string | null; email: string | null; phone_number: string | null }>
          | null
      }> | null
    }>).map((section) => ({
      id: section.id,
      name: section.name,
      students: asArray(section.students).map((student) => {
        const profile = asArray(student.profiles)[0]
        return {
          id: student.id,
          studentNo: student.student_no,
          name: `${profile?.first_name ?? ''} ${profile?.last_name ?? ''}`.trim() || 'Unnamed student',
          email: profile?.email ?? 'No email',
          phone: profile?.phone_number ?? 'No phone number',
        }
      }),
    }))

    const allStudentIds = mappedSections.flatMap((section) => section.students.map((s) => s.id))

    const { data: procData, error: procErr } = await supabase
      .from('procedures')
      .select('id,name,category,description')
      .order('created_at', { ascending: false })
    if (procErr) {
      setError(procErr.message)
      setLoading(false)
      return
    }

    let mappedSp: StudentProcedure[] = []
    if (allStudentIds.length > 0) {
      const { data: spData, error: spErr } = await supabase
        .from('student_procedures')
        .select('id,student_id,procedure_id,status,notes')
        .in('student_id', allStudentIds)
      if (spErr) setError(spErr.message)
      mappedSp = (spData ?? []) as StudentProcedure[]
    }

    setSections(mappedSections)
    setProcedures(((procData ?? []) as Array<{ id: string; name: string; category: string; description: string | null }>).map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      description: p.description ?? '',
    })))
    setSpRows(mappedSp)
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const enabledSectionIds = (procedureId: string) =>
    sections.filter((section) =>
      section.students.some((student) => spRows.some((sp) => sp.student_id === student.id && sp.procedure_id === procedureId))
    ).map((section) => section.id)

  const getSp = (studentId: string, procedureId: string) =>
    spRows.find((row) => row.student_id === studentId && row.procedure_id === procedureId)

  const toggleSectionAccess = async (procedureId: string, sectionId: string) => {
    const section = sections.find((s) => s.id === sectionId)
    if (!section) return
    const studentIds = section.students.map((s) => s.id)
    if (!studentIds.length) return

    setSaving(true)
    const hasAccess = enabledSectionIds(procedureId).includes(sectionId)
    if (hasAccess) {
      const { error: delErr } = await supabase
        .from('student_procedures')
        .delete()
        .eq('procedure_id', procedureId)
        .in('student_id', studentIds)
      if (delErr) setError(delErr.message)
    } else {
      const rows = studentIds.map((studentId) => ({ student_id: studentId, procedure_id: procedureId, status: 'pending' }))
      const { error: upErr } = await supabase
        .from('student_procedures')
        .upsert(rows, { onConflict: 'student_id,procedure_id', ignoreDuplicates: true })
      if (upErr) setError(upErr.message)
    }
    await fetchData()
    setSaving(false)
  }

  const addProcedure = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUserId) return
    setSaving(true)
    const { error: insErr } = await supabase.from('procedures').insert({
      name: newProcedure.name,
      category: newProcedure.category,
      description: newProcedure.description,
      created_by: currentUserId,
    })
    if (insErr) setError(insErr.message)
    setShowAdd(false)
    setNewProcedure({ name: '', category: 'Clinical Procedure', description: '' })
    await fetchData()
    setSaving(false)
  }

  const saveEvaluation = async (payload: unknown) => {
    if (!selectedStudent || !currentUserId) return
    const data = (payload ?? {}) as EvaluationPayload
    const values = Object.values(data.evaluations ?? {}).filter((v): v is 'performed' | 'not-performed' => v === 'performed' || v === 'not-performed')
    const performed = values.filter((v) => v === 'performed').length
    const score = values.length ? Number(((performed / values.length) * 100).toFixed(2)) : null
    const status = score === null ? null : score >= 75 ? 'Competent' : 'Not Yet Competent'

    setSaving(true)
    const { error: evalErr } = await supabase.from('evaluations').insert({
      student_id: selectedStudent.student.id,
      procedure_id: selectedStudent.procedure.id,
      instructor_id: currentUserId,
      overall_score: score,
      max_score: 100,
      competency_status: status,
      feedback: data.feedback ?? '',
    })
    if (evalErr) setError(evalErr.message)

    const { error: spErr } = await supabase
      .from('student_procedures')
      .update({ status: 'evaluated' })
      .eq('student_id', selectedStudent.student.id)
      .eq('procedure_id', selectedStudent.procedure.id)
    if (spErr) setError(spErr.message)

    setSelectedStudent(null)
    await fetchData()
    setSaving(false)
  }

  const saveNote = async () => {
    if (!noteTarget) return
    setSaving(true)
    const { error: upErr } = await supabase
      .from('student_procedures')
      .update({ notes: noteText })
      .eq('student_id', noteTarget.student.id)
      .eq('procedure_id', noteTarget.procedure.id)
    if (upErr) setError(upErr.message)
    setNoteTarget(null)
    setNoteText('')
    await fetchData()
    setSaving(false)
  }

  if (loading) return <div className="bg-white border border-border rounded-xl p-8 text-center text-muted-foreground">Loading procedures...</div>

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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6" onClick={() => setNoteTarget(null)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-3">Leave a note</h3>
            <textarea className="w-full border border-border rounded-lg p-3 min-h-[140px]" value={noteText} onChange={(e) => setNoteText(e.target.value)} />
            <div className="mt-4 flex gap-2 justify-end">
              <button className="px-4 py-2 border rounded-lg" onClick={() => setNoteTarget(null)} suppressHydrationWarning>Cancel</button>
              <button className="px-4 py-2 text-white rounded-lg flex items-center gap-2" style={{ backgroundColor: 'var(--brand-pink-dark)' }} onClick={saveNote} suppressHydrationWarning>
                <Send className="w-4 h-4" />
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div>}

      {selectedProcedure ? (
        <div>
          <button className="mb-4 flex items-center gap-2" onClick={() => setSelectedProcedure(null)} suppressHydrationWarning>
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <h2 className="text-2xl font-bold mb-2">{selectedProcedure.name}</h2>
          <p className="text-muted-foreground mb-6">{selectedProcedure.description}</p>

          <div className="space-y-4">
            {sections.filter((section) => enabledSectionIds(selectedProcedure.id).includes(section.id)).map((section) => (
              <div key={section.id} className="bg-white border rounded-xl p-4">
                <h3 className="font-bold mb-3">{section.name}</h3>
                <div className="grid gap-3">
                  {section.students.map((student) => {
                    const row = getSp(student.id, selectedProcedure.id)
                    if (!row) return null
                    return (
                      <div key={student.id} className="border rounded-lg p-3">
                        <div className="font-medium">{student.name}</div>
                        <div className="text-sm text-muted-foreground">{student.email} | {student.phone}</div>
                        <div className="text-sm mt-2">Status: <b>{row.status}</b></div>
                        {row.notes && <div className="text-sm text-muted-foreground mt-1">Note: {row.notes}</div>}
                        <div className="mt-2 flex gap-2">
                          <button className="px-3 py-1 border rounded-lg text-sm" onClick={() => { setNoteTarget({ student, procedure: selectedProcedure }); setNoteText(row.notes ?? '') }} suppressHydrationWarning>Note</button>
                          <button className="px-3 py-1 rounded-lg text-sm text-white" style={{ backgroundColor: 'var(--brand-green-dark)' }} onClick={() => setSelectedStudent({ student, procedure: selectedProcedure })} suppressHydrationWarning>Evaluate</button>
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
            <button className="px-4 py-2 text-white rounded-lg flex items-center gap-2" style={{ backgroundColor: 'var(--brand-green-dark)' }} onClick={() => setShowAdd((v) => !v)} suppressHydrationWarning>
              <Plus className="w-4 h-4" />
              Add Procedure
            </button>
          </div>

          {showAdd && (
            <form onSubmit={addProcedure} className="bg-white border rounded-xl p-4 mb-6 space-y-3">
              <input className="w-full border rounded-lg p-2" placeholder="Procedure name" value={newProcedure.name} onChange={(e) => setNewProcedure((v) => ({ ...v, name: e.target.value }))} required suppressHydrationWarning />
              <input className="w-full border rounded-lg p-2" placeholder="Category" value={newProcedure.category} onChange={(e) => setNewProcedure((v) => ({ ...v, category: e.target.value }))} required suppressHydrationWarning />
              <textarea className="w-full border rounded-lg p-2" placeholder="Description" value={newProcedure.description} onChange={(e) => setNewProcedure((v) => ({ ...v, description: e.target.value }))} suppressHydrationWarning />
              <button disabled={saving} className="px-4 py-2 text-white rounded-lg" style={{ backgroundColor: 'var(--brand-green-dark)' }} suppressHydrationWarning>{saving ? 'Saving...' : 'Save'}</button>
            </form>
          )}

          <div className="space-y-3">
            {procedures.map((procedure) => {
              const enabled = enabledSectionIds(procedure.id)
              return (
                <div key={procedure.id} className="bg-white border rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div onClick={() => setSelectedProcedure(procedure)} className="cursor-pointer">
                      <h3 className="font-bold">{procedure.name}</h3>
                      <p className="text-sm text-muted-foreground">{procedure.category} • {procedure.description}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {sections.map((section) => {
                      const has = enabled.includes(section.id)
                      return (
                        <button key={section.id} disabled={saving} onClick={() => toggleSectionAccess(procedure.id, section.id)} className="px-2 py-1 rounded text-sm flex items-center gap-1" style={{ backgroundColor: has ? 'var(--brand-green-dark)' : '#E5E7EB', color: has ? '#fff' : '#333' }} suppressHydrationWarning>
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
