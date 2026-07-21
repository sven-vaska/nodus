import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useUser } from '../lib/UserContext'
import { useWorkspace } from '../lib/WorkspaceContext'
import { formatDate } from '../lib/utils'
import SidePeek, { FormField, Input, Textarea, TabSelect, SearchableSelect, TimeInput } from '../components/SidePeek'
import DatePicker from '../components/DatePicker'
import { Phone, Mail, Calendar, MessageSquare, MoreHorizontal, Headphones, LayoutGrid, Receipt, Repeat2 } from 'lucide-react'
import Loading from '../components/Loading'

// 'Email' is intentionally not selectable — emails live in the Emails section now
const typeOptions = ['Call', 'Follow-up', 'Meeting', 'Demo', 'Pakkumine', 'Note', 'Support', 'Other']
const typeFilters = ['All', ...typeOptions]
const typeColors = {
  'Call': { bg: '#F2EDE5', text: '#4C6FBF' },
  'Email': { bg: '#F2EDE5', text: '#6E4A8E' },
  'Follow-up': { bg: '#F2EDE5', text: '#2E8A8A' },
  'Meeting': { bg: '#F2EDE5', text: '#3D8A5B' },
  'Demo': { bg: '#F2EDE5', text: '#A97B1F' },
  'Pakkumine': { bg: '#F2EDE5', text: '#B4552D' },
  'Note': { bg: '#F2EDE5', text: '#9C948A' },
  'Support': { bg: '#F2EDE5', text: '#B04343' },
  'Other': { bg: '#F2EDE5', text: '#7C756A' },
}
const icons = { 'Call': Phone, 'Email': Mail, 'Follow-up': Repeat2, 'Meeting': Calendar, 'Demo': LayoutGrid, 'Pakkumine': Receipt, 'Note': MessageSquare, 'Support': Headphones, 'Other': MoreHorizontal }

