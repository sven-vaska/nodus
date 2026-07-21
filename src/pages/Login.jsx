import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [mode, setMode] = useState('signin') // signin | signup | forgot
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const handleGoogleLogin = async () => {
    setError('')
    setLoading(true)
    // OAuth returns to the origin; remember invite paths so App can restore them
    if (window.location.pathname.startsWith('/invite/')) {
      sessionStorage.setItem('postLoginRedirect', window.location.pathname)
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        // Always show Google's account chooser instead of silently
        // signing in with the last-used account
        queryParams: { prompt: 'select_account' },
      },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setNotice('')
    setLoading(true)
    if (window.location.pathname.startsWith('/invite/')) {
      sessionStorage.setItem('postLoginRedirect', window.location.pathname)
    }
    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    } else if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      })
      if (error) setError(error.message)
      else if (data.user?.identities?.length === 0) setError('An account with this email already exists')
      else setNotice('Check your email to confirm your account.')
    } else if (mode === 'forgot') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) setError(error.message)
      else setNotice('Password reset link sent — check your email.')
    }
    setLoading(false)
  }

  function switchMode(m) {
    setMode(m)
    setError('')
    setNotice('')
  }

  return (
    <div className="flex items-center justify-center min-h-screen w-screen bg-frame">
      <div className="bg-surface p-10 text-center w-[380px] rounded-2xl shadow-[0_2px_10px_rgba(38,34,28,.05),0_24px_60px_rgba(30,28,25,.10)]">
        <div className="flex items-center justify-center gap-2.5 mb-1"><div className="w-7 h-7 rounded-full bg-accent text-white flex items-center justify-center text-[14px] font-bold">N</div><div className="font-serif text-[28px] font-semibold text-text-primary">Nodus</div></div>
        <div className="text-text-secondary text-[15px] mb-8">Hours OÜ CRM</div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-border-light rounded-full text-[15px] font-medium text-text-primary hover:bg-[#EDE6DA] transition-colors cursor-pointer disabled:opacity-50"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 2.58 9 3.58z" fill="#EA4335"/>
          </svg>
          Sign in with Google
        </button>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[12px] text-text-muted">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-2.5 text-left">
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full px-4 py-2.5 border-none rounded-xl text-[15px] bg-border-light outline-none transition-colors"
          />
          {mode !== 'forgot' && (
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-2.5 border-none rounded-xl text-[15px] bg-border-light outline-none transition-colors"
            />
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2.5 bg-accent text-white rounded-full text-[15px] font-medium hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Please wait...' : mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link'}
          </button>
        </form>

        <div className="flex justify-between mt-4 text-[13px]">
          {mode === 'signin' ? (
            <>
              <button onClick={() => switchMode('signup')} className="text-accent hover:underline cursor-pointer">Create account</button>
              <button onClick={() => switchMode('forgot')} className="text-text-muted hover:text-text-primary cursor-pointer">Forgot password?</button>
            </>
          ) : (
            <button onClick={() => switchMode('signin')} className="text-accent hover:underline cursor-pointer">Back to sign in</button>
          )}
        </div>

        {notice && <div className="text-[14px] text-text-secondary mt-3">{notice}</div>}
        {error && <div className="text-[14px] text-lost mt-3">{error}</div>}
      </div>
    </div>
  )
}
