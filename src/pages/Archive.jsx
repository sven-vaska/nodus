import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useWorkspace } from '../lib/WorkspaceContext'
import { formatDate } from '../lib/utils'
import { RotateCcw, Trash2 } from 'lucide-react'
import Loading from '../components/Loading'

export default function Archive() {
  const [companies, setCompanies] = useState([])
  const [people, setPeople] = useState([])
  const [loading, setLoading] = useState(true)

  const { ws } = useWorkspace()

  useEffect(() => { fetchArchive() }, [ws])

  async function fetchArchive() {
    const [cRes, pRes] = await Promise.all([
      supabase.from('companies').select('id, name, status, deleted_at').eq('workspace_id', ws).not('deleted_at', 'is', null).order('deleted_at', { ascending: false }),
      supabase.from('people').select('id, name, email, deleted_at').eq('workspace_id', ws).not('deleted_at', 'is', null).order('deleted_at', { ascending: false }),
    ])
    setCompanies(cRes.data || [])
    setPeople(pRes.data || [])
    setLoading(false)
  }

  async function restore(table, id) {
    await supabase.from(table).update({ deleted_at: null }).eq('id', id)
    fetchArchive()
  }

  async function hardDelete(table, id) {
    if (!confirm('Permanently delete? This cannot be undone.')) return
    await supabase.from(table).delete().eq('id', id)
    fetchArchive()
  }

  if (loading) return <Loading />

  return (
    <div className="space-y-6">
      {/* Deleted companies */}
      <div>
        <div className="text-[13px] text-text-muted font-medium mb-2">Companies ({companies.length})</div>
        <div className="bg-surface">
          {companies.length === 0 ? (
            <div className="text-center py-6 text-text-muted text-[14px]">No deleted companies</div>
          ) : (
            companies.map(c => (
              <div key={c.id} className="flex items-center gap-3 px-3 py-2.5 border-b border-border-light last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-medium text-text-primary truncate">{c.name}</div>
                  <div className="text-[12px] text-text-muted">{c.status} · Deleted {formatDate(c.deleted_at)}</div>
                </div>
                <button onClick={() => restore('companies', c.id)} className="p-1.5 rounded hover:bg-border-light text-text-muted hover:text-accent transition-colors cursor-pointer" title="Restore">
                  <RotateCcw size={15} />
                </button>
                <button onClick={() => hardDelete('companies', c.id)} className="p-1.5 rounded hover:bg-border-light text-text-muted hover:text-lost transition-colors cursor-pointer" title="Delete permanently">
                  <Trash2 size={15} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Deleted people */}
      <div>
        <div className="text-[13px] text-text-muted font-medium mb-2">People ({people.length})</div>
        <div className="bg-surface">
          {people.length === 0 ? (
            <div className="text-center py-6 text-text-muted text-[14px]">No deleted contacts</div>
          ) : (
            people.map(p => (
              <div key={p.id} className="flex items-center gap-3 px-3 py-2.5 border-b border-border-light last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-medium text-text-primary truncate">{p.name}</div>
                  <div className="text-[12px] text-text-muted">{p.email || '—'} · Deleted {formatDate(p.deleted_at)}</div>
                </div>
                <button onClick={() => restore('people', p.id)} className="p-1.5 rounded hover:bg-border-light text-text-muted hover:text-accent transition-colors cursor-pointer" title="Restore">
                  <RotateCcw size={15} />
                </button>
                <button onClick={() => hardDelete('people', p.id)} className="p-1.5 rounded hover:bg-border-light text-text-muted hover:text-lost transition-colors cursor-pointer" title="Delete permanently">
                  <Trash2 size={15} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
