import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useWorkspace } from '../lib/WorkspaceContext'
import { relativeTime, formatDate } from '../lib/utils'
import Avatar from '../components/Avatar'
import Loading from '../components/Loading'
import { SearchableSelect } from '../components/SidePeek'
import { X, Link2 } from 'lucide-react'

// Shown on emails gmail-sync couldn't match to a contact/company — lets the
// user pick one by hand instead of the mail getting lost.
function LinkToCompany({ companies, onLink }) {
  const [value, setValue] = useState('')
  return (
    <div className="flex items-center gap-2 mt-3">
      <div className="flex-1 min-w-0">
        <SearchableSelect value={value} onChange={setValue} options={companies.map(c => ({ value: c.id, label: c.name }))} placeholder="Link to a company..." />
      </div>
      {value && (
        <button
          onClick={() => onLink(value)}
          className="flex items-center gap-1.5 px-3 py-2 bg-text-primary text-bg rounded-xl text-[13px] font-medium hover:opacity-90 transition-opacity cursor-pointer shrink-0"
        >
          <Link2 size={13} /> Link
        </button>
      )}
    </div>
  )
}

export default function Emails() {
  const [emails, setEmails] = useState([])
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')
  const [openId, setOpenId] = useState(null)

  const { ws } = useWorkspace()

  useEffect(() => { fetchEmails(); fetchCompanies() }, [ws])

  function fetchEmails() {
    return supabase
      .from('emails')
      .select('*, companies(id, name)')
      .eq('workspace_id', ws)
      .order('received_at', { ascending: false })
      .then(({ data }) => {
        setEmails(data || [])
        setLoading(false)
      })
  }

  function fetchCompanies() {
    supabase.from('companies').select('id, name').eq('workspace_id', ws).is('deleted_at', null).order('name')
      .then(({ data }) => setCompanies(data || []))
  }

  async function linkToCompany(emailId, companyId) {
    await supabase.from('emails').update({ company_id: companyId }).eq('id', emailId)
    fetchEmails()
  }

  const filtered = emails.filter(e => {
    if (filter === 'Unread') return !e.read
    if (filter === 'Unlinked') return !e.company_id
    return true
  })

  const unlinkedCount = emails.filter(e => !e.company_id).length
  const open = emails.find(e => e.id === openId) || null

  if (loading) return <Loading />

  return (
    <div className="p-4 md:p-6 md:h-full md:flex md:flex-col md:overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-baseline md:justify-between mb-6 gap-4 shrink-0">
        <h1 className="font-serif text-[24px] font-semibold text-text-primary m-0">Emails</h1>
        <div className="flex gap-1.5 overflow-x-auto md:flex-wrap md:justify-end [scrollbar-width:none] [&::-webkit-scrollbar]:hidden -mx-4 px-4 md:mx-0 md:px-0">
        {['All', 'Unread', 'Unlinked'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-[13.5px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
              filter === f ? 'bg-text-primary text-bg' : 'text-text-muted hover:bg-border-light hover:text-text-primary'
            }`}
          >
            {f}{f === 'Unlinked' && unlinkedCount > 0 ? ` (${unlinkedCount})` : ''}
          </button>
        ))}
        </div>
      </div>

      {/* Desktop: list on the left, reading pane on the right (like a mail client).
          Mobile: single list, body expands inline under the row. */}
      <div className="md:flex md:flex-1 md:min-h-0 md:gap-10">
        <div className="md:w-[430px] lg:w-[470px] md:shrink-0 md:overflow-y-auto md:pr-2 [scrollbar-width:thin]">
          {filtered.length === 0 ? (
            <div className="text-text-muted text-[14px] py-4 text-center">No emails found</div>
          ) : (
            filtered.map(e => (
              <div key={e.id}>
                <div
                  onClick={() => setOpenId(openId === e.id ? null : e.id)}
                  className={`flex items-start gap-3.5 py-3 cursor-pointer -mx-3.5 px-3.5 rounded-xl transition-colors ${
                    openId === e.id ? 'bg-border-light' : 'hover:bg-border-light'
                  }`}
                >
                  <div className="flex flex-col items-center gap-1 shrink-0 w-[56px]">
                    <Avatar name={e.from_name || 'U'} size={36} />
                    <span className="text-[10.5px] text-[#C4BCB1] whitespace-nowrap">{relativeTime(e.received_at)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {!e.read && <div className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />}
                      <span className={`text-[14px] ${!e.read ? 'font-semibold' : 'font-medium'} text-text-primary truncate`}>{e.from_name}</span>
                      {e.companies ? (
                        <Link to={`/companies/${e.companies.id}`} onClick={ev => ev.stopPropagation()} className="text-[12px] text-accent hover:underline no-underline shrink-0">
                          {e.companies.name}
                        </Link>
                      ) : (
                        <span className="text-[11px] text-text-muted uppercase tracking-wide shrink-0">Unlinked</span>
                      )}
                    </div>
                    <div className={`text-[14px] mt-0.5 truncate ${!e.read ? 'font-semibold text-text-primary' : 'text-text-primary'}`}>{e.subject}</div>
                    <div className="text-[13px] text-[#B0A89C] truncate mt-0.5">{e.preview}</div>
                  </div>
                </div>
                {/* Mobile inline body */}
                {openId === e.id && (
                  <div className="md:hidden bg-border-light rounded-xl p-5 mb-3">
                    <div className="text-[14px] text-text-primary whitespace-pre-line">{e.body}</div>
                    {!e.company_id && <LinkToCompany companies={companies} onLink={cId => linkToCompany(e.id, cId)} />}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Reading pane (desktop only) */}
        <div className="hidden md:flex md:flex-1 md:min-w-0 md:flex-col md:overflow-hidden">
          {open ? (
            <>
              <div className="flex items-start gap-4 pb-5 shrink-0">
                <Avatar name={open.from_name || 'U'} size={42} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2.5">
                    <span className="text-[15px] font-semibold text-text-primary truncate">{open.from_name}</span>
                    {open.companies && (
                      <Link to={`/companies/${open.companies.id}`} className="text-[12.5px] text-accent hover:underline no-underline shrink-0">
                        {open.companies.name}
                      </Link>
                    )}
                    <span className="ml-auto text-[13px] text-[#C4BCB1] shrink-0">{formatDate(open.received_at)}</span>
                  </div>
                  <div className="font-serif text-[18px] font-semibold text-text-primary mt-1 leading-snug">{open.subject}</div>
                </div>
                <button onClick={() => setOpenId(null)} className="p-1.5 text-text-muted hover:text-text-primary transition-colors cursor-pointer shrink-0" title="Close">
                  <X size={17} />
                </button>
              </div>
              {!open.company_id && <LinkToCompany companies={companies} onLink={cId => linkToCompany(open.id, cId)} />}
              <div className="flex-1 overflow-y-auto mt-5">
                <div className="bg-border-light/60 rounded-2xl p-7 text-[14.5px] text-text-primary leading-relaxed whitespace-pre-line">
                  {open.body}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-[14px] text-text-muted">
              Select an email to read it here
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
