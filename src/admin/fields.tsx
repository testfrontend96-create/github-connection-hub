// Form controls for the admin editors (dark Sales-panel styling, see admin.css).
import { useRef, useState, type ReactNode } from 'react'
import type { Field, Opt } from './schemas'
import { uploadImage } from './media'
import { I } from './icons'
import { DateField } from './DateField'

export function Modal({ title, onClose, children, wide, footer, className = '' }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean; footer?: ReactNode; className?: string }) {
  return (
    <div className="adm-modal-wrap">
      <button type="button" aria-label="Close" className="adm-modal-scrim" onClick={onClose} />
      <div className={'adm-modal' + (wide ? ' adm-modal--wide' : '') + (className ? ' ' + className : '')} role="dialog" aria-label={title}>
        <div className="adm-modal-head">
          <h2>{title}</h2>
          <button type="button" className="adm-icon-btn" onClick={onClose} aria-label="Close" data-tip="Close without saving">{I.x}</button>
        </div>
        <div className="adm-modal-body">{children}</div>
        {footer && <div className="adm-modal-foot">{footer}</div>}
      </div>
    </div>
  )
}

function ImageField({ value, onChange, folder }: { value: string; onChange: (v: string) => void; folder: string }) {
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [over, setOver] = useState(false)
  const take = async (file?: File | null) => {
    if (!file) return
    if (!file.type.startsWith('image/')) return setErr('Please choose an image file.')
    setBusy(true); setErr('')
    try { onChange(await uploadImage(file, folder)) } catch (e: any) { setErr(e.message || 'Upload failed') }
    setBusy(false)
  }
  return (
    <div>
      <div
        className={'adm-drop' + (over ? ' is-over' : '')}
        onDragOver={(e) => { e.preventDefault(); setOver(true) }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); take(e.dataTransfer.files?.[0]) }}
      >
        {value ? <img src={value} alt="" /> : <span className="adm-drop-empty">{I.image}</span>}
        <div className="adm-drop-copy">
          <b>{busy ? 'Uploading…' : value ? 'Replace image' : 'Drop an image here'}</b>
          <span>or</span>
          <button type="button" className="adm-pill" onClick={() => input.current?.click()} disabled={busy}>Choose file</button>
          {value && <button type="button" className="adm-link" onClick={() => onChange('')}>Remove</button>}
        </div>
        <input ref={input} type="file" accept="image/*" hidden onChange={(e) => take(e.target.files?.[0])} />
      </div>
      <input className="adm-field adm-field--sm" value={value} onChange={(e) => onChange(e.target.value)} placeholder="…or paste an image link" />
      {err && <p className="adm-err">{err}</p>}
    </div>
  )
}

function Chips({ options, value, onChange, custom }: { options: Opt[]; value: string[]; onChange: (v: string[]) => void; custom?: boolean }) {
  const [q, setQ] = useState('')
  const known = new Set(options.map(([v]) => v))
  const extra = value.filter((v) => !known.has(v)).map((v) => [v, v] as Opt)
  const all = [...options, ...extra]
  const shown = all.filter(([v, l]) => value.includes(v) || !q || l.toLowerCase().includes(q.toLowerCase()))
  const toggle = (v: string) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v])
  return (
    <div>
      {all.length > 12 && <input className="adm-field adm-field--sm" placeholder="Filter…" value={q} onChange={(e) => setQ(e.target.value)} />}
      <div className="adm-chips">
        {shown.map(([v, l]) => (
          <button type="button" key={v} className={'adm-chip' + (value.includes(v) ? ' is-on' : '')} onClick={() => toggle(v)}>
            {value.includes(v) && I.check}{l}
          </button>
        ))}
        {custom && q && !all.some(([, l]) => l.toLowerCase() === q.toLowerCase()) && (
          <button type="button" className="adm-chip adm-chip--add" onClick={() => { onChange([...value, q.trim()]); setQ('') }}>{I.plus}Add “{q.trim()}”</button>
        )}
      </div>
    </div>
  )
}

