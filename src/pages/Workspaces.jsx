import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useWorkspace } from '../lib/WorkspaceContext'
import { useUser } from '../lib/UserContext'
import { failed, toastError } from '../lib/toast'
import { Check, Trash2, Pencil, Plus, LogOut } from 'lucide-react'

export default function Workspaces() {
  const { memberships, ws, switchWorkspace } = useWorkspace()
  const { profile } = useUser()
  const [deleting, setDeleting] = useState(null)
  const [owners, setOwners] = useState({})
  const [counts, setCounts] = useState({})
  const [renaming, setRenaming] = useState(null)
  const [renameVal, setRenameVal] = useState('')

  // Owner profiles + member counts for transparency
  useEffect(() => {
    const ownerIds = [...new Set(memberships.map(m => m.workspaces.owner_id).filter(Boolean))]
    if (ownerIds.length) {
      supabase.from('profiles').select('id, full_name, email').in('id', ownerIds).then(({ data }) => {
        setOwners(Object.fromEntries((data || []).map(p => [p.id, p])))
      })
    }
    const wsIds = memberships.map(m => m.workspace_id)
    if (wsIds.length) {
      supabase.from('workspace_members').select('workspace_id').in('workspace_id', wsIds).then(({ data }) => {
        const c = {}
        ;(data || []).forEach(r => { c[r.workspace_id] = (c[r.workspace_id] || 0) + 1 })
        setCounts(c)
      })
    }
  }, [memberships])

  async function createWorkspace() {
    const name = prompt('Name for the new workspace:')?.trim()
    if (!name) return
    const res = await supabase.from('workspaces').insert({ name, owner_id: profile.id }).select('id').single()
    if (failed(res, 'Creating workspace failed')) return
    const mRes = await supabase.from('workspace_members').insert({ workspace_id: res.data.id, user_id: profile.id, role: 'owner' })
    if (failed(mRes, 'Creating workspace failed')) return
    localStorage.setItem('activeWorkspace', res.data.id)
    window.location.href = '/settings/workspace'
  }

  function startRename(m) {
    setRenaming(m.workspace_id)
    setRenameVal(m.workspaces.name)
  }

  async function saveRename(m) {
    const name = renameVal.trim()
    setRenaming(null)
    if (!name || name === m.workspaces.name) return
    const res = await supabase.from('workspaces').update({ name }).eq('id', m.workspace_id)
    if (failed(res, 'Renaming workspace failed')) return
    window.location.href = '/settings/workspace'
  }

  async function leaveWorkspace(m) {
    if (!confirm(`Leave workspace "${m.workspaces.name}"? You will lose access to its data until re-invited.`)) return
    const res = await supabase.from('workspace_members').delete()
      .eq('workspace_id', m.workspace_id).eq('user_id', profile.id)
    if (failed(res, 'Leaving workspace failed')) return
    if (ws === m.workspace_id) localStorage.removeItem('activeWorkspace')
    window.location.href = '/settings/workspace'
  }

  async function deleteWorkspace(m) {
    if (memberships.length < 2) {
      toastError('You cannot delete your only workspace')
      return
    }
    const name = m.workspaces.name
    // Non-empty workspaces demand typing the exact name — a plain confirm is
    // too easy to click through when the workspace holds real CRM data.
    const { count } = await supabase.from('companies').select('id', { count: 'exact', head: true }).eq('workspace_id', m.workspace_id)
    if (count > 0) {
      const typed = prompt(`"${name}" contains ${count} companies and all their data. Deleting it CANNOT be undone.\n\nType the workspace name to confirm:`)
      if (typed !== name) {
        if (typed !== null) toastError('Name did not match — nothing was deleted')
        return
      }
    } else if (!confirm(`Delete empty workspace "${name}"? This cannot be undone.`)) {
      return
    }
    setDeleting(m.workspace_id)
    const res = await supabase.from('workspaces').delete().eq('id', m.workspace_id)
    setDeleting(null)
    if (failed(res, 'Deleting workspace failed')) return
    if (ws === m.workspace_id) localStorage.removeItem('activeWorkspace')
    // Full reload so WorkspaceContext refetches memberships
    window.location.href = '/settings/workspace'
  }

  return (
    <div className="max-w-[560px]">
      <div className="bg-surface">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-[18px] font-semibold text-text-primary m-0">Workspaces</h2>
          <button onClick={createWorkspace} className="flex items-center gap-1.5 px-4 py-1.5 bg-accent text-white rounded-full text-[13px] font-semibold hover:opacity-90 transition-opacity cursor-pointer">
            <Plus size={13} /> New workspace
          </button>
        </div>
        <p className="text-[13px] text-text-muted mt-1 mb-5">Click a workspace to switch. Invite people under Settings → Team.</p>

        <div className="flex flex-col gap-2">
          {memberships.map(m => {
            const isActive = m.workspace_id === ws
            const isOwned = m.workspaces.owner_id === profile?.id
            const owner = owners[m.workspaces.owner_id]
            const memberCount = counts[m.workspace_id]
            return (
              <div
                key={m.workspace_id}
                onClick={() => switchWorkspace(m.workspace_id)}
                className={`flex items-center gap-3.5 rounded-xl px-3 py-3 cursor-pointer transition-colors ${isActive ? 'bg-border-light' : 'hover:bg-border-light'}`}
              >
                <div className="w-9 h-9 rounded-full bg-accent text-white flex items-center justify-center text-[13px] font-bold shrink-0">
                  {m.workspaces.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  {renaming === m.workspace_id ? (
                    <input
                      autoFocus
                      value={renameVal}
                      onChange={e => setRenameVal(e.target.value)}
                      onClick={e => e.stopPropagation()}
                      onBlur={() => saveRename(m)}
                      onKeyDown={e => { if (e.key === 'Enter') saveRename(m); if (e.key === 'Escape') setRenaming(null) }}
                      className="w-full px-2 py-1 rounded-lg bg-surface text-[14px] font-medium outline-none"
                    />
                  ) : (
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[14.5px] text-text-primary font-semibold truncate">{m.workspaces.name}</span>
                      {isOwned && (
                        <button onClick={e => { e.stopPropagation(); startRename(m) }} title="Rename" className="p-0.5 text-text-muted hover:text-text-primary transition-colors cursor-pointer shrink-0">
                          <Pencil size={12} />
                        </button>
                      )}
                    </div>
                  )}
                  <div className="text-[12.5px] text-text-secondary truncate">
                    {isOwned
                      ? `Owner: you${owner?.email ? ` · ${owner.email}` : ''}`
                      : `Owner: ${owner?.full_name || '—'}${owner?.email ? ` · ${owner.email}` : ''}`}
                  </div>
                  <div className="text-[12px] text-text-muted capitalize">
                    Your role: {isOwned ? 'owner' : m.role}{memberCount ? ` · ${memberCount} member${memberCount > 1 ? 's' : ''}` : ''}
                  </div>
                </div>
                {isActive && (
                  <span className="flex items-center gap-1 text-[12px] font-medium text-bg bg-text-primary rounded-full px-2.5 py-1 shrink-0">
                    <Check size={11} strokeWidth={3} /> Active
                  </span>
                )}
                {isOwned ? (
                  <button
                    onClick={e => { e.stopPropagation(); deleteWorkspace(m) }}
                    disabled={deleting === m.workspace_id}
                    title="Delete workspace"
                    className="p-1.5 text-text-muted hover:text-lost transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    <Trash2 size={15} />
                  </button>
                ) : (
                  <button
                    onClick={e => { e.stopPropagation(); leaveWorkspace(m) }}
                    title="Leave workspace"
                    className="p-1.5 text-text-muted hover:text-lost transition-colors cursor-pointer shrink-0"
                  >
                    <LogOut size={15} />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
