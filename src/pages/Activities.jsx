import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { relativeTime } from '../lib/utils'
import Avatar from '../components/Avatar'
import { Phone, Mail, Calendar, MessageSquare, MoreHorizontal } from 'lucide-react'

const typeFilters = ['Kõik', 'Kõne', 'Email', 'Kohtumine', 'Märge', 'Muu']
const icons = { 'Kõne': Phone, 'Email': Mail, 'Kohtumine': Calendar, 'Märge': MessageSquare, 'Muu': MoreHorizontal }

export default function Activities() {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('Kõik')

  useEffect(() => {
    supabase
      .from('activities')
      .select('*, companies(id, name)')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setActivities(data || [])
        setLoading(false)
      })
  }, [])

  const filtered = activities.filter(a => filter === 'Kõik' || a.type === filter)

  if (loading) return <div className="p-6 text-text-muted text-[13px]">Laadin...</div>

  return (
    <div className="p-6">
      <h1 className="text-[20px] font-semibold text-text-primary mb-5">Activities</h1>

      <div className="flex flex-wrap gap-1 mb-4">
        {typeFilters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
              filter === f ? 'bg-text-primary text-white' : 'bg-surface border border-border text-text-secondary hover:bg-border-light'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="bg-surface border border-border rounded-[10px] p-4">
        {filtered.length === 0 ? (
          <div className="text-text-muted text-[12px] py-4 text-center">Tegevusi ei leitud</div>
        ) : (
          filtered.map(a => {
            const Icon = icons[a.type] || MoreHorizontal
            return (
              <div key={a.id} className="flex gap-3 py-3 border-b border-border-light last:border-0">
                <Avatar name={a.created_by || 'SV'} size={28} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Icon size={12} className="text-text-muted shrink-0" />
                    <span className="text-[12px] font-medium text-text-primary">{a.title}</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-border-light rounded text-text-secondary">{a.type}</span>
                    {a.companies && (
                      <Link to={`/companies/${a.companies.id}`} className="text-[10px] text-accent hover:underline no-underline ml-auto shrink-0">
                        {a.companies.name}
                      </Link>
                    )}
                  </div>
                  {a.body && <div className="text-[12px] text-text-secondary mt-0.5">{a.body}</div>}
                </div>
                <span className="text-[11px] text-text-muted whitespace-nowrap shrink-0">{relativeTime(a.created_at)}</span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
