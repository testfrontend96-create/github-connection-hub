// Custom date picker for the admin forms (UDS: round day cells, white selection, dark glass popover).
import { useEffect, useRef, useState } from 'react'
import { I } from './icons'

const pad = (n: number) => String(n).padStart(2, '0')
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const parse = (v?: string) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v || ''); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null }
const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

export function DateField({ value, onChange }: { value?: string; onChange: (v: string) => void }) {
  const sel = parse(value)
  const [open, setOpen] = useState(false)
  const [view, setView] = useState(() => sel || new Date())
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const off = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false) }
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', off); document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', off); document.removeEventListener('keydown', esc) }
  }, [open])
  const y = view.getFullYear(), m = view.getMonth()
  const lead = (new Date(y, m, 1).getDay() + 6) % 7
  const count = new Date(y, m + 1, 0).getDate()
  const cells = [...Array(lead).fill(null), ...Array.from({ length: count }, (_, i) => new Date(y, m, i + 1))]
  const today = iso(new Date())
  const pick = (d: Date) => { onChange(iso(d)); setOpen(false) }
  return (
    <div className="adm-date" ref={box}>
      <button type="button" className="adm-field adm-date-btn" aria-haspopup="dialog" aria-expanded={open} onClick={() => { setView(sel || new Date()); setOpen(!open) }}>
        <span className={sel ? '' : 'adm-date-empty'}>{sel ? sel.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Pick a date'}</span>
        {I.calendar}
      </button>
      {open && (
        <div className="adm-date-pop" role="dialog" aria-label="Choose date">
          <div className="adm-date-head">
            <button type="button" className="adm-icon-btn" aria-label="Previous month" onClick={() => setView(new Date(y, m - 1, 1))}>{I.left}</button>
            <b>{view.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</b>
            <button type="button" className="adm-icon-btn" aria-label="Next month" onClick={() => setView(new Date(y, m + 1, 1))}>{I.right}</button>
          </div>
          <div className="adm-date-grid">
            {DAYS.map((d) => <span key={d} className="adm-date-dow">{d}</span>)}
            {cells.map((d, i) => d ? (
              <button key={i} type="button" className={'adm-date-day' + (value && iso(d) === iso(sel!) ? ' is-on' : '') + (iso(d) === today ? ' is-today' : '')} onClick={() => pick(d)}>{d.getDate()}</button>
            ) : <span key={i} />)}
          </div>
          <div className="adm-date-foot">
            <button type="button" className="adm-pill" onClick={() => pick(new Date())}>Today</button>
            {value && <button type="button" className="adm-pill" onClick={() => { onChange(''); setOpen(false) }}>Clear</button>}
          </div>
        </div>
      )}
    </div>
  )
}
