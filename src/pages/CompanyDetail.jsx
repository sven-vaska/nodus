import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { pipelineText, formatDate, relativeTime, monthlyTotal, daysAgo } from '../lib/utils'
import StatusPill from '../components/StatusPill'
import Avatar from '../components/Avatar'
import SidePeek, { FormField, Input, Textarea, Select, Toggle } from '../components/SidePeek'
import { ArrowLeft, ExternalLink, Check, Phone, Mail, Calendar, MessageSquare, MoreHorizontal, Plus, ChevronLeft } from 'lucide-react'

const allStatuses = ['Research', 'In Conversation', 'On Hold', 'Trial', 'Waiting onboarding', 'Onboarding', 'Won', 'Lost', 'Former Client']
const activityTypes = ['Kõne', 'Email', 'Kohtumine', 'Märge', 'Muu']
const activityIcons = { 'Kõne': Phone, 'Email': Mail, 'Kohtumine': Calendar, 'Märge': MessageSquare, 'Muu': MoreHorizontal }

const tabConfig = [
  { key: 'Overview', icon: '⊞' },
  { key: 'Activity', icon: '↗' },
  { key: 'Emails', icon: '✉' },
  { key: 'Notes', icon: '✎' },
  { key: 'Tasks', icon: '☑' },
  { key: 'Files', icon: '📎' },
]

