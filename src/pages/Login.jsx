import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState('email')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSendOtp = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({ email })
    setLoading(false)
    if (error) setError(error.message)
    else setStep('otp')
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' })
    setLoading(false)
    if (error) setError(error.message)
  }

  return (
    <div className="flex items-center justify-center min-h-screen w-screen bg-bg">
      <div className="bg-surface border border-border rounded-[10px] p-10 text-center w-[360px]">
        <div className="text-[28px] font-bold text-text-primary mb-1">Nodus</div>
        <div className="text-text-secondary text-[13px] mb-8">Hours OÜ CRM</div>

        {step === 'email' ? (
          <form onSubmit={handleSendOtp} className="space-y-3">
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
              disabled={loading}
              className="w-full px-4 py-2.5 bg-text-primary text-bg rounded-lg text-[13px] font-medium cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Saadan...' : 'Saada kood'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-3">
            <div className="text-[13px] text-text-secondary mb-2">
              Sisestasime koodi aadressile <span className="font-medium text-text-primary">{email}</span>
            </div>
            <input
              type="text"
              inputMode="numeric"
              value={otp}
              onChange={e => setOtp(e.target.value)}
              placeholder="6-kohaline kood"
              required
              maxLength={6}
              className="w-full px-3 py-2 border border-border rounded-lg text-[13px] text-text-primary bg-bg outline-none focus:border-accent text-center tracking-[0.3em] text-[18px]"
            />
            <button
              type="submit"
              disabled={loading || otp.length < 6}
              className="w-full px-4 py-2.5 bg-text-primary text-bg rounded-lg text-[13px] font-medium cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Kontrollin...' : 'Logi sisse'}
            </button>
            <button
              type="button"
              onClick={() => { setStep('email'); setOtp(''); setError('') }}
              className="text-[12px] text-text-muted hover:text-text-secondary cursor-pointer"
            >
              ← Tagasi
            </button>
          </form>
        )}
        {error && <div className="text-[12px] text-lost mt-2">{error}</div>}
      </div>
    </div>
  )
}