function Records({ f, value, onChange }: { f: Extract<Field, { type: 'records' }>; value: any[]; onChange: (v: any[]) => void }) {
  const set = (i: number, k: string, v: any) => onChange(value.map((r, j) => (j === i ? { ...r, [k]: v } : r)))
  const move = (i: number, d: number) => { const n = [...value]; const [x] = n.splice(i, 1); n.splice(i + d, 0, x); onChange(n) }
  return (
    <div className="adm-records">
      {value.map((r, i) => (
        <div className="adm-record" key={i}>
          <div className="adm-record-fields">
            {f.sub.map((s) => (
              <label key={s.k}>
                <span className="adm-label">{s.label}</span>
                {s.type === 'textarea' || s.type === 'lines'
                  ? <textarea className="adm-field" rows={s.type === 'lines' ? 4 : 3} value={s.type === 'lines' ? (r[s.k] || []).join('\n') : r[s.k] || ''} onChange={(e) => set(i, s.k, s.type === 'lines' ? e.target.value.split('\n') : e.target.value)} />
                  : <input className="adm-field" value={r[s.k] || ''} onChange={(e) => set(i, s.k, e.target.value)} />}
              </label>
            ))}
          </div>
          <div className="adm-record-tools">
            <button type="button" className="adm-icon-btn" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up" data-tip="Move up one place">{I.up}</button>
            <button type="button" className="adm-icon-btn" disabled={i === value.length - 1} onClick={() => move(i, 1)} aria-label="Move down" data-tip="Move down one place">{I.down}</button>
            <button type="button" className="adm-icon-btn adm-danger" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label="Remove" data-tip="Remove this section">{I.trash}</button>
          </div>
        </div>
      ))}
      <button type="button" className="adm-pill" onClick={() => onChange([...value, {}])}>{I.plus}Add</button>
    </div>
  )
}

const BLOCK_TYPES: Opt[] = [
  ['p', 'Paragraph'], ['h2', 'Section heading'], ['h3', 'Sub-heading'], ['img', 'Image'], ['ul', 'Bullet list'], ['ol', 'Numbered list'],
  ['note', 'How to start tip'], ['video', 'YouTube video'], ['table', 'Table'], ['events', 'Upcoming events promo'], ['academy', 'Academy promo'],
]
const slug = (s: string) => s.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 80)

