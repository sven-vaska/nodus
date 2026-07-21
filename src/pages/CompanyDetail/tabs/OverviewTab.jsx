import { useWorkspace } from '../../../lib/WorkspaceContext'
import { useUser } from '../../../lib/UserContext'
import { pipelineText, formatDate } from '../../../lib/utils'
import StatusPill from '../../../components/StatusPill'
import Avatar from '../../../components/Avatar'
import DatePicker from '../../../components/DatePicker'
import TypeIcon from '../TypeIcon'
import RelatedCompanies from '../RelatedCompanies'
import { allStatuses } from '../constants'
import { Check, Plus, ArrowUpRight, ArrowDownLeft } from 'lucide-react'

// Thin outlined card shared by all four Highlights tiles
export const highlightCard = 'bg-surface border border-border-light rounded-xl px-3.5 py-3'

function FollowUpCard({ company, onUpdate }) {
  return (
    <div className={highlightCard}>
      <div className="text-[12px] text-text-muted font-semibold uppercase tracking-[.06em] mb-1.5">Follow-up</div>
      <DatePicker value={company.follow_up || ''} onChange={v => onUpdate(v || null)} placeholder="Pick a date" inline />
    </div>
  )
}

function TrialEndsCard({ company, onUpdate }) {
  return (
    <div className={highlightCard}>
      <div className="text-[12px] text-text-muted font-semibold uppercase tracking-[.06em] mb-1.5">Trial ends</div>
      <DatePicker value={company.trial_ends || ''} onChange={v => onUpdate(v || null)} placeholder="Pick a date" inline />
    </div>
  )
}

