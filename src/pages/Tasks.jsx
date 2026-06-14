import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatDate, daysAgo } from '../lib/utils'
import { Check } from 'lucide-react'

const filters = ['Kõik', 'Täna', 'Homme', 'Hilinenud', 'Tehtud']

export default function Tasks() {
  const [tasks, setTasks] = useState([])
  const [filter, setFilter] = useState('Kõik')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('tasks')
      .select('*, companies(id, name)')
      .order('done')
      .order('due_date', { ascending: true, nullsFirst: false })
      .then(({ data }) => {
        setTasks(data || [])
        setLoading(false)
      })
  }, [])

  async function toggleTask(id, done) {
    await supabase.from('tasks').update({ done: !done }).eq('id', id)
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !done } : t))
  }

  const today = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]

  const filtered = tasks.filter(t => {
    if (filter === 'Täna') return t.due_date === today && !t.done
    if (filter === 'Homme') return t.due_date === tomorrow && !t.done
    if (filter === 'Hilinenud') return t.due_date && t.due_date < today && !t.done
    if (filter === 'Tehtud') return t.done
    return true
  })

  const grouped = {}
  filtered.forEach(t => {
    const key = t.done ? 'Tehtud' : (t.due_date || 'Kuupäevata')
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(t)
  })

  return (
    <div className="p-6">
      <h1 className="text-[20px] font-semibold text-text-primary mb-5">Tasks</h1>

      <div className="flex flex-wrap gap-1 mb-5">
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
              filter === f
                ? 'bg-text-primary text-white'
                : 'bg-surface border border-border text-text-secondary hover:bg-border-light'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="bg-surface border border-border rounded-[10px] p-4">
        {loading ? (
          <div className="text-text-muted text-[12px] py-4 text-center">Laadin...</div>
        ) : filtered.length === 0 ? (
          <div className="text-text-muted text-[12px] py-4 text-center">Ülesandeid ei leitud</div>
        ) : (
          Object.entries(grouped).map(([date, items]) => (
            <div key={date} className="mb-4 last:mb-0">
              <div className={`text-[11px] font-semibold uppercase tracking-wide mb-2 ${
                date < today && date !== 'Tehtud' && date !== 'Kuupäevata' ? 'text-lost' : 'text-text-muted'
              }`}>
                {date === 'Tehtud' ? 'Tehtud' : date === 'Kuupäevata' ? 'Kuupäevata' : formatDate(date)}
              </div>
              {items.map(t => {
                const overdue = !t.done && t.due_date && t.due_date < today
                return (
                  <div key={t.id} className="flex items-center gap-3 py-1.5 border-b border-border-light last:border-0">
                    <button onClick={() => toggleTask(t.id, t.done)} className="cursor-pointer">
                      <div className={`w-4 h-4 rounded border ${t.done ? 'bg-accent border-accent' : 'border-border'} flex items-center justify-center`}>
                        {t.done && <Check size={10} className="text-white" />}
                      </div>
                    </button>
                    <span className={`flex-1 text-[12px] ${t.done ? 'line-through text-text-muted' : 'text-text-primary'}`}>{t.title}</span>
                    {t.companies && (
                      <Link to={`/companies/${t.companies.id}`} className="text-[11px] text-accent hover:underline no-underline shrink-0">{t.companies.name}</Link>
                    )}
                    {t.due_date && (
                      <span className={`text-[11px] shrink-0 ${overdue ? 'text-lost font-medium' : 'text-text-secondary'}`}>{formatDate(t.due_date)}</span>
                    )}
                  </div>
                )
              })}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
