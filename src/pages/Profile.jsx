import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useUser } from '../lib/UserContext'
import Avatar from '../components/Avatar'
import { Camera } from 'lucide-react'
import Loading from '../components/Loading'

export default function Profile() {
  const { profile, updateProfile, email } = useUser()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef()

  if (!profile) return <Loading />

  function startEdit() {
    setName(profile.full_name || '')
    setEditing(true)
  }

  async function save() {
    await updateProfile({ full_name: name.trim() })
    setEditing(false)
  }

  async function uploadAvatar(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `${profile.id}.${ext}`
      await supabase.storage.from('avatars').upload(path, file, { upsert: true })
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      const url = `${data.publicUrl}?t=${Date.now()}`
      await updateProfile({ avatar_url: url })
    } catch (err) {
      console.error('Upload failed:', err)
    }
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function removeAvatar() {
    await updateProfile({ avatar_url: null })
  }

  return (
    <div className="max-w-[560px]">
      <div className="bg-surface">
        <div className="flex items-center gap-5 mb-10">
          <div className="relative group">
            <Avatar name={profile.full_name || 'U'} size={64} src={profile.avatar_url} />
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-colors cursor-pointer"
            >
              <Camera size={18} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={uploadAvatar} className="hidden" />
          </div>
          <div className="min-w-0">
            <div className="font-serif text-[24px] font-semibold text-text-primary truncate">{profile.full_name || 'Unnamed'}</div>
            <div className="text-[14px] text-text-muted capitalize truncate">{profile.role || 'user'}{email ? <span className="normal-case"> · {email}</span> : null}</div>
          </div>
          <div className="flex items-center gap-2 ml-4 shrink-0">
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="px-5 py-2 text-[14px] font-semibold text-accent bg-accent-soft rounded-full hover:opacity-80 transition-opacity cursor-pointer disabled:opacity-50 whitespace-nowrap"
            >
              {uploading ? 'Uploading...' : 'Upload photo'}
            </button>
            {profile.avatar_url && (
              <button onClick={removeAvatar} className="px-2 py-2 text-[14px] text-text-muted hover:text-lost transition-colors cursor-pointer">
                Remove
              </button>
            )}
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <label className="block text-[12px] font-semibold uppercase tracking-[.06em] text-text-muted mb-2.5">Full name</label>
            {editing ? (
              <div className="flex gap-2">
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="flex-1 px-4 py-2 border-none rounded-xl text-[14px] bg-border-light outline-none transition-colors"
                  autoFocus
                  onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false) }}
                />
                <button onClick={save} className="px-5 py-2 bg-accent text-white rounded-full text-[13.5px] font-semibold hover:opacity-90 cursor-pointer">Save</button>
                <button onClick={() => setEditing(false)} className="px-3 py-1.5 text-[13px] text-text-secondary hover:text-text-primary cursor-pointer">Cancel</button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-[15px] text-text-primary">{profile.full_name || '—'}</span>
                <button onClick={startEdit} className="text-[13.5px] text-accent hover:underline cursor-pointer">Edit</button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-[12px] font-semibold uppercase tracking-[.06em] text-text-muted mb-2.5">Role</label>
            <span className="text-[14px] text-text-primary capitalize">{profile.role || 'user'}</span>
          </div>
        </div>
      </div>

      <div className="mt-12 pt-6 border-t border-border-light">
        <button
          onClick={() => supabase.auth.signOut()}
          className="px-1 py-2 text-[14px] font-semibold text-lost hover:underline transition-colors cursor-pointer"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
