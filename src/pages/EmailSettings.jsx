import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useWorkspace } from '../lib/WorkspaceContext'
import { failed, toastError } from '../lib/toast'
import { formatDate, relativeTime } from '../lib/utils'
import { Mail, Plus, Trash2, RefreshCw } from 'lucide-react'
import Loading from '../components/Loading'

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`

const ERROR_MESSAGES = {
  missing_params: 'Google did not return the expected parameters.',
  bad_state: 'Security check failed — please try connecting again.',
  expired: 'The connect link expired — please try again.',
  token_exchange: 'Google did not grant access. Try again and make sure you approve all permissions.',
  no_email: 'Could not read the email address from Google.',
  save_failed: 'Saving the account failed.',
  vault_failed: 'Storing the token securely failed.',
}

export default function EmailSettings() {
  const { ws, canEdit } = useWorkspace()
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(null) // account id being synced, or 'connect'
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    const error = searchParams.get('error')
    if (error) toastError(ERROR_MESSAGES[error] || `Connect failed: ${error}`)
    if (error || searchParams.get('connected')) setSearchParams({}, { replace: true })
  }, [])

  useEffect(() => { load() }, [ws])

  async function load() {
    const res = await supabase.from('email_accounts').select('*').eq('workspace_id', ws).order('created_at')
    if (!failed(res, 'Loading email accounts failed')) setAccounts(res.data || [])
    setLoading(false)
  }

  async function connect() {
    setBusy('connect')
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(`${FN_URL}/gmail-oauth?action=start&workspace_id=${ws}`, {
      headers: { Authorization: `Bearer ${session?.access_token}` },
    })
    const data = await res.json().catch(() => ({}))
    setBusy(null)
    if (!res.ok || !data.url) { toastError(data.error || 'Starting Gmail connect failed'); return }
    window.location.href = data.url
  }

  async function syncNow(account) {
    setBusy(account.id)
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(`${FN_URL}/gmail-sync`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${session?.access_token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ account_id: account.id }),
    })
    const data = await res.json().catch(() => ({}))
    setBusy(null)
    if (!res.ok) { toastError(data.error || 'Sync failed'); load(); return }
    toastError(`Synced ${data.synced} new email${data.synced === 1 ? '' : 's'}`)
    load()
  }

  async function disconnect(account) {
    if (!confirm(`Disconnect ${account.gmail_address}? Already synced emails stay in the CRM.`)) return
    const res = await supabase.from('email_accounts').delete().eq('id', account.id)
    if (failed(res, 'Disconnecting failed')) return
    setAccounts(accounts.filter(a => a.id !== account.id))
  }

  if (loading) return <Loading />

  return (
    <div className="max-w-[560px]">
      <div className="bg-surface p-5">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-serif text-[18px] font-semibold text-text-primary m-0">Email accounts</h2>
          {canEdit && (
            <button onClick={connect} disabled={busy === 'connect'} className="flex items-center gap-1.5 px-2.5 py-1 bg-accent text-white rounded-full text-[13px] font-medium hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50">
              <Plus size={13} /> Connect Gmail
            </button>
          )}
        </div>
        <p className="text-[13px] text-text-muted mb-4">
          Connected inboxes sync conversations with your CRM contacts. Only emails matching a contact or company are imported.
        </p>

        {accounts.length === 0 && (
          <div className="text-[14px] text-text-muted py-2">No accounts connected yet.</div>
        )}

        <div className="flex flex-col gap-1">
          {accounts.map(a => (
            <div key={a.id} className="flex items-center gap-3 rounded-lg px-2.5 py-2.5">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-border-light text-text-secondary shrink-0">
                <Mail size={16} />
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] text-text-primary font-medium truncate">{a.gmail_address}</div>
                <div className={`text-[12px] ${a.status === 'error' ? 'text-lost' : 'text-text-muted'}`}>
                  {a.status === 'error' ? (a.last_error || 'Error') :
                   a.status === 'syncing' || busy === a.id ? 'Syncing...' :
                   a.last_synced_at ? `Synced ${relativeTime(a.last_synced_at)}` : 'Not synced yet'}
                </div>
              </div>
              <button onClick={() => syncNow(a)} disabled={busy === a.id} title="Sync now" className="p-1.5 text-text-muted hover:text-text-primary transition-colors cursor-pointer disabled:opacity-50">
                <RefreshCw size={15} className={busy === a.id ? 'animate-spin' : ''} />
              </button>
              <button onClick={() => disconnect(a)} title="Disconnect" className="p-1.5 text-text-muted hover:text-lost transition-colors cursor-pointer">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
