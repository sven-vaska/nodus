import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useWorkspace } from '../../lib/WorkspaceContext'
import { SearchableSelect } from '../../components/SidePeek'
import { X, Plus, Link2 } from 'lucide-react'

// Symmetric "related company" links: shown identically on both companies,
// click navigates across, X unlinks, + opens a company picker.
export default function RelatedCompanies({ companyId, links, canEdit, onAdd, onRemove }) {
  const [adding, setAdding] = useState(false)
  const [options, setOptions] = useState([])
  const { ws } = useWorkspace()
  const navigate = useNavigate()

  async function startAdd() {
    setAdding(true)
    const { data } = await supabase.from('companies').select('id, name').eq('workspace_id', ws).is('deleted_at', null).order('name')
    const linkedIds = new Set(links.map(l => l.company.id))
    setOptions((data || []).filter(c => c.id !== companyId && !linkedIds.has(c.id)).map(c => ({ value: c.id, label: c.name })))
  }

  return (
    <div className="flex flex-col gap-1.5">
      {links.map(l => (
        <div key={l.linkId} className="flex items-center gap-2">
          <button onClick={() => navigate(`/companies/${l.company.id}`)} className="flex items-center gap-1.5 text-[13.5px] text-accent hover:underline cursor-pointer text-left min-w-0">
            <Link2 size={12} className="shrink-0" />
            <span className="truncate">{l.company.name}</span>
          </button>
          {canEdit && (
            <button onClick={() => onRemove(l.linkId)} className="text-text-muted hover:text-lost cursor-pointer shrink-0" aria-label="Unlink">
              <X size={12} />
            </button>
          )}
        </div>
      ))}
      {links.length === 0 && !adding && !canEdit && <div className="text-[13px] text-text-muted">—</div>}
      {canEdit && (adding ? (
        <SearchableSelect value="" onChange={v => { if (v) onAdd(v); setAdding(false) }} options={options} placeholder="Select company..." />
      ) : (
        <button onClick={startAdd} className="flex items-center gap-0.5 text-[12px] text-accent hover:underline cursor-pointer self-start">
          <Plus size={10} /> Link company
        </button>
      ))}
    </div>
  )
}
