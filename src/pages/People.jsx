import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Avatar from '../components/Avatar'
import { Star, Search } from 'lucide-react'

export default function People() {
  const [people, setPeople] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('people')
      .select('*, companies(id, name)')
      .order('name')
      .then(({ data }) => {
        setPeople(data || [])
        setLoading(false)
      })
  }, [])

  const filtered = people.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6">
      <h1 className="text-[20px] font-semibold text-text-primary mb-5">People</h1>

      <div className="relative max-w-xs mb-4">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          placeholder="Otsi nime või emaili järgi..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-8 pr-3 py-1.5 border border-border rounded-lg text-[12px] bg-surface outline-none focus:border-accent transition-colors"
        />
      </div>

      <div className="bg-surface border border-border rounded-[10px] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-[11px] text-text-muted font-medium">
              <th className="text-left py-2 px-3">Nimi</th>
              <th className="text-left py-2 px-3">Firma</th>
              <th className="text-left py-2 px-3">Ametikoht</th>
              <th className="text-left py-2 px-3">Email</th>
              <th className="text-left py-2 px-3">Telefon</th>
              <th className="text-center py-2 px-3">Peamine</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8 text-text-muted text-[12px]">Laadin...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-text-muted text-[12px]">Kontakte ei leitud</td></tr>
            ) : (
              filtered.map(p => (
                <tr key={p.id} className="border-b border-border last:border-b-0 hover:bg-[#fafaf9] transition-colors">
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={p.name} size={24} />
                      <span className="text-[13px] font-medium text-text-primary">{p.name}</span>
                    </div>
                  </td>
                  <td className="py-2 px-3">
                    {p.companies ? (
                      <Link to={`/companies/${p.companies.id}`} className="text-[12px] text-accent hover:underline no-underline">{p.companies.name}</Link>
                    ) : <span className="text-[12px] text-text-muted">—</span>}
                  </td>
                  <td className="py-2 px-3 text-[12px] text-text-secondary">{p.role || '—'}</td>
                  <td className="py-2 px-3">
                    {p.email ? <a href={`mailto:${p.email}`} className="text-[12px] text-accent hover:underline">{p.email}</a> : <span className="text-[12px] text-text-muted">—</span>}
                  </td>
                  <td className="py-2 px-3 text-[12px] text-text-secondary">{p.phone || '—'}</td>
                  <td className="py-2 px-3 text-center">
                    {p.is_primary && <Star size={14} className="text-warning inline-block fill-warning" />}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
