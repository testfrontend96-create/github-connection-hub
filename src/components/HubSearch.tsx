// Full-screen Hub search: one query, filtered by area (and Knowledge Base type), grouped live results.
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import { articles, episodes, hackers, entities, howtos, clip } from '../lib/data'
import { guideUrl } from '../lib/browsing'
import { searchRoute } from '../lib/searchRoute'
import { IconSearch, IconClose } from './icons'

type Area = 'all' | 'blog' | 'podcast' | 'biohackers' | 'knowledge'
type Hit = { area: Exclude<Area, 'all'>; kind: string; title: string; text: string; to: string; img?: string; meta?: string }

const AREAS: [Area, string][] = [['all', 'Everything'], ['blog', 'Blog posts'], ['podcast', 'Podcast'], ['biohackers', 'Top Biohackers'], ['knowledge', 'Knowledge Base']]
const KB_TYPES: [string, string][] = [['all', 'All types'], ['molecule', 'Molecules'], ['biomarker', 'Biomarkers'], ['protocol', 'Protocols'], ['concept', 'Concepts'], ['howto', 'How To']]
const SUGGEST = ['HRV', 'Magnesium', 'Sleep', 'Fasting', 'Longevity', 'Red light']
const label = (k: string) => k === 'howto' ? 'How To' : k[0].toUpperCase() + k.slice(1)

const INDEX: Hit[] = [
  ...articles.map(a => ({ area: 'blog' as const, kind: 'Article', title: a.title, text: a.excerpt || '', to: `/articles/${a.slug}`, img: a.image, meta: a.date })),
  ...episodes.map(p => ({ area: 'podcast' as const, kind: 'Episode', title: p.title, text: [p.guest, p.description].filter(Boolean).join(' — '), to: `/podcast/${p.slug}`, img: p.image, meta: p.guest })),
  ...hackers.map(h => ({ area: 'biohackers' as const, kind: 'Biohacker', title: h.name, text: [h.title, h.known, h.summary].filter(Boolean).join(' — '), to: `/biohackers/${h.slug}`, img: h.image, meta: h.title })),
  ...entities.map(e => ({ area: 'knowledge' as const, kind: e.type, title: e.name, text: [e.aka?.join?.(', '), e.summary].filter(Boolean).join(' — '), to: `/knowledge/${e.slug}` })),
  ...howtos.map(h => ({ area: 'knowledge' as const, kind: 'howto', title: h.title, text: h.excerpt || '', to: guideUrl(h.slug) })),
]

function score(h: Hit, n: string) {
  const t = h.title.toLowerCase()
  if (t === n) return 100
  if (t.startsWith(n)) return 60
  if (t.includes(n)) return 40
  return h.text.toLowerCase().includes(n) ? 10 : 0
}

