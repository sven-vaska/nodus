import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Menu, ChevronDown, Check } from 'lucide-react'
import { useSearch } from '../lib/useSearch'
import { useUser } from '../lib/UserContext'
import { useWorkspace } from '../lib/WorkspaceContext'
import Avatar from './Avatar'

function WorkspaceSwitcher() {
  const { memberships, workspace, switchWorkspace } = useWorkspace()
  const [open, setOpen] = useState(false)
  const ref = useRef()

  useEffect(() => {
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  if (!workspace) return null
  if (memberships.length < 2) {
    return <div className="text-[14px] font-semibold text-text-primary px-1 truncate max-w-[160px]">{workspace.name}</div>
  }

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-2 py-1 rounded-md text-[14px] font-semibold text-text-primary hover:bg-border-light transition-colors cursor-pointer max-w-[200px]"
      >
        <span className="truncate">{workspace.name}</span>
        <ChevronDown size={14} className="text-text-muted shrink-0" />
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 w-56 bg-surface border border-border rounded-xl shadow-lg overflow-hidden z-50">
          {memberships.map(m => (
            <button
              key={m.workspace_id}
              onClick={() => { switchWorkspace(m.workspace_id); setOpen(false) }}
              className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-border-light transition-colors cursor-pointer"
            >
              <div className="flex-1 min-w-0">
                <div className="text-[14px] text-text-primary font-medium truncate">{m.workspaces.name}</div>
                <div className="text-[12px] text-text-muted capitalize">{m.role}</div>
              </div>
              {m.workspace_id === workspace.id && <Check size={14} className="text-accent shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function TopBar({ onMenuToggle }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const results = useSearch(query)
  const ref = useRef()
  const navigate = useNavigate()

  useEffect(() => {
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => { if (results.length > 0) setOpen(true) }, [results])

  function select(r) {
    if (r.type === 'company') navigate(`/companies/${r.id}`)
    else if (r.id) navigate(`/companies/${r.id}`)
    setQuery('')
    setOpen(false)
  }

  return (
    <div className="bg-surface flex items-center gap-2 px-3 md:px-6 py-2.5 md:pt-4 shrink-0 z-30">
      <button onClick={onMenuToggle} className="md:hidden shrink-0 p-1 text-text-secondary hover:text-text-primary cursor-pointer">
        <Menu size={20} />
      </button>
      <div className="md:hidden"><WorkspaceSwitcher /></div>
      {/* Search lives at the left of the top bar on desktop; on mobile it moves to the bottom bar */}
      <div className="relative w-full max-w-md hidden md:block" ref={ref}>
        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search companies, contacts..."
          className="w-full pl-10 pr-4 py-2 rounded-full text-[16px] md:text-[14px] bg-border-light text-text-primary placeholder:text-text-muted outline-none transition-colors"
        />
        {open && results.length > 0 && (
          <div className="absolute top-full mt-1 left-0 right-0 bg-surface border border-border rounded-xl shadow-lg overflow-hidden z-50">
            {results.map((r, i) => (
              <button
                key={`${r.type}-${r.id}-${i}`}
                onClick={() => select(r)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-border-light transition-colors cursor-pointer"
              >
                <Avatar name={r.name} size={22} />
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] text-text-primary font-medium truncate">{r.name}</div>
                  <div className="text-[12px] text-text-muted truncate">{r.type === 'company' ? 'Company' : 'Contact'} · {r.sub}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex-1" />
      <div className="hidden md:block"><WorkspaceSwitcher /></div>
      <button onClick={() => navigate('/settings')} className="hidden md:block shrink-0 cursor-pointer" aria-label="Settings">
        <TopBarAvatar />
      </button>
    </div>
  )
}

function TopBarAvatar() {
  const { profile } = useUser()
  return <Avatar name={profile?.full_name || 'U'} size={32} src={profile?.avatar_url} />
}
