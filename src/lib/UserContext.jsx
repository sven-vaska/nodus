import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from './supabase'
import { bindBottomNavProfile } from './useBottomNav'
import { failed } from './toast'

const UserContext = createContext(null)

export function UserProvider({ children, session }) {
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    if (!session) {
      setProfile(null)
      return
    }
    const userId = session.user.id
    supabase.from('profiles').select('*').eq('id', userId).single()
      .then(({ data }) => {
        if (data) setProfile(data)
        else setProfile({ id: userId, full_name: session.user.email?.split('@')[0] || 'User', role: 'user' })
        // Bottom-bar shortcuts live on the profile so they survive PWA storage
        // eviction and sync across devices; localStorage is only a cache.
        bindBottomNavProfile(data?.bottom_nav, (keys) => {
          supabase.from('profiles').update({ bottom_nav: keys }).eq('id', userId).then(() => {})
        })
      })
  }, [session])

  async function updateProfile(updates) {
    if (!profile) return
    // upsert: the profile row may not exist yet for first-time users
    const res = await supabase.from('profiles')
      .upsert({ id: profile.id, ...updates, updated_at: new Date().toISOString() })
    if (failed(res, 'Saving profile failed')) return
    setProfile(p => ({ ...p, ...updates }))
  }

  return (
    <UserContext.Provider value={{ profile, updateProfile, email: session?.user?.email }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  return useContext(UserContext)
}
