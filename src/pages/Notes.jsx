import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { relativeTime } from '../lib/utils'
import Avatar from '../components/Avatar'

export default function Notes() {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    supabase
      .from('notes')
      .select('*, companies(id, name)')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setNotes(data || [])
        setLoading(false)
      })
  }, [])

  if (loading) return <div className="p-6 text-text-muted text-[13px]">Laadin...</div>

  return (
    <div className="p-6">
      <h1 className="text-[20px] font-semibold text-text-primary mb-5">Notes</h1>

      <div className="bg-surface border border-border rounded-[10px] p-4">
        {notes.length === 0 ? (
          <div className="text-text-muted text-[12px] py-4 text-center">Märkmeid pole</div>
        ) : (
          notes.map(n => (
            <div
              key={n.id}
              onClick={() => setExpandedId(expandedId === n.id ? null : n.id)}
              className="flex gap-3 py-3 border-b border-border-light last:border-0 cursor-pointer hover:bg-[#fafaf9] -mx-2 px-2 rounded transition-colors"
            >
              <Avatar name={n.created_by || 'SV'} size={28} />
              <div className="flex-1 min-w-0">
                {n.companies && (
                  <Link
                    to={`/companies/${n.companies.id}`}
                    onClick={e => e.stopPropagation()}
                    className="text-[11px] text-accent hover:underline no-underline"
                  >
                    {n.companies.name}
                  </Link>
                )}
                <div className={`text-[12px] text-text-primary mt-0.5 ${expandedId === n.id ? '' : 'line-clamp-2'}`}>
                  {n.body}
                </div>
              </div>
              <span className="text-[11px] text-text-muted whitespace-nowrap shrink-0">{relativeTime(n.created_at)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
