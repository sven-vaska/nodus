import { NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useWorkspace } from '../lib/WorkspaceContext'
import { navItems } from '../lib/navItems'
import { LogOut, Plus, Menu, Settings as SettingsIcon } from 'lucide-react'

export default function Sidebar({ open, onToggle }) {
  const navigate = useNavigate()
  const { hasModule, canEdit } = useWorkspace()
  // home is always available; module pages only when shared.
  // Settings is pinned at the bottom, next to Log out.
  const visibleItems = navItems.filter(n => n.key !== 'settings' && (n.key === 'home' || hasModule(n.key)))

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-30 flex flex-col transition-[transform,width] duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] overflow-hidden ${
        open
          ? 'translate-x-0 w-[55vw] md:w-[300px]'
          : '-translate-x-full md:translate-x-0 w-[55vw] md:w-16'
      }`}
      style={{ paddingTop: 'env(safe-area-inset-top)', background: 'var(--app-frame)' }}
    >
      <div className="flex items-center shrink-0 h-14 gap-3 px-5 md:px-3">
        <button
          onClick={onToggle}
          className="hidden md:flex items-center justify-center w-8 h-8 ml-2 shrink-0 text-text-secondary hover:text-text-primary cursor-pointer"
        >
          <Menu size={20} />
        </button>
        <div className="w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center text-[13px] font-bold shrink-0 hidden md:flex">N</div>
        <span className="font-serif text-[20px] font-semibold text-text-primary whitespace-nowrap">Nodus</span>
      </div>

      <nav className="flex-1 flex flex-col gap-0.5 py-2 overflow-y-auto overflow-x-hidden px-3">
        {visibleItems.map(({ key, to, icon: Icon, label, end }) => (
          <NavLink
            key={key}
            to={to}
            end={end}
            onClick={open ? onToggle : undefined}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-full text-[15px] transition-colors duration-150 whitespace-nowrap px-2 py-2.5 hover:bg-border-light ${
                isActive
                  ? 'text-accent font-semibold'
                  : 'text-text-muted hover:text-text-primary'
              }`
            }
          >
            <span className="flex items-center justify-center w-8 h-8 shrink-0">
              <Icon size={18} />
            </span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="flex flex-col gap-0.5 px-3" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}>
        {canEdit && hasModule('activities') && (
          <button
            onClick={() => { onToggle(); navigate('/activities', { state: { newActivity: true } }) }}
            className="md:hidden flex items-center justify-center gap-2 bg-accent text-white rounded-full py-3.5 text-[15px] font-semibold hover:opacity-90 transition-opacity cursor-pointer mb-2"
          >
            <Plus size={20} />
            <span>New activity</span>
          </button>
        )}
        <NavLink
          to="/settings"
          onClick={open ? onToggle : undefined}
          className={({ isActive }) =>
            `group flex items-center gap-3 rounded-full text-[15px] transition-colors duration-150 whitespace-nowrap px-2 py-2.5 hover:bg-border-light ${
              isActive ? 'text-accent font-semibold' : 'text-text-muted hover:text-text-primary'
            }`
          }
        >
          <span className="flex items-center justify-center w-8 h-8 shrink-0">
            <SettingsIcon size={18} />
          </span>
          <span>Settings</span>
        </NavLink>
        <button
          onClick={() => supabase.auth.signOut()}
          className="group flex items-center gap-3 rounded-full text-[13px] text-text-muted hover:text-text-primary hover:bg-border-light transition-colors cursor-pointer whitespace-nowrap px-2 py-2"
        >
          <span className="flex items-center justify-center w-8 h-8 shrink-0">
            <LogOut size={16} />
          </span>
          <span>Log out</span>
        </button>
      </div>
    </aside>
  )
}
