import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useWorkspace } from '../lib/WorkspaceContext'
import Avatar from '../components/Avatar'
import SidePeek, { FormField, Input, Textarea, Toggle, SearchableSelect, TagInput } from '../components/SidePeek'
import { Star, Mail as MailIcon } from 'lucide-react'

export default function People() {
  const [people, setPeople] = useState([])
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [peek, setPeek] = useState({ open: false, data: null })
  const [form, setForm] = useState({})

  const { ws } = useWorkspace()

  useEffect(() => { fetchPeople(); fetchCompanies() }, [ws])

  async function fetchPeople() {
    const { data } = await supabase
      .from('people')
      .select('*, companies(id, name)')
      .eq('workspace_id', ws)
      .is('deleted_at', null)
      .order('name')
    setPeople(data || [])
    setLoading(false)
  }

  async function fetchCompanies() {
    const { data } = await supabase
      .from('companies')
      .select('id, name')
      .eq('workspace_id', ws)
      .is('deleted_at', null)
      .order('name')
    setCompanies(data || [])
  }

  function openEdit(p) {
    setForm({
      name: p.name,
      role: p.role || '',
      email: p.email || '',
      alt_emails: p.alt_emails || [],
      phone: p.phone || '',
      company_id: p.company_id || '',
      is_primary: p.is_primary || false,
      newsletter: p.newsletter || false,
      notes: p.notes || '',
    })
    setPeek({ open: true, data: p })
  }

  function closePeek() {
    setPeek({ open: false, data: null })
  }

  async function saveEdit() {
    const payload = { ...form, company_id: form.company_id || null }
    await supabase.from('people').update(payload).eq('id', peek.data.id)
    closePeek()
    fetchPeople()
  }

  async function deletePerson() {
    if (!confirm('Delete this contact?')) return
    await supabase.from('people').update({ deleted_at: new Date().toISOString() }).eq('id', peek.data.id)
    closePeek()
    fetchPeople()
  }

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-baseline justify-between mb-6">
        <h1 className="font-serif text-[24px] font-semibold text-text-primary m-0">
          People {!loading && <span className="font-sans text-[14px] font-normal text-[#C4BCB1] ml-1">{people.length}</span>}
        </h1>
      </div>
      {/* Mobile card list */}
      <div className="md:hidden bg-surface">
        {loading ? (
          <div className="text-center py-8 text-text-muted text-[14px]">Loading...</div>
        ) : people.length === 0 ? (
          <div className="text-center py-8 text-text-muted text-[14px]">No contacts found</div>
        ) : (
          people.map(p => (
            <div key={p.id} onClick={() => openEdit(p)} className="flex items-center gap-2.5 px-3 py-2.5 border-b border-border-light last:border-0 cursor-pointer hover:bg-border-light transition-colors">
              <Avatar name={p.name} size={28} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-medium text-text-primary truncate">{p.name}</span>
                  {p.companies && (
                    <Link to={`/companies/${p.companies.id}`} onClick={e => e.stopPropagation()} className="text-[13px] text-accent hover:underline no-underline shrink-0">{p.companies.name}</Link>
                  )}
                  {p.is_primary && <Star size={12} className="text-accent fill-accent shrink-0" />}
                  {p.newsletter && <MailIcon size={12} className="text-accent shrink-0" />}
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  {p.role && <span className="text-[12px] text-text-muted">{p.role}</span>}
                  {p.email && <span className="text-[12px] text-text-muted truncate">{p.email}</span>}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-surface overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="text-[12px] text-text-muted font-semibold uppercase tracking-[.06em]">
              <th className="text-left py-2 px-3">Name</th>
              <th className="text-left py-2 px-3">Company</th>
              <th className="text-left py-2 px-3">Role</th>
              <th className="text-left py-2 px-3">Email</th>
              <th className="text-left py-2 px-3">Phone</th>
              <th className="text-center py-2 px-3">Primary</th>
              <th className="text-center py-2 px-3">Newsletter</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-8 text-text-muted text-[14px]">Loading...</td></tr>
            ) : people.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-text-muted text-[14px]">No contacts found</td></tr>
            ) : (
              people.map(p => (
                <tr key={p.id} onClick={() => openEdit(p)} className="hover:bg-border-light transition-colors cursor-pointer">
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={p.name} size={30} />
                      <span className="text-[15px] font-medium text-text-primary whitespace-nowrap">{p.name}</span>
                    </div>
                  </td>
                  <td className="py-2 px-3">
                    {p.companies ? (
                      <Link to={`/companies/${p.companies.id}`} onClick={e => e.stopPropagation()} className="text-[14px] text-accent hover:underline no-underline whitespace-nowrap">{p.companies.name}</Link>
                    ) : <span className="text-[14px] text-text-muted">—</span>}
                  </td>
                  <td className="py-2 px-3 text-[14px] text-text-secondary">{p.role || '—'}</td>
                  <td className="py-2 px-3">
                    {p.email ? <a href={`mailto:${p.email}`} onClick={e => e.stopPropagation()} className="text-[14px] text-accent hover:underline">{p.email}</a> : <span className="text-[14px] text-text-muted">—</span>}
                  </td>
                  <td className="py-2 px-3 text-[14px] text-text-secondary">{p.phone || '—'}</td>
                  <td className="py-2 px-3 text-center">
                    {p.is_primary && <Star size={14} className="text-accent inline-block fill-accent" />}
                  </td>
                  <td className="py-2 px-3 text-center">
                    {p.newsletter && <MailIcon size={14} className="text-accent inline-block" />}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <SidePeek title="Edit contact" open={peek.open} onClose={closePeek} onSave={saveEdit} onDelete={deletePerson}>
        <FormField label="Name"><Input value={form.name} onChange={v => set('name', v)} /></FormField>
        <FormField label="Role"><Input value={form.role} onChange={v => set('role', v)} /></FormField>
        <FormField label="Email"><Input value={form.email} onChange={v => set('email', v)} type="email" /></FormField>
        <FormField label="Other emails"><TagInput value={form.alt_emails} onChange={v => set('alt_emails', v)} placeholder="e.g. personal email — press Enter" /></FormField>
        <FormField label="Phone"><Input value={form.phone} onChange={v => set('phone', v)} type="tel" /></FormField>
        <FormField label="Company">
          <SearchableSelect
            value={form.company_id || ''}
            onChange={v => set('company_id', v)}
            options={companies.map(c => ({ value: c.id, label: c.name }))}
            placeholder="— No company —"
          />
        </FormField>
        <div className="flex items-center gap-6 mb-3">
          <Toggle checked={form.is_primary || false} onChange={v => set('is_primary', v)} label="Primary contact" />
          <Toggle checked={form.newsletter || false} onChange={v => set('newsletter', v)} label="Newsletter" />
        </div>
        <FormField label="Notes">
          <Textarea value={form.notes} onChange={v => set('notes', v)} placeholder="e.g. lapsehoolduspuhkusel, prefers email..." rows={3} />
        </FormField>
      </SidePeek>
    </div>
  )
}
