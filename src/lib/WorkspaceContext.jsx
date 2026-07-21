import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from './supabase'
import { failed } from './toast'

const WorkspaceContext = createContext(null)

export function WorkspaceProvider({ children }) {
  const [memberships, setMemberships] = useState(null) // null = loading
  const [activeId, setActiveId] = useState(() => localStorage.getItem('activeWorkspace') || null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const uid = data.user?.id
      if (!uid) { setMemberships([]); return }
      // Only this user's memberships — the roster policy exposes teammates'
      // rows too, which must not appear in the switcher
      supabase.from('workspace_members')
        .select('workspace_id, role, modules, field_groups, workspaces(id, name, owner_id, created_at, status_labels)')
        .eq('user_id', uid)
        .then(res => {
          if (failed(res, 'Loading workspaces failed')) { setMemberships([]); return }
          const ms = (res.data || []).filter(m => m.workspaces)
            .sort((a, b) => new Date(a.workspaces.created_at) - new Date(b.workspaces.created_at))
          setMemberships(ms)
        })
    })
  }, [])

  const active = memberships?.find(m => m.workspace_id === activeId) || memberships?.[0] || null

  function switchWorkspace(id) {
    setActiveId(id)
    localStorage.setItem('activeWorkspace', id)
  }

  if (memberships === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg">
        <div className="flex flex-col items-center gap-4"><div className="w-9 h-9 rounded-full border-2 border-border border-t-accent animate-spin" /><div className="text-[13.5px] text-text-muted">Loading…</div></div>
      </div>
    )
  }

  const modules = active?.modules || []
  const fieldGroups = active?.field_groups || []
  const statusLabels = active?.workspaces?.status_labels || {}

  // Display-name mapping for pipeline statuses. Internal values in the DB
  // stay canonical ("Research", "Trial", …) so history and stats never break.
  const statusLabel = (key) => statusLabels[key] || key

  async function setStatusLabel(key, label) {
    const next = { ...statusLabels }
    if (label && label.trim() && label.trim() !== key) next[key] = label.trim()
    else delete next[key]
    const res = await supabase.from('workspaces').update({ status_labels: next }).eq('id', active.workspace_id)
    if (failed(res, 'Renaming status failed')) return
    setMemberships(ms => ms.map(m => m.workspace_id === active.workspace_id
      ? { ...m, workspaces: { ...m.workspaces, status_labels: next } } : m))
  }

  return (
    <WorkspaceContext.Provider value={{
      memberships,
      workspace: active?.workspaces || null,
      ws: active?.workspace_id || null,
      role: active?.role || null,
      modules,
      fieldGroups,
      canEdit: active?.role === 'owner' || active?.role === 'editor',
      hasModule: (m) => modules.includes(m),
      hasFinance: fieldGroups.includes('finance'),
      statusLabel,
      setStatusLabel,
      switchWorkspace,
    }}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  return useContext(WorkspaceContext)
}
