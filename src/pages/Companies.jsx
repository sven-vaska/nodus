import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useWorkspace } from '../lib/WorkspaceContext'
import { useUser } from '../lib/UserContext'
import { failed } from '../lib/toast'
import { pipelineText, formatDate, priorityColor, FINANCE_FIELDS } from '../lib/utils'
import StatusPill from '../components/StatusPill'
import Avatar from '../components/Avatar'
import SidePeek, { FormField, Input, Textarea, Select } from '../components/SidePeek'
import DatePicker from '../components/DatePicker'
import { Plus, List as ListIcon, LayoutGrid, MoreVertical } from 'lucide-react'
import { useRef } from 'react'

const statuses = ['All', 'Research', 'In Conversation', 'On Hold', 'Trial', 'Waiting onboarding', 'Onboarding', 'Won', 'Lost', 'Former Client']
const counties = ['Tallinn', 'Tartu', 'Pärnu', 'Narva', 'Viljandi', 'Rakvere', 'Haapsalu', 'Kuressaare', 'Jõhvi', 'Soome']

const sourceOptions = ['Self', 'Web', 'FB lead', 'Networking', 'Internet', 'Erply', 'Wishlist']

const emptyCompany = { name: '', www: '', description: '', company_no: '', email: '', county: '', address: '', status: 'Research', source: [], newsletter: false, software_fee: '', equipment_rent: '', chips: '', additional_fees: '', start_of_billing: '', users_count: '', trial_ends: '' }

