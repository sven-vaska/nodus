import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleMagicLink = async (e) => {
    e.preventDefault()
    setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
    if (error) setError(error.message)
    else setSent(true)
  }

  return (
    <div className="flex items-center justify-center min-h-screen w-screen bg-bg">
      <div className="bg-surface border border-border rounded-[10px] p-10 text-center w-[360px]">
        <div className="text-[28px] font-bold text-text-primary mb-1">Nodus</div>
        <div className="text-text-secondary text-[13px] mb-8">Hours OÜ CRM</div>

        {sent ? (
          <div className="text-[13px] text-text-secondary">
            <div className="text-accent font-medium mb-2">Link saadetud!</div>
            Kontrolli oma postkasti <span className="font-medium text-text-primary">{email}</span> ja kliki lingile.
          </div>
        ) : (
          <form onSubmit={handleMagicLink} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="sinu@email.ee"
              required
              className="w-full px-3 py-2 border border-border rounded-lg text-[13px] text-text-primary bg-bg outline-none focus:border-accent"
            />
            <button
              type="submit"
              className="w-full px-4 py-2.5 bg-text-primary text-bg rounded-lg text-[13px] font-medium cursor-pointer hover:opacity-90 transition-opacity"
            >
              Saada sisselogimise link
            </button>
            {error && <div className="text-[12px] text-lost">{error}</div>}
          </form>
        )}
      </div>
    </div>
  )
}
