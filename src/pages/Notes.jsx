import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useUser } from '../lib/UserContext'
import { useWorkspace } from '../lib/WorkspaceContext'
import { relativeTime } from '../lib/utils'
import Avatar from '../components/Avatar'
import SidePeek, { FormField, Textarea } from '../components/SidePeek'
import Loading from '../components/Loading'

export default function Notes() {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [peek, setPeek] = useState({ open: false, data: null })
  const { profile } = useUser()

  const { ws } = useWorkspace()

  function fetchNotes() {
    supabase
      .from('notes')
      .select('*, companies!inner(id, name, deleted_at)')
      .eq('workspace_id', ws)
      .is('companies.deleted_at', null)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setNotes(data || [])
        setLoading(false)
      })
  }

  useEffect(() => { fetchNotes() }, [ws])

  function openEdit(n) {
    setPeek({ open: true, data: { ...n } })
  }

  async function savePeek() {
    const d = peek.data
    if (!d?.body?.trim()) return
    await supabase.from('notes').update({ body: d.body }).eq('id', d.id)
    setPeek({ open: false, data: null })
    fetchNotes()
  }

  async function deletePeek() {
    if (!confirm('Delete this note?')) return
    await supabase.from('notes').delete().eq('id', peek.data.id)
    setPeek({ open: false, data: null })
    fetchNotes()
  }

  if (loading) return <Loading />

  return (
    <div className="p-4 md:p-6">
      <h1 className="font-serif text-[24px] font-semibold text-text-primary mb-6 mt-0">Notes</h1>
      <div className="max-w-[860px]">
        {notes.length === 0 ? (
          <div className="text-text-muted text-[14px] py-4 text-center">No notes yet</div>
        ) : (
          notes.map(n => (
            <div
              key={n.id}
              onClick={() => openEdit(n)}
              className="flex gap-4 py-3 cursor-pointer hover:bg-border-light -mx-3 px-3 rounded-xl transition-colors"
            >
              <div className="flex flex-col items-center gap-1 shrink-0 w-[56px]">
                <Avatar name={n.companies?.name || 'U'} size={38} />
                <span className="text-[10.5px] text-[#C4BCB1] whitespace-nowrap">{relativeTime(n.created_at)}</span>
              </div>
              <div className="flex-1 min-w-0">
                {n.companies && (
                  <Link
                    to={`/companies/${n.companies.id}`}
                    onClick={e => e.stopPropagation()}
                    className="text-[14px] font-semibold text-text-primary hover:underline no-underline"
                  >
                    {n.companies.name}
                  </Link>
                )}
                <div className="text-[14.5px] text-text-secondary leading-relaxed mt-0.5 line-clamp-2">
                  {n.body}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <SidePeek title="Edit note" open={peek.open} onClose={() => setPeek({ open: false, data: null })} onSave={savePeek} onDelete={deletePeek}>
        {peek.data?.companies && (
          <div className="text-[13px] text-accent mb-3">{peek.data.companies.name}</div>
        )}
        <FormField label="Note"><Textarea value={peek.data?.body} onChange={v => setPeek(p => ({ ...p, data: { ...p.data, body: v } }))} placeholder="Write a note..." rows={12} /></FormField>
      </SidePeek>
    </div>
  )
}
