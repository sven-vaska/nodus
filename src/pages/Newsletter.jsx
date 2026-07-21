import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useWorkspace } from '../lib/WorkspaceContext'
import { Download } from 'lucide-react'

export default function Newsletter() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  const { ws } = useWorkspace()

  useEffect(() => { fetchList() }, [ws])

  async function fetchList() {
    const [companyRes, peopleRes] = await Promise.all([
      supabase
        .from('companies')
        .select('id, name, email, newsletter')
        .eq('workspace_id', ws)
        .is('deleted_at', null)
        .eq('newsletter', true)
        .not('email', 'is', null),
      supabase
        .from('people')
        .select('id, name, email, newsletter, company_id, companies(id, name)')
        .eq('workspace_id', ws)
        .is('deleted_at', null)
        .eq('newsletter', true)
        .not('email', 'is', null),
    ])

    const list = []
    const seen = new Set()

    for (const c of (companyRes.data || [])) {
      if (c.email) {
        const key = c.email.toLowerCase()
        if (!seen.has(key)) {
          seen.add(key)
          list.push({ email: c.email, company: c.name, contact: '— company email —', source: 'company' })
        }
      }
    }

    for (const p of (peopleRes.data || [])) {
      if (p.email) {
        const key = p.email.toLowerCase()
        if (!seen.has(key)) {
          seen.add(key)
          list.push({ email: p.email, company: p.companies?.name || '—', contact: p.name, source: 'contact' })
        }
      }
    }

    list.sort((a, b) => a.email.localeCompare(b.email))
    setRows(list)
    setLoading(false)
  }

  function downloadCSV() {
    const header = 'Email,Company,Contact\n'
    const body = rows.map(r => `"${r.email}","${r.company}","${r.contact}"`).join('\n')
    const blob = new Blob([header + body], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `newsletter-list-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-serif text-[22px] font-semibold text-text-primary m-0">Newsletter List</h1>
        <button
          onClick={downloadCSV}
          disabled={rows.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-accent text-white rounded-full text-[13px] font-medium hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download size={14} /> Download CSV
        </button>
      </div>

      <p className="text-[13px] text-text-muted mb-4">
        Emails collected from companies and contacts where "Newsletter" is enabled. Total: <span className="font-semibold text-text-primary">{rows.length}</span>
      </p>

      <div className="bg-surface overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-[13px] text-text-muted font-medium">
              <th className="text-left py-2 px-3">Email</th>
              <th className="text-left py-2 px-3">Company</th>
              <th className="text-left py-2 px-3">Contact</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={3} className="text-center py-8 text-text-muted text-[14px]">Loading...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={3} className="text-center py-8 text-text-muted text-[14px]">No newsletter subscribers yet. Enable "Newsletter" on companies or contacts.</td></tr>
            ) : (
              rows.map((r, i) => (
                <tr key={i} className="border-b border-border last:border-b-0">
                  <td className="py-2 px-3 text-[14px] text-text-primary">{r.email}</td>
                  <td className="py-2 px-3 text-[14px] text-text-secondary">{r.company}</td>
                  <td className="py-2 px-3 text-[14px] text-text-secondary">{r.contact}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
