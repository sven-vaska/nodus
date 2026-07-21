import { useState } from 'react'
import { formatDate } from '../../../lib/utils'
import Avatar from '../../../components/Avatar'

export default function EmailsTab({ emails }) {
  const [openId, setOpenId] = useState(null)
  return (
    <div>
      <span className="text-[14px] font-medium text-text-secondary">Emails</span>
      <div className="mt-2">
        {emails.map(e => (
          <div key={e.id}>
            <div onClick={() => setOpenId(openId === e.id ? null : e.id)} className="flex items-start gap-2 py-2 border-b border-border-light cursor-pointer hover:bg-border-light px-1.5 -mx-1.5 rounded transition-colors">
              <Avatar name={e.from_name || 'U'} size={22} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-[14px]">
                  {!e.read && <div className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />}
                  <span className={`${!e.read ? 'font-semibold' : 'font-medium'} text-text-primary`}>{e.from_name}</span>
                  <span className="text-text-muted text-[13px]">{e.from_email}</span>
                </div>
                <div className={`text-[14px] ${!e.read ? 'font-semibold' : ''} text-text-primary`}>{e.subject}</div>
                {openId !== e.id && <div className="text-[13px] text-text-secondary truncate">{e.preview}</div>}
              </div>
              <span className="text-[13px] text-text-muted whitespace-nowrap shrink-0">{formatDate(e.received_at)}</span>
            </div>
            {openId === e.id && (
              <div className="bg-surface p-3 mb-1 ml-8">
                <div className="text-[14px] text-text-primary whitespace-pre-line">{e.body}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