export default function Companies() {
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('All')
  const [view, setView] = useState(() => localStorage.getItem('companiesView') || 'list')
  const setViewMode = v => { setView(v); localStorage.setItem('companiesView', v) }
  const [peekOpen, setPeekOpen] = useState(false)
  const [form, setForm] = useState({ ...emptyCompany })

  const { ws, canEdit, hasFinance, role, statusLabel, setStatusLabel } = useWorkspace()
  const { profile } = useUser()
  const [team, setTeam] = useState([])

  useEffect(() => { fetchCompanies(); fetchTeam() }, [ws])

  async function fetchTeam() {
    const { data: members } = await supabase.from('workspace_members').select('user_id').eq('workspace_id', ws)
    const ids = (members || []).map(m => m.user_id)
    if (!ids.length) { setTeam([]); return }
    const { data: profs } = await supabase.from('profiles').select('id, full_name, avatar_url').in('id', ids)
    setTeam(profs || [])
  }

  async function changeStatus(companyId, newStatus) {
    const company = companies.find(c => c.id === companyId)
    if (!company || company.status === newStatus) return
    const updates = { status: newStatus, status_changed_at: new Date().toISOString() }
    if (['Won', 'Lost'].includes(newStatus) && !company.closed_date) updates.closed_date = new Date().toISOString().split('T')[0]
    if (newStatus === 'In Conversation' && !company.starting_date) updates.starting_date = new Date().toISOString().split('T')[0]
    const res = await supabase.from('companies').update(updates).eq('id', companyId)
    if (failed(res, 'Changing status failed')) return
    setCompanies(prev => prev.map(c => c.id === companyId ? { ...c, ...updates } : c))
  }

  async function changeOwner(companyId, ownerId) {
    const res = await supabase.from('companies').update({ owner_id: ownerId || null }).eq('id', companyId)
    if (failed(res, 'Changing owner failed')) return
    setCompanies(prev => prev.map(c => c.id === companyId ? { ...c, owner_id: ownerId || null } : c))
  }

  async function fetchCompanies() {
    const { data } = await supabase
      .from('companies')
      .select('*')
      .eq('workspace_id', ws)
      .is('deleted_at', null)
      .order('last_contact', { ascending: false, nullsFirst: false })
    setCompanies(data || [])
    setLoading(false)
  }

  function openNew() {
    setForm({ ...emptyCompany })
    setPeekOpen(true)
  }

  async function handleSave() {
    if (!form.name.trim()) return
    // Pricing fields go to company_finance; everything else to companies
    const companyData = {}
    const financeData = {}
    for (const [k, v] of Object.entries(form)) {
      if (FINANCE_FIELDS.includes(k)) { if (v !== '') financeData[k] = v }
      else companyData[k] = v
    }
    const res = await supabase.from('companies').insert({
      ...companyData,
      workspace_id: ws,
      owner_id: profile?.id || null,
      last_contact: new Date().toISOString(),
      created_at: new Date().toISOString(),
    }).select('id').single()
    if (failed(res, 'Saving company failed')) return
    if (Object.keys(financeData).length) {
      const finRes = await supabase.from('company_finance').insert({ company_id: res.data.id, ...financeData })
      failed(finRes, 'Saving pricing failed')
    }
    setPeekOpen(false)
    fetchCompanies()
  }

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const filtered = companies.filter(c => {
    if (statusFilter !== 'All' && c.status !== statusFilter) return false
    return true
  })

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-baseline justify-between mb-6">
        <h1 className="font-serif text-[24px] font-semibold text-text-primary m-0">
          Companies {!loading && <span className="font-sans text-[14px] font-normal text-[#C4BCB1] ml-1">{filtered.length}</span>}
        </h1>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-1">
            <button onClick={() => setViewMode('list')} title="List view"
              className={`p-2 rounded-full transition-colors cursor-pointer ${view === 'list' ? 'text-text-primary bg-border-light' : 'text-[#C4BCB1] hover:text-text-secondary'}`}>
              <ListIcon size={18} />
            </button>
            <button onClick={() => setViewMode('board')} title="Board view"
              className={`p-2 rounded-full transition-colors cursor-pointer ${view === 'board' ? 'text-text-primary bg-border-light' : 'text-[#C4BCB1] hover:text-text-secondary'}`}>
              <LayoutGrid size={18} />
            </button>
          </div>
          {canEdit && (
            <button onClick={openNew} className="flex items-center gap-1.5 px-5 py-2 bg-accent text-white rounded-full text-[14px] font-semibold hover:opacity-90 transition-opacity cursor-pointer">
              <Plus size={14} />
              New company
            </button>
          )}
        </div>
      </div>

      <div className={`flex gap-1.5 mb-5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden -mx-4 px-4 md:mx-0 md:px-0 ${view === 'board' ? 'md:hidden' : ''}`}>
        {statuses.map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              statusFilter === s
                ? 'bg-text-primary text-bg'
                : 'text-text-muted hover:bg-border-light hover:text-text-primary'
            }`}
          >
            {s === 'All' ? 'All' : statusLabel(s)}
          </button>
        ))}
      </div>

      {/* Mobile card list */}
      <div className="md:hidden bg-surface">
        {loading ? (
          <div className="text-center py-8 text-text-muted text-[14px]">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-text-muted text-[14px]">No companies found</div>
        ) : (
          filtered.map(company => {
            const primary = null
            return (
              <Link key={company.id} to={`/companies/${company.id}`} className="flex items-center gap-2.5 px-3 py-2.5 border-b border-border-light last:border-0 no-underline hover:bg-border-light transition-colors">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0" style={{ backgroundColor: priorityColor(company.users_count).bg, color: priorityColor(company.users_count).text }}>
                  {company.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[15px] font-medium text-text-primary truncate block">{company.name}</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    {company.follow_up && (
                      <span className={`text-[12px] ${new Date(company.follow_up) < new Date() ? 'text-lost font-medium' : 'text-text-muted'}`}>
                        {formatDate(company.follow_up)}
                      </span>
                    )}
                    <StatusPill status={company.status} />
                  </div>
                </div>
                {company.owner_id && <Avatar name={team.find(t => t.id === company.owner_id)?.full_name || '?'} src={team.find(t => t.id === company.owner_id)?.avatar_url} size={22} />}
              </Link>
            )
          })
        )}
      </div>

      {/* Desktop table */}
      <div className={`bg-surface overflow-x-auto ${view === 'list' ? 'hidden md:block' : 'hidden'}`}>
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="text-[12px] text-text-muted font-semibold uppercase tracking-[.06em]">
              <th className="text-left py-2 px-3">Company</th>
              <th className="text-left py-2 px-3">Sector</th>
              <th className="text-left py-2 px-3">County</th>
              <th className="text-left py-2 px-3">Status</th>
              <th className="text-left py-2 px-3">Pipeline</th>
              <th className="text-left py-2 px-3">Follow-up</th>
              <th className="text-left py-2 px-3">Owner</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-8 text-text-muted text-[14px]">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-text-muted text-[14px]">No companies found</td></tr>
            ) : (
              filtered.map(company => (
                <tr key={company.id} className="hover:bg-border-light transition-colors">
                  <td className="py-2 px-3">
                    <Link to={`/companies/${company.id}`} className="flex items-center gap-2.5 no-underline">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0" style={{ backgroundColor: priorityColor(company.users_count).bg, color: priorityColor(company.users_count).text }}>
                        {company.name.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-[15px] font-medium text-text-primary hover:text-accent transition-colors whitespace-nowrap">
                        {company.name}
                      </span>
                    </Link>
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex flex-wrap gap-1">
                      {(company.sector || []).map(s => (
                        <span key={s} className="text-[12px] px-2 py-0.5 bg-border-light rounded-full text-text-secondary">{s}</span>
                      ))}
                    </div>
                  </td>
                  <td className="py-2 px-3 text-[14px] text-text-secondary">{company.county || '—'}</td>
                  <td className="py-2 px-3"><StatusPill status={company.status} /></td>
                  <td className="py-2 px-3 text-[13px] text-text-secondary">{pipelineText(company)}</td>
                  <td className="py-2 px-3" onClick={e => e.stopPropagation()}>
                    <DatePicker value={company.follow_up} onChange={async v => { await supabase.from('companies').update({ follow_up: v || null }).eq('id', company.id); fetchCompanies() }} inline />
                  </td>
                  <td className="py-2 px-3" onClick={e => e.stopPropagation()}>
                    <OwnerPicker company={company} team={team} canEdit={canEdit} onChange={changeOwner} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Kanban board (desktop) */}
      {view === 'board' && (
        <div className="hidden md:flex gap-4 overflow-x-auto pb-4 items-start [scrollbar-width:thin]">
          {statuses.filter(st => st !== 'All').map(st => {
            const cards = companies.filter(c => c.status === st)
            return (
              <div
                key={st}
                className="w-[230px] shrink-0 rounded-2xl bg-border-light/50 p-3"
                onDragOver={e => { if (canEdit) e.preventDefault() }}
                onDrop={e => {
                  if (!canEdit) return
                  e.preventDefault()
                  const id = e.dataTransfer.getData('companyId')
                  if (id) changeStatus(id, st)
                }}
              >
                <BoardColumnHeader status={st} count={cards.length} isOwner={role === 'owner'} label={statusLabel(st)} onRename={setStatusLabel} />
                <div className="flex flex-col gap-2 min-h-[40px]">
                  {cards.map(c => (
                    <Link
                      key={c.id}
                      to={`/companies/${c.id}`}
                      draggable={canEdit}
                      onDragStart={e => e.dataTransfer.setData('companyId', c.id)}
                      className="block bg-surface rounded-xl p-3 no-underline shadow-[0_1px_3px_rgba(38,34,28,.06)] hover:shadow-[0_2px_8px_rgba(38,34,28,.10)] transition-shadow cursor-grab active:cursor-grabbing"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0" style={{ backgroundColor: priorityColor(c.users_count).bg, color: priorityColor(c.users_count).text }}>
                          {c.name.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-[13.5px] font-semibold text-text-primary truncate">{c.name}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2 pl-0.5">
                        {c.follow_up && (
                          <span className={`text-[12px] ${new Date(c.follow_up) < new Date() ? 'text-lost font-medium' : 'text-text-muted'}`}>{formatDate(c.follow_up)}</span>
                        )}
                        {c.users_count ? <span className="text-[12px] text-[#C4BCB1]">{c.users_count} users</span> : null}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <SidePeek title="New company" open={peekOpen} onClose={() => setPeekOpen(false)} onSave={handleSave} wide>
        <div className="text-[12px] text-text-muted uppercase tracking-wide font-medium mb-2">General Information</div>
        <FormField label="Company name *">
          <Input value={form.name} onChange={v => set('name', v)} placeholder="Company OÜ" />
        </FormField>
        <FormField label="Website">
          <Input value={form.www} onChange={v => set('www', v)} placeholder="https://" />
        </FormField>
        <FormField label="Description">
          <Textarea value={form.description} onChange={v => set('description', v)} placeholder="Industry description..." />
        </FormField>
        <FormField label="Company no.">
          <Input value={form.company_no} onChange={v => set('company_no', v)} />
        </FormField>
        <FormField label="Email">
          <Input value={form.email} onChange={v => set('email', v)} type="email" placeholder="info@company.ee" />
        </FormField>
        <FormField label="Source">
          <div className="flex flex-wrap gap-1">
            {sourceOptions.map(o => (
              <button key={o} type="button" onClick={() => set('source', (form.source || []).includes(o) ? form.source.filter(x => x !== o) : [...(form.source || []), o])}
                className={`text-[12.5px] px-3 py-1 rounded-full cursor-pointer ${(form.source || []).includes(o) ? 'bg-text-primary text-white' : 'bg-border-light text-text-secondary hover:bg-border'}`}>{o}</button>
            ))}
          </div>
        </FormField>
        <FormField label="Newsletter">
          <input type="checkbox" checked={form.newsletter || false} onChange={e => set('newsletter', e.target.checked)} className="w-4 h-4 accent-accent cursor-pointer" />
        </FormField>

        <div className="text-[12px] text-text-muted uppercase tracking-wide font-medium mb-2 mt-4 pt-3 border-t border-border-light">Address</div>
        <FormField label="County">
          <Select value={form.county} onChange={v => set('county', v)} options={counties} placeholder="Select county..." />
        </FormField>
        <FormField label="Address">
          <Input value={form.address} onChange={v => set('address', v)} />
        </FormField>

        {hasFinance && (
          <>
            <div className="text-[12px] text-text-muted uppercase tracking-wide font-medium mb-2 mt-4 pt-3 border-t border-border-light">Billing Information</div>
            <FormField label="Software fee (€/mo)">
              <Input type="number" value={form.software_fee} onChange={v => set('software_fee', v)} placeholder="0" />
            </FormField>
            <FormField label="Equipment rent (€/mo)">
              <Input type="number" value={form.equipment_rent} onChange={v => set('equipment_rent', v)} placeholder="0" />
            </FormField>
            <FormField label="Chips (€/mo)">
              <Input type="number" value={form.chips} onChange={v => set('chips', v)} placeholder="0" />
            </FormField>
            <FormField label="Additional fees (€)">
              <Input type="number" value={form.additional_fees} onChange={v => set('additional_fees', v)} placeholder="0" />
            </FormField>
            <FormField label="Billing start">
              <DatePicker value={form.start_of_billing} onChange={v => set('start_of_billing', v)} />
            </FormField>
          </>
        )}
        <FormField label="Users">
          <Input type="number" value={form.users_count} onChange={v => set('users_count', v)} placeholder="0" />
        </FormField>

        <div className="text-[12px] text-text-muted uppercase tracking-wide font-medium mb-2 mt-4 pt-3 border-t border-border-light">Pipeline</div>
        <FormField label="Status">
          <Select value={form.status} onChange={v => set('status', v)} options={statuses.filter(s => s !== 'All')} />
        </FormField>
        <FormField label="Trial ends">
          <DatePicker value={form.trial_ends} onChange={v => set('trial_ends', v)} />
        </FormField>
      </SidePeek>
    </div>
  )
}

function OwnerPicker({ company, team, canEdit, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef()

  useEffect(() => {
    if (!open) return
    const handle = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  const owner = team.find(t => t.id === company.owner_id)

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => canEdit && setOpen(!open)}
        className={`flex items-center gap-2 rounded-full py-0.5 pr-2 -ml-1 pl-1 transition-colors ${canEdit ? 'cursor-pointer hover:bg-border-light' : 'cursor-default'}`}
        title={owner?.full_name || 'No owner'}
      >
        {owner
          ? <Avatar name={owner.full_name || '?'} src={owner.avatar_url} size={24} />
          : <span className="text-[13px] text-text-muted px-1">—</span>}
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-1 w-52 bg-surface border border-border rounded-xl shadow-lg overflow-hidden z-50">
          {team.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => { onChange(company.id, t.id); setOpen(false) }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-border-light transition-colors cursor-pointer ${t.id === company.owner_id ? 'bg-border-light/60' : ''}`}
            >
              <Avatar name={t.full_name || '?'} src={t.avatar_url} size={24} />
              <span className="text-[14px] text-text-primary truncate">{t.full_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function BoardColumnHeader({ status, count, isOwner, label, onRename }) {
  const [menu, setMenu] = useState(false)
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(label)
  const ref = useRef()

  useEffect(() => {
    if (!menu) return
    const handle = e => { if (ref.current && !ref.current.contains(e.target)) setMenu(false) }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [menu])

  function save() {
    setEditing(false)
    onRename(status, val)
  }

  if (editing) {
    return (
      <div className="px-1.5 pb-3">
        <input
          autoFocus
          value={val}
          onChange={e => setVal(e.target.value)}
          onBlur={save}
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setVal(label); setEditing(false) } }}
          className="w-full px-2 py-1 rounded-lg bg-surface text-[13px] font-medium outline-none"
        />
      </div>
    )
  }

  return (
    <div className="group/col flex items-center gap-2 px-1.5 pb-3 relative" ref={ref}>
      <StatusPill status={status} />
      <span className="ml-auto text-[12px] text-[#C4BCB1]">{count}</span>
      {isOwner && (
        <button
          onClick={() => setMenu(!menu)}
          className="p-0.5 -mr-1 text-[#C4BCB1] hover:text-text-primary opacity-0 group-hover/col:opacity-100 transition-opacity cursor-pointer"
          title="Column options"
        >
          <MoreVertical size={14} />
        </button>
      )}
      {menu && (
        <div className="absolute top-full right-0 mt-1 w-40 bg-surface border border-border rounded-xl shadow-lg overflow-hidden z-50">
          <button
            onClick={() => { setMenu(false); setVal(label); setEditing(true) }}
            className="w-full text-left px-3.5 py-2 text-[13.5px] text-text-primary hover:bg-border-light transition-colors cursor-pointer"
          >
            Rename
          </button>
          {label !== status && (
            <button
              onClick={() => { setMenu(false); onRename(status, '') }}
              className="w-full text-left px-3.5 py-2 text-[13.5px] text-text-muted hover:bg-border-light transition-colors cursor-pointer"
            >
              Reset to "{status}"
            </button>
          )}
        </div>
      )}
    </div>
  )
}
