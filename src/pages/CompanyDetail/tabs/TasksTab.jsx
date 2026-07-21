import { useWorkspace } from '../../../lib/WorkspaceContext'
import { formatDate } from '../../../lib/utils'
import { Check, CheckSquare } from 'lucide-react'

function TaskRow({ task, onToggle, onEdit }) {
  const overdue = !task.done && task.due_date && new Date(task.due_date) < new Date()
  return (
    <div className="flex items-center gap-2 py-1.5 border-b border-border-light last:border-0 cursor-pointer hover:bg-border-light px-1.5 -mx-1.5 rounded transition-colors" onClick={() => onEdit(task)}>
      <button type="button" onClick={e => { e.stopPropagation(); onToggle(task.id, task.done) }} className="cursor-pointer shrink-0 p-0 bg-transparent border-none">
        <div className={`w-[16px] h-[16px] rounded border-[1.5px] ${task.done ? 'bg-accent border-accent' : 'border-border hover:border-text-muted'} flex items-center justify-center`}>
          {task.done && <Check size={10} className="text-white" />}
        </div>
      </button>
      <span className={`flex-1 text-[14px] ${task.done ? 'line-through text-text-muted' : 'text-text-primary'}`}>{task.title}</span>
      {task.due_date && (
        <span className={`text-[13px] ${overdue ? 'text-lost font-medium' : 'text-text-secondary'}`}>{formatDate(task.due_date)}</span>
      )}
    </div>
  )
}

export default function TasksTab({ tasks, onToggle, onAdd, onEdit }) {
  const { canEdit } = useWorkspace()
  const open = tasks.filter(t => !t.done)
  const done = tasks.filter(t => t.done)
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[14px] font-medium text-text-secondary">Tasks</span>
        {canEdit && <button type="button" onClick={onAdd} className="flex items-center gap-1.5 px-3 py-1.5 border-none rounded-xl bg-border-light text-[13px] font-medium text-text-primary hover:bg-border-light transition-colors cursor-pointer">
          <CheckSquare size={14} className="text-text-secondary" /> Create task
        </button>}
      </div>
      {open.map(t => <TaskRow key={t.id} task={t} onToggle={onToggle} onEdit={onEdit} />)}
      {done.length > 0 && (
        <>
          <div className="text-[12px] text-text-muted uppercase tracking-wide mt-3 mb-1">Done</div>
          {done.map(t => <TaskRow key={t.id} task={t} onToggle={onToggle} onEdit={onEdit} />)}
        </>
      )}
    </div>
  )
}
