import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useWorkspace } from '../lib/WorkspaceContext'
import { useUser } from '../lib/UserContext'
import { failed, toastError } from '../lib/toast'
import Avatar from '../components/Avatar'
import { Check, Copy, Trash2, Plus } from 'lucide-react'
import Loading from '../components/Loading'

const ALL_MODULES = [
  { key: 'companies', label: 'Companies' },
  { key: 'people', label: 'People' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'notes', label: 'Notes' },
  { key: 'emails', label: 'Emails' },
  { key: 'activities', label: 'Activities' },
  { key: 'offers', label: 'Offers' },
  { key: 'statistics', label: 'Statistics' },
]

const emptyInvite = { email: '', role: 'editor', modules: ALL_MODULES.map(m => m.key), finance: false }

export default function Members() {
  const { ws, role, workspace } = useWorkspace()
  const { profile } = useUser()
  const isOwner = role === 'owner'
  const isPro = profile?.plan === 'pro'
  const [members, setMembers] = useState([])
  const [profiles, setProfiles] = useState({})
  const [invites, setInvites] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ ...emptyInvite })
  const [showForm, setShowForm] = useState(false)
  const [copiedId, setCopiedId] = useState(null)

  useEffect(() => { load() }, [ws])

  async function load() {
    setLoading(true)
    const mRes = await supabase.from('workspace_members').select('*').eq('workspace_id', ws).order('created_at')
    const memberList = mRes.data || []
    setMembers(memberList)
    if (memberList.length) {
      const { data: profs } = await supabase.from('profiles').select('id, full_name, avatar_url, email').in('id', memberList.map(m => m.user_id))
      setProfiles(Object.fromEntries((profs || []).map(p => [p.id, p])))
    }
    // RLS returns rows only for the owner; harmless empty result for others
    const iRes = await supabase.from('invitations').select('*').eq('workspace_id', ws).is('accepted_at', null).order('created_at', { ascending: false })
    setInvites(iRes.data || [])
    setLoading(false)
  }

  async function sendInvite() {
    const email = form.email.trim().toLowerCase()
    if (!email || !email.includes('@')) { toastError('Enter a valid email address'); return }
    if (!form.modules.length) { toastError('Select at least one module'); return }
    const res = await supabase.from('invitations').insert({
      workspace_id: ws,
      email,
      role: form.role,
      modules: form.modules,
      field_groups: form.finance ? ['finance'] : [],
      created_by: profile?.id,
    })
    if (failed(res, 'Creating invitation failed')) return
    setForm({ ...emptyInvite })
    setShowForm(false)
    load()
  }

  async function revokeInvite(id) {
    const res = await supabase.from('invitations').delete().eq('id', id)
    if (failed(res, 'Revoking invitation failed')) return
    setInvites(invites.filter(i => i.id !== id))
  }

  async function copyLink(invite) {
    await navigator.clipboard.writeText(`${window.location.origin}/invite/${invite.token}`)
    setCopiedId(invite.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  async function changeRole(member, newRole) {
    const res = await supabase.from('workspace_members').update({ role: newRole })
      .eq('workspace_id', ws).eq('user_id', member.user_id)
    if (failed(res, 'Changing role failed')) return
    setMembers(members.map(m => m.user_id === member.user_id ? { ...m, role: newRole } : m))
  }

  async function removeMember(member) {
    if (!confirm('Remove this member from the workspace?')) return
    const res = await supabase.from('workspace_members').delete()
      .eq('workspace_id', ws).eq('user_id', member.user_id)
    if (failed(res, 'Removing member failed')) return
    setMembers(members.filter(m => m.user_id !== member.user_id))
  }

  const toggleModule = (key) => setForm(f => ({
    ...f,
    modules: f.modules.includes(key) ? f.modules.filter(k => k !== key) : [...f.modules, key],
  }))

  if (loading) return <Loading />

  return (
    <div className="max-w-[560px] flex flex-col gap-4">
      <div className="bg-surface p-5">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-serif text-[18px] font-semibold text-text-primary m-0">Members</h2>
          {isOwner && (
            <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 px-2.5 py-1 bg-accent text-white rounded-full text-[13px] font-medium hover:opacity-90 transition-opacity cursor-pointer">
              <Plus size={13} /> Invite
            </button>
          )}
        </div>
        <p className="text-[13px] text-text-muted mb-4">People with access to {workspace?.name}</p>

        <div className="flex flex-col gap-1">
          {members.map(m => {
            const p = profiles[m.user_id]
            const isSelf = m.user_id === profile?.id
            return (
              <div key={m.user_id} className="flex items-center gap-3 rounded-lg px-2.5 py-2.5">
                <Avatar name={p?.full_name || '?'} src={p?.avatar_url} size={36} />
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] text-text-primary font-medium truncate">
                    {p?.full_name || 'Unknown'}{isSelf ? ' (you)' : ''}
                  </div>
                  {p?.email && <div className="text-[12.5px] text-text-secondary truncate">{p.email}</div>}
                  <div className="text-[12px] text-text-muted">
                    {m.role === 'owner' ? 'Owner' : `${m.modules.length}/${ALL_MODULES.length} modules${m.field_groups.includes('finance') ? ' · finance' : ''}`}
                    {m.created_at ? ` · joined ${new Date(m.created_at).toLocaleDateString('et-EE')}` : ''}
                  </div>
                </div>
                {isOwner && m.role !== 'owner' ? (
                  <>
                    <select
                      value={m.role}
                      onChange={e => changeRole(m, e.target.value)}
                      className="text-[13px] border border-border rounded-md px-1.5 py-1 bg-bg text-text-primary outline-none cursor-pointer"
                    >
                      <option value="editor">Editor</option>
                      <option value="viewer">Viewer</option>
                    </select>
                    <button onClick={() => removeMember(m)} className="p-1.5 text-text-muted hover:text-lost transition-colors cursor-pointer">
                      <Trash2 size={15} />
                    </button>
                  </>
                ) : (
                  <span className="text-[13px] text-text-secondary capitalize">{m.role}</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {isOwner && showForm && !isPro && (
        <div className="bg-surface p-5">
          <h2 className="text-[15px] font-semibold text-text-primary mb-1">Sharing is a Pro feature</h2>
          <p className="text-[13px] text-text-muted">
            Inviting people to your workspace requires the Pro plan. Contact us to upgrade.
          </p>
        </div>
      )}

      {isOwner && showForm && isPro && (
        <div className="bg-surface p-5">
          <h2 className="text-[15px] font-semibold text-text-primary mb-4">Invite someone</h2>
          <div className="flex flex-col gap-3">
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="email@example.com"
              className="w-full px-3 py-2 border-none rounded-xl bg-border-light text-[14px] outline-none transition-colors"
            />
            <div className="flex gap-1">
              {['editor', 'viewer'].map(r => (
                <button
                  key={r}
                  onClick={() => setForm(f => ({ ...f, role: r }))}
                  className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors cursor-pointer capitalize ${
                    form.role === r ? 'bg-text-primary text-bg' : 'bg-border-light text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <div>
              <div className="text-[13px] font-medium text-text-secondary mb-1.5">Shared modules</div>
              <div className="grid grid-cols-2 gap-0.5">
                {ALL_MODULES.map(({ key, label }) => {
                  const on = form.modules.includes(key)
                  return (
                    <button key={key} onClick={() => toggleModule(key)} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-border-light transition-colors cursor-pointer">
                      <span className={`flex items-center justify-center w-4 h-4 rounded border transition-colors ${on ? 'bg-text-primary border-text-primary text-white' : 'border-border'}`}>
                        {on && <Check size={11} strokeWidth={3} />}
                      </span>
                      <span className="text-[13px] text-text-primary">{label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
            <button onClick={() => setForm(f => ({ ...f, finance: !f.finance }))} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-border-light transition-colors cursor-pointer w-fit">
              <span className={`flex items-center justify-center w-4 h-4 rounded border transition-colors ${form.finance ? 'bg-text-primary border-text-primary text-white' : 'border-border'}`}>
                {form.finance && <Check size={11} strokeWidth={3} />}
              </span>
              <span className="text-[13px] text-text-primary">Show financial data (fees, subscription)</span>
            </button>
            <button onClick={sendInvite} className="px-3 py-2 bg-accent text-white rounded-full text-[14px] font-medium hover:opacity-90 transition-opacity cursor-pointer w-fit">
              Create invitation
            </button>
          </div>
        </div>
      )}

      {isOwner && invites.length > 0 && (
        <div className="bg-surface p-5">
          <h2 className="text-[15px] font-semibold text-text-primary mb-1">Pending invitations</h2>
          <p className="text-[13px] text-text-muted mb-3">Send the link to the invitee — it expires 7 days after creation.</p>
          <div className="flex flex-col gap-1">
            {invites.map(i => (
              <div key={i.id} className="flex items-center gap-3 rounded-lg px-2.5 py-2">
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] text-text-primary truncate">{i.email}</div>
                  <div className="text-[12px] text-text-muted capitalize">{i.role} · {i.modules.length}/{ALL_MODULES.length} modules{new Date(i.expires_at) < new Date() ? ' · expired' : ''}</div>
                </div>
                <button onClick={() => copyLink(i)} className="flex items-center gap-1 px-2 py-1 text-[13px] text-text-secondary border border-border rounded-md hover:bg-border-light transition-colors cursor-pointer">
                  {copiedId === i.id ? <Check size={13} /> : <Copy size={13} />}
                  {copiedId === i.id ? 'Copied' : 'Copy link'}
                </button>
                <button onClick={() => revokeInvite(i.id)} className="p-1.5 text-text-muted hover:text-lost transition-colors cursor-pointer">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