export function HubSearch({ initial, onClose }: { initial: string; onClose: () => void }) {
  const [q, setQ] = useState(initial)
  const [area, setArea] = useState<Area>('all')
  const [kbType, setKbType] = useState('all')
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    inputRef.current?.focus()
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') closeRef.current() }
    document.addEventListener('keydown', key)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', key); document.body.style.overflow = prev }
  }, [])

  const n = q.trim().toLowerCase()
  const scored = useMemo(() => n.length < 2 ? [] : INDEX.map(h => ({ h, s: score(h, n) })).filter(x => x.s > 0).sort((a, b) => b.s - a.s).map(x => x.h), [n])
  const counts = Object.fromEntries(AREAS.map(([a]) => [a, a === 'all' ? scored.length : scored.filter(h => h.area === a).length]))
  const shown = scored.filter(h => (area === 'all' || h.area === area) && (area !== 'knowledge' || kbType === 'all' || h.kind === kbType))
  const groups = (area === 'all' ? AREAS.slice(1) : AREAS.filter(([a]) => a === area))
    .map(([a, name]) => ({ a, name, items: shown.filter(h => h.area === a) })).filter(g => g.items.length)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!q.trim()) return
    const enc = encodeURIComponent(q.trim())
    const to = area === 'blog' ? `/blog?q=${enc}` : area === 'podcast' ? `/podcast?q=${enc}` : area === 'biohackers' ? `/search?q=${enc}`
      : area === 'knowledge' ? `/knowledge-base?${kbType !== 'all' ? `type=${kbType}&` : ''}q=${enc}` : searchRoute(q)
    navigate(to); onClose()
  }

  return createPortal(
    <div className="hs-overlay" style={{ backdropFilter: 'blur(24px) saturate(1.5)', WebkitBackdropFilter: 'blur(24px) saturate(1.5)' }} role="dialog" aria-modal="true" aria-label="Search the Biohacking Hub" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="hs-panel" style={{ backdropFilter: 'blur(40px) saturate(1.8)', WebkitBackdropFilter: 'blur(40px) saturate(1.8)' }}>
        <form className="hs-bar" onSubmit={submit} role="search">
          <IconSearch />
          <input ref={inputRef} type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Search articles, episodes, biohackers, molecules, biomarkers…" aria-label="Search the Hub" />
          <button type="button" className="hs-close" aria-label="Close search" onClick={onClose}><IconClose /></button>
        </form>

        <div className="hs-filters chip-row" role="group" aria-label="Search in">
          {AREAS.map(([a, name]) => (
            <button key={a} type="button" className={'chip' + (area === a ? ' is-active' : '')} aria-pressed={area === a} onClick={() => { setArea(a); setKbType('all') }}>
              {name}{n.length >= 2 && <span className="hs-count">{counts[a]}</span>}
            </button>
          ))}
        </div>
        {area === 'knowledge' && <div className="hs-filters hs-filters--sub chip-row" role="group" aria-label="Knowledge Base type">
          {KB_TYPES.map(([k, name]) => (
            <button key={k} type="button" className={'chip' + (kbType === k ? ' is-active' : '')} aria-pressed={kbType === k} onClick={() => setKbType(k)}>{name}</button>
          ))}
        </div>}

        <div className="hs-results">
          {n.length < 2 && <div className="hs-empty">
            <p className="hs-hint">Try a search</p>
            <div className="hs-suggest">{SUGGEST.map(s => <button key={s} type="button" className="chip" onClick={() => setQ(s)}>{s}</button>)}</div>
          </div>}
          {n.length >= 2 && groups.length === 0 && <p className="hs-hint">Nothing matches “{q}”{area !== 'all' ? ' here — try Everything.' : '.'}</p>}
          {groups.map(g => (
            <section key={g.a} className="hs-group">
              <div className="hs-group-head">
                <h3>{g.name} <span>{g.items.length}</span></h3>
                {area === 'all' && g.items.length > 4 && <button type="button" className="hs-more" onClick={() => setArea(g.a)}>Show all</button>}
              </div>
              <div className="hs-list">
                {g.items.slice(0, area === 'all' ? 4 : 40).map(h => (
                  <Link key={h.to} to={h.to} className={`hs-item hs-item--${g.a}`} onClick={onClose}>
                    {h.img ? <img src={h.img} alt="" loading="lazy" className={g.a === 'biohackers' ? 'is-round' : 'is-thumb'} /> : <span className="hs-item-mark">{h.title[0]}</span>}
                    <span className="hs-item-body">
                      <span className="hs-item-kind">{label(h.kind)}{h.meta && g.a !== 'biohackers' && h.kind !== 'Article' ? ` · ${h.meta}` : ''}</span>
                      <b>{h.title}</b>
                      <span className="hs-item-text">{clip(h.text, 110)}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
        <p className="hs-foot">Press Enter to open the full {area === 'all' ? 'best-matching page' : AREAS.find(x => x[0] === area)![1]} results</p>
      </div>
    </div>, document.body)
}
