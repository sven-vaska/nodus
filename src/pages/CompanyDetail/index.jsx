import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { mergeFinance, FINANCE_FIELDS } from '../../lib/utils'
import { useWorkspace } from '../../lib/WorkspaceContext'
import { failed } from '../../lib/toast'
import { ChevronLeft, Plus } from 'lucide-react'

import CompanySidebar from './CompanySidebar'
import StatusPill from '../../components/StatusPill'
import { EditableText } from './EditableFields'
import { priorityColor } from '../../lib/utils'
import PeekForms from './PeekForms'
import { tabConfig, tabModuleReq } from './constants'
import OverviewTab from './tabs/OverviewTab'
import MobileDetailsTab from './tabs/MobileDetailsTab'
import ActivityTab from './tabs/ActivityTab'
import EmailsTab from './tabs/EmailsTab'
import NotesTab from './tabs/NotesTab'
import TasksTab from './tabs/TasksTab'
import FilesTab from './tabs/FilesTab'
import SubscriptionTab from './tabs/SubscriptionTab'
import OffersTab from './tabs/OffersTab'
import StatisticsTab from './tabs/StatisticsTab'
import Loading from '../../components/Loading'

export default function CompanyDetail() {
  const { id } = useParams()
  const [company, setCompany] = useState(null)
  const [contacts, setContacts] = useState([])
  const [activities, setActivities] = useState([])
  const [tasks, setTasks] = useState([])
  const [notes, setNotes] = useState([])
  const [emails, setEmails] = useState([])
  const [modules, setModules] = useState([])
  const [companyLinks, setCompanyLinks] = useState([])
  const [activeTab, setActiveTab] = useState('Overview')
  const [statusDropdown, setStatusDropdown] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showSidebar] = useState(true)
  const [peek, setPeek] = useState({ type: null, data: null })
  const { canEdit, hasModule, hasFinance } = useWorkspace()

  // Tabs backed by an unshared module (or the finance field group) are hidden
  const visibleTabs = tabConfig.filter(t => {
    if (t.key === 'Subscription') return hasFinance
    const req = tabModuleReq[t.key]
    return !req || hasModule(req)
  })

  const mobileTabs = visibleTabs.map(t => t.key)
  const swipeRef = useRef({ startX: 0, startY: 0 })
  const swipeHandlers = {
    onTouchStart: e => {
      swipeRef.current.startX = e.touches[0].clientX
      swipeRef.current.startY = e.touches[0].clientY
    },
    onTouchEnd: e => {
      const dx = e.changedTouches[0].clientX - swipeRef.current.startX
      const dy = e.changedTouches[0].clientY - swipeRef.current.startY
      if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx)) return
      const idx = mobileTabs.indexOf(activeTab)
      if (dx < 0 && idx < mobileTabs.length - 1) setActiveTab(mobileTabs[idx + 1])
      if (dx > 0 && idx > 0) setActiveTab(mobileTabs[idx - 1])
    },
  }

  // Guards against a slow response for a previous company overwriting the
  // current one when navigating quickly between companies
  const loadSeq = useRef(0)

  useEffect(() => { load() }, [id])

  async function load() {
    const seq = ++loadSeq.current
    setLoading(true)
    const [cRes, pRes, aRes, tRes, nRes, eRes, mRes, lRes] = await Promise.all([
      supabase.from('companies').select('*, company_finance(*), creator:profiles!created_by(full_name)').eq('id', id).single(),
      supabase.from('people').select('*').eq('company_id', id).order('is_primary', { ascending: false }),
      supabase.from('activities').select('*, contact:people!contact_id(id, name)').eq('company_id', id).order('created_at', { ascending: false }),
      supabase.from('tasks').select('*').eq('company_id', id).order('done').order('due_date', { ascending: true }),
      supabase.from('notes').select('*').eq('company_id', id).order('created_at', { ascending: false }),
      supabase.from('emails').select('*').eq('company_id', id).order('received_at', { ascending: false }),
      supabase.from('company_modules').select('*').eq('company_id', id).order('sort_order'),
      supabase.from('company_links').select('id, company_a, company_b, a:companies!company_links_company_a_fkey(id, name), b:companies!company_links_company_b_fkey(id, name)').or(`company_a.eq.${id},company_b.eq.${id}`),
    ])
    if (seq !== loadSeq.current) return
    setCompany(mergeFinance(cRes.data))
    setContacts(pRes.data || [])
    setActivities(aRes.data || [])
    setTasks(tRes.data || [])
    setNotes(nRes.data || [])
    setEmails(eRes.data || [])
    setModules(mRes.data || [])
    // Normalize symmetric links to "the other company" regardless of direction
    setCompanyLinks((lRes.data || []).map(r => ({ linkId: r.id, company: r.company_a === id ? r.b : r.a })).filter(l => l.company))
    setLoading(false)
  }

  async function updateField(field, value) {
    // Pricing fields live in company_finance (separate RLS gate)
    const res = FINANCE_FIELDS.includes(field)
      ? await supabase.from('company_finance').upsert({ company_id: id, [field]: value })
      : await supabase.from('companies').update({ [field]: value }).eq('id', id)
    if (failed(res, 'Saving failed')) return
    setCompany(c => ({ ...c, [field]: value }))
  }

  async function updateStatus(newStatus) {
    const updates = { status: newStatus, status_changed_at: new Date().toISOString() }
    if (['Won', 'Lost'].includes(newStatus) && !company.closed_date) updates.closed_date = new Date().toISOString().split('T')[0]
    if (newStatus === 'In Conversation' && !company.starting_date) updates.starting_date = new Date().toISOString().split('T')[0]
    const res = await supabase.from('companies').update(updates).eq('id', id)
    if (failed(res, 'Saving status failed')) return
    setCompany({ ...company, ...updates })
    setStatusDropdown(false)
  }

  async function togglePrimary(contactId, wasPrimary) {
    if (wasPrimary) return
    const res1 = await supabase.from('people').update({ is_primary: false }).eq('company_id', id)
    if (failed(res1, 'Saving failed')) return
    const res2 = await supabase.from('people').update({ is_primary: true }).eq('id', contactId)
    if (failed(res2, 'Saving failed')) { load(); return }
    setContacts(contacts.map(c => ({ ...c, is_primary: c.id === contactId })))
  }

  async function toggleTask(taskId, done) {
    const res = await supabase.from('tasks').update({ done: !done }).eq('id', taskId)
    if (failed(res, 'Saving task failed')) return
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, done: !done } : t))
  }

  function openPeek(type, data = {}) {
    // New activities default to the primary contact — adjustable in the form
    if (type === 'activity' && !data.id && !data.contact_id) {
      const primary = contacts.find(c => c.is_primary) || contacts[0]
      if (primary) data = { ...data, contact_id: primary.id }
    }
    setPeek({ type, data })
  }
  function closePeek() { setPeek({ type: null, data: null }) }

  async function savePeek() {
    const d = peek.data
    const isEdit = !!d.id
    let res
    if (peek.type === 'task') {
      if (isEdit) res = await supabase.from('tasks').update({ title: d.title, due_date: d.due_date || null }).eq('id', d.id)
      else res = await supabase.from('tasks').insert({ company_id: id, title: d.title, due_date: d.due_date || null })
      if (failed(res, 'Saving task failed')) return
      setActiveTab('Tasks')
    } else if (peek.type === 'note') {
      if (isEdit) res = await supabase.from('notes').update({ body: d.body }).eq('id', d.id)
      else res = await supabase.from('notes').insert({ company_id: id, body: d.body })
      if (failed(res, 'Saving note failed')) return
      setActiveTab('Notes')
    } else if (peek.type === 'activity') {
      if (isEdit) res = await supabase.from('activities').update({ type: d.type, title: d.title, body: d.body, contact_id: d.contact_id || null, reminder: d.reminder || null, reminder_time: d.reminder ? d.reminder_time || null : null }).eq('id', d.id)
      else {
        res = await supabase.from('activities').insert({ company_id: id, type: d.type, title: d.title, body: d.body, contact_id: d.contact_id || null, reminder: d.reminder || null, reminder_time: d.reminder ? d.reminder_time || null : null })
        if (!res.error) await supabase.from('companies').update({ last_contact: new Date().toISOString() }).eq('id', id)
      }
      if (failed(res, 'Saving activity failed')) return
      setActiveTab('Activity')
    } else if (peek.type === 'contact') {
      if (d.is_primary) {
        res = await supabase.from('people').update({ is_primary: false }).eq('company_id', id)
        if (failed(res, 'Saving contact failed')) return
      }
      if (isEdit) res = await supabase.from('people').update({ name: d.name, role: d.role, email: d.email, alt_emails: d.alt_emails || [], phone: d.phone, is_primary: d.is_primary || false, newsletter: d.newsletter || false, notes: d.notes || null }).eq('id', d.id)
      else res = await supabase.from('people').insert({ company_id: id, name: d.name, role: d.role, email: d.email, alt_emails: d.alt_emails || [], phone: d.phone, is_primary: d.is_primary || false, newsletter: d.newsletter || false, notes: d.notes || null })
      if (failed(res, 'Saving contact failed')) return
    }
    closePeek()
    load()
  }

  async function addCompanyLink(otherId) {
    const res = await supabase.from('company_links').insert({ company_a: id, company_b: otherId })
    if (failed(res, 'Linking failed')) return
    load()
  }

  async function removeCompanyLink(linkId) {
    const res = await supabase.from('company_links').delete().eq('id', linkId)
    if (failed(res, 'Unlinking failed')) return
    load()
  }

  async function addActivityUpdate(parent, text) {
    if (!text?.trim()) return false
    const res = await supabase.from('activities').insert({
      company_id: id, parent_id: parent.id, type: parent.type, title: 'Update', body: text.trim(),
    })
    if (failed(res, 'Saving update failed')) return false
    // An update is real contact/progress — bump last_contact like a new activity
    await supabase.from('companies').update({ last_contact: new Date().toISOString() }).eq('id', id)
    load()
    return true
  }

  async function deletePeekItem() {
    const d = peek.data
    if (!d.id) return
    const table = { task: 'tasks', note: 'notes', activity: 'activities', contact: 'people' }[peek.type]
    if (table) {
      const res = await supabase.from(table).delete().eq('id', d.id)
      if (failed(res, 'Deleting failed')) return
    }
    closePeek()
    load()
  }

  const setPeekData = (key, val) => setPeek(p => ({ ...p, data: { ...p.data, [key]: val } }))

  if (loading) return <Loading />
  if (!company) return <div className="p-4 text-text-muted text-[15px]">Company not found</div>

  const isArchived = !!company.deleted_at
  const nextTask = tasks.find(t => !t.done)

  // Sub-activities: updates thread under their parent instead of appearing as
  // standalone timeline rows. One level only — updates can't have updates.
  const updatesByParent = {}
  for (const a of activities) {
    if (a.parent_id) (updatesByParent[a.parent_id] ||= []).push(a)
  }
  for (const list of Object.values(updatesByParent)) {
    list.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  }

  // One chronological feed: manually logged activities + synced emails.
  // This is the core idea of the CRM — everything about a company in order.
  const timeline = [
    ...activities.filter(a => !a.parent_id).map(a => ({ kind: 'activity', ts: a.created_at, item: a, updates: updatesByParent[a.id] || [] })),
    ...emails.map(e => ({ kind: 'email', ts: e.received_at, item: e })),
  ].sort((a, b) => new Date(b.ts) - new Date(a.ts))

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {isArchived && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-lost text-white text-center py-2 text-[14px] font-semibold tracking-wide">
          Archived — this company has been deleted
        </div>
      )}

      {/* Desktop header: back · avatar · name · status · add activity */}
      <div className="hidden md:flex items-center gap-4 px-6 pt-5 pb-4 shrink-0" style={isArchived ? { marginTop: '40px' } : undefined}>
        <Link to="/companies" className="text-text-muted hover:text-text-primary no-underline shrink-0"><ChevronLeft size={20} /></Link>
        <div className="w-[46px] h-[46px] rounded-full flex items-center justify-center text-[14px] font-bold shrink-0" style={{ backgroundColor: priorityColor(company.users_count).bg, color: priorityColor(company.users_count).text }}>
          {company.name.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex flex-col gap-0.5 min-w-0">
          <EditableText value={company.name} field="name" onSave={updateField} className="font-serif text-[24px] font-semibold tracking-[-0.01em] text-text-primary leading-tight truncate" />
          <StatusPill status={company.status} />
        </div>
        {canEdit && hasModule('activities') && (
          <button
            onClick={() => openPeek('activity', { type: 'Call', title: '', body: '' })}
            className="ml-auto flex items-center gap-1.5 px-5 py-2.5 bg-accent text-white rounded-full text-[14px] font-semibold hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus size={14} /> Add activity
          </button>
        )}
      </div>

      <div className="flex flex-1 min-h-0 w-full overflow-hidden">
      <CompanySidebar
        company={company}
        contacts={contacts}
        canEdit={canEdit}
        isArchived={isArchived}
        showSidebar={showSidebar}
        onUpdateField={updateField}
        onOpenPeek={openPeek}
        onTogglePrimary={togglePrimary}
        companyLinks={companyLinks}
        onAddLink={addCompanyLink}
        onRemoveLink={removeCompanyLink}
      />

      {/* Right panel */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <div className="md:hidden flex items-center gap-2 px-4 pt-3 pb-3 bg-surface">
          <Link to="/companies" className="text-text-muted hover:text-text-primary no-underline shrink-0"><ChevronLeft size={18} /></Link>
          <span className="font-serif text-[20px] font-semibold text-text-primary truncate">{company.name}</span>
        </div>

        {/* Tabs */}
        <div className="flex items-center bg-surface px-3 md:px-4 md:pt-4 pb-2 md:pb-0 overflow-x-auto shrink-0 sticky top-0 z-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {visibleTabs.map(({ key, icon: TabIcon, mobileOnly }) => {
            const count = key === 'Emails' ? emails.length : key === 'Notes' ? notes.length : key === 'Tasks' ? tasks.length : key === 'Activity' ? activities.filter(a => !a.parent_id).length : 0
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-[14.5px] transition-colors cursor-pointer whitespace-nowrap ${mobileOnly ? 'md:hidden' : ''} ${
                  activeTab === key ? 'text-text-primary font-semibold shadow-[inset_0_-2px_0_#B4552D]' : 'text-text-muted hover:text-text-primary'
                }`}
              >
                <TabIcon size={15} className="md:hidden" />
                <span className="hidden md:inline">{key}</span>
                <span className="md:hidden text-[13px]">{key}</span>
                {count > 0 && <span className="text-[#C4BCB1] text-[13px]">{count}</span>}
              </button>
            )
          })}
          <div className="flex-1" />
        </div>

        <div className="flex-1 overflow-y-auto pb-[calc(env(safe-area-inset-bottom,0px)+96px)] md:pb-0" {...swipeHandlers}>
          <div className="px-4 pt-5 pb-4 md:px-5 md:pt-6 lg:px-8">
            {activeTab === 'Overview' && <OverviewTab company={company} nextTask={nextTask} timeline={timeline} notes={notes} tasks={tasks} contacts={contacts} companyLinks={companyLinks} onAddLink={addCompanyLink} onRemoveLink={removeCompanyLink} onToggleTask={toggleTask} onUpdateFollowUp={async (date) => {
                await supabase.from('companies').update({ follow_up: date }).eq('id', id)
                setCompany(c => ({ ...c, follow_up: date }))
              }} onUpdateStatus={updateStatus} onUpdateTrialEnds={async (date) => {
                await supabase.from('companies').update({ trial_ends: date }).eq('id', id)
                setCompany(c => ({ ...c, trial_ends: date }))
              }} statusDropdown={statusDropdown} setStatusDropdown={setStatusDropdown} onSwitchTab={setActiveTab} onAddNote={() => openPeek('note', { body: '' })} onAddTask={() => openPeek('task', { title: '', due_date: '' })} onAddActivity={() => openPeek('activity', { type: 'Call', title: '', body: '' })} onEditActivity={a => openPeek('activity', { ...a })} onEditNote={n => openPeek('note', { ...n })} onEditTask={t => openPeek('task', { ...t })} />}
            {activeTab === 'Details' && <MobileDetailsTab company={company} contacts={contacts} onUpdateField={updateField} onOpenContact={(c) => openPeek('contact', { ...c })} onAddContact={() => openPeek('contact', { name: '', role: '', email: '', alt_emails: [], phone: '', is_primary: false, newsletter: false, notes: '' })} onTogglePrimary={togglePrimary} />}
            {activeTab === 'Activity' && <ActivityTab timeline={timeline} onEdit={a => openPeek('activity', { ...a })} onOpenEmails={() => setActiveTab('Emails')} />}
            {activeTab === 'Emails' && <EmailsTab emails={emails} />}
            {activeTab === 'Notes' && <NotesTab notes={notes} onAdd={() => openPeek('note', { body: '' })} onEdit={n => openPeek('note', { ...n })} />}
            {activeTab === 'Tasks' && <TasksTab tasks={tasks} onToggle={toggleTask} onAdd={() => openPeek('task', { title: '', due_date: '' })} onEdit={t => openPeek('task', { ...t })} />}
            {activeTab === 'Files' && <FilesTab />}
            {activeTab === 'Subscription' && <SubscriptionTab company={company} modules={modules} companyId={id} onUpdateCompany={(field, value) => updateField(field, value)} onReloadModules={async () => { const { data } = await supabase.from('company_modules').select('*').eq('company_id', id).order('sort_order'); setModules(data || []) }} />}
            {activeTab === 'Offers' && <OffersTab companyId={id} companyName={company.name} />}
            {activeTab === 'Statistics' && <StatisticsTab company={company} activities={activities} tasks={tasks} notes={notes} emails={emails} contacts={contacts} companyId={id} />}
          </div>
        </div>
      </div>
      </div>

      <PeekForms peek={peek} setPeekData={setPeekData} closePeek={closePeek} savePeek={savePeek} deletePeekItem={deletePeekItem}
        activityUpdates={peek.type === 'activity' && peek.data?.id ? updatesByParent[peek.data.id] || [] : []}
        onAddUpdate={addActivityUpdate} contacts={contacts} />
    </div>
  )
}
