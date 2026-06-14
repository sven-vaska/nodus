import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Companies from './pages/Companies'
import CompanyDetail from './pages/CompanyDetail'
import People from './pages/People'
import Tasks from './pages/Tasks'
import Notes from './pages/Notes'
import Emails from './pages/Emails'
import Activities from './pages/Activities'
import Statistics from './pages/Statistics'
import Login from './pages/Login'

const DEV_MODE = import.meta.env.DEV

export default function App() {
  const [session, setSession] = useState(DEV_MODE ? 'dev' : undefined)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (DEV_MODE) return
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg">
        <div className="text-text-muted text-sm">Laadin...</div>
      </div>
    )
  }

  if (!session) {
    return <Login />
  }

  return (
    <div className="flex min-h-screen w-full bg-bg">
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <main className="flex-1 overflow-auto">
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}
