import { useWorkspace } from '../../../lib/WorkspaceContext'
import { useUser } from '../../../lib/UserContext'
import { formatDate } from '../../../lib/utils'
import Avatar from '../../../components/Avatar'
import { FileText } from 'lucide-react'

export default function NotesTab({ notes, onAdd, onEdit }) {
  const { canEdit } = useWorkspace()
  const { profile } = useUser()
  const userName = profile?.full_name || 'U'
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[14px] font-medium text-text-secondary">Notes</span>
        {canEdit && <button type="button" onClick={onAdd} className="flex items-center gap-1.5 px-3 py-1.5 border-none rounded-xl bg-border-light text-[13px] font-medium text-text-primary hover:bg-border-light transition-colors cursor-pointer">
          <FileText size={14} className="text-text-secondary" /> Create note
        </button>}
      </div>
      {notes.map(n => (
        <div key={n.id} onClick={() => onEdit(n)} className="flex items-start gap-2 py-2 border-b border-border-light last:border-0 cursor-pointer hover:bg-border-light px-1.5 -mx-1.5 rounded transition-colors">
          <Avatar name={userName} size={22} src={profile?.avatar_url} />
          <div className="flex-1 min-w-0 text-[14px] text-text-primary">{n.body}</div>
          <span className="text-[13px] text-text-muted whitespace-nowrap shrink-0">{formatDate(n.created_at)}</span>
        </div>
      ))}
    </div>
  )
}
