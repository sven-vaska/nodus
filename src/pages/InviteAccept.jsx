import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

// Landing page for /invite/<token>. The user is already signed in here
// (App shows Login first), so we can accept immediately.
export default function InviteAccept() {
  const { token } = useParams()
  const [error, setError] = useState(null)
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true
    supabase.rpc('accept_invitation', { invite_token: token }).then(({ data, error }) => {
      if (error) {
        setError(error.message)
        return
      }
      // Full reload so WorkspaceContext refetches memberships with the new one active
      localStorage.setItem('activeWorkspace', data)
      window.location.href = '/'
    })
  }, [token])

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="bg-surface p-8 text-center max-w-[400px]">
        {error ? (
          <>
            <div className="text-[16px] font-semibold text-text-primary mb-2">Could not join workspace</div>
            <div className="text-[14px] text-lost mb-4">{error}</div>
            <Link to="/" className="text-[14px] text-accent no-underline hover:underline">Back to home</Link>
          </>
        ) : (
          <div className="text-[15px] text-text-muted">Joining workspace...</div>
        )}
      </div>
    </div>
  )
}
