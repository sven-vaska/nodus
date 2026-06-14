import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { pipelineText, formatDate } from '../lib/utils'
import StatusPill from '../components/StatusPill'
import Avatar from '../components/Avatar'
import SidePeek, { FormField, Input, Textarea, Select } from '../components/SidePeek'
import { Search, Plus } from 'lucide-react'

const statuses = ['Kõik', 'Research', 'In Conversation', 'On Hold', 'Trial', 'Waiting onboarding', 'Onboarding', 'Won', 'Lost', 'Former Client']
const counties = ['Tallinn', 'Tartu', 'Pärnu', 'Narva', 'Viljandi', 'Rakvere', 'Haapsalu', 'Kuressaare', 'Jõhvi', 'Soome']

const emptyCompany = { name: '', www: '', description: '', company_no: '', email: '', county: '', address: '', status: 'Research' }

export default function Companies() {
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('Kõik')
  const [peekOpen, setPeekOpen] = useState(false)
  const [form, setForm] = useState({ ...emptyCompany })

  useEffect(() => { fetchCompanies() }, [])

  async function fetchCompanies() {
    const { data } = await supabase
      .from('companies')
      .select('*')
      .order('last_contact', { ascending: false, nullsFirst: false })
    setCompanies(data || [])
    setLoading(false)
  }

  function openNew() {
    setForm({ ...emptyCompany })
    setPeekOpen(true)
  }

  async function handleSave() {
    if (!form.name.trim()) return
    await supabase.from('companies').insert({
      ...form,
      last_contact: new Date().toISOString(),
      created_at: new Date().toISOString(),
    })
    setPeekOpen(false)
    fetchCompanies()
  }

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const filtered = companies.filter(c => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false
    if (statusFilter !== 'Kõik' && c.status !== statusFilter) return false
    return true
  })

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-[20px] font-semibold text-text-primary">Companies</h1>
        <button onClick={openNew} className="flex items-center gap-1.5 px-3 py-1.5 bg-text-primary text-white rounded-lg text-[12px] font-medium hover:opacity-90 transition-opacity cursor-pointer">
          <Plus size={14} />
          Lisa firma
        </button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Otsi firma nime järgi..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 border border-border rounded-lg text-[12px] bg-surface outline-none focus:border-accent transition-colors"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-1 mb-5">
        {statuses.map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
              statusFilter === s
                ? 'bg-text-primary text-white'
                : 'bg-surface border border-border text-text-secondary hover:bg-border-light'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="bg-surface border border-border rounded-[10px] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-[11px] text-text-muted font-medium">
              <th className="text-left py-2 px-3">Firma</th>
              <th className="text-left py-2 px-3">Sektor</th>
              <th className="text-left py-2 px-3">Maakond</th>
              <th className="text-left py-2 px-3">Staatus</th>
              <th className="text-left py-2 px-3">Pipeline</th>
              <th className="text-left py-2 px-3">Follow-up</th>
              <th className="text-left py-2 px-3">Owner</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-8 text-text-muted text-[12px]">Laadin...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-text-muted text-[12px]">Firmasid ei leitud</td></tr>
            ) : (
              filtered.map(company => (
                <tr key={company.id} className="border-b border-border last:border-b-0 hover:bg-[#fafaf9] transition-colors">
                  <td className="py-2 px-3">
                    <Link to={`/companies/${company.id}`} className="flex items-center gap-2.5 no-underline">
                      <div className="w-7 h-7 rounded-md bg-border-light flex items-center justify-center text-[11px] font-semibold text-text-secondary shrink-0">
                        {company.name.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-[13px] font-medium text-text-primary hover:text-accent transition-colors">
                        {company.name}
                      </span>
                    </Link>
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex flex-wrap gap-1">
                      {(company.sector || []).map(s => (
                        <span key={s} className="text-[10px] px-1.5 py-0.5 bg-border-light rounded text-text-secondary">{s}</span>
                      ))}
                    </div>
                  </td>
                  <td className="py-2 px-3 text-[12px] text-text-secondary">{company.county || '—'}</td>
                  <td className="py-2 px-3"><StatusPill status={company.status} /></td>
                  <td className="py-2 px-3 text-[11px] text-text-secondary">{pipelineText(company)}</td>
                  <td className="py-2 px-3">
                    {company.follow_up ? (
                      <span className={`text-[11px] ${new Date(company.follow_up) < new Date() ? 'text-lost font-medium' : 'text-text-secondary'}`}>
                        {formatDate(company.follow_up)}
                      </span>
                    ) : <span className="text-[11px] text-text-muted">—</span>}
                  </td>
                  <td className="py-2 px-3">
                    {company.owner_id ? <Avatar name="Sven Vaska" size={22} /> : <span className="text-[11px] text-text-muted">—</span>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <SidePeek title="Uus firma" open={peekOpen} onClose={() => setPeekOpen(false)} onSave={handleSave}>
        <FormField label="Ettevõtte nimi *">
          <Input value={form.name} onChange={v => set('name', v)} placeholder="OÜ Näidis" />
        </FormField>
        <FormField label="Veebileht">
          <Input value={form.www} onChange={v => set('www', v)} placeholder="https://" />
        </FormField>
        <FormField label="Kirjeldus">
          <Textarea value={form.description} onChange={v => set('description', v)} placeholder="Tegevusala kirjeldus..." />
        </FormField>
        <FormField label="Reg. nr">
          <Input value={form.company_no} onChange={v => set('company_no', v)} />
        </FormField>
        <FormField label="Email">
          <Input value={form.email} onChange={v => set('email', v)} type="email" placeholder="info@firma.ee" />
        </FormField>
        <FormField label="Maakond">
          <Select value={form.county} onChange={v => set('county', v)} options={counties} placeholder="Vali maakond..." />
        </FormField>
        <FormField label="Aadress">
          <Input value={form.address} onChange={v => set('address', v)} />
        </FormField>
        <FormField label="Staatus">
          <Select value={form.status} onChange={v => set('status', v)} options={statuses.filter(s => s !== 'Kõik')} />
        </FormField>
      </SidePeek>
    </div>
  )
}
