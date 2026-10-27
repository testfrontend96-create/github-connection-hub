import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { PageHead } from '../components/chrome'
import { Tag, Mention } from '../components/ui'
import { Button, SearchField } from '../components/controls'
import { entities, howtos, topics, KIND_LABEL, clip, pretty } from '../lib/data'
import { filterKnowledge } from '../lib/browsing'

const KINDS = ['molecule', 'biomarker', 'protocol', 'concept', 'howto']
const STAT_ORDER = ['biomarker', 'protocol', 'molecule', 'concept', 'howto']

const typeLabel = (k: string) => (k === 'howto' ? 'How To' : k === 'all' ? 'All types' : `${KIND_LABEL[k]}s`)

// Entry-type menu: one designed popup instead of the browser's native select list.
function TypeMenu({ value, onChange, options }: {
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string; count: number }[]
}) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(() => Math.max(0, options.findIndex(o => o.value === value)))
  const root = useRef<HTMLDivElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const items = useRef<(HTMLButtonElement | null)[]>([])
  const current = options.find(o => o.value === value) || options[0]

  useEffect(() => {
    if (!open) return
    const onDown = (event: MouseEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  useEffect(() => {
    if (open) items.current[active]?.scrollIntoView({ block: 'nearest' })
  }, [open, active])

  const pick = (option: { value: string }) => { onChange(option.value); setActive(options.findIndex(o => o.value === option.value)); setOpen(false) }
  const move = (delta: number) => setActive((active + delta + options.length) % options.length)

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (!open) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault(); setOpen(true)
      }
      return
    }
    if (event.key === 'ArrowDown') { event.preventDefault(); move(1) }
    else if (event.key === 'ArrowUp') { event.preventDefault(); move(-1) }
    else if (event.key === 'Home') { event.preventDefault(); setActive(0) }
    else if (event.key === 'End') { event.preventDefault(); setActive(options.length - 1) }
    else if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); pick(options[active]) }
    else if (event.key === 'Escape' || event.key === 'Tab') { event.preventDefault(); setOpen(false) }
  }

  return <div className={'kb-type' + (open ? ' is-open' : '')} ref={root}>
    <button type="button" className="kb-type-trigger" aria-haspopup="listbox" aria-expanded={open}
      aria-controls="kb-type-list" aria-activedescendant={open ? `kb-type-${options[active].value}` : undefined}
      aria-label="Filter by entry type" onClick={() => setOpen(!open)} onKeyDown={onKeyDown}>
      <span>{current.label}</span>
      <svg className="kb-type-caret" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
    </button>
    {open && <div className="kb-type-panel" id="kb-type-list" role="listbox" aria-label="Entry type" ref={panel}>
      <span className="kb-type-panel-head">Entry type</span>
      {options.map((option, index) => <button key={option.value} type="button" role="option" id={`kb-type-${option.value}`}
        aria-selected={option.value === value}
        className={'kb-type-option' + (index === active ? ' is-active' : '')}
        ref={(el) => { items.current[index] = el }}
        onMouseEnter={() => setActive(index)} onClick={() => pick(option)}>
        <span className="kb-type-option-mark" aria-hidden="true">{option.value === value && <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>}</span>
        <span>{option.label}</span>
        <span className="kb-type-option-count">{option.count}</span>
      </button>)}
    </div>}
  </div>
}

export default function KnowledgeBase() {
  const [q, setQ] = useState('')
  const [params, setParams] = useSearchParams()
  const { hash } = useLocation()
  const kind = KINDS.includes(params.get('type') || '') ? params.get('type') || 'all' : 'all'
  const setKind = (value: string) => { const next = new URLSearchParams(params); if (value === 'all') next.delete('type'); else next.set('type', value); setParams(next, { replace: true, preventScrollReset: true }) }
  const [topic, setTopic] = useState('all')

  const sorted = useMemo(() => [...entities, ...howtos.map(h => ({ ...h, name: h.title, summary: h.excerpt, type: 'howto' }))].sort((a, b) => a.name.localeCompare(b.name)), [])
  const counts = Object.fromEntries(KINDS.map(k => [k, sorted.filter(e => e.type === k).length]))
  const typeOptions = useMemo(() => [{ value: 'all', label: 'All types', count: sorted.length }, ...KINDS.map(k => ({ value: k, label: typeLabel(k), count: counts[k] }))], [sorted.length, counts])
  const hits = filterKnowledge(sorted, q, kind, topic)
  useEffect(() => {
    if (!hash) return
    const frame = requestAnimationFrame(() => document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView({ block: 'start' }))
    return () => cancelAnimationFrame(frame)
  }, [hash, kind])

  return (
    <>
      <PageHead compact accent="#4243B0" title="Knowledge Base"
        lede="Molecules, biomarkers, protocols, concepts and How To guides — connected to the topics, articles and episodes that reference them." />

      <section className="section--tight" style={{ paddingTop: 40 }}><div className="wrap">
        <div className="stats knowledge-stats" style={{ marginBottom: 40 }}>
          {STAT_ORDER.map((k) => {
            const label = k === 'howto' ? 'How To guides' : `${KIND_LABEL[k]}s`
            return <div key={k} className="stat">
              <span>{label}</span>
              <b>{counts[k]}</b>
              <Button className="knowledge-stat-action" aria-label={`Show ${label}`} title={`Show ${label}`} onClick={() => setKind(k)}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
              </Button>
            </div>
          })}
        </div>
        <div className="content-filter-bar">
          <SearchField label="Filter the Knowledge Base" placeholder="Filter entries — try HRV, magnesium, fasting…" value={q} onChange={setQ} />
          <div className="kb-filter-row">
            <TypeMenu value={kind} onChange={setKind} options={typeOptions} />
            <div className="chip-row knowledge-topic-filters" role="group" aria-label="Entry topics">
              <Button className={'chip' + (topic === 'all' ? ' is-active' : '')} aria-pressed={topic === 'all'} onClick={() => setTopic('all')}>All topics</Button>
              {topics.map((t) => <Button key={t.slug} className={'chip' + (topic === t.slug ? ' is-active' : '')} aria-pressed={topic === t.slug} onClick={() => setTopic(t.slug)}>{t.name}</Button>)}
            </div>
          </div>
        </div>
        <p className="content-result-count" aria-live="polite">Showing {hits.length} of {sorted.length} entries</p>
        <div>
          {hits.map((e) => e.type === 'howto' ? (
            <article key={e.slug} id={e.slug} className="knowledge-guide">
              <div className="knowledge-guide-meta"><Tag kind="howto" /><span>{e.steps} steps · {e.time}</span><span>{pretty(e.date)}</span></div>
              <h3>{e.name}</h3><p>{e.summary}</p>
              <div className="mentions">{e.entities.map((slug: string) => <Mention key={slug} slug={slug} />)}</div>
            </article>
          ) : (
            <Link key={e.slug} className="erow" to={`/knowledge/${e.slug}`}>
              <div className="erow-main"><div className="erow-name">{e.name}</div><div className="erow-sum">{clip(e.summary, 150)}</div></div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                <span className="evidence" data-lvl={e.evidence} style={{ color: 'var(--muted)' }}>{e.evidence}</span>
                <Tag kind={e.type} />
              </div>
            </Link>
          ))}
        </div>
        {hits.length === 0 && <p className="lede">No entries match those filters yet. Try a broader combination, or <Link to="/search">search the whole Hub</Link>.</p>}
      </div></section>
    </>
  )
}