export default function Activities() {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')
  const [peek, setPeek] = useState({ open: false, data: null })
  const [createPeek, setCreatePeek] = useState({ open: false, data: { type: 'Call', title: '', description: '', company_id: '', reminder: '' } })
  const [companies, setCompanies] = useState([])
  const [contactOptions, setContactOptions] = useState([])
  const { profile } = useUser()
  const { ws } = useWorkspace()
  const location = useLocation()

  function fetchActivities() {
    supabase
      .from('activities')
      .select('*, companies!inner(id, name, deleted_at), contact:people!contact_id(id, name)')
      .eq('workspace_id', ws)
      .is('companies.deleted_at', null)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setActivities(data || [])
        setLoading(false)
      })
  }

  function fetchCompanyOptions() {
    supabase.from('companies').select('id, name').eq('workspace_id', ws).is('deleted_at', null).order('name').then(({ data }) => {
      setCompanies((data || []).map(c => ({ value: c.id, label: c.name })))
    })
  }

  function fetchContactsFor(companyId, onLoaded) {
    if (!companyId) { setContactOptions([]); return }
    supabase.from('people').select('id, name').eq('company_id', companyId).is('deleted_at', null).order('is_primary', { ascending: false }).then(({ data }) => {
      const opts = (data || []).map(p => ({ value: p.id, label: p.name }))
      setContactOptions(opts)
      if (onLoaded) onLoaded(opts)
    })
  }

  useEffect(() => { fetchActivities() }, [ws])

  useEffect(() => {
    if (location.state?.newActivity) {
      setCreatePeek({ open: true, data: { type: 'Call', title: '', description: '', company_id: '', reminder: '' } })
      fetchCompanyOptions()
      window.history.replaceState({}, '')
    }
  }, [location.state])

  function openEdit(a) {
    setPeek({ open: true, data: { ...a } })
    fetchContactsFor(a.companies?.id || a.company_id)
  }

  async function savePeek() {
    const d = peek.data
    if (!d?.title?.trim()) return
    await supabase.from('activities').update({
      title: d.title,
      body: d.description || null,
      type: d.type,
      contact_id: d.contact_id || null,
      reminder: d.reminder || null,
      reminder_time: d.reminder ? d.reminder_time || null : null,
    }).eq('id', d.id)
    setPeek({ open: false, data: null })
    fetchActivities()
  }

  async function deletePeek() {
    if (!confirm('Delete this activity?')) return
    await supabase.from('activities').delete().eq('id', peek.data.id)
    setPeek({ open: false, data: null })
    fetchActivities()
  }

  function openCreate() {
    setCreatePeek({ open: true, data: { type: 'Call', title: '', description: '', company_id: '', reminder: '' } })
    if (companies.length === 0) fetchCompanyOptions()
  }

  async function saveCreate() {
    const d = createPeek.data
    if (!d?.title?.trim() || !d?.company_id) return
    await supabase.from('activities').insert({
      title: d.title,
      body: d.description || null,
      type: d.type,
      company_id: d.company_id,
      contact_id: d.contact_id || null,
      reminder: d.reminder || null,
      reminder_time: d.reminder ? d.reminder_time || null : null,
    })
    setCreatePeek({ open: false, data: null })
    fetchActivities()
  }

  // Sub-activity updates render inline under their parent row, never as
  // standalone list rows.
  const updatesByParent = {}
  for (const a of activities) {
    if (a.parent_id) (updatesByParent[a.parent_id] ||= []).push(a)
  }
  for (const list of Object.values(updatesByParent)) {
    list.sort((x, y) => new Date(x.created_at) - new Date(y.created_at))
  }
  const filtered = activities.filter(a => !a.parent_id && (filter === 'All' || a.type === filter))

  const grouped = {}
  filtered.forEach(a => {
    const key = a.created_at ? a.created_at.split('T')[0] : 'No date'
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(a)
  })

  if (loading) return <Loading />

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-baseline md:justify-between mb-7 gap-4">
        <h1 className="font-serif text-[24px] font-semibold text-text-primary m-0">Activities</h1>
        <div className="flex gap-1.5 overflow-x-auto md:flex-wrap md:justify-end [scrollbar-width:none] [&::-webkit-scrollbar]:hidden -mx-4 px-4 md:mx-0 md:px-0">
        {typeFilters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-[13.5px] font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              filter === f ? 'bg-text-primary text-bg' : 'text-text-muted hover:bg-border-light hover:text-text-primary'
            }`}
          >
            {f}
          </button>
        ))}
        </div>
      </div>

      <div className="max-w-[960px]">
        {filtered.length === 0 ? (
          <div className="text-text-muted text-[14px] py-4 text-center">No activities found</div>
        ) : (
          Object.entries(grouped).map(([date, items]) => (
            <div key={date} className="mb-7 last:mb-0">
              <div className="text-[12.5px] font-semibold uppercase tracking-[.06em] mb-3 text-text-muted">
                {date === 'No date' ? 'No date' : formatDate(date)}
              </div>
              {items.map(a => {
                const Icon = icons[a.type] || MoreHorizontal
                const c = typeColors[a.type] || { bg: '#F2EDE5', text: '#7C756A' }
                const updates = updatesByParent[a.id] || []
                return (
                  <div key={a.id}>
                    <div onClick={() => openEdit(a)} className="flex items-center gap-3.5 py-2 cursor-pointer hover:bg-border-light px-2.5 -mx-2.5 rounded-xl transition-colors">
                      <span className="rounded-full flex items-center justify-center shrink-0 w-[30px] h-[30px]" style={{ backgroundColor: c.bg, color: c.text }}>
                        <Icon size={14} />
                      </span>
                      <span className="flex-1 min-w-0 flex items-baseline gap-1.5">
                        <span className="text-[15px] font-medium text-text-primary truncate">{a.title}</span>
                        {a.contact?.name && <span className="text-[12.5px] text-text-muted shrink-0">· {a.contact.name}</span>}
                      </span>
                      {a.companies && (
                        <Link to={`/companies/${a.companies.id}`} onClick={e => e.stopPropagation()} className="text-[13.5px] text-text-muted hover:text-text-primary no-underline shrink-0">
                          {a.companies.name}
                        </Link>
                      )}
                      <span className="text-[12.5px] font-semibold shrink-0 w-[80px] text-right" style={{ color: c.text }}>{a.type}</span>
                    </div>
                    {updates.length > 0 && (
                      <div onClick={() => openEdit(a)} className="ml-[46px] mb-1.5 flex flex-col gap-1 border-l-2 border-border pl-3 cursor-pointer">
                        {updates.map(u => (
                          <div key={u.id} className="flex items-baseline gap-2.5">
                            <span className="flex-1 min-w-0 text-[13.5px] text-text-secondary">{u.body}</span>
                            <span className="text-[12px] text-text-muted whitespace-nowrap shrink-0">{formatDate(u.created_at)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))
        )}
      </div>

      <SidePeek title="Edit activity" open={peek.open} onClose={() => setPeek({ open: false, data: null })} onSave={savePeek} onDelete={deletePeek}>
        <FormField label="Type"><TabSelect value={peek.data?.type} onChange={v => setPeek(p => ({ ...p, data: { ...p.data, type: v } }))} options={typeOptions} colors={typeColors} /></FormField>
        <FormField label="Contact"><SearchableSelect value={peek.data?.contact_id || ''} onChange={v => setPeek(p => ({ ...p, data: { ...p.data, contact_id: v } }))} options={contactOptions} placeholder="Who did you talk to?" /></FormField>
        <FormField label="Title *"><Input value={peek.data?.title} onChange={v => setPeek(p => ({ ...p, data: { ...p.data, title: v } }))} placeholder="Activity title" /></FormField>
        <FormField label="Description"><Textarea value={peek.data?.description} onChange={v => setPeek(p => ({ ...p, data: { ...p.data, description: v } }))} placeholder="Details..." rows={8} /></FormField>
        <FormField label="Reminder">
          <div className="grid grid-cols-2 gap-2">
            <DatePicker value={peek.data?.reminder} onChange={v => setPeek(p => ({ ...p, data: { ...p.data, reminder: v } }))} />
            <TimeInput value={peek.data?.reminder_time?.slice(0, 5)} onChange={v => setPeek(p => ({ ...p, data: { ...p.data, reminder_time: v } }))} />
          </div>
        </FormField>
      </SidePeek>

      <SidePeek title="New activity" open={createPeek.open} onClose={() => setCreatePeek({ open: false, data: null })} onSave={saveCreate} saveLabel="Create">
        <FormField label="Company *"><SearchableSelect value={createPeek.data?.company_id} onChange={v => {
          setCreatePeek(p => ({ ...p, data: { ...p.data, company_id: v, contact_id: '' } }))
          // Contacts arrive primary-first — default to the first one
          fetchContactsFor(v, opts => setCreatePeek(p => ({ ...p, data: { ...p.data, contact_id: opts[0]?.value || '' } })))
        }} options={companies} placeholder="Select company..." /></FormField>
        {createPeek.data?.company_id && (
          <FormField label="Contact"><SearchableSelect value={createPeek.data?.contact_id || ''} onChange={v => setCreatePeek(p => ({ ...p, data: { ...p.data, contact_id: v } }))} options={contactOptions} placeholder="Who did you talk to?" /></FormField>
        )}
        <FormField label="Type"><TabSelect value={createPeek.data?.type} onChange={v => setCreatePeek(p => ({ ...p, data: { ...p.data, type: v } }))} options={typeOptions} colors={typeColors} /></FormField>
        <FormField label="Title *"><Input value={createPeek.data?.title} onChange={v => setCreatePeek(p => ({ ...p, data: { ...p.data, title: v } }))} placeholder="Activity title" /></FormField>
        <FormField label="Description"><Textarea value={createPeek.data?.description} onChange={v => setCreatePeek(p => ({ ...p, data: { ...p.data, description: v } }))} placeholder="Details..." rows={8} /></FormField>
        <FormField label="Reminder">
          <div className="grid grid-cols-2 gap-2">
            <DatePicker value={createPeek.data?.reminder} onChange={v => setCreatePeek(p => ({ ...p, data: { ...p.data, reminder: v } }))} />
            <TimeInput value={createPeek.data?.reminder_time} onChange={v => setCreatePeek(p => ({ ...p, data: { ...p.data, reminder_time: v } }))} />
          </div>
        </FormField>
      </SidePeek>
    </div>
  )
}
