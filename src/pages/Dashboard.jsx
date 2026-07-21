import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useWorkspace } from '../lib/WorkspaceContext'
import { relativeTime, formatDate, pipelineText, priorityColor } from '../lib/utils'
import StatusPill from '../components/StatusPill'
import Avatar from '../components/Avatar'
import DatePicker from '../components/DatePicker'
import { Check } from 'lucide-react'
import Loading from '../components/Loading'

export default function Dashboard() {
  const [recentCompanies, setRecentCompanies] = useState([])
  const [followUps, setFollowUps] = useState([])
  const [overdueFollowUps, setOverdueFollowUps] = useState([])
  const [tasks, setTasks] = useState([])
  const [emails, setEmails] = useState([])
  const [loading, setLoading] = useState(true)

  const { ws } = useWorkspace()
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => { load() }, [ws])

  async function load() {
    const [cRes, fRes, ofRes, tRes, eRes] = await Promise.all([
      supabase.from('companies').select('*').eq('workspace_id', ws).is('deleted_at', null).order('last_contact', { ascending: false, nullsFirst: false }).limit(5),
      supabase.from('companies').select('*, people(name, is_primary)').eq('workspace_id', ws).is('deleted_at', null).eq('follow_up', today).order('name'),
      supabase.from('companies').select('*, people(name, is_primary)').eq('workspace_id', ws).is('deleted_at', null).lt('follow_up', today).not('follow_up', 'is', null).order('follow_up'),
      supabase.from('tasks').select('*, companies!inner(name, deleted_at)').eq('workspace_id', ws).is('companies.deleted_at', null).eq('done', false).order('due_date').limit(5),
      supabase.from('emails').select('*, companies(name)').eq('workspace_id', ws).order('received_at', { ascending: false }).limit(5),
    ])
    setRecentCompanies(cRes.data || [])
    setFollowUps(fRes.data || [])
    setOverdueFollowUps(ofRes.data || [])
    setTasks(tRes.data || [])
    setEmails(eRes.data || [])
    setLoading(false)
  }

  async function toggleTask(id, done) {
    await supabase.from('tasks').update({ done: !done }).eq('id', id)
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  async function updateFollowUp(companyId, newDate) {
    await supabase.from('companies').update({ follow_up: newDate || null }).eq('id', companyId)
    load()
  }

  function primaryContact(company) {
    const primary = company.people?.find(p => p.is_primary)
    return primary?.name || company.people?.[0]?.name || null
  }

  if (loading) return <Loading />

  const dateStr = new Date().toLocaleDateString('et-EE', { weekday: 'long', day: 'numeric', month: 'long' })
  const heading = dateStr.charAt(0).toUpperCase() + dateStr.slice(1)
  const openCount = followUps.length + overdueFollowUps.length
  const sub = [
    openCount > 0 ? `${openCount} follow-up${openCount > 1 ? 'i' : ''}` : null,
    tasks.length > 0 ? `${tasks.length} ülesa${tasks.length > 1 ? 'nnet' : 'nne'}` : null,
  ].filter(Boolean)

  return (
    <div className="p-4 md:px-14 md:py-8">
      {/* Greeting spans the full width so both columns start on the same line below it */}
      <div className="mb-10">
        <h1 className="font-serif text-[26px] md:text-[30px] font-semibold tracking-[-0.01em] text-text-primary m-0">{heading}</h1>
        <div className="text-[14px] md:text-[15px] text-text-muted mt-1.5">
          {sub.length ? `${sub.join(' ja ')} ootavad.` : 'Kõik tehtud — rahulik päev.'}
        </div>
      </div>

      <div className="flex gap-16 xl:gap-20">
      <div className="flex-1 max-w-[780px] min-w-0">
        {/* Overdue follow-ups */}
        {overdueFollowUps.length > 0 && (
          <section className="mb-10">
            <h2 className="font-serif text-[18px] font-semibold text-lost mb-4">Overdue follow-ups</h2>
            <div className="space-y-1">
              {overdueFollowUps.map(c => (
                <FollowUpRow key={c.id} company={c} contact={primaryContact(c)} onDateChange={updateFollowUp} overdue />
              ))}
            </div>
          </section>
        )}

        {/* Today: follow-ups + tasks */}
        <section className="mb-10">
          <h2 className="font-serif text-[18px] font-semibold text-text-primary mb-4">Täna</h2>
          {followUps.length === 0 && tasks.length === 0 && (
            <div className="text-[14px] text-text-muted">Täna pole ühtegi follow-upi ega ülesannet</div>
          )}
          {followUps.length > 0 && (
            <div className="space-y-1 mb-5">
              {followUps.map(c => (
                <FollowUpRow key={c.id} company={c} contact={primaryContact(c)} onDateChange={updateFollowUp} />
              ))}
            </div>
          )}
          {tasks.length > 0 && (
            <div className="space-y-3.5">
              {tasks.map(t => (
                <div key={t.id} className="flex items-center gap-3.5">
                  <button type="button" onClick={() => toggleTask(t.id, t.done)} className="cursor-pointer bg-transparent border-none p-0 flex">
                    <div className={`w-[18px] h-[18px] rounded-full border-[1.5px] ${t.done ? 'bg-accent border-accent' : 'border-[#CFC7BA] hover:border-accent'} flex items-center justify-center transition-colors`}>
                      {t.done && <Check size={11} className="text-white" />}
                    </div>
                  </button>
                  <span className="text-[14.5px] text-text-primary flex-1 truncate">{t.title}</span>
                  {t.companies && (
                    <Link to={`/companies/${t.company_id}`} className="text-[13px] text-text-muted hover:text-text-primary no-underline shrink-0">{t.companies.name}</Link>
                  )}
                  {t.due_date && (
                    <span className={`text-[13px] shrink-0 w-14 text-right ${t.due_date < today ? 'text-lost font-medium' : 'text-[#C4BCB1]'}`}>{formatDate(t.due_date)}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recent emails */}
        <section className="mb-8">
          <h2 className="font-serif text-[18px] font-semibold text-text-primary mb-4">Viimased kirjad</h2>
          {emails.length === 0 ? (
            <div className="text-[14px] text-text-muted">No emails</div>
          ) : (
            <div className="space-y-5">
              {emails.map(e => (
                <div key={e.id} className="flex items-start gap-4">
                  <Avatar name={e.from_name || 'U'} size={34} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2.5">
                      {!e.read && <div className="w-1.5 h-1.5 rounded-full bg-accent shrink-0 self-center" />}
                      <span className="text-[14px] font-semibold text-text-primary truncate">{e.from_name}</span>
                      {e.companies && <Link to={`/companies/${e.company_id}`} className="text-[12.5px] text-accent hover:underline no-underline shrink-0">{e.companies.name}</Link>}
                    </div>
                    <div className={`text-[14px] truncate mt-0.5 ${!e.read ? 'font-semibold text-text-primary' : 'text-text-secondary'}`}>{e.subject}</div>
                    <div className="text-[13.5px] text-[#B0A89C] truncate">{e.preview}</div>
                  </div>
                  <span className="text-[13px] text-[#C4BCB1] whitespace-nowrap shrink-0">{relativeTime(e.received_at)}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Right column: recently contacted */}
      <aside className="hidden lg:flex w-[280px] shrink-0 flex-col gap-5">
        <div className="text-[12.5px] font-semibold text-text-muted tracking-[.06em] uppercase">Recently contacted</div>
        <div className="flex flex-col gap-5">
          {recentCompanies.map(c => {
            const pc = priorityColor(c.users_count)
            return (
              <Link key={c.id} to={`/companies/${c.id}`} className="flex items-center gap-3.5 no-underline group">
                <div className="w-[38px] h-[38px] rounded-full flex items-center justify-center text-[12px] font-bold shrink-0" style={{ backgroundColor: pc.bg, color: pc.text }}>
                  {c.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="text-[14px] font-semibold text-text-primary truncate group-hover:underline">{c.name}</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <StatusPill status={c.status} />
                    {c.last_contact && <span className="text-[12.5px] text-[#C4BCB1]">· {relativeTime(c.last_contact)}</span>}
                  </div>
                </div>
              </Link>
            )
          })}
          {recentCompanies.length === 0 && <div className="text-[14px] text-text-muted">No recent contacts</div>}
        </div>
      </aside>
      </div>
    </div>
  )
}

function FollowUpRow({ company: c, contact, onDateChange, overdue }) {
  return (
    <div className={`flex items-center gap-4 py-1.5 pl-5 border-l-[3px] ${overdue ? 'border-[#DCB4AC]' : 'border-accent'}`}>
      <Link to={`/companies/${c.id}`} className="flex flex-col gap-0.5 flex-1 min-w-0 no-underline group">
        <span className={`text-[15px] font-semibold truncate group-hover:underline ${overdue ? 'text-text-secondary' : 'text-text-primary'}`}>{c.name}</span>
        {contact && <span className={`text-[13.5px] truncate ${overdue ? 'text-[#C4BCB1]' : 'text-text-muted'}`}>{contact}</span>}
      </Link>
      <div className={`shrink-0 ${overdue ? 'opacity-55' : ''}`} onClick={e => e.stopPropagation()}>
        <DatePicker value={c.follow_up} onChange={v => onDateChange(c.id, v)} inline />
      </div>
    </div>
  )
}
