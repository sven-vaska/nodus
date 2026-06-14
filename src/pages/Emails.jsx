import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { relativeTime } from '../lib/utils'
import Avatar from '../components/Avatar'

export default function Emails() {
  const [emails, setEmails] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('Kõik')
  const [openId, setOpenId] = useState(null)

  useEffect(() => {
    supabase
      .from('emails')
      .select('*, companies(id, name)')
      .order('received_at', { ascending: false })
      .then(({ data }) => {
        setEmails(data || [])
        setLoading(false)
      })
  }, [])

  const filtered = emails.filter(e => {
    if (filter === 'Lugemata') return !e.read
    return true
  })

  if (loading) return <div className="p-6 text-text-muted text-[13px]">Laadin...</div>

  return (
    <div className="p-6">
      <h1 className="text-[20px] font-semibold text-text-primary mb-5">Emails</h1>

      <div className="flex gap-1 mb-4">
        {['Kõik', 'Lugemata'].map(f => (
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
          <div className="text-text-muted text-[12px] py-4 text-center">Emaile ei leitud</div>
        ) : (
          filtered.map(e => (
            <div key={e.id}>
              <div
                onClick={() => setOpenId(openId === e.id ? null : e.id)}
                className="flex items-start gap-3 py-3 border-b border-border-light last:border-0 cursor-pointer hover:bg-[#fafaf9] -mx-2 px-2 rounded transition-colors"
              >
                <Avatar name={e.from_name || 'U'} size={28} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {!e.read && <div className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />}
                    <span className={`text-[12px] ${!e.read ? 'font-semibold' : 'font-medium'} text-text-primary`}>{e.from_name}</span>
                    {e.companies && (
                      <Link to={`/companies/${e.companies.id}`} onClick={ev => ev.stopPropagation()} className="text-[10px] text-accent hover:underline no-underline">
                        {e.companies.name}
                      </Link>
                    )}
                  </div>
                  <div className={`text-[12px] mt-0.5 ${!e.read ? 'font-semibold text-text-primary' : 'text-text-primary'}`}>{e.subject}</div>
                  {openId !== e.id && <div className="text-[11px] text-text-secondary truncate mt-0.5">{e.preview}</div>}
                </div>
                <span className="text-[11px] text-text-muted whitespace-nowrap shrink-0">{relativeTime(e.received_at)}</span>
              </div>
              {openId === e.id && (
                <div className="bg-border-light rounded-lg p-4 mb-2 ml-10">
                  <div className="text-[12px] text-text-primary whitespace-pre-line">{e.body}</div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
