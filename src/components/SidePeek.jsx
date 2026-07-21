import { useEffect, useState, useRef } from 'react'
import { X, Trash2, ChevronDown, Search } from 'lucide-react'

export default function SidePeek({ title, open, onClose, onSave, onDelete, children, saveLabel = 'Save', wide }) {
  useEffect(() => {
    if (!open) return
    const handleEsc = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [open, onClose])

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 bg-[rgba(38,34,28,.18)] z-[55]" onClick={onClose} />
      <div
        className={`fixed top-0 right-0 h-full w-full md:max-w-full md:rounded-l-2xl z-[60] flex flex-col animate-slide-in ${wide ? 'md:w-[600px]' : 'md:w-[520px]'}`}
        style={{ boxShadow: '-24px 0 60px rgba(30,28,25,0.18)', paddingTop: 'env(safe-area-inset-top)', background: 'var(--app-sidepeek)' }}
      >
        <div className="flex items-center justify-between px-6 md:px-8 pt-6 pb-4">
          <h2 className="font-serif text-[21px] font-semibold text-text-primary m-0">{title}</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 md:px-8 py-4">
          {children}
        </div>

        {onSave && (
          <div className="flex items-center gap-4 px-6 md:px-8 py-5" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}>
            <button
              onClick={onSave}
              className="px-6 py-2.5 bg-accent text-white rounded-full text-[14px] font-semibold hover:opacity-90 transition-opacity cursor-pointer"
            >
              {saveLabel}
            </button>
            <button
              onClick={onClose}
              className="px-2 py-2 text-text-muted text-[14px] font-medium hover:text-text-primary transition-colors cursor-pointer"
            >
              Cancel
            </button>
            {onDelete && (
              <button
                onClick={onDelete}
                className="ml-auto px-3 py-1.5 text-lost text-[14px] font-medium hover:bg-border-light rounded-full transition-colors cursor-pointer flex items-center gap-1"
              >
                <Trash2 size={12} /> Delete
              </button>
            )}
          </div>
        )}
      </div>
    </>
  )
}

export function FormField({ label, children }) {
  return (
    <div className="mb-3">
      <label className="block text-[12px] font-semibold uppercase tracking-[.06em] text-text-muted mb-1.5">{label}</label>
      {children}
    </div>
  )
}

export function Input({ value, onChange, type = 'text', placeholder, ...props }) {
  return (
    <input
      type={type}
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-4 py-2.5 border-none text-[16px] md:text-[14.5px] bg-input rounded-xl outline-none focus:bg-border-light transition-colors"
      {...props}
    />
  )
}

// Custom dropdown instead of input[type=time]: native time inputs render their
// own ghost text/format per platform, which fought the placeholder overlay.
const TIME_OPTIONS = Array.from({ length: 96 }, (_, i) =>
  `${String(Math.floor(i / 4)).padStart(2, '0')}:${['00', '15', '30', '45'][i % 4]}`
)

