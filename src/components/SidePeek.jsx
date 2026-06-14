import { useEffect } from 'react'
import { X, Trash2 } from 'lucide-react'

export default function SidePeek({ title, open, onClose, onSave, onDelete, children, saveLabel = 'Salvesta' }) {
  useEffect(() => {
    if (!open) return
    const handleEsc = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [open, onClose])

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/10 z-40" onClick={onClose} />
      <div
        className="fixed top-0 right-0 h-full w-[420px] max-w-full bg-surface border-l border-border z-50 flex flex-col animate-slide-in"
        style={{ boxShadow: '-4px 0 24px rgba(0,0,0,0.08)' }}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <h2 className="text-[14px] font-semibold text-text-primary">{title}</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {children}
        </div>

        {onSave && (
          <div className="flex items-center gap-2 px-5 py-3 border-t border-border">
            <button
              onClick={onSave}
              className="px-4 py-1.5 bg-text-primary text-white rounded-lg text-[12px] font-medium hover:opacity-90 transition-opacity cursor-pointer"
            >
              {saveLabel}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-text-secondary text-[12px] font-medium hover:text-text-primary transition-colors cursor-pointer"
            >
              Tühista
            </button>
            {onDelete && (
              <button
                onClick={onDelete}
                className="ml-auto px-3 py-1.5 text-lost text-[12px] font-medium hover:bg-[#fff1f2] rounded-lg transition-colors cursor-pointer flex items-center gap-1"
              >
                <Trash2 size={12} /> Kustuta
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
      <label className="block text-[11px] font-medium text-text-secondary mb-1">{label}</label>
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
      className="w-full px-2.5 py-1.5 border border-border rounded-lg text-[12px] bg-surface outline-none focus:border-accent transition-colors"
      {...props}
    />
  )
}

export function Textarea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-2.5 py-1.5 border border-border rounded-lg text-[12px] bg-surface outline-none focus:border-accent transition-colors resize-none"
    />
  )
}

export function Select({ value, onChange, options, placeholder }) {
  return (
    <select
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      className="w-full px-2.5 py-1.5 border border-border rounded-lg text-[12px] bg-surface outline-none focus:border-accent transition-colors cursor-pointer"
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

export function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <div
        onClick={() => onChange(!checked)}
        className={`w-8 h-4.5 rounded-full transition-colors relative cursor-pointer ${checked ? 'bg-accent' : 'bg-border'}`}
      >
        <div className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </div>
      {label && <span className="text-[12px] text-text-primary">{label}</span>}
    </label>
  )
}
