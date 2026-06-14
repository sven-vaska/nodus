import { NavLink } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  Home, Building2, Users, CheckSquare,
  StickyNote, Mail, Zap, BarChart3, Menu, LogOut
} from 'lucide-react'

const nav = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/companies', icon: Building2, label: 'Companies' },
  { to: '/people', icon: Users, label: 'People' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/notes', icon: StickyNote, label: 'Notes' },
  { to: '/emails', icon: Mail, label: 'Emails' },
  { to: '/activities', icon: Zap, label: 'Activities' },
  { to: '/statistics', icon: BarChart3, label: 'Statistics' },
]

export default function Sidebar({ open, onToggle }) {
  return (
    <aside
      className="flex flex-col bg-surface border-r border-border transition-all duration-200 shrink-0"
      style={{ width: open ? 200 : 52 }}
    >
      <button
        onClick={onToggle}
        className="flex items-center justify-center h-12 hover:bg-border-light transition-colors"
      >
        <Menu size={18} className="text-text-secondary" />
      </button>

      <nav className="flex-1 flex flex-col gap-0.5 px-1.5 mt-1">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-2 py-1.5 rounded-md text-[13px] transition-colors ${
                isActive
                  ? 'bg-border-light text-text-primary font-semibold'
                  : 'text-text-secondary hover:bg-border-light'
              }`
            }
          >
            <Icon size={16} className="shrink-0" />
            {open && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      <button
        onClick={() => supabase.auth.signOut()}
        className="flex items-center gap-2.5 px-3.5 py-2 mb-2 text-text-secondary hover:text-text-primary transition-colors text-[12px]"
      >
        <LogOut size={16} className="shrink-0" />
        {open && <span>Logi välja</span>}
      </button>
    </aside>
  )
}
