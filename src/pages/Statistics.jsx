import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { daysAgo, daysBetween, formatDate, monthlyTotal } from '../lib/utils'
import StatusPill from '../components/StatusPill'

const periods = ['See kuu', 'See kvartal', 'See aasta', 'Kogu aeg']
const markets = ['Kõik', 'Eesti', 'Soome']

const pipelineOrder = ['Research', 'In Conversation', 'On Hold', 'Trial', 'Waiting onboarding', 'Onboarding']

export default function Statistics() {
  const [companies, setCompanies] = useState([])
  const [activities, setActivities] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('See kvartal')
  const [market, setMarket] = useState('Kõik')

  useEffect(() => {
    Promise.all([
      supabase.from('companies').select('*'),
      supabase.from('activities').select('*'),
      supabase.from('tasks').select('*'),
    ]).then(([cRes, aRes, tRes]) => {
      setCompanies(cRes.data || [])
      setActivities(aRes.data || [])
      setTasks(tRes.data || [])
      setLoading(false)
    })
  }, [])

  const dateRange = useMemo(() => {
    const now = new Date()
    const y = now.getFullYear(), m = now.getMonth()
    if (period === 'See kuu') return { start: new Date(y, m, 1), end: now }
    if (period === 'See kvartal') { const q = Math.floor(m / 3) * 3; return { start: new Date(y, q, 1), end: now } }
    if (period === 'See aasta') return { start: new Date(y, 0, 1), end: now }
    return { start: new Date(2000, 0, 1), end: now }
  }, [period])

  const fc = useMemo(() => {
    return companies.filter(c => {
      if (market === 'Soome') return c.county === 'Soome'
      if (market === 'Eesti') return c.county !== 'Soome'
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
  lost.forEach(c => { const r = c.loss_reason || 'Muu'; lossReasons[r] = (lossReasons[r] || 0) + 1 })

  const sources = {}
  fc.forEach(c => {
    (c.source || ['Tundmatu']).forEach(s => {
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
    (c.sector || ['Muu']).forEach(s => {
      if (!sectorStats[s]) sectorStats[s] = { active: 0, won: 0, lost: 0 }
      if (activeStatuses.includes(c.status)) sectorStats[s].active++
      if (c.status === 'Won') sectorStats[s].won++
      if (c.status === 'Lost') sectorStats[s].lost++
    })
  })

  if (loading) return <div className="p-6 text-text-muted text-[13px]">Laadin...</div>

  return (
    <div className="p-6">
      <h1 className="text-[20px] font-semibold text-text-primary mb-5">Statistics</h1>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex gap-1">
          {periods.map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${period === p ? 'bg-text-primary text-white' : 'bg-surface border border-border text-text-secondary hover:bg-border-light'}`}
            >{p}</button>
          ))}
        </div>
        <div className="flex gap-1">
          {markets.map(m => (
            <button key={m} onClick={() => setMarket(m)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${market === m ? 'bg-text-primary text-white' : 'bg-surface border border-border text-text-secondary hover:bg-border-light'}`}
            >{m}</button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <KPI label="Aktiivsed tehingud" value={active.length} />
        <KPI label="Win Rate" value={`${winRate}%`} color={winRate > 50 ? 'text-won' : 'text-lost'} />
        <KPI label="Kesk. tehingukestus" value={`${avgDeal}p`} />
        <KPI label="Üle tähtaja follow-up'd" value={overdueFollowUps.length} color={overdueFollowUps.length > 0 ? 'text-lost' : undefined} />
      </div>

      {/* Pipeline Funnel */}
      <Card title="Pipeline funnel" className="mb-6">
        <div className="flex items-end gap-2">
          {pipelineOrder.map((s, i) => {
            const count = fc.filter(c => c.status === s).length
            const maxCount = Math.max(...pipelineOrder.map(st => fc.filter(c => c.status === st).length), 1)
            return (
              <div key={s} className="flex-1 text-center">
                <div className="text-[16px] font-bold text-text-primary mb-1">{count}</div>
                <div className="mx-auto rounded-t" style={{ height: Math.max(count / maxCount * 80, 4), backgroundColor: ['#6b6b6b', '#1d4ed8', '#b45309', '#be185d', '#475569', '#92400e'][i] || '#6b6b6b' }} />
                <div className="text-[9px] text-text-secondary mt-1 leading-tight">{s}</div>
              </div>
            )
          })}
          <div className="flex-1 text-center">
            <div className="text-[16px] font-bold text-won mb-1">{won.length}</div>
            <div className="mx-auto rounded-t bg-won" style={{ height: Math.max(won.length / Math.max(...pipelineOrder.map(st => fc.filter(c => c.status === st).length), 1) * 80, 4) }} />
            <div className="text-[9px] text-text-secondary mt-1">Won</div>
          </div>
          <div className="flex-1 text-center">
            <div className="text-[16px] font-bold text-lost mb-1">{lost.length}</div>
            <div className="mx-auto rounded-t bg-lost" style={{ height: Math.max(lost.length / Math.max(...pipelineOrder.map(st => fc.filter(c => c.status === st).length), 1) * 80, 4) }} />
            <div className="text-[9px] text-text-secondary mt-1">Lost</div>
          </div>
        </div>
      </Card>

      {/* MRR */}
      <Card title="MRR pilt" className="mb-6">
        <div className="grid grid-cols-3 gap-4 mb-4">
          <KPI label="Praegune MRR" value={`${currentMRR} €`} small />
          <KPI label="Kesk. MRR/klient" value={`${avgMRR} €`} small />
          <KPI label="Pipeline potentsiaal" value={`${pipelineMRR} €`} small />
        </div>
      </Card>

      {/* Activity Health */}
      <Card title="Tegevuse tervis" className="mb-6">
        <div className="grid grid-cols-3 gap-4 mb-4">
          <KPI label="Activities sel perioodil" value={periodActivities.length} small />
          <KPI label="Taskid üle tähtaja" value={overdueTasks.length} small color={overdueTasks.length > 0 ? 'text-lost' : undefined} />
          <KPI label="Vaikivad firmad (30+p)" value={silentCompanies.length} small color={silentCompanies.length > 0 ? 'text-lost' : undefined} />
        </div>
        {silentCompanies.length > 0 && (
          <div className="border-t border-border pt-3">
            <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wide mb-2">Vaikivad firmad</div>
            {silentCompanies.map(c => (
              <div key={c.id} className="flex items-center gap-3 py-1.5 text-[12px]">
                <Link to={`/companies/${c.id}`} className="text-accent hover:underline no-underline flex-1">{c.name}</Link>
                <StatusPill status={c.status} />
                <span className="text-lost text-[11px]">{daysAgo(c.last_contact)}p tagasi</span>
                <span className="text-text-muted text-[11px]">{formatDate(c.follow_up)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Loss Analysis */}
      {lost.length > 0 && (
        <Card title="Kaotuse analüüs" className="mb-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wide mb-2">Põhjused</div>
              {Object.entries(lossReasons).sort((a, b) => b[1] - a[1]).map(([reason, count]) => (
                <div key={reason} className="flex items-center justify-between py-1.5 text-[12px]">
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
              <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wide mb-2">Lost tehingud</div>
              {lost.map(c => (
                <div key={c.id} className="flex items-center gap-3 py-1.5 text-[12px]">
                  <Link to={`/companies/${c.id}`} className="text-accent hover:underline no-underline flex-1">{c.name}</Link>
                  <span className="text-text-secondary">{c.loss_reason}</span>
                  <span className="text-text-muted">{daysBetween(c.starting_date, c.closed_date)}p</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Sources */}
      <Card title="Allikate analüüs" className="mb-6">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="text-[11px] text-text-muted font-medium border-b border-border">
              <th className="text-left py-1.5">Allikas</th>
              <th className="text-right py-1.5">Kokku</th>
              <th className="text-right py-1.5">Won</th>
              <th className="text-right py-1.5">Lost</th>
              <th className="text-right py-1.5">Aktiivne</th>
              <th className="text-right py-1.5">Win Rate</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(sources).sort((a, b) => b[1].total - a[1].total).map(([source, s]) => {
              const wr = s.won + s.lost > 0 ? Math.round(s.won / (s.won + s.lost) * 100) : null
              return (
                <tr key={source} className="border-b border-border-light">
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
        <Card title="Trial tervis" className="mb-6">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <KPI label="Aktiivsed trial'id" value={trials.length} small />
            <KPI label="Lõpevad 7p jooksul" value={trialsEndingSoon.length} small color={trialsEndingSoon.length > 0 ? 'text-warning' : undefined} />
            <KPI label="Trial → Won" value={`${fc.filter(c => c.status === 'Won').length}`} small />
          </div>
          {trials.map(c => (
            <div key={c.id} className="flex items-center gap-3 py-1.5 text-[12px] border-b border-border-light last:border-0">
              <Link to={`/companies/${c.id}`} className="text-accent hover:underline no-underline flex-1">{c.name}</Link>
              <span className={`${c.trial_ends && daysAgo(c.trial_ends) > -7 ? 'text-lost font-medium' : 'text-text-secondary'}`}>{formatDate(c.trial_ends)}</span>
              <span className="text-text-muted">{c.users_count || 0} kasutajat</span>
              <span className="text-text-secondary">{monthlyTotal(c)} €/kuu</span>
            </div>
          ))}
        </Card>
      )}

      {/* Sectors */}
      <Card title="Sektori jaotus">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="text-[11px] text-text-muted font-medium border-b border-border">
              <th className="text-left py-1.5">Sektor</th>
              <th className="text-right py-1.5">Aktiivsed</th>
              <th className="text-right py-1.5">Won</th>
              <th className="text-right py-1.5">Lost</th>
              <th className="text-right py-1.5">Win Rate</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(sectorStats).sort((a, b) => (b[1].active + b[1].won) - (a[1].active + a[1].won)).map(([sector, s]) => {
              const wr = s.won + s.lost > 0 ? Math.round(s.won / (s.won + s.lost) * 100) : null
              return (
                <tr key={sector} className="border-b border-border-light">
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
    <div className={`bg-surface border border-border rounded-[10px] p-4 ${className}`}>
      <h3 className="text-[13px] font-semibold text-text-primary mb-3">{title}</h3>
      {children}
    </div>
  )
}

function KPI({ label, value, color, small }) {
  return (
    <div className={small ? '' : 'bg-surface border border-border rounded-[10px] p-3'}>
      <div className="text-[10px] text-text-muted uppercase tracking-wide mb-1">{label}</div>
      <div className={`${small ? 'text-[18px]' : 'text-[24px]'} font-bold ${color || 'text-text-primary'}`}>{value}</div>
    </div>
  )
}
