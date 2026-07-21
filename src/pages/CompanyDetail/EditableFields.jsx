import { useState, useEffect } from 'react'
import { useWorkspace } from '../../lib/WorkspaceContext'
import { formatDate } from '../../lib/utils'
import DatePicker from '../../components/DatePicker'

export function EditableText({ value, field, onSave, className }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(value)
  const { canEdit } = useWorkspace()
  if (!canEdit) return <span className={className}>{value || '—'}</span>
  if (editing) return (
    <input autoFocus value={val} onChange={e => setVal(e.target.value)}
      onBlur={() => { if (val !== value) onSave(field, val); setEditing(false) }}
      onKeyDown={e => { if (e.key === 'Enter') { if (val !== value) onSave(field, val); setEditing(false) } if (e.key === 'Escape') { setVal(value); setEditing(false) } }}
      className={`${className} bg-transparent border-b border-accent outline-none`} />
  )
  return <span className={`${className} cursor-pointer hover:bg-border-light rounded px-0.5 -mx-0.5`} onClick={() => setEditing(true)}>{value || '—'}</span>
}

export function EditableAttrRow({ label, value, field, onSave, inputType = 'text', type, suffix, render }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(value ?? '')
  const { canEdit } = useWorkspace()

  useEffect(() => { setVal(value ?? '') }, [value])

  const display = render ? render(value) : (value ? (suffix ? `${value} ${suffix}` : String(value)) : null)

  if (!canEdit) {
    return (
      <div className="flex items-start py-[5px] text-[14px] gap-3">
        <span className="text-text-muted w-[110px] shrink-0 truncate">{label}</span>
        <div className="flex-1 min-w-0 text-text-primary">
          {inputType === 'date' ? (value ? formatDate(value) : <span className="text-text-muted text-[13px]"></span>) : (display || <span className="text-text-muted text-[13px]"></span>)}
        </div>
      </div>
    )
  }

  if (inputType === 'date') {
    return (
      <div className="flex items-start py-[5px] text-[14px] gap-3">
        <span className="text-text-muted w-[110px] shrink-0 truncate">{label}</span>
        <div className="flex-1 min-w-0">
          <DatePicker value={value || ''} onChange={v => onSave(field, v || null)} inline />
        </div>
      </div>
    )
  }

  if (editing) {
    if (type === 'textarea') return (
      <div className="flex items-start py-[5px] text-[14px] gap-3">
        <span className="text-text-muted w-[110px] shrink-0 truncate">{label}</span>
        <textarea autoFocus value={val} onChange={e => setVal(e.target.value)}
          onBlur={() => { onSave(field, val || null); setEditing(false) }}
          onKeyDown={e => { if (e.key === 'Escape') { setVal(value ?? ''); setEditing(false) } }}
          rows={3}
          className="flex-1 min-w-0 px-1.5 py-1 border border-accent rounded text-[14px] bg-surface outline-none resize-none" />
      </div>
    )
    return (
      <div className="flex items-start py-[5px] text-[14px] gap-3">
        <span className="text-text-muted w-[110px] shrink-0 truncate">{label}</span>
        <input autoFocus type={inputType} value={val} onChange={e => setVal(e.target.value)}
          onBlur={() => { onSave(field, val || null); setEditing(false) }}
          onKeyDown={e => { if (e.key === 'Enter') { onSave(field, val || null); setEditing(false) } if (e.key === 'Escape') { setVal(value ?? ''); setEditing(false) } }}
          className="flex-1 min-w-0 px-1.5 py-0.5 border border-accent rounded text-[14px] bg-surface outline-none" />
      </div>
    )
  }

  return (
    <div className="flex items-start py-[5px] text-[14px] gap-3 cursor-pointer hover:bg-border-light -mx-1 px-1 rounded transition-colors" onClick={() => setEditing(true)}>
      <span className="text-text-muted w-[110px] shrink-0 truncate">{label}</span>
      <div className="flex-1 min-w-0 text-text-primary">{display || <span className="text-text-muted text-[13px]"></span>}</div>
    </div>
  )
}

