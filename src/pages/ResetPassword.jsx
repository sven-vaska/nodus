import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

// Landing page for the password-recovery email link. The recovery link signs
// the user in, so this renders inside the app shell.
export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('Passwords do not match'); return }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) { setError(error.message); return }
    navigate('/', { replace: true })
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <form onSubmit={handleSubmit} className="bg-surface p-8 w-[360px] flex flex-col gap-2.5">
        <div className="text-[17px] font-semibold text-text-primary mb-2">Set a new password</div>
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="New password"
          className="w-full px-3 py-2.5 border-none rounded-xl text-[15px] bg-border-light outline-none transition-colors"
        />
        <input
          type="password"
          required
          minLength={6}
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          placeholder="Repeat new password"
          className="w-full px-3 py-2.5 border-none rounded-xl text-[15px] bg-border-light outline-none transition-colors"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2.5 bg-accent text-white rounded-full text-[15px] font-medium hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save password'}
        </button>
        {error && <div className="text-[14px] text-lost">{error}</div>}
      </form>
    </div>
  )
}
