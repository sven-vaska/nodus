import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import { formatDate, daysAgo, daysBetween, monthlyTotal } from '../../../lib/utils'
import { Trash2 } from 'lucide-react'

function StatRow({ label, value, sub, color }) {
  return (
    <div className="flex items-center justify-between px-3 py-2.5">
      <span className="text-[13px] text-text-muted">{label}</span>
      <div className="text-right">
        <div className={`text-[14px] font-medium ${color || 'text-text-primary'}`}>{value}</div>
        {sub && <div className={`text-[12px] ${color || 'text-text-muted'}`}>{sub}</div>}
      </div>
    </div>
  )
}

function MiniKPI({ label, value, color }) {
  return (
    <div className="bg-surface px-3 py-2">
      <div className="text-[11px] text-text-muted uppercase tracking-wide">{label}</div>
      <div className={`text-[20px] font-bold ${color || 'text-text-primary'}`}>{value}</div>
    </div>
  )
}

export default function StatisticsTab({ company, activities, tasks, notes, emails, contacts, companyId }) {
  const navigate = useNavigate()
  const [deleting, setDeleting] = useState(false)
  const today = new Date()
  const created = company.created_at ? new Date(company.created_at) : null
  const daysSinceCreated = created ? Math.floor((today - created) / (1000 * 60 * 60 * 24)) : null
  const daysSinceLastContact = daysAgo(company.last_contact)
  const daysInCurrentStatus = daysAgo(company.status_changed_at || company.starting_date)
  const dealDuration = daysBetween(company.starting_date, company.closed_date)
  const mTotal = monthlyTotal(company)

  const activeTasks = tasks.filter(t => !t.done).length
  const doneTasks = tasks.filter(t => t.done).length
  const overdueTasks = tasks.filter(t => !t.done && t.due_date && t.due_date < today.toISOString().split('T')[0]).length

  const activityByType = {}
  activities.forEach(a => { activityByType[a.type] = (activityByType[a.type] || 0) + 1 })

  const last30 = activities.filter(a => daysAgo(a.created_at) <= 30).length
  const last90 = activities.filter(a => daysAgo(a.created_at) <= 90).length

  return (
    <div className="space-y-5">
      {/* Timeline */}
      <div>
        <div className="text-[13px] text-text-muted font-medium mb-2">Timeline</div>
        <div className="bg-surface divide-y divide-border-light">
          <StatRow label="Created" value={created ? formatDate(created) : '—'} sub={[company.creator?.full_name && `by ${company.creator.full_name}`, daysSinceCreated !== null && `${daysSinceCreated} days ago`].filter(Boolean).join(' · ') || null} />
          {company.starting_date && <StatRow label="First contact" value={formatDate(company.starting_date)} sub={`${daysAgo(company.starting_date)} days ago`} />}
          {company.status_changed_at && <StatRow label={`In "${company.status}" since`} value={formatDate(company.status_changed_at)} sub={daysInCurrentStatus !== null ? `${daysInCurrentStatus} days` : null} />}
          {company.closed_date && <StatRow label={company.status === 'Won' ? 'Won on' : company.status === 'Lost' ? 'Lost on' : 'Closed'} value={formatDate(company.closed_date)} sub={dealDuration !== null ? `Deal took ${dealDuration} days` : null} />}
          {company.trial_ends && <StatRow label="Trial ends" value={formatDate(company.trial_ends)} sub={daysAgo(company.trial_ends) !== null ? (daysAgo(company.trial_ends) > 0 ? `${daysAgo(company.trial_ends)} days ago` : `in ${Math.abs(daysAgo(company.trial_ends))} days`) : null} />}
          {company.follow_up && <StatRow label="Next follow-up" value={formatDate(company.follow_up)} sub={daysAgo(company.follow_up) > 0 ? `${daysAgo(company.follow_up)} days overdue` : `in ${Math.abs(daysAgo(company.follow_up))} days`} color={daysAgo(company.follow_up) > 0 ? 'text-lost' : undefined} />}
          <StatRow label="Last contact" value={company.last_contact ? formatDate(company.last_contact) : '—'} sub={daysSinceLastContact !== null ? `${daysSinceLastContact} days ago` : null} color={daysSinceLastContact > 30 ? 'text-lost' : undefined} />
        </div>
      </div>

      {/* Activity stats */}
      <div>
        <div className="text-[13px] text-text-muted font-medium mb-2">Activity</div>
        <div className="grid grid-cols-3 gap-2 mb-3">
          <MiniKPI label="Total" value={activities.length} />
          <MiniKPI label="Last 30d" value={last30} />
          <MiniKPI label="Last 90d" value={last90} />
        </div>
        {Object.keys(activityByType).length > 0 && (
          <div className="bg-surface divide-y divide-border-light">
            {Object.entries(activityByType).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between px-3 py-2">
                <span className="text-[14px] text-text-secondary">{type}</span>
                <span className="text-[14px] font-medium text-text-primary">{count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tasks stats */}
      <div>
        <div className="text-[13px] text-text-muted font-medium mb-2">Tasks</div>
        <div className="grid grid-cols-3 gap-2">
          <MiniKPI label="Active" value={activeTasks} />
          <MiniKPI label="Done" value={doneTasks} />
          <MiniKPI label="Overdue" value={overdueTasks} color={overdueTasks > 0 ? 'text-lost' : undefined} />
        </div>
      </div>

      {/* Content counts */}
      <div>
        <div className="text-[13px] text-text-muted font-medium mb-2">Content</div>
        <div className="grid grid-cols-3 gap-2">
          <MiniKPI label="Notes" value={notes.length} />
          <MiniKPI label="Emails" value={emails.length} />
          <MiniKPI label="Contacts" value={contacts.length} />
        </div>
      </div>

      {/* Revenue */}
      {mTotal > 0 && (
        <div>
          <div className="text-[13px] text-text-muted font-medium mb-2">Revenue</div>
          <div className="grid grid-cols-2 gap-2">
            <MiniKPI label="Monthly" value={`${mTotal} €`} />
            <MiniKPI label="Annual" value={`${mTotal * 12} €`} />
          </div>
        </div>
      )}

      {/* Danger zone */}
      <div className="mt-8 pt-5 border-t border-border-light">
        {!deleting ? (
          <button onClick={() => setDeleting(true)} className="flex items-center gap-2 text-[13px] text-text-muted hover:text-lost transition-colors cursor-pointer">
            <Trash2 size={14} />
            Delete company
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-[13px] text-lost">Are you sure?</span>
            <button
              onClick={async () => {
                await supabase.from('companies').update({ deleted_at: new Date().toISOString() }).eq('id', companyId)
                navigate('/companies')
              }}
              className="px-3 py-1 rounded text-[13px] font-medium bg-lost text-white hover:opacity-90 cursor-pointer"
            >
              Delete
            </button>
            <button onClick={() => setDeleting(false)} className="px-3 py-1 rounded text-[13px] font-medium bg-border-light text-text-secondary hover:bg-border cursor-pointer">
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
