import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useUser } from '../lib/UserContext'
import { useWorkspace } from '../lib/WorkspaceContext'
import { formatDate } from '../lib/utils'
import Avatar from '../components/Avatar'
import SidePeek, { FormField, Input } from '../components/SidePeek'
import DatePicker from '../components/DatePicker'
import { Check, ArrowUpRight } from 'lucide-react'

const filters = ['All', 'Today', 'Tomorrow', 'Overdue', 'Done']

export default function Tasks() {
  const [tasks, setTasks] = useState([])
  const [filter, setFilter] = useState('All')
  const [loading, setLoading] = useState(true)
  const { profile } = useUser()
  const [peek, setPeek] = useState({ open: false, data: null })

  const { ws } = useWorkspace()

  function fetchTasks() {
    supabase
      .from('tasks')
      .select('*, companies!inner(id, name, deleted_at)')
      .eq('workspace_id', ws)
      .is('companies.deleted_at', null)
      .order('done')
      .order('due_date', { ascending: true, nullsFirst: false })
      .then(({ data }) => {
        setTasks(data || [])
        setLoading(false)
      })
  }

  useEffect(() => { fetchTasks() }, [ws])

  async function toggleTask(id, done) {
    await supabase.from('tasks').update({ done: !done }).eq('id', id)
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !done } : t))
  }

  function openEdit(t) {
    setPeek({ open: true, data: { ...t } })
  }

  async function savePeek() {
    const d = peek.data
    if (!d?.title?.trim()) return
    await supabase.from('tasks').update({ title: d.title, due_date: d.due_date || null }).eq('id', d.id)
    setPeek({ open: false, data: null })
    fetchTasks()
  }

  async function deletePeek() {
    if (!confirm('Delete this task?')) return
    await supabase.from('tasks').delete().eq('id', peek.data.id)
    setPeek({ open: false, data: null })
    fetchTasks()
  }

  const today = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]

  const filtered = tasks.filter(t => {
    if (filter === 'Today') return t.due_date === today && !t.done
    if (filter === 'Tomorrow') return t.due_date === tomorrow && !t.done
    if (filter === 'Overdue') return t.due_date && t.due_date < today && !t.done
    if (filter === 'Done') return t.done
    return true
  })

  const grouped = {}
  filtered.forEach(t => {
    const key = t.done ? 'Done' : (t.due_date || 'No date')
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(t)
  })

  function dateLabel(date) {
    if (date === 'Done') return 'Done'
    if (date === 'No date') return 'No date'
    if (date === today) return 'Today'
    if (date === tomorrow) return 'Tomorrow'
    return formatDate(date)
  }

  function dueBadge(date, done) {
    if (!date || done) return null
    const isToday = date === today
    const isTomorrow = date === tomorrow
    const overdue = date < today
    const label = isToday ? 'Today' : isTomorrow ? 'Tomorrow' : formatDate(date)
    const color = overdue ? 'text-lost' : isToday ? 'text-warning' : 'text-text-secondary'
    return <span className={`text-[12px] font-medium ${color}`}>{label}</span>
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-baseline md:justify-between mb-7 gap-4">
        <h1 className="font-serif text-[24px] font-semibold text-text-primary m-0">Tasks</h1>
        <div className="flex gap-1.5 overflow-x-auto md:flex-wrap md:justify-end [scrollbar-width:none] [&::-webkit-scrollbar]:hidden -mx-4 px-4 md:mx-0 md:px-0">
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-[13.5px] font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              filter === f
                ? 'bg-text-primary text-bg'
                : 'text-text-muted hover:bg-border-light hover:text-text-primary'
            }`}
          >
            {f}
          </button>
        ))}
        </div>
      </div>

      <div className="max-w-[860px]">
        {loading ? (
          <div className="text-text-muted text-[14px] py-4 text-center">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-text-muted text-[14px] py-4 text-center">No tasks found</div>
        ) : (
          Object.entries(grouped).map(([date, items]) => (
            <div key={date} className="mb-8 last:mb-0">
              <div className={`text-[12.5px] font-semibold tracking-[.06em] uppercase mb-3 ${
                date < today && date !== 'Done' && date !== 'No date' ? 'text-lost' : date === today ? 'text-accent' : 'text-text-muted'
              }`}>
                {dateLabel(date)} · {items.length}
              </div>
              {items.map(t => (
                <div key={t.id} className="flex items-start gap-3.5 py-2 cursor-pointer hover:bg-border-light px-2.5 -mx-2.5 rounded-xl transition-colors" onClick={() => openEdit(t)}>
                  <button onClick={e => { e.stopPropagation(); toggleTask(t.id, t.done) }} className="cursor-pointer shrink-0 mt-0.5">
                    <div className={`w-[18px] h-[18px] rounded-full border-[1.5px] ${t.done ? 'bg-accent border-accent' : 'border-[#CFC7BA] hover:border-accent'} flex items-center justify-center`}>
                      {t.done && <Check size={10} className="text-white" />}
                    </div>
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className={`text-[14px] ${t.done ? 'line-through text-text-muted' : 'text-text-primary'}`}>{t.title}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Avatar name={profile?.full_name || 'U'} size={16} src={profile?.avatar_url} />
                      {dueBadge(t.due_date, t.done)}
                      {t.companies && (
                        <Link to={`/companies/${t.companies.id}`} onClick={e => e.stopPropagation()} className="flex items-center gap-0.5 text-[12px] text-accent hover:underline no-underline truncate">
                          <ArrowUpRight size={10} className="shrink-0" />
                          <span className="truncate">{t.companies.name}</span>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      <SidePeek title="Edit task" open={peek.open} onClose={() => setPeek({ open: false, data: null })} onSave={savePeek} onDelete={deletePeek}>
        <FormField label="Title *"><Input value={peek.data?.title} onChange={v => setPeek(p => ({ ...p, data: { ...p.data, title: v } }))} placeholder="Task description" /></FormField>
        <FormField label="Due date"><DatePicker value={peek.data?.due_date} onChange={v => setPeek(p => ({ ...p, data: { ...p.data, due_date: v } }))} /></FormField>
      </SidePeek>
    </div>
  )
}
