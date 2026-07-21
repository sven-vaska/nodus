import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useWorkspace } from '../lib/WorkspaceContext'
import { daysAgo, daysBetween, formatDate, monthlyTotal, mergeFinance } from '../lib/utils'
import StatusPill from '../components/StatusPill'
import Loading from '../components/Loading'

const periods = ['This month', 'This quarter', 'This year', 'All time']
const markets = ['All', 'Estonia', 'Finland']

const pipelineOrder = ['Research', 'In Conversation', 'On Hold', 'Trial', 'Waiting onboarding', 'Onboarding']

export default function Statistics() {
  const [companies, setCompanies] = useState([])
  const [activities, setActivities] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('This quarter')
  const [market, setMarket] = useState('All')

  const { ws, statusLabel } = useWorkspace()

  useEffect(() => {
    Promise.all([
      supabase.from('companies').select('*, company_finance(*)').eq('workspace_id', ws).is('deleted_at', null),
      supabase.from('activities').select('*').eq('workspace_id', ws),
      supabase.from('tasks').select('*').eq('workspace_id', ws),
    ]).then(([cRes, aRes, tRes]) => {
      setCompanies((cRes.data || []).map(mergeFinance))
      setActivities(aRes.data || [])
      setTasks(tRes.data || [])
      setLoading(false)
    })
  }, [ws])

  const dateRange = useMemo(() => {
    const now = new Date()
    const y = now.getFullYear(), m = now.getMonth()
    if (period === 'This month') return { start: new Date(y, m, 1), end: now }
    if (period === 'This quarter') { const q = Math.floor(m / 3) * 3; return { start: new Date(y, q, 1), end: now } }
    if (period === 'This year') return { start: new Date(y, 0, 1), end: now }
    return { start: new Date(2000, 0, 1), end: now }
  }, [period])

  const fc = useMemo(() => {
    return companies.filter(c => {
      if (market === 'Finland') return c.county === 'Soome'
      if (market === 'Estonia') return c.county !== 'Soome'
      return true
    })
  }, [companies, market])

  const activeStatuses = ['In Conversation', 'On Hold', 'Trial', 'Waiting onboarding', 'Onboarding']
  const active = fc.filter(c => activeStatuses.includes(c.status))
  const won = fc.filter(c => c.status === 'Won' && c.closed_date && new Date(c.closed_date) >= dateRange.start)
  const lost = fc.filter(c => c.status === 'Lost' && c.closed_date && new Date(c.closed_date) >= dateRange.start)
  const winRate = won.length + lost.length > 0 ? Math.round(won.length / (won.length + lost.length) * 100) : 0
  const avgDeal = won.length > 0 ? Math.round(won.reduce((s, c) => s + (daysBetween(c.starting_date, c.closed_date) || 0), 0) / won.length) : 0
  const overdueFollowUps = fc.filter(c => activeStatuses.includes(c.status) && c.follow_up && new Date(c.follow_up) < new Date())

  const currentMRR = fc.filter(c => c.status === 'Won').reduce((s, c) => s + monthlyTotal(c), 0)
  const wonCount = fc.filter(c => c.status === 'Won').length
  const avgMRR = wonCount > 0 ? Math.round(currentMRR / wonCount) : 0
  const pipelineMRR = fc.filter(c => ['In Conversation', 'Trial'].includes(c.status)).reduce((s, c) => s + monthlyTotal(c), 0)

  const periodActivities = activities.filter(a => new Date(a.created_at) >= dateRange.start)
  const overdueTasks = tasks.filter(t => !t.done && t.due_date && new Date(t.due_date) < new Date())
  const silentCompanies = fc.filter(c => activeStatuses.includes(c.status) && c.last_contact && daysAgo(c.last_contact) > 30)

  const lossReasons = {}
  lost.forEach(c => { const r = c.loss_reason || 'Other'; lossReasons[r] = (lossReasons[r] || 0) + 1 })

  const sources = {}
  fc.forEach(c => {
    (c.source || ['Unknown']).forEach(s => {
      if (!sources[s]) sources[s] = { total: 0, won: 0, lost: 0, active: 0 }
      sources[s].total++
      if (c.status === 'Won') sources[s].won++
      else if (c.status === 'Lost') sources[s].lost++
      else if (activeStatuses.includes(c.status)) sources[s].active++
    })
  })

  const trials = fc.filter(c => c.status === 'Trial')
  const trialsEndingSoon = trials.filter(c => c.trial_ends && daysAgo(c.trial_ends) !== null && daysAgo(c.trial_ends) > -7)

  const sectorStats = {}
  fc.forEach(c => {
    (c.sector || ['Other']).forEach(s => {
      if (!sectorStats[s]) sectorStats[s] = { active: 0, won: 0, lost: 0 }
      if (activeStatuses.includes(c.status)) sectorStats[s].active++
      if (c.status === 'Won') sectorStats[s].won++
      if (c.status === 'Lost') sectorStats[s].lost++
    })
  })

  if (loading) return <Loading />

  return (
    <div className="p-4 md:p-6 md:px-[10%]">
      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-baseline md:justify-between mb-10 gap-4">
        <h1 className="font-serif text-[24px] font-semibold text-text-primary m-0">Statistics</h1>
        <div className="flex gap-4 items-center overflow-x-auto md:flex-wrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden -mx-4 px-4 md:mx-0 md:px-0">
        <div className="flex gap-1 overflow-x-auto">
          {periods.map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3.5 py-1.5 rounded-full text-[13.5px] font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${period === p ? 'bg-text-primary text-bg' : 'text-text-muted hover:bg-border-light hover:text-text-primary'}`}
            >{p}</button>
          ))}
        </div>
        <div className="flex gap-1 overflow-x-auto">
          {markets.map(m => (
            <button key={m} onClick={() => setMarket(m)}
              className={`px-3.5 py-1.5 rounded-full text-[13.5px] font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${market === m ? 'bg-border-light text-text-primary' : 'text-text-muted hover:bg-border-light hover:text-text-primary'}`}
            >{m}</button>
          ))}
        </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-12">
        <KPI label="Active deals" value={active.length} />
        <KPI label="Win Rate" value={`${winRate}%`} color={winRate > 50 ? 'text-won' : 'text-lost'} />
        <KPI label="Avg. deal duration" value={`${avgDeal}d`} />
        <KPI label="Overdue follow-ups" value={overdueFollowUps.length} color={overdueFollowUps.length > 0 ? 'text-lost' : undefined} />
      </div>

      {/* Pipeline Funnel */}
      <Card title="Pipeline funnel" className="mb-12">
        <div className="flex items-end gap-1 md:gap-2 overflow-x-auto">
          {pipelineOrder.map((s, i) => {
            const count = fc.filter(c => c.status === s).length
            const maxCount = Math.max(...pipelineOrder.map(st => fc.filter(c => c.status === st).length), 1)
            return (
              <div key={s} className="flex-1 text-center">
                <div className="text-[15px] font-semibold text-text-primary mb-1.5">{count}</div>
                <div className="mx-auto rounded-t-lg" style={{ height: Math.max(count / maxCount * 80, 4), backgroundColor: ['#E3D9CA', '#D9A184', '#C9BDA8', '#B4552D', '#CBB89A', '#A97B1F'][i] || '#E3D9CA' }} />
                <div className="text-[11px] text-text-secondary mt-1 leading-tight">{statusLabel(s)}</div>
              </div>
            )
          })}
          <div className="flex-1 text-center">
            <div className="text-[18px] font-bold text-won mb-1">{won.length}</div>
            <div className="mx-auto rounded-t-lg bg-won" style={{ height: Math.max(won.length / Math.max(...pipelineOrder.map(st => fc.filter(c => c.status === st).length), 1) * 80, 4) }} />
            <div className="text-[11px] text-text-secondary mt-1">Won</div>
          </div>
          <div className="flex-1 text-center">
            <div className="text-[18px] font-bold text-lost mb-1">{lost.length}</div>
            <div className="mx-auto rounded-t-lg bg-lost" style={{ height: Math.max(lost.length / Math.max(...pipelineOrder.map(st => fc.filter(c => c.status === st).length), 1) * 80, 4) }} />
            <div className="text-[11px] text-text-secondary mt-1">Lost</div>
          </div>
        </div>
      </Card>

      {/* MRR */}
      <Card title="MRR overview" className="mb-12">
        <div className="grid grid-cols-3 gap-4 mb-4">
          <KPI label="Current MRR" value={`${currentMRR} €`} small />
          <KPI label="Avg. MRR/client" value={`${avgMRR} €`} small />
          <KPI label="Pipeline potential" value={`${pipelineMRR} €`} small />
        </div>
      </Card>

      {/* Activity Health */}
      <Card title="Activity health" className="mb-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mb-4">
          <KPI label="Activities this period" value={periodActivities.length} small />
          <KPI label="Calls" value={periodActivities.filter(a => a.type === 'Call' || a.type === 'Kõne').length} small />
          <KPI label="Meetings" value={periodActivities.filter(a => a.type === 'Meeting' || a.type === 'Kohtumine').length} small />
          <KPI label="Overdue tasks" value={overdueTasks.length} small color={overdueTasks.length > 0 ? 'text-lost' : undefined} />
          <KPI label="Silent companies (30+d)" value={silentCompanies.length} small color={silentCompanies.length > 0 ? 'text-lost' : undefined} />
        </div>
        {silentCompanies.length > 0 && (
          <div className="border-t border-border pt-3">
            <div className="text-[13px] font-semibold text-text-muted uppercase tracking-wide mb-2">Silent companies</div>
            {silentCompanies.map(c => (
              <div key={c.id} className="flex items-center gap-2 py-1.5 text-[14px] flex-wrap">
                <Link to={`/companies/${c.id}`} className="text-accent hover:underline no-underline flex-1 min-w-0 truncate">{c.name}</Link>
                <StatusPill status={c.status} />
                <span className="text-lost text-[13px] shrink-0">{daysAgo(c.last_contact)}d ago</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Loss Analysis */}
      {lost.length > 0 && (
        <Card title="Loss analysis" className="mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-[13px] font-semibold text-text-muted uppercase tracking-wide mb-2">Reasons</div>
              {Object.entries(lossReasons).sort((a, b) => b[1] - a[1]).map(([reason, count]) => (
                <div key={reason} className="flex items-center justify-between py-1.5 text-[14px]">
                  <span className="text-text-primary">{reason}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1.5 bg-border-light rounded-full overflow-hidden">
                      <div className="h-full bg-lost rounded-full" style={{ width: `${count / lost.length * 100}%` }} />
                    </div>
                    <span className="text-text-secondary w-8 text-right">{count}</span>
                    <span className="text-text-muted w-10 text-right">{Math.round(count / lost.length * 100)}%</span>
                  </div>
                </div>
              ))}
            </div>
            <div>
              <div className="text-[13px] font-semibold text-text-muted uppercase tracking-wide mb-2">Lost deals</div>
              {lost.map(c => (
                <div key={c.id} className="flex items-center gap-3 py-1.5 text-[14px]">
                  <Link to={`/companies/${c.id}`} className="text-accent hover:underline no-underline flex-1">{c.name}</Link>
                  <span className="text-text-secondary">{c.loss_reason}</span>
                  <span className="text-text-muted">{daysBetween(c.starting_date, c.closed_date)}d</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Sources */}
      <Card title="Source analysis" className="mb-12 overflow-x-auto">
        <table className="w-full text-[14px] min-w-[400px]">
          <thead>
            <tr className="text-[12px] text-text-muted font-semibold uppercase tracking-[.06em]">
              <th className="text-left py-1.5">Source</th>
              <th className="text-right py-1.5">Total</th>
              <th className="text-right py-1.5">Won</th>
              <th className="text-right py-1.5">Lost</th>
              <th className="text-right py-1.5">Active</th>
              <th className="text-right py-1.5">Win Rate</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(sources).sort((a, b) => b[1].total - a[1].total).map(([source, s]) => {
              const wr = s.won + s.lost > 0 ? Math.round(s.won / (s.won + s.lost) * 100) : null
              return (
                <tr key={source}>
                  <td className="py-1.5 text-text-primary font-medium">{source}</td>
                  <td className="py-1.5 text-right text-text-secondary">{s.total}</td>
                  <td className="py-1.5 text-right text-won">{s.won}</td>
                  <td className="py-1.5 text-right text-lost">{s.lost}</td>
                  <td className="py-1.5 text-right text-text-secondary">{s.active}</td>
                  <td className={`py-1.5 text-right font-medium ${wr !== null ? (wr > 50 ? 'text-won' : wr < 30 ? 'text-lost' : 'text-warning') : 'text-text-muted'}`}>
                    {wr !== null ? `${wr}%` : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>

      {/* Trials */}
      {trials.length > 0 && (
        <Card title="Trial health" className="mb-12">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <KPI label="Active trials" value={trials.length} small />
            <KPI label="Ending in 7 days" value={trialsEndingSoon.length} small color={trialsEndingSoon.length > 0 ? 'text-warning' : undefined} />
            <KPI label="Trial → Won" value={`${fc.filter(c => c.status === 'Won').length}`} small />
          </div>
          {trials.map(c => (
            <div key={c.id} className="flex items-center gap-3 py-1.5 text-[14px] border-b border-border-light last:border-0">
              <Link to={`/companies/${c.id}`} className="text-accent hover:underline no-underline flex-1">{c.name}</Link>
              <span className={`${c.trial_ends && daysAgo(c.trial_ends) > -7 ? 'text-lost font-medium' : 'text-text-secondary'}`}>{formatDate(c.trial_ends)}</span>
              <span className="text-text-muted">{c.users_count || 0} users</span>
              <span className="text-text-secondary">{monthlyTotal(c)} €/mo</span>
            </div>
          ))}
        </Card>
      )}

      {/* Sectors */}
      <Card title="Sector breakdown" className="overflow-x-auto">
        <table className="w-full text-[14px] min-w-[350px]">
          <thead>
            <tr className="text-[12px] text-text-muted font-semibold uppercase tracking-[.06em]">
              <th className="text-left py-1.5">Sector</th>
              <th className="text-right py-1.5">Active</th>
              <th className="text-right py-1.5">Won</th>
              <th className="text-right py-1.5">Lost</th>
              <th className="text-right py-1.5">Win Rate</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(sectorStats).sort((a, b) => (b[1].active + b[1].won) - (a[1].active + a[1].won)).map(([sector, s]) => {
              const wr = s.won + s.lost > 0 ? Math.round(s.won / (s.won + s.lost) * 100) : null
              return (
                <tr key={sector}>
                  <td className="py-1.5 text-text-primary font-medium">{sector}</td>
                  <td className="py-1.5 text-right text-text-secondary">{s.active}</td>
                  <td className="py-1.5 text-right text-won">{s.won}</td>
                  <td className="py-1.5 text-right text-lost">{s.lost}</td>
                  <td className={`py-1.5 text-right font-medium ${wr !== null ? (wr > 60 ? 'text-won' : wr < 30 ? 'text-lost' : 'text-warning') : 'text-text-muted'}`}>
                    {wr !== null ? `${wr}%` : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

function Card({ title, children, className = '' }) {
  return (
    <div className={`bg-surface ${className}`}>
      <h3 className="font-serif text-[18px] font-semibold text-text-primary mb-4 mt-0">{title}</h3>
      {children}
    </div>
  )
}

function KPI({ label, value, color, small }) {
  return (
    <div>
      <div className="text-[12px] text-text-muted uppercase tracking-[.06em] font-semibold mb-1.5">{label}</div>
      <div className={`font-serif ${small ? 'text-[26px]' : 'text-[34px]'} font-semibold ${color || 'text-text-primary'}`}>{value}</div>
    </div>
  )
}