export default function OverviewTab({ company, nextTask, timeline, notes, tasks, contacts, companyLinks = [], onAddLink, onRemoveLink, onToggleTask, onUpdateFollowUp, onUpdateStatus, onUpdateTrialEnds, statusDropdown, setStatusDropdown, onSwitchTab, onAddNote, onAddTask, onAddActivity, onEditActivity, onEditNote, onEditTask }) {
  const { canEdit } = useWorkspace()
  const { profile } = useUser()
  const userName = profile?.full_name || 'U'
  const primary = contacts?.find(c => c.is_primary) || contacts?.[0]
  const activeTasks = tasks.filter(t => !t.done)
  return (
    <div className="space-y-8 md:space-y-9">
      {/* Highlights - 2 cols on mobile, 4 on desktop */}
      <div>
        <div className="text-[13px] text-text-muted font-medium mb-2 md:hidden">Highlights</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className={`relative cursor-pointer ${highlightCard}`} onClick={() => canEdit && setStatusDropdown(!statusDropdown)}>
            <div className="text-[12px] text-text-muted font-semibold uppercase tracking-[.06em] mb-1.5">Pipeline status</div>
            <div><StatusPill status={company.status} /></div>
            <div className="text-[12px] text-text-secondary mt-0.5">{pipelineText(company)}</div>
            {statusDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-surface border border-border rounded-xl shadow-lg z-10 py-1 min-w-[180px]" onClick={e => e.stopPropagation()}>
                {allStatuses.map(s => (
                  <button key={s} onClick={() => onUpdateStatus(s)} className="w-full text-left px-3 py-1 text-[14px] hover:bg-border-light transition-colors cursor-pointer flex items-center gap-2">
                    <StatusPill status={s} />
                  </button>
                ))}
              </div>
            )}
          </div>
          <FollowUpCard company={company} onUpdate={onUpdateFollowUp} />
          <div className={highlightCard}>
            <div className="text-[12px] text-text-muted font-semibold uppercase tracking-[.06em] mb-1.5">Contact</div>
            {primary ? <span className="flex items-center gap-1.5"><Avatar name={primary.name} size={24} /> <span className="text-[14.5px] font-semibold">{primary.name}</span></span> : <span className="text-text-muted text-[13px]">—</span>}
          </div>
          <TrialEndsCard company={company} onUpdate={onUpdateTrialEnds} />
        </div>
      </div>

      {/* Company details - mobile only */}
      <div className="md:hidden">
        <div className="text-[13px] text-text-muted font-medium mb-2">Company details</div>
        <div className="bg-surface divide-y divide-border-light">
          <div className="flex items-center justify-between px-3 py-2.5">
            <span className="text-[13px] text-text-muted">Website</span>
            {company.www ? (
              <a href={company.www.startsWith('http') ? company.www : `https://${company.www}`} target="_blank" rel="noopener" className="text-[14px] text-accent hover:underline">{company.www.replace(/^https?:\/\//, '')}</a>
            ) : <span className="text-[13px] text-text-muted">—</span>}
          </div>
          <div className="flex items-start justify-between px-3 py-2.5">
            <span className="text-[13px] text-text-muted shrink-0">Description</span>
            <div className="text-[14px] text-text-primary text-right line-clamp-3 ml-4">{company.description || '—'}</div>
          </div>
          {primary && (
            <div className="flex items-center justify-between px-3 py-2.5">
              <span className="text-[13px] text-text-muted shrink-0">Contact</span>
              <div className="flex items-center gap-2">
                <Avatar name={primary.name} size={20} />
                <div className="text-right">
                  <div className="text-[14px] font-medium text-text-primary">{primary.name}</div>
                  {primary.role && <div className="text-[12px] text-text-muted">{primary.role}</div>}
                </div>
              </div>
            </div>
          )}
          <div className="flex items-start justify-between px-3 py-2.5">
            <span className="text-[13px] text-text-muted shrink-0">Related</span>
            <div className="ml-4 flex flex-col items-end">
              <RelatedCompanies companyId={company.id} links={companyLinks} canEdit={canEdit} onAdd={onAddLink} onRemove={onRemoveLink} />
            </div>
          </div>
        </div>
      </div>

      {/* Activity: unified feed of logged activities + synced emails */}
      {timeline.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-serif text-[17px] font-semibold text-text-primary">Activity</span>
            <div className="flex items-center gap-2">
              <span className="text-[13.5px] text-accent cursor-pointer hover:underline" onClick={() => onSwitchTab('Activity')}>View all</span>
              {canEdit && <button type="button" onClick={onAddActivity} className="text-text-muted hover:text-accent cursor-pointer"><Plus size={14} /></button>}
            </div>
          </div>
          {timeline.slice(0, 10).map(entry => {
            if (entry.kind === 'email') {
              const e = entry.item
              const sent = e.direction === 'out'
              return (
                <div key={`e-${e.id}`} className="flex items-start gap-2.5 py-2 cursor-pointer hover:bg-border-light px-1.5 -mx-1.5 rounded transition-colors" onClick={() => onSwitchTab('Emails')}>
                  <TypeIcon type="Email" size={22} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-[14px]">
                      <span className="text-text-secondary truncate">{e.subject}</span>
                      <span className={`flex items-center gap-0.5 text-[12px] font-semibold shrink-0 ${sent ? 'text-accent' : 'text-won'}`}>
                        {sent ? <ArrowUpRight size={9} /> : <ArrowDownLeft size={9} />}
                        {sent ? 'Sent' : 'Received'}
                      </span>
                    </div>
                    <div className="text-[13px] text-text-secondary mt-0.5 line-clamp-2">{e.preview}</div>
                  </div>
                  <span className="text-[13px] text-text-muted shrink-0 whitespace-nowrap">{formatDate(e.received_at)}</span>
                </div>
              )
            }
            const a = entry.item
            return (
              <div key={`a-${a.id}`} className="flex items-start gap-2.5 py-2 cursor-pointer hover:bg-border-light px-1.5 -mx-1.5 rounded transition-colors" onClick={() => onEditActivity(a)}>
                <TypeIcon type={a.type} size={22} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-[14px]">
                    <span className="text-text-secondary truncate">{a.title}</span>
                    {a.contact?.name && <span className="text-[12px] text-text-muted shrink-0">· {a.contact.name}</span>}
                  </div>
                  {a.body && <div className="text-[13px] text-text-secondary mt-0.5 line-clamp-2">{a.body}</div>}
                  {entry.updates?.length > 0 && (
                    <div className="mt-1.5 flex flex-col gap-1 border-l-2 border-border pl-2.5">
                      {entry.updates.map(u => (
                        <div key={u.id} className="flex items-baseline gap-2">
                          <span className="flex-1 min-w-0 text-[13px] text-text-secondary line-clamp-2">{u.body}</span>
                          <span className="text-[12px] text-text-muted whitespace-nowrap shrink-0">{formatDate(u.created_at)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-[13px] text-text-muted shrink-0 whitespace-nowrap">{formatDate(a.created_at)}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Notes - desktop only in overview */}
      {notes.length > 0 && (
        <div className="hidden md:block">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-serif text-[17px] font-semibold text-text-primary">Notes <span className="font-sans text-[13px] font-normal text-[#C4BCB1]">{notes.length}</span></span>
            <div className="flex items-center gap-2">
              <span className="text-[13.5px] text-accent cursor-pointer hover:underline" onClick={() => onSwitchTab('Notes')}>View all</span>
              {canEdit && <button type="button" onClick={onAddNote} className="text-text-muted hover:text-accent cursor-pointer"><Plus size={14} /></button>}
            </div>
          </div>
          {notes.slice(0, 3).map(n => (
            <div key={n.id} className="flex items-center gap-2 py-1.5 text-[14px] cursor-pointer hover:bg-border-light px-1.5 -mx-1.5 rounded transition-colors" onClick={() => onEditNote(n)}>
              <Avatar name={userName} size={20} src={profile?.avatar_url} />
              <span className="text-text-primary truncate flex-1">{n.body}</span>
              <span className="text-[13px] text-text-muted shrink-0">{formatDate(n.created_at)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Tasks - active only */}
      {activeTasks.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-serif text-[17px] font-semibold text-text-primary">Tasks <span className="font-sans text-[13px] font-normal text-[#C4BCB1]">{activeTasks.length}</span></span>
            <div className="flex items-center gap-2">
              <span className="text-[13.5px] text-accent cursor-pointer hover:underline" onClick={() => onSwitchTab('Tasks')}>View all</span>
              {canEdit && <button type="button" onClick={onAddTask} className="text-text-muted hover:text-accent cursor-pointer"><Plus size={14} /></button>}
            </div>
          </div>
          {activeTasks.slice(0, 5).map(t => (
            <div key={t.id} className="flex items-center gap-2 py-1.5 text-[14px] cursor-pointer hover:bg-border-light px-1.5 -mx-1.5 rounded transition-colors" onClick={() => onEditTask(t)}>
              <button type="button" onClick={e => { e.stopPropagation(); onToggleTask(t.id, t.done) }} className="cursor-pointer shrink-0">
                <div className={`w-4 h-4 rounded-full border-[1.5px] ${t.done ? 'bg-accent border-accent' : 'border-[#CFC7BA] hover:border-accent'} flex items-center justify-center`}>
                  {t.done && <Check size={9} className="text-white" />}
                </div>
              </button>
              <span className="text-text-primary flex-1 truncate">{t.title}</span>
              {t.due_date && <span className={`text-[13px] shrink-0 ${new Date(t.due_date) < new Date() ? 'text-lost' : 'text-warning'}`}>{formatDate(t.due_date)}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