function Blocks({ value, onChange }: { value: any[]; onChange: (v: any[]) => void }) {
  const set = (i: number, b: any) => onChange(value.map((x, j) => (j === i ? b : x)))
  const insert = (i: number, t: string) => { const n = [...value]; n.splice(i, 0, { t }); onChange(n) }
  const move = (i: number, d: number) => { const n = [...value]; const [x] = n.splice(i, 1); n.splice(i + d, 0, x); onChange(n) }
  const [adding, setAdding] = useState<number | null>(null)
  const Adder = ({ at }: { at: number }) => adding === at ? (
    <div className="adm-block-add">
      {BLOCK_TYPES.map(([t, l]) => <button key={t} type="button" className="adm-chip" onClick={() => { insert(at, t); setAdding(null) }}>{l}</button>)}
      <button type="button" className="adm-icon-btn adm-danger" onClick={() => setAdding(null)} aria-label="Cancel" data-tip="Cancel">{I.trash}</button>
    </div>
  ) : at === 0 ? <button type="button" className="adm-pill adm-body-add" onClick={() => setAdding(0)}>{I.plus}Add article body</button>
  : <button type="button" className="adm-block-plus" onClick={() => setAdding(at)} aria-label="Insert block here" data-tip="Add a section here">{I.plus}</button>
  return (
    <div className="adm-blocks">
      <Adder at={0} />
      {value.map((b, i) => (
        <div key={i}>
          <div className="adm-block">
            <div className="adm-block-head">
              <select className="adm-field adm-field--sm" value={b.t} onChange={(e) => set(i, { ...b, t: e.target.value })}>
                {BLOCK_TYPES.map(([t, l]) => <option key={t} value={t}>{l}</option>)}
              </select>
              <div className="adm-record-tools adm-record-tools--row">
                <button type="button" className="adm-icon-btn" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up" data-tip="Move up one place">{I.up}</button>
                <button type="button" className="adm-icon-btn" disabled={i === value.length - 1} onClick={() => move(i, 1)} aria-label="Move down" data-tip="Move down one place">{I.down}</button>
                <button type="button" className="adm-icon-btn adm-danger" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label="Remove" data-tip="Remove this section">{I.trash}</button>
              </div>
            </div>
            {['p', 'note'].includes(b.t) && <textarea className="adm-field" rows={4} value={b.text || ''} onChange={(e) => set(i, { ...b, text: e.target.value })} placeholder="Text — links as [text](https://…), bold as **text**" />}
            {['h2', 'h3'].includes(b.t) && <input className="adm-field" value={b.text || ''} onChange={(e) => set(i, { ...b, text: e.target.value, ...(b.t === 'h2' ? { id: slug(e.target.value) } : {}) })} />}
            {b.t === 'img' && <><ImageField value={b.src || ''} onChange={(v) => set(i, { ...b, src: v })} folder="articles" /><input className="adm-field adm-field--sm" placeholder="Image description (alt text)" value={b.alt || ''} onChange={(e) => set(i, { ...b, alt: e.target.value })} /></>}
            {['ul', 'ol'].includes(b.t) && <textarea className="adm-field" rows={4} value={(b.items || []).join('\n')} onChange={(e) => set(i, { ...b, items: e.target.value.split('\n') })} placeholder="One item per line" />}
            {b.t === 'video' && <input className="adm-field" value={b.id || ''} onChange={(e) => { const v = e.target.value; const m = v.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/); set(i, { ...b, id: m ? m[1] : v }) }} placeholder="YouTube link or video ID" />}
            {b.t === 'table' && <textarea className="adm-field adm-mono" rows={5} value={(b.rows || []).map((r: string[]) => r.join(' | ')).join('\n')} onChange={(e) => set(i, { ...b, rows: e.target.value.split('\n').map((r) => r.split('|').map((c) => c.trim())) })} placeholder="One row per line, cells separated by |. First row is the header." />}
            {['events', 'academy'].includes(b.t) && <p className="adm-hint">The {b.t === 'events' ? 'Upcoming events' : 'Longevity Science Academy'} promo appears here.</p>}
          </div>
          <Adder at={i + 1} />
        </div>
      ))}
    </div>
  )
}

export function FieldInput({ f, value, onChange, folder }: { f: Field; value: any; onChange: (v: any) => void; folder: string }) {
  const ph = f.ph || (f.type === 'lines' ? 'One item per line' : f.type === 'number' ? 'e.g. 1' : f.type === 'url' ? 'https://…' : 'Enter ' + f.label.toLowerCase())
  switch (f.type) {
    case 'textarea': return <textarea className="adm-field" rows={4} value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={ph} />
    case 'lines': return <textarea className="adm-field" rows={5} value={(value || []).join('\n')} onChange={(e) => onChange(e.target.value.split('\n'))} placeholder={ph} />
    case 'number': return <input className="adm-field adm-number" type="number" inputMode="numeric" min={0} value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))} placeholder={ph} />
    case 'date': return <DateField value={value} onChange={onChange} />
    case 'url': return <input className="adm-field" type="url" value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={ph} />
    case 'bool': return <label className="adm-switch"><input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} /><span /> {value ? 'Yes' : 'No'}</label>
    case 'image': return <ImageField value={value || ''} onChange={onChange} folder={folder} />
    case 'select': return (
      <select className="adm-field" value={value || ''} onChange={(e) => onChange(e.target.value)}>
        <option value="">Not set</option>
        {f.options().map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    )
    case 'chips': return <Chips options={f.options()} value={value || []} onChange={onChange} custom={f.custom} />
    case 'records': return <Records f={f} value={value || []} onChange={onChange} />
    case 'dict': return (
      <div className="adm-dict">
        {f.keys.map((k) => (
          <label key={k}><span className="adm-label">{k === 'x' ? 'X' : k[0].toUpperCase() + k.slice(1)}</span>
            <input className="adm-field" type="url" value={value?.[k] || ''} onChange={(e) => { const n = { ...(value || {}), [k]: e.target.value }; if (!e.target.value) delete n[k]; onChange(n) }} placeholder="https://…" /></label>
        ))}
      </div>
    )
    case 'blocks': return <Blocks value={value || []} onChange={onChange} />
    default: return <input className="adm-field" value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={ph} />
  }
}
