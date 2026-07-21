import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { UserProvider } from './lib/UserContext'
import { WorkspaceProvider } from './lib/WorkspaceContext'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import BottomNav from './components/BottomNav'
import Dashboard from './pages/Dashboard'
import Companies from './pages/Companies'
import CompanyDetail from './pages/CompanyDetail'
import People from './pages/People'
import Tasks from './pages/Tasks'
import Notes from './pages/Notes'
import Emails from './pages/Emails'
import Activities from './pages/Activities'
import Statistics from './pages/Statistics'
import Settings from './pages/Settings'
import Login from './pages/Login'
import InviteAccept from './pages/InviteAccept'
import ResetPassword from './pages/ResetPassword'

function Toasts() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    function onToast(e) {
      const id = Date.now() + Math.random()
      setToasts(t => [...t, { id, message: e.detail.message }])
      setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 5000)
    }
    window.addEventListener('app-toast', onToast)
    return () => window.removeEventListener('app-toast', onToast)
  }, [])

  if (!toasts.length) return null
  return (
    <div className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+96px)] md:bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className="bg-lost text-white text-[14px] px-4 py-2.5 rounded-lg shadow-lg max-w-[90vw] truncate">
          {t.message}
        </div>
      ))}
    </div>
  )
}

export default function App() {
  const [session, setSession] = useState(undefined)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  // Restore the path saved before an OAuth round-trip (e.g. an invite link)
  useEffect(() => {
    if (!session) return
    const redirect = sessionStorage.getItem('postLoginRedirect')
    if (redirect) {
      sessionStorage.removeItem('postLoginRedirect')
      navigate(redirect, { replace: true })
    }
  }, [session])

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (_event === 'SIGNED_IN' || _event === 'TOKEN_REFRESHED') {
        setSession(session)
      } else if (_event === 'SIGNED_OUT') {
        setSession(null)
      } else if (_event === 'INITIAL_SESSION') {
        setSession(session)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg">
        <div className="flex flex-col items-center gap-4"><div className="w-9 h-9 rounded-full border-2 border-border border-t-accent animate-spin" /><div className="text-[13.5px] text-text-muted">Loading…</div></div>
      </div>
    )
  }

  if (!session) {
    return <Login />
  }

  const isCompanyDetail = /^\/companies\/[^/]+$/.test(location.pathname)

  return (
    <UserProvider session={session}>
      <WorkspaceProvider>
      <div className="h-full w-full bg-frame">
        <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        <div
          className={`flex flex-col h-full bg-bg overflow-hidden transition-[transform,border-radius,box-shadow] duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] relative z-40 md:ml-16 md:my-2.5 md:mr-2.5 md:h-[calc(100%-20px)] md:rounded-2xl md:shadow-[-8px_0_24px_rgba(38,34,28,.07),0_2px_10px_rgba(38,34,28,.05)] ${
            sidebarOpen ? 'sidebar-push rounded-2xl shadow-2xl' : ''
          }`}
          onClick={sidebarOpen ? (e) => { e.stopPropagation(); setSidebarOpen(false) } : undefined}
        >
          <div className={isCompanyDetail ? 'hidden md:block' : ''}>
            <TopBar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
          </div>
          {/* On mobile content scrolls behind the floating bottom bar and shows
              through its translucent glass; padding keeps the end reachable.
              CompanyDetail scrolls internally with its own clearance, so main
              must not add padding there — it would clip content above the bar. */}
          <main className={`flex-1 overflow-auto md:pb-[env(safe-area-inset-bottom)] ${
            isCompanyDetail ? '' : 'pb-[calc(env(safe-area-inset-bottom,0px)+96px)] md:pb-[env(safe-area-inset-bottom)]'
          }`}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/companies" element={<Companies />} />
              <Route path="/companies/:id" element={<CompanyDetail />} />
              <Route path="/people" element={<People />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/notes" element={<Notes />} />
              <Route path="/emails" element={<Emails />} />
              <Route path="/activities" element={<Activities />} />
              <Route path="/statistics" element={<Statistics />} />
              <Route path="/settings/*" element={<Settings />} />
              <Route path="/profile" element={<Navigate to="/settings" replace />} />
              <Route path="/workspaces" element={<Navigate to="/settings/workspace" replace />} />
              <Route path="/invite/:token" element={<InviteAccept />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <BottomNav />
        </div>
        <Toasts />
      </div>
      </WorkspaceProvider>
    </UserProvider>
  )
}
