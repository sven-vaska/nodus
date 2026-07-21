import { formatDate } from '../../../lib/utils'
import TypeIcon from '../TypeIcon'
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react'

// Unified chronological feed: logged activities + synced emails.
export default function ActivityTab({ timeline, onEdit, onOpenEmails }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="font-serif text-[17px] font-semibold text-text-primary">Activity</span>
      </div>
      {timeline.length === 0 && <div className="text-[14px] text-text-muted py-2">Nothing here yet.</div>}
      {timeline.map(entry => entry.kind === 'email' ? (
        <EmailRow key={`e-${entry.item.id}`} email={entry.item} onClick={onOpenEmails} />
      ) : (
        <ActivityRow key={`a-${entry.item.id}`} activity={entry.item} updates={entry.updates} onEdit={onEdit} />
      ))}
    </div>
  )
}

function ActivityRow({ activity: a, updates = [], onEdit }) {
  return (
    <div onClick={() => onEdit(a)} className="flex items-start gap-3.5 py-2.5 cursor-pointer hover:bg-border-light px-2.5 -mx-2.5 rounded-xl transition-colors">
      <TypeIcon type={a.type} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 text-[14px]">
          <span className="font-medium text-text-primary">{a.title}</span>
          <span className="text-[12px] font-semibold text-text-muted shrink-0">{a.type}</span>
          {a.contact?.name && <span className="text-[12px] text-text-muted shrink-0">· {a.contact.name}</span>}
        </div>
        {a.body && <div className="text-[13px] text-text-secondary mt-px line-clamp-3">{a.body}</div>}
        {updates.length > 0 && (
          <div className="mt-2 flex flex-col gap-1.5 border-l-2 border-border pl-3">
            {updates.map(u => (
              <div key={u.id} className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <span className="text-[13px] text-text-secondary">{u.body}</span>
                </div>
                <span className="text-[12px] text-[#C4BCB1] whitespace-nowrap shrink-0">{formatDate(u.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <span className="text-[13px] text-[#C4BCB1] whitespace-nowrap shrink-0">{formatDate(a.created_at)}</span>
    </div>
  )
}

function EmailRow({ email: e, onClick }) {
  const sent = e.direction === 'out'
  return (
    <div onClick={onClick} className="flex items-start gap-3.5 py-2.5 cursor-pointer hover:bg-border-light px-2.5 -mx-2.5 rounded-xl transition-colors">
      <TypeIcon type="Email" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 text-[14px]">
          <span className="font-medium text-text-primary truncate">{e.subject}</span>
          <span className={`flex items-center gap-0.5 text-[12px] font-semibold shrink-0 ${sent ? 'text-accent' : 'text-won'}`}>
            {sent ? <ArrowUpRight size={10} /> : <ArrowDownLeft size={10} />}
            {sent ? 'Sent' : 'Received'}
          </span>
        </div>
        <div className="text-[13px] text-text-secondary mt-px line-clamp-2">
          {!sent && e.from_name && <span className="text-text-primary font-medium">{e.from_name}: </span>}
          {e.preview}
        </div>
      </div>
      <span className="text-[13px] text-[#C4BCB1] whitespace-nowrap shrink-0">{formatDate(e.received_at)}</span>
    </div>
  )
}