export default function CompanyDetail() {
  const { id } = useParams()
  const [company, setCompany] = useState(null)
  const [contacts, setContacts] = useState([])
  const [activities, setActivities] = useState([])
  const [tasks, setTasks] = useState([])
  const [notes, setNotes] = useState([])
  const [emails, setEmails] = useState([])
  const [activeTab, setActiveTab] = useState('Overview')
  const [statusDropdown, setStatusDropdown] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showSidebar, setShowSidebar] = useState(true)
  const [peek, setPeek] = useState({ type: null, data: null })

  useEffect(() => { load() }, [id])

  async function load() {
    setLoading(true)
    const [cRes, pRes, aRes, tRes, nRes, eRes] = await Promise.all([
      supabase.from('companies').select('*').eq('id', id).single(),
      supabase.from('people').select('*').eq('company_id', id).order('is_primary', { ascending: false }),
      supabase.from('activities').select('*').eq('company_id', id).order('created_at', { ascending: false }),
      supabase.from('tasks').select('*').eq('company_id', id).order('done').order('due_date', { ascending: true }),
      supabase.from('notes').select('*').eq('company_id', id).order('created_at', { ascending: false }),
      supabase.from('emails').select('*').eq('company_id', id).order('received_at', { ascending: false }),
    ])
    setCompany(cRes.data)
    setContacts(pRes.data || [])
    setActivities(aRes.data || [])
    setTasks(tRes.data || [])
    setNotes(nRes.data || [])
    setEmails(eRes.data || [])
    setLoading(false)
  }

  async function updateStatus(newStatus) {
    const updates = { status: newStatus }
    if (['Won', 'Lost'].includes(newStatus) && !company.closed_date) updates.closed_date = new Date().toISOString().split('T')[0]
    if (newStatus === 'In Conversation' && !company.starting_date) updates.starting_date = new Date().toISOString().split('T')[0]
    await supabase.from('companies').update(updates).eq('id', id)
    setCompany({ ...company, ...updates })
    setStatusDropdown(false)
  }

  async function toggleTask(taskId, done) {
    await supabase.from('tasks').update({ done: !done }).eq('id', taskId)
    setTasks(tasks.map(t => t.id === taskId ? { ...t, done: !done } : t))
  }

  function openPeek(type, data = {}) { setPeek({ type, data }) }
  function closePeek() { setPeek({ type: null, data: null }) }

  async function savePeek() {
    const d = peek.data
    const isEdit = !!d.id
    if (peek.type === 'task') {
      if (isEdit) await supabase.from('tasks').update({ title: d.title, due_date: d.due_date || null }).eq('id', d.id)
      else await supabase.from('tasks').insert({ company_id: id, title: d.title, due_date: d.due_date || null })
      setActiveTab('Tasks')
    } else if (peek.type === 'note') {
      if (isEdit) await supabase.from('notes').update({ body: d.body }).eq('id', d.id)
      else await supabase.from('notes').insert({ company_id: id, body: d.body })
      setActiveTab('Notes')
    } else if (peek.type === 'activity') {
      if (isEdit) await supabase.from('activities').update({ type: d.type, title: d.title, body: d.body }).eq('id', d.id)
      else {
        await supabase.from('activities').insert({ company_id: id, type: d.type, title: d.title, body: d.body })
        await supabase.from('companies').update({ last_contact: new Date().toISOString() }).eq('id', id)
      }
      setActiveTab('Activity')
    } else if (peek.type === 'contact') {
      if (d.is_primary) await supabase.from('people').update({ is_primary: false }).eq('company_id', id)
      if (isEdit) await supabase.from('people').update({ name: d.name, role: d.role, email: d.email, phone: d.phone, is_primary: d.is_primary || false }).eq('id', d.id)
      else await supabase.from('people').insert({ company_id: id, name: d.name, role: d.role, email: d.email, phone: d.phone, is_primary: d.is_primary || false })
    }
    closePeek()
    load()
  }

  async function deletePeekItem() {
    const d = peek.data
    if (!d.id) return
    const table = { task: 'tasks', note: 'notes', activity: 'activities', contact: 'people' }[peek.type]
    if (table) await supabase.from(table).delete().eq('id', d.id)
    closePeek()
    load()
  }

  const setPeekData = (key, val) => setPeek(p => ({ ...p, data: { ...p.data, [key]: val } }))

  if (loading) return <div className="p-4 text-text-muted text-[13px]">Laadin...</div>
  if (!company) return <div className="p-4 text-text-muted text-[13px]">Firmat ei leitud</div>

  const mTotal = monthlyTotal(company)
  const nextTask = tasks.find(t => !t.done)

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Left sidebar */}
      <div className={`${showSidebar ? 'w-[340px] lg:w-[380px]' : 'w-0'} border-r border-border bg-surface overflow-y-auto overflow-x-hidden shrink-0 transition-all duration-200 hidden md:block`}>
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-center gap-2 mb-2">
            <Link to="/companies" className="text-text-muted hover:text-text-primary no-underline shrink-0">
              <ChevronLeft size={16} />
            </Link>
            <div className="w-7 h-7 rounded-md bg-border-light flex items-center justify-center text-[11px] font-bold text-text-secondary shrink-0">
              {company.name.slice(0, 2).toUpperCase()}
            </div>
            <h2 className="text-[15px] font-semibold text-text-primary leading-tight truncate">{company.name}</h2>
          </div>

          <div className="relative flex items-center gap-2 mb-3 ml-[38px]">
            <button onClick={() => setStatusDropdown(!statusDropdown)} className="cursor-pointer">
              <StatusPill status={company.status} />
            </button>
            <span className="text-[11px] text-text-secondary">{pipelineText(company)}</span>
            {statusDropdown && (
              <div className="absolute top-6 left-0 bg-surface border border-border rounded-lg shadow-lg z-10 py-1 min-w-[180px]">
                {allStatuses.map(s => (
                  <button key={s} onClick={() => updateStatus(s)} className="w-full text-left px-3 py-1 text-[12px] hover:bg-border-light transition-colors cursor-pointer flex items-center gap-2">
                    <StatusPill status={s} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="px-4 pb-3">
          {company.www && (
            <AttrRow label="Domains">
              <a href={company.www} target="_blank" rel="noopener" className="text-accent hover:underline">{company.www.replace(/^https?:\/\//, '')}</a>
            </AttrRow>
          )}
          <AttrRow label="Kirjeldus"><span className="truncate block">{company.description || '—'}</span></AttrRow>
          <AttrRow label="Reg. nr">{company.company_no || '—'}</AttrRow>
          <AttrRow label="Email">{company.email || '—'}</AttrRow>
          <AttrRow label="Team"><span className="flex items-center gap-1"><Avatar name="Sven Vaska" size={16} /> Sven Vaska</span></AttrRow>

          {((company.sector || []).length > 0 || (company.device || []).length > 0) && (
            <AttrRow label="Categories">
              <div className="flex flex-wrap gap-1">
                {(company.sector || []).map(s => (
                  <span key={s} className="text-[10px] px-1.5 py-px bg-border-light rounded text-text-secondary">{s}</span>
                ))}
                {(company.device || []).map(d => (
                  <span key={d} className="text-[10px] px-1.5 py-px bg-[#eff6ff] rounded text-[#1d4ed8]">{d}</span>
                ))}
              </div>
            </AttrRow>
          )}

          <AttrRow label="Aadress">{company.address || '—'}</AttrRow>
          <AttrRow label="Maakond">{company.county || '—'}</AttrRow>
          <AttrRow label="Allikas">{company.source?.join(', ') || '—'}</AttrRow>
          <AttrRow label="Kuidas leidsid">{company.found_us || '—'}</AttrRow>
          <AttrRow label="Newsletter">{company.newsletter ? '✓ Jah' : '✗ Ei'}</AttrRow>
          {company.version && <AttrRow label="Versioon">{company.version}</AttrRow>}

          <div className="border-t border-border-light mt-2 pt-2">
            {company.software_fee > 0 && <AttrRow label="Tarkvaratasu">{company.software_fee} €/kuu</AttrRow>}
            {company.equipment_rent > 0 && <AttrRow label="Seadmete rent">{company.equipment_rent} €/kuu</AttrRow>}
            {company.chips > 0 && <AttrRow label="Chips">{company.chips} €/kuu</AttrRow>}
            {company.additional_fees > 0 && <AttrRow label="Lisatasud">{company.additional_fees} €</AttrRow>}
            <AttrRow label="Kuumakse"><span className="font-semibold">{mTotal} €/kuu</span></AttrRow>
            {company.users_count && <AttrRow label="Kasutajad">{company.users_count}</AttrRow>}
            {company.start_of_billing && <AttrRow label="Arvelduse algus">{formatDate(company.start_of_billing)}</AttrRow>}
          </div>

          <div className="border-t border-border-light mt-2 pt-2">
            <div className="text-[11px] text-text-muted font-medium mb-1">Kontaktid</div>
            {contacts.map(c => (
              <div key={c.id} onClick={() => openPeek('contact', { ...c })} className="flex items-center gap-2 py-1 cursor-pointer hover:bg-border-light -mx-1 px-1 rounded transition-colors">
                <Avatar name={c.name} size={20} />
                <div className="flex-1 min-w-0">
                  <span className="text-[12px] text-text-primary">{c.name}</span>
                  {c.role && <span className="text-[11px] text-text-muted ml-1">· {c.role}</span>}
                </div>
                {c.is_primary && <div className="w-3 h-3 rounded-full bg-accent flex items-center justify-center"><Check size={8} className="text-white" /></div>}
              </div>
            ))}
            <button onClick={() => openPeek('contact', { name: '', role: '', email: '', phone: '', is_primary: false })} className="flex items-center gap-1 text-[11px] text-accent mt-1 hover:underline cursor-pointer">
              <Plus size={11} /> Lisa kontakt
            </button>
          </div>
        </div>
      </div>

      {/* Right panel — stretches to fill all remaining space */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="md:hidden flex items-center gap-2 px-3 py-2 border-b border-border bg-surface">
          <Link to="/companies" className="text-text-muted hover:text-text-primary no-underline"><ChevronLeft size={16} /></Link>
          <div className="w-6 h-6 rounded bg-border-light flex items-center justify-center text-[10px] font-bold text-text-secondary">{company.name.slice(0, 2).toUpperCase()}</div>
          <span className="text-[14px] font-semibold text-text-primary truncate">{company.name}</span>
          <StatusPill status={company.status} />
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border bg-surface px-4 overflow-x-auto shrink-0">
          {tabConfig.map(({ key, icon }) => {
            const count = key === 'Emails' ? emails.length : key === 'Notes' ? notes.length : key === 'Tasks' ? tasks.length : key === 'Activity' ? activities.length : 0
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-1 px-2.5 py-2 text-[12px] font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === key ? 'border-text-primary text-text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                <span className="text-[11px] opacity-60">{icon}</span>
                <span className="hidden sm:inline">{key}</span>
                {count > 0 && <span className="text-text-muted text-[11px]">{count}</span>}
              </button>
            )
          })}
        </div>

        {/* Tab content — fills remaining height + width */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-5 py-4 lg:px-8">
            {activeTab === 'Overview' && <OverviewTab company={company} nextTask={nextTask} activities={activities} notes={notes} tasks={tasks} />}
            {activeTab === 'Activity' && <ActivityTab activities={activities} onAdd={() => openPeek('activity', { type: 'Kõne', title: '', body: '' })} onEdit={a => openPeek('activity', { ...a })} />}
            {activeTab === 'Emails' && <EmailsTab emails={emails} />}
            {activeTab === 'Notes' && <NotesTab notes={notes} onAdd={() => openPeek('note', { body: '' })} onEdit={n => openPeek('note', { ...n })} />}
            {activeTab === 'Tasks' && <TasksTab tasks={tasks} onToggle={toggleTask} onAdd={() => openPeek('task', { title: '', due_date: '' })} onEdit={t => openPeek('task', { ...t })} />}
            {activeTab === 'Files' && <FilesTab />}
          </div>
        </div>
      </div>

      {/* Side Peeks */}
      <SidePeek title={peek.data?.id ? 'Muuda task' : 'Uus task'} open={peek.type === 'task'} onClose={closePeek} onSave={savePeek} onDelete={peek.data?.id ? deletePeekItem : undefined}>
        <FormField label="Pealkiri *"><Input value={peek.data?.title} onChange={v => setPeekData('title', v)} placeholder="Ülesande kirjeldus" /></FormField>
        <FormField label="Tähtaeg"><Input type="date" value={peek.data?.due_date} onChange={v => setPeekData('due_date', v)} /></FormField>
      </SidePeek>

      <SidePeek title={peek.data?.id ? 'Muuda märge' : 'Uus märge'} open={peek.type === 'note'} onClose={closePeek} onSave={savePeek} onDelete={peek.data?.id ? deletePeekItem : undefined}>
        <FormField label="Sisu *"><Textarea value={peek.data?.body} onChange={v => setPeekData('body', v)} rows={6} placeholder="Kirjuta märge..." /></FormField>
      </SidePeek>

      <SidePeek title={peek.data?.id ? 'Muuda tegevus' : 'Uus tegevus'} open={peek.type === 'activity'} onClose={closePeek} onSave={savePeek} onDelete={peek.data?.id ? deletePeekItem : undefined}>
        <FormField label="Tüüp"><Select value={peek.data?.type} onChange={v => setPeekData('type', v)} options={activityTypes} /></FormField>
        <FormField label="Pealkiri *"><Input value={peek.data?.title} onChange={v => setPeekData('title', v)} placeholder="Tegevuse pealkiri" /></FormField>
        <FormField label="Kirjeldus"><Textarea value={peek.data?.body} onChange={v => setPeekData('body', v)} placeholder="Lisainfo..." /></FormField>
      </SidePeek>

      <SidePeek title={peek.data?.id ? 'Muuda kontakt' : 'Uus kontakt'} open={peek.type === 'contact'} onClose={closePeek} onSave={savePeek} onDelete={peek.data?.id ? deletePeekItem : undefined}>
        <FormField label="Nimi *"><Input value={peek.data?.name} onChange={v => setPeekData('name', v)} placeholder="Eesnimi Perenimi" /></FormField>
        <FormField label="Ametikoht"><Input value={peek.data?.role} onChange={v => setPeekData('role', v)} placeholder="nt Tegevjuht" /></FormField>
        <FormField label="Email"><Input value={peek.data?.email} onChange={v => setPeekData('email', v)} type="email" placeholder="nimi@firma.ee" /></FormField>
        <FormField label="Telefon"><Input value={peek.data?.phone} onChange={v => setPeekData('phone', v)} placeholder="+372 ..." /></FormField>
        <FormField label="Peamine kontakt"><Toggle checked={peek.data?.is_primary || false} onChange={v => setPeekData('is_primary', v)} label="Märgi peamiseks kontaktiks" /></FormField>
      </SidePeek>
    </div>
  )
}

function AttrRow({ label, children }) {
  return (
    <div className="flex items-start py-[5px] text-[12px] gap-3">
      <span className="text-text-muted w-[110px] shrink-0 truncate">{label}</span>
      <div className="flex-1 min-w-0 text-text-primary">{children}</div>
    </div>
  )
}

function OverviewTab({ company, nextTask, activities, notes, tasks }) {
  const cards = [
    { label: 'Pipeline status', content: <><StatusPill status={company.status} /> <span className="text-[11px] text-text-secondary ml-1">{pipelineText(company)}</span></> },
    { label: 'Follow-Up', content: company.follow_up ? (
      <span className={`text-[13px] font-semibold ${new Date(company.follow_up) < new Date() ? 'text-lost' : 'text-text-primary'}`}>{formatDate(company.follow_up)}</span>
    ) : <span className="text-text-muted text-[12px]">—</span> },
    { label: 'Team', content: <span className="flex items-center gap-1.5"><Avatar name="Sven Vaska" size={18} /> <span className="text-[12px]">Sven Vaska</span></span> },
    { label: 'Kuumakse', content: <span className="text-[14px] font-semibold text-text-primary">{monthlyTotal(company)} €</span> },
    { label: 'Kasutajad', content: <span className="text-[14px] font-semibold text-text-primary">{company.users_count || '—'}</span> },
    { label: 'Trial lõpeb', content: company.trial_ends ? (
      <span className={`text-[13px] font-semibold ${daysAgo(company.trial_ends) !== null && daysAgo(company.trial_ends) > -7 ? 'text-lost' : 'text-text-primary'}`}>{formatDate(company.trial_ends)}</span>
    ) : <span className="text-text-muted text-[12px]">—</span> },
  ]
  return (
    <div className="space-y-5">
      <div>
        <div className="text-[12px] font-medium text-text-secondary mb-2">Highlights</div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
          {cards.map(({ label, content }) => (
            <div key={label} className="bg-surface border border-border rounded-lg px-3 py-2.5">
              <div className="text-[10px] text-text-muted uppercase tracking-wide mb-1">{label}</div>
              <div>{content}</div>
            </div>
          ))}
        </div>
      </div>

      {activities.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[12px] font-medium text-text-secondary">Activity</span>
            <span className="text-[11px] text-text-muted cursor-pointer hover:text-text-secondary">View all</span>
          </div>
          {activities.slice(0, 3).map(a => (
            <div key={a.id} className="flex items-center gap-2 py-1.5 text-[12px]">
              <Avatar name={a.created_by || 'SV'} size={20} />
              <span className="text-text-primary font-medium shrink-0">Sven Vaska</span>
              <span className="text-text-secondary truncate">{a.title}</span>
              <span className="ml-auto text-[11px] text-text-muted shrink-0">{relativeTime(a.created_at)}</span>
            </div>
          ))}
        </div>
      )}

      {notes.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[12px] font-medium text-text-secondary">Notes <span className="text-text-muted">{notes.length}</span></span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-text-muted cursor-pointer hover:text-text-secondary">View all</span>
              <Plus size={12} className="text-text-muted cursor-pointer hover:text-text-secondary" />
            </div>
          </div>
          {notes.slice(0, 3).map(n => (
            <div key={n.id} className="flex items-center gap-2 py-1.5 text-[12px]">
              <Avatar name={n.created_by || 'SV'} size={20} />
              <span className="text-text-primary truncate flex-1">{n.body}</span>
              <span className="text-[11px] text-text-muted shrink-0">{relativeTime(n.created_at)}</span>
            </div>
          ))}
        </div>
      )}

      {tasks.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[12px] font-medium text-text-secondary">Tasks <span className="text-text-muted">{tasks.length}</span></span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-text-muted cursor-pointer hover:text-text-secondary">View all</span>
              <Plus size={12} className="text-text-muted cursor-pointer hover:text-text-secondary" />
            </div>
          </div>
          {tasks.filter(t => !t.done).slice(0, 3).map(t => (
            <div key={t.id} className="flex items-center gap-2 py-1.5 text-[12px]">
              <div className="w-4 h-4 rounded border border-border flex items-center justify-center shrink-0" />
              <span className="text-text-primary flex-1 truncate">{t.title}</span>
              <Avatar name="Sven Vaska" size={16} />
              {t.due_date && <span className={`text-[11px] shrink-0 ${new Date(t.due_date) < new Date() ? 'text-lost' : 'text-warning'}`}>{formatDate(t.due_date)}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ActivityTab({ activities, onAdd, onEdit }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[12px] font-medium text-text-secondary">Activity</span>
        <button onClick={onAdd} className="flex items-center gap-1 text-[11px] text-accent hover:underline cursor-pointer"><Plus size={11} /></button>
      </div>
      {activities.map(a => {
        const Icon = activityIcons[a.type] || MoreHorizontal
        return (
          <div key={a.id} onClick={() => onEdit(a)} className="flex items-start gap-2 py-2 border-b border-border-light last:border-0 cursor-pointer hover:bg-[#fafaf9] px-1.5 -mx-1.5 rounded transition-colors">
            <Avatar name={a.created_by || 'SV'} size={22} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-[12px]">
                <Icon size={11} className="text-text-muted shrink-0" />
                <span className="font-medium text-text-primary">{a.title}</span>
                <span className="text-[10px] px-1 py-px bg-border-light rounded text-text-secondary">{a.type}</span>
              </div>
              {a.body && <div className="text-[11px] text-text-secondary mt-px truncate">{a.body}</div>}
            </div>
            <span className="text-[11px] text-text-muted whitespace-nowrap shrink-0">{relativeTime(a.created_at)}</span>
          </div>
        )
      })}
    </div>
  )
}

function EmailsTab({ emails }) {
  const [openId, setOpenId] = useState(null)
  return (
    <div>
      <span className="text-[12px] font-medium text-text-secondary">Emails</span>
      <div className="mt-2">
        {emails.map(e => (
          <div key={e.id}>
            <div onClick={() => setOpenId(openId === e.id ? null : e.id)} className="flex items-start gap-2 py-2 border-b border-border-light cursor-pointer hover:bg-[#fafaf9] px-1.5 -mx-1.5 rounded transition-colors">
              <Avatar name={e.from_name || 'U'} size={22} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-[12px]">
                  {!e.read && <div className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />}
                  <span className={`${!e.read ? 'font-semibold' : 'font-medium'} text-text-primary`}>{e.from_name}</span>
                  <span className="text-text-muted text-[11px]">{e.from_email}</span>
                </div>
                <div className={`text-[12px] ${!e.read ? 'font-semibold' : ''} text-text-primary`}>{e.subject}</div>
                {openId !== e.id && <div className="text-[11px] text-text-secondary truncate">{e.preview}</div>}
              </div>
              <span className="text-[11px] text-text-muted whitespace-nowrap shrink-0">{relativeTime(e.received_at)}</span>
            </div>
            {openId === e.id && (
              <div className="bg-surface border border-border rounded-lg p-3 mb-1 ml-8">
                <div className="text-[12px] text-text-primary whitespace-pre-line">{e.body}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function NotesTab({ notes, onAdd, onEdit }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[12px] font-medium text-text-secondary">Notes</span>
        <button onClick={onAdd} className="flex items-center gap-1 text-[11px] text-accent hover:underline cursor-pointer"><Plus size={11} /></button>
      </div>
      {notes.map(n => (
        <div key={n.id} onClick={() => onEdit(n)} className="flex items-start gap-2 py-2 border-b border-border-light last:border-0 cursor-pointer hover:bg-[#fafaf9] px-1.5 -mx-1.5 rounded transition-colors">
          <Avatar name={n.created_by || 'SV'} size={22} />
          <div className="flex-1 min-w-0 text-[12px] text-text-primary">{n.body}</div>
          <span className="text-[11px] text-text-muted whitespace-nowrap shrink-0">{relativeTime(n.created_at)}</span>
        </div>
      ))}
    </div>
  )
}

function TasksTab({ tasks, onToggle, onAdd, onEdit }) {
  const open = tasks.filter(t => !t.done)
  const done = tasks.filter(t => t.done)
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[12px] font-medium text-text-secondary">Tasks</span>
        <button onClick={onAdd} className="flex items-center gap-1 text-[11px] text-accent hover:underline cursor-pointer"><Plus size={11} /></button>
      </div>
      {open.map(t => <TaskRow key={t.id} task={t} onToggle={onToggle} onEdit={onEdit} />)}
      {done.length > 0 && (
        <>
          <div className="text-[10px] text-text-muted uppercase tracking-wide mt-3 mb-1">Tehtud</div>
          {done.map(t => <TaskRow key={t.id} task={t} onToggle={onToggle} onEdit={onEdit} />)}
        </>
      )}
    </div>
  )
}

function TaskRow({ task, onToggle, onEdit }) {
  const overdue = !task.done && task.due_date && new Date(task.due_date) < new Date()
  return (
    <div className="flex items-center gap-2 py-1.5 border-b border-border-light last:border-0 cursor-pointer hover:bg-[#fafaf9] px-1.5 -mx-1.5 rounded transition-colors" onClick={() => onEdit(task)}>
      <button onClick={e => { e.stopPropagation(); onToggle(task.id, task.done) }} className="cursor-pointer shrink-0">
        <div className={`w-[14px] h-[14px] rounded border ${task.done ? 'bg-accent border-accent' : 'border-border'} flex items-center justify-center`}>
          {task.done && <Check size={9} className="text-white" />}
        </div>
      </button>
      <span className={`flex-1 text-[12px] ${task.done ? 'line-through text-text-muted' : 'text-text-primary'}`}>{task.title}</span>
      <Avatar name="Sven Vaska" size={16} />
      {task.due_date && (
        <span className={`text-[11px] ${overdue ? 'text-lost font-medium' : 'text-text-secondary'}`}>{formatDate(task.due_date)}</span>
      )}
    </div>
  )
}

function FilesTab() {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[12px] font-medium text-text-secondary">Files</span>
        <button className="flex items-center gap-1 text-[11px] text-accent hover:underline cursor-pointer"><Plus size={11} /></button>
      </div>
      <div className="text-[12px] text-text-muted">Faile pole veel lisatud.</div>
    </div>
  )
}
