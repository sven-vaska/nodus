import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { navByKey } from '../lib/navItems'
import { useBottomNav } from '../lib/useBottomNav'
import { useWorkspace } from '../lib/WorkspaceContext'
import { useSearch } from '../lib/useSearch'
import Avatar from './Avatar'

export default function BottomNav() {
  const [searchOpen, setSearchOpen] = useState(false)
  const selectedKeys = useBottomNav()
  const { hasModule } = useWorkspace()
  // Home is always first; the user-selected shortcuts follow. Search is a fixed
  // action button to the right (not a route). Modules not shared with this
  // member are dropped.
  const items = ['home', ...selectedKeys].map(k => navByKey[k]).filter(Boolean)
    .filter(n => ['home', 'settings'].includes(n.key) || hasModule(n.key))

  return (
    <>
      <div
        className="md:hidden absolute bottom-0 left-0 right-0 z-50 flex items-center justify-center gap-2.5 px-4 pointer-events-none"
        style={{ paddingBottom: 'calc((env(safe-area-inset-bottom, 0px) + 12px) / 2)' }}
      >
        <nav
          className="pointer-events-auto flex items-center gap-1 border border-border rounded-full shadow-lg p-1.5 backdrop-blur-xl"
          style={{ background: 'color-mix(in srgb, var(--app-surface) 72%, transparent)' }}
        >
          {items.map(({ key, to, icon: Icon, end }) => (
            <NavLink
              key={key}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center justify-center w-12 h-12 rounded-full transition-colors ${
                  isActive ? 'bg-border-light text-accent' : 'text-text-secondary'
                }`
              }
            >
              <Icon size={22} />
            </NavLink>
          ))}
        </nav>
        <button
          onClick={() => setSearchOpen(true)}
          aria-label="Search"
          className="pointer-events-auto flex items-center justify-center w-[60px] h-[60px] border border-border rounded-full shadow-lg text-text-secondary active:bg-border-light transition-colors cursor-pointer backdrop-blur-xl"
          style={{ background: 'color-mix(in srgb, var(--app-surface) 72%, transparent)' }}
        >
          <Search size={22} />
        </button>
      </div>
      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
    </>
  )
}

function SearchOverlay({ onClose }) {
  const [query, setQuery] = useState('')
  const results = useSearch(query)
  const navigate = useNavigate()

  function select(r) {
    if (r.type === 'company') navigate(`/companies/${r.id}`)
    else if (r.id) navigate(`/companies/${r.id}`)
    onClose()
  }

  return (
    <div
      className="md:hidden fixed inset-0 z-[70] bg-bg flex flex-col"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="flex items-center gap-2 p-3 border-b border-border shrink-0">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search companies, contacts..."
            className="w-full pl-9 pr-4 py-2.5 border-none rounded-full text-[16px] bg-border-light outline-none transition-colors"
          />
        </div>
        <button onClick={onClose} className="px-2 py-2 text-text-secondary text-[15px] font-medium cursor-pointer">
          Cancel
        </button>
      </div>
      <div className="flex-1 overflow-auto">
        {results.map((r, i) => (
          <button
            key={`${r.type}-${r.id}-${i}`}
            onClick={() => select(r)}
            className="w-full flex items-center gap-2.5 px-4 py-3 text-left hover:bg-border-light border-b border-border-light transition-colors cursor-pointer"
          >
            <Avatar name={r.name} size={28} />
            <div className="flex-1 min-w-0">
              <div className="text-[15px] text-text-primary font-medium truncate">{r.name}</div>
              <div className="text-[13px] text-text-muted truncate">{r.type === 'company' ? 'Company' : 'Contact'} · {r.sub}</div>
            </div>
          </button>
        ))}
        {query.trim() && results.length === 0 && (
          <div className="text-center py-12 text-text-muted text-[14px]">No results</div>
        )}
      </div>
    </div>
  )
}
