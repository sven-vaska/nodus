import { Link, Routes, Route, useLocation } from 'react-router-dom'
import { Check, Search, Lock } from 'lucide-react'
import Archive from './Archive'
import Newsletter from './Newsletter'
import Members from './Members'
import EmailSettings from './EmailSettings'
import Connections from './Connections'
import Profile from './Profile'
import Workspaces from './Workspaces'
import { navByKey, bottomNavChoices } from '../lib/navItems'
import { useBottomNav, setBottomNav, BOTTOM_NAV_SLOTS } from '../lib/useBottomNav'

const tabs = [
  { key: 'profile', label: 'Profile', path: '/settings' },
  { key: 'workspace', label: 'Workspace', path: '/settings/workspace' },
  { key: 'general', label: 'General', path: '/settings/general' },
  { key: 'email', label: 'Email accounts', path: '/settings/email' },
  { key: 'connections', label: 'Connections', path: '/settings/connections' },
  { key: 'members', label: 'Team', path: '/settings/members' },
  { key: 'archive', label: 'Archive', path: '/settings/archive' },
  { key: 'newsletter', label: 'Newsletter list', path: '/settings/newsletter' },
]

export default function Settings() {
  const location = useLocation()
  const activeTab = tabs.find(t => t.path === location.pathname)?.key || 'profile'

  return (
    <div className="p-4 md:px-14 md:py-8">
      <h1 className="font-serif text-[26px] font-semibold text-text-primary mb-8 mt-0">Settings</h1>
      <div className="flex flex-col md:flex-row gap-8 md:gap-16">
        {/* Sub-nav: horizontal pills on mobile, vertical list on desktop */}
        <nav className="flex md:flex-col gap-1 md:w-[220px] shrink-0 overflow-x-auto md:overflow-visible">
          {tabs.map(t => (
            <Link
              key={t.key}
              to={t.path}
              className={`px-5 py-2.5 rounded-full text-[14.5px] transition-colors no-underline whitespace-nowrap ${
                activeTab === t.key
                  ? 'bg-border-light text-text-primary font-semibold'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {t.label}
            </Link>
          ))}
        </nav>

        <div className="flex-1 min-w-0 max-w-[720px]">
          <Routes>
            <Route index element={<Profile />} />
            <Route path="workspace" element={<Workspaces />} />
            <Route path="general" element={<SettingsHome />} />
            <Route path="members" element={<Members />} />
            <Route path="email" element={<EmailSettings />} />
            <Route path="connections" element={<Connections />} />
            <Route path="archive" element={<Archive />} />
            <Route path="newsletter" element={<Newsletter />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}

function SettingsHome() {
  return (
    <div className="max-w-[560px]">
      <BottomNavSettings />
    </div>
  )
}

function BottomNavSettings() {
  const selected = useBottomNav()
  const home = navByKey.home

  function toggle(key) {
    if (selected.includes(key)) {
      // remove it
      setBottomNav(selected.filter(k => k !== key))
    } else if (selected.length < BOTTOM_NAV_SLOTS) {
      // room left — just add
      setBottomNav([...selected, key])
    } else {
      // already at the limit — replace the oldest so the tap always takes effect
      setBottomNav([...selected.slice(1), key])
    }
  }

  return (
    <div className="bg-surface">
      <h2 className="font-serif text-[18px] font-semibold text-text-primary m-0">Mobile bottom bar</h2>
      <p className="text-[13px] text-text-muted mt-1 mb-4">
        Pick up to {BOTTOM_NAV_SLOTS} shortcuts for the bottom bar on mobile. When {BOTTOM_NAV_SLOTS} are selected, tapping another swaps out the oldest. Home and Search are always shown and stay in the full menu.
        {' '}<span className="text-text-secondary font-medium">{selected.length}/{BOTTOM_NAV_SLOTS} selected</span>
      </p>

      <div className="flex flex-col gap-1">
        <FixedRow icon={home.icon} label="Home" />
        {bottomNavChoices.map(({ key, icon: Icon, label }) => {
          const isOn = selected.includes(key)
          return (
            <button
              key={key}
              onClick={() => toggle(key)}
              className="flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-left transition-colors cursor-pointer hover:bg-border-light"
            >
              <span className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0 text-text-secondary">
                <Icon size={18} />
              </span>
              <span className="flex-1 text-[15px] text-text-primary">{label}</span>
              <span className={`flex items-center justify-center w-5 h-5 rounded-md border transition-colors ${
                isOn ? 'bg-text-primary border-text-primary text-white' : 'border-border'
              }`}>
                {isOn && <Check size={13} strokeWidth={3} />}
              </span>
            </button>
          )
        })}
        <FixedRow icon={Search} label="Search" />
      </div>
    </div>
  )
}

function FixedRow({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-3 rounded-lg px-2.5 py-2.5">
      <span className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0 text-text-secondary">
        <Icon size={18} />
      </span>
      <span className="flex-1 text-[15px] text-text-primary">{label}</span>
      <span className="flex items-center gap-1 text-[12px] text-text-muted">
        <Lock size={12} /> Always on
      </span>
    </div>
  )
}
