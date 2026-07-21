import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import { useWorkspace } from './WorkspaceContext'

// Debounced company + contact search shared by the desktop top bar and the
// mobile search overlay.
export function useSearch(query) {
  const [results, setResults] = useState([])
  const { ws } = useWorkspace()

  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    const timeout = setTimeout(async () => {
      const q = query.trim()
      // Commas and parens are PostgREST .or() syntax — strip them so user
      // input can't break or alter the filter expression
      const like = `%${q.replace(/[,()]/g, ' ')}%`
      const [cRes, pRes] = await Promise.all([
        supabase.from('companies').select('id, name, status, email, company_no, www, county, address, phone')
          .eq('workspace_id', ws)
          .is('deleted_at', null)
          .or(`name.ilike.${like},email.ilike.${like},company_no.ilike.${like},www.ilike.${like},county.ilike.${like},address.ilike.${like},description.ilike.${like},phone.ilike.${like}`)
          .limit(8),
        supabase.from('people').select('id, name, role, email, phone, company_id, companies(name)')
          .eq('workspace_id', ws)
          .is('deleted_at', null)
          .or(`name.ilike.${like},email.ilike.${like},phone.ilike.${like},role.ilike.${like}`)
          .limit(8),
      ])
      const matched = (obj, fields) => {
        const ql = q.toLowerCase()
        for (const f of fields) { if (obj[f] && obj[f].toLowerCase().includes(ql)) return obj[f] }
        return null
      }
      setResults([
        ...(cRes.data || []).map(c => {
          const hit = matched(c, ['email', 'company_no', 'phone', 'www', 'county', 'address'])
          return { type: 'company', id: c.id, name: c.name, sub: hit ? `${hit} · ${c.status}` : c.status }
        }),
        ...(pRes.data || []).map(p => {
          const hit = matched(p, ['email', 'phone', 'role'])
          const base = p.companies?.name || p.role || ''
          return { type: 'person', id: p.company_id, name: p.name, sub: hit && hit !== p.role ? `${hit} · ${base}` : base }
        }),
      ])
    }, 200)
    return () => clearTimeout(timeout)
  }, [query, ws])

  return results
}
