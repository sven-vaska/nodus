import { Home, Building2, Users, CheckSquare, StickyNote, Mail, Activity, BarChart3, Settings } from 'lucide-react'

// Single source of truth for the app's primary navigation.
// Used by the desktop sidebar, the mobile bottom bar and the settings picker.
export const navItems = [
  { key: 'home', to: '/', icon: Home, label: 'Home', end: true },
  { key: 'companies', to: '/companies', icon: Building2, label: 'Companies' },
  { key: 'people', to: '/people', icon: Users, label: 'People' },
  { key: 'tasks', to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { key: 'notes', to: '/notes', icon: StickyNote, label: 'Notes' },
  { key: 'emails', to: '/emails', icon: Mail, label: 'Emails' },
  { key: 'activities', to: '/activities', icon: Activity, label: 'Activities' },
  { key: 'statistics', to: '/statistics', icon: BarChart3, label: 'Statistics' },
  { key: 'settings', to: '/settings', icon: Settings, label: 'Settings' },
]

export const navByKey = Object.fromEntries(navItems.map(n => [n.key, n]))

// Items the user may duplicate into the mobile bottom bar.
// Home and Search are fixed there and therefore not selectable.
export const bottomNavChoices = navItems.filter(n => n.key !== 'home')