export function EditableSelect({ value, field, options, onSave, multi }) {
  const [editing, setEditing] = useState(false)
  const { canEdit } = useWorkspace()

  if (!canEdit) {
    if (multi) {
      const arr = value || []
      return (
        <div className="flex flex-wrap gap-1">
          {arr.map(s => <span key={s} className="text-[12px] px-2 py-0.5 bg-border-light rounded-full text-text-secondary">{s}</span>)}
        </div>
      )
    }
    return <span>{value || <span className="text-text-muted text-[13px]"></span>}</span>
  }

  if (multi) {
    const arr = value || []
    if (editing) return (
      <div className="flex flex-wrap gap-1">
        {options.map(o => (
          <button key={o} onClick={() => {
            const next = arr.includes(o) ? arr.filter(x => x !== o) : [...arr, o]
            onSave(field, next)
          }}
          className={`text-[12px] px-2 py-0.5 rounded-full cursor-pointer ${arr.includes(o) ? 'bg-text-primary text-white' : 'bg-border-light text-text-secondary hover:bg-border'}`}>{o}</button>
        ))}
        <button onClick={() => setEditing(false)} className="text-[11px] text-text-muted hover:text-text-primary cursor-pointer ml-1">✓</button>
      </div>
    )
    return (
      <div className="flex flex-wrap gap-1 cursor-pointer" onClick={() => setEditing(true)}>
        {arr.length > 0 ? arr.map(s => <span key={s} className="text-[12px] px-2 py-0.5 bg-border-light rounded-full text-text-secondary">{s}</span>) : <span className="text-text-muted text-[13px]"></span>}
      </div>
    )
  }

  if (editing) return (
    <select autoFocus value={value || ''} onChange={e => { onSave(field, e.target.value || null); setEditing(false) }}
      onBlur={() => setEditing(false)}
      className="text-[14px] px-1 py-0.5 border border-accent rounded bg-surface outline-none cursor-pointer">
      <option value="">—</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )

  return <span className="cursor-pointer hover:text-accent" onClick={() => setEditing(true)}>{value || <span className="text-text-muted text-[13px]"></span>}</span>
}

export function EditableTagList({ value, field, defaults, onSave }) {
  const [editing, setEditing] = useState(false)
  const [customInput, setCustomInput] = useState('')
  const { canEdit } = useWorkspace()
  const arr = value || []

  if (!canEdit) {
    return (
      <div className="flex flex-wrap gap-1">
        {arr.map(s => <span key={s} className="text-[12px] px-2 py-0.5 bg-border-light rounded-full text-text-secondary">{s}</span>)}
      </div>
    )
  }
  const allOptions = [...new Set([...defaults, ...arr])].sort()

  function toggle(tag) {
    const next = arr.includes(tag) ? arr.filter(x => x !== tag) : [...arr, tag]
    onSave(field, next)
  }

  function addCustom() {
    const tag = customInput.trim()
    if (tag && !arr.includes(tag)) {
      onSave(field, [...arr, tag])
    }
    setCustomInput('')
  }

  if (editing) return (
    <div>
      <div className="flex flex-wrap gap-1 mb-1.5 max-h-[140px] overflow-y-auto">
        {allOptions.map(o => (
          <button key={o} type="button" onClick={() => toggle(o)}
            className={`text-[12px] px-2 py-0.5 rounded-full cursor-pointer ${arr.includes(o) ? 'bg-text-primary text-white' : 'bg-border-light text-text-secondary hover:bg-border'}`}>{o}</button>
        ))}
      </div>
      <div className="flex items-center gap-1">
        <input value={customInput} onChange={e => setCustomInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustom() } }}
          placeholder="Add custom..."
          className="flex-1 text-[12px] px-1.5 py-0.5 border border-border rounded bg-surface outline-none focus:border-accent" />
        <button type="button" onClick={() => setEditing(false)} className="text-[11px] text-text-muted hover:text-text-primary cursor-pointer px-1">✓</button>
      </div>
    </div>
  )

  return (
    <div className="flex flex-wrap gap-1 cursor-pointer" onClick={() => setEditing(true)}>
      {arr.length > 0 ? arr.map(s => <span key={s} className="text-[12px] px-2 py-0.5 bg-border-light rounded-full text-text-secondary">{s}</span>) : <span className="text-text-muted text-[13px]"></span>}
    </div>
  )
}

export function AttrRow({ label, children }) {
  return (
    <div className="flex items-start py-[5px] text-[14px] gap-3">
      <span className="text-text-muted w-[110px] shrink-0 truncate">{label}</span>
      <div className="flex-1 min-w-0 text-text-primary">{children}</div>
    </div>
  )
}

export function SidebarGroup({ title, children, action }) {
  return (
    <div className="pt-3 pb-2 first:pt-0">
      <div className="flex items-center justify-between mb-2.5">
        <div className="text-[12px] text-text-muted font-semibold uppercase tracking-[.06em]">{title}</div>
        {action}
      </div>
      {children}
    </div>
  )
}