export function TimeInput({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef()

  useEffect(() => {
    if (!open) return
    const handle = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  return (
    <div className="relative w-full" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full px-2.5 py-2 text-left text-[15px] bg-input rounded-lg outline-none hover:bg-border-light transition-colors cursor-pointer"
      >
        {value ? <span className="text-text-primary">{value}</span> : <span className="text-text-muted">Time</span>}
      </button>
      {open && (
        /* Opens upward — the reminder row sits at the bottom of the form, so a
           downward list would run off the panel */
        <div className="absolute left-0 right-0 bottom-full mb-1 bg-surface border border-border rounded-xl shadow-lg z-50 max-h-[220px] overflow-y-auto py-1">
          <button
            type="button"
            onClick={() => { onChange(''); setOpen(false) }}
            className="w-full text-left px-3 py-1.5 text-[14px] text-text-muted hover:bg-border-light transition-colors cursor-pointer"
          >
            —
          </button>
          {TIME_OPTIONS.map(t => (
            <button
              key={t}
              type="button"
              onClick={() => { onChange(t); setOpen(false) }}
              className={`w-full text-left px-3 py-1.5 text-[14px] hover:bg-border-light transition-colors cursor-pointer ${
                value === t ? 'text-accent font-semibold' : 'text-text-primary'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function Textarea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-4 py-2.5 border-none text-[16px] md:text-[14.5px] bg-input rounded-xl outline-none focus:bg-border-light transition-colors resize-none"
    />
  )
}

export function Select({ value, onChange, options, placeholder }) {
  return (
    <select
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      className="w-full px-4 py-2.5 border-none rounded-xl text-[14px] bg-input outline-none transition-colors cursor-pointer"
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

export function TabSelect({ value, onChange, options, colors }) {
  return (
    <div className="flex gap-1 flex-wrap">
      {options.map(o => {
        const color = colors?.[o]
        const isActive = value === o
        return (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
            className={`px-3.5 py-1.5 text-[13.5px] font-medium rounded-full transition-colors cursor-pointer border ${
              isActive
                ? 'bg-accent border-accent text-white'
                : 'bg-surface border-border text-text-secondary hover:text-text-primary'
            }`}
          >
            {o}
          </button>
        )
      })}
    </div>
  )
}

export function SearchableSelect({ value, onChange, options, placeholder = '— Select —' }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef()
  const inputRef = useRef()

  useEffect(() => {
    if (!open) return
    const handle = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  useEffect(() => { if (open && inputRef.current) inputRef.current.focus() }, [open])

  const selected = options.find(o => o.value === value)
  const filtered = options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => { setOpen(!open); setQuery('') }}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-input rounded-xl text-[16px] md:text-[14.5px] outline-none hover:bg-border-light transition-colors cursor-pointer text-left"
      >
        <span className={selected ? 'text-text-primary' : 'text-text-muted'}>{selected ? selected.label : placeholder}</span>
        <ChevronDown size={14} className="text-text-muted shrink-0" />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-surface border border-border rounded-xl shadow-lg z-50 max-h-[240px] flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 px-2.5 py-2 border-b border-border">
            <Search size={14} className="text-text-muted shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search..."
              className="flex-1 text-[16px] bg-transparent outline-none text-text-primary placeholder:text-text-muted"
            />
          </div>
          <div className="overflow-y-auto flex-1">
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false) }}
              className={`w-full text-left px-2.5 py-2 text-[14px] hover:bg-border-light transition-colors cursor-pointer ${!value ? 'text-text-primary font-medium' : 'text-text-muted'}`}
            >
              {placeholder}
            </button>
            {filtered.map(o => (
              <button
                key={o.value}
                type="button"
                onClick={() => { onChange(o.value); setOpen(false) }}
                className={`w-full text-left px-2.5 py-2 text-[14px] hover:bg-border-light transition-colors cursor-pointer ${value === o.value ? 'text-text-primary font-medium bg-border-light/50' : 'text-text-primary'}`}
              >
                {o.label}
              </button>
            ))}
            {filtered.length === 0 && <div className="px-2.5 py-3 text-[13px] text-text-muted text-center">No results</div>}
          </div>
        </div>
      )}
    </div>
  )
}

// Free-text chip list — add via Enter/comma, remove via ×. Used for
// "other emails" on a contact so the same person can be matched under
// several addresses (work + personal, old domain, etc).
export function TagInput({ value, onChange, placeholder = 'Add and press Enter' }) {
  const [draft, setDraft] = useState('')
  const arr = value || []

  function add() {
    const v = draft.trim()
    if (v && !arr.includes(v)) onChange([...arr, v])
    setDraft('')
  }
  function remove(tag) {
    onChange(arr.filter(x => x !== tag))
  }

  return (
    <div>
      {arr.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-1.5">
          {arr.map(tag => (
            <span key={tag} className="flex items-center gap-1 text-[12px] pl-2 pr-1.5 py-0.5 bg-border-light rounded-full text-text-secondary">
              {tag}
              <button type="button" onClick={() => remove(tag)} className="text-text-muted hover:text-text-primary cursor-pointer leading-none">×</button>
            </span>
          ))}
        </div>
      )}
      <input
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add() } }}
        onBlur={add}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 bg-input rounded-xl text-[16px] md:text-[14.5px] outline-none placeholder:text-text-muted"
      />
    </div>
  )
}

export function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <div
        onClick={() => onChange(!checked)}
        className={`w-8 h-4.5 rounded-full transition-colors relative cursor-pointer ${checked ? 'bg-accent' : 'bg-border'}`}
      >
        <div className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-surface shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </div>
      {label && <span className="text-[14px] text-text-primary">{label}</span>}
    </label>
  )
}
