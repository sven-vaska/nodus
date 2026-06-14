import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { relativeTime, formatDate, pipelineText } from '../lib/utils'
import StatusPill from '../components/StatusPill'
import Avatar from '../components/Avatar'
import { Check } from 'lucide-react'

export default function Dashboard() {
  const [companies, setCompanies] = useState([])
  const [tasks, setTasks] = useState([])
  const [emails, setEmails] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('companies').select('*').order('last_contact', { ascending: false, nullsFirst: false }).limit(6),
      supabase.from('tasks').select('*, companies(name)').eq('done', false).order('due_date').limit(10),
      supabase.from('emails').select('*, companies(name)').order('received_at', { ascending: false }).limit(6),
    ]).then(([cRes, tRes, eRes]) => {
      setCompanies(cRes.data || [])
      setTasks(tRes.data || [])
      setEmails(eRes.data || [])
      setLoading(false)
    })
  }, [])

  async function toggleTask(id, done) {
    await supabase.from('tasks').update({ done: !done }).eq('id', id)
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !done } : t).filter(t => !t.done || t.id !== id))
  }

  const today = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
  const todayTasks = tasks.filter(t => t.due_date === today)
  const tomorrowTasks = tasks.filter(t => t.due_date === tomorrow)
  const overdueTasks = tasks.filter(t => t.due_date && t.due_date < today)
  const otherTasks = tasks.filter(t => !t.due_date || (t.due_date > tomorrow))

  if (loading) return <div className="p-6 text-text-muted text-[13px]">Laadin...</div>

  return (
    <div className="p-6">
      <h1 className="text-[20px] font-semibold text-text-primary mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
        {/* Recent companies */}
        <div className="bg-surface border border-border rounded-[10px] p-4">
          <h2 className="text-[13px] font-semibold text-text-primary mb-3">Viimati suheldud</h2>
          <div className="space-y-0">
            {companies.map(c => (
              <Link key={c.id} to={`/companies/${c.id}`} className="flex items-center gap-2.5 py-2 border-b border-border-light last:border-0 no-underline hover:bg-[#fafaf9] -mx-2 px-2 rounded transition-colors">
                <div className="w-7 h-7 rounded-md bg-border-light flex items-center justify-center text-[10px] font-semibold text-text-secondary shrink-0">
                  {c.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-medium text-text-primary truncate">{c.name}</div>
                  <div className="text-[11px] text-text-muted">{pipelineText(c)}</div>
                </div>
                <div className="flex flex-col items-end shrink-0">
                  <StatusPill status={c.status} />
                  <span className="text-[10px] text-text-muted mt-0.5">{relativeTime(c.last_contact)}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Tasks */}
        <div className="bg-surface border border-border rounded-[10px] p-4">
          <h2 className="text-[13px] font-semibold text-text-primary mb-3">Ülesanded</h2>
          <div className="space-y-0">
            {overdueTasks.length > 0 && (
              <TaskGroup label="Hilinenud" tasks={overdueTasks} onToggle={toggleTask} danger />
            )}
            {todayTasks.length > 0 && (
              <TaskGroup label={`Täna · ${formatDate(today)}`} tasks={todayTasks} onToggle={toggleTask} />
            )}
            {tomorrowTasks.length > 0 && (
              <TaskGroup label={`Homme · ${formatDate(tomorrow)}`} tasks={tomorrowTasks} onToggle={toggleTask} />
            )}
            {otherTasks.length > 0 && (
              <TaskGroup label="Tulevased" tasks={otherTasks} onToggle={toggleTask} />
            )}
            {tasks.length === 0 && <div className="text-[12px] text-text-muted py-2">Ülesandeid pole</div>}
          </div>
        </div>

        {/* Recent emails */}
        <div className="bg-surface border border-border rounded-[10px] p-4">
          <h2 className="text-[13px] font-semibold text-text-primary mb-3">Viimased emailid</h2>
          <div className="space-y-0">
            {emails.map(e => (
              <div key={e.id} className="flex items-start gap-2.5 py-2 border-b border-border-light last:border-0">
                <Avatar name={e.from_name || 'U'} size={24} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {!e.read && <div className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />}
                    <span className="text-[12px] font-medium text-text-primary truncate">{e.from_name}</span>
                    {e.companies && <span className="text-[10px] text-text-muted">· {e.companies.name}</span>}
                  </div>
                  <div className={`text-[11px] truncate ${!e.read ? 'font-semibold text-text-primary' : 'text-text-secondary'}`}>{e.subject}</div>
                  <div className="text-[10px] text-text-muted truncate">{e.preview}</div>
                </div>
                <span className="text-[10px] text-text-muted whitespace-nowrap shrink-0">{relativeTime(e.received_at)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function TaskGroup({ label, tasks, onToggle, danger }) {
  return (
    <div className="mb-3">
      <div className={`text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${danger ? 'text-lost' : 'text-text-muted'}`}>{label}</div>
      {tasks.map(t => (
        <div key={t.id} className="flex items-center gap-2.5 py-1.5">
          <button onClick={() => onToggle(t.id, t.done)} className="cursor-pointer">
            <div className={`w-3.5 h-3.5 rounded border ${t.done ? 'bg-accent border-accent' : 'border-border'} flex items-center justify-center`}>
              {t.done && <Check size={8} className="text-white" />}
            </div>
          </button>
          <span className="text-[12px] text-text-primary flex-1 truncate">{t.title}</span>
          {t.companies && (
            <Link to={`/companies/${t.company_id}`} className="text-[10px] text-accent hover:underline no-underline shrink-0">{t.companies.name}</Link>
          )}
          <span className={`text-[10px] shrink-0 ${danger ? 'text-lost' : 'text-text-muted'}`}>{formatDate(t.due_date)}</span>
        </div>
      ))}
    </div>
  )
}
