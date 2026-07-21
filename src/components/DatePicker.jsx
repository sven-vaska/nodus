import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function getMonthDays(year, month) {
  const first = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0).getDate()
  let startDow = first.getDay() - 1
  if (startDow < 0) startDow = 6

  const days = []
  const prevLastDay = new Date(year, month, 0).getDate()
  for (let i = startDow - 1; i >= 0; i--) days.push({ day: prevLastDay - i, current: false })
  for (let d = 1; d <= lastDay; d++) days.push({ day: d, current: true })
  const remaining = 42 - days.length
  for (let d = 1; d <= remaining; d++) days.push({ day: d, current: false })
  return days
}

function fmt(date) {
  if (!date) return ''
  const d = new Date(date + 'T00:00:00')
  return `${MONTHS[d.getMonth()].slice(0, 3)} ${d.getDate()}, ${d.getFullYear()}`
}

function toIso(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export default function DatePicker({ value, onChange, placeholder = 'Pick a date', inline }) {
  const [open, setOpen] = useState(false)
  const ref = useRef()
  const today = new Date()
  const parsed = value ? new Date(value + 'T00:00:00') : null
  const [viewYear, setViewYear] = useState(parsed?.getFullYear() || today.getFullYear())
  const [viewMonth, setViewMonth] = useState(parsed?.getMonth() ?? today.getMonth())

  useEffect(() => {
    if (!open) return
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  useEffect(() => {
    if (open) {
      const p = value ? new Date(value + 'T00:00:00') : new Date()
      setViewYear(p.getFullYear())
      setViewMonth(p.getMonth())
    }
  }, [open])

  const prev = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  const next = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  const selectDay = (day, current) => {
    if (!current) return
    onChange(toIso(viewYear, viewMonth, day))
    setOpen(false)
  }

  const setToday = () => {
    onChange(toIso(today.getFullYear(), today.getMonth(), today.getDate()))
    setOpen(false)
  }

  const clear = () => {
    onChange('')
    setOpen(false)
  }

  const days = getMonthDays(viewYear, viewMonth)
  const todayStr = toIso(today.getFullYear(), today.getMonth(), today.getDate())

  return (
    <div className="relative" ref={ref}>
      {inline ? (
        <button type="button" onClick={() => setOpen(!open)} className="text-left cursor-pointer">
          {value ? <span className="text-[14px] font-semibold text-text-primary">{fmt(value)}</span> : <span className="text-text-muted text-[13px]">{placeholder}</span>}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="w-full px-2.5 py-2 text-left text-[15px] bg-input rounded-lg outline-none hover:bg-border-light transition-colors cursor-pointer"
        >
          {value ? fmt(value) : <span className="text-text-muted">{placeholder}</span>}
        </button>
      )}

      {open && (
        <div className="fixed md:absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 md:top-full md:left-auto md:right-0 md:translate-x-0 md:translate-y-0 md:mt-1 bg-surface border border-border rounded-xl shadow-lg z-50 p-4 w-[280px]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[14px] font-semibold text-text-primary">
              {MONTHS[viewMonth].slice(0, 3)} {viewYear}
            </span>
            <div className="flex items-center gap-1">
              <button type="button" onClick={setToday} className="text-[12px] text-text-secondary hover:text-text-primary px-2 py-0.5 rounded transition-colors cursor-pointer">Today</button>
              <button type="button" onClick={prev} className="p-0.5 text-text-muted hover:text-text-primary rounded transition-colors cursor-pointer"><ChevronLeft size={16} /></button>
              <button type="button" onClick={next} className="p-0.5 text-text-muted hover:text-text-primary rounded transition-colors cursor-pointer"><ChevronRight size={16} /></button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-0">
            {DAYS.map(d => (
              <div key={d} className="text-center text-[11px] font-medium text-text-muted py-1">{d}</div>
            ))}
            {days.map((d, i) => {
              const iso = d.current ? toIso(viewYear, viewMonth, d.day) : null
              const isSelected = iso === value
              const isToday = iso === todayStr
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => selectDay(d.day, d.current)}
                  className={`text-center text-[13px] py-1.5 rounded-md transition-colors cursor-pointer ${
                    !d.current ? 'text-text-muted/40' :
                    isSelected ? 'bg-accent text-white font-medium' :
                    isToday ? 'bg-border-light text-text-primary font-medium' :
                    'text-text-primary hover:bg-border-light'
                  }`}
                >
                  {d.day}
                </button>
              )
            })}
          </div>

          {value && (
            <button type="button" onClick={clear} className="mt-3 pt-3 border-t border-border text-[13px] text-text-secondary hover:text-text-primary w-full text-left transition-colors cursor-pointer">
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  )
}
