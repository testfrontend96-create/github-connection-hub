import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { PageHead } from '../components/chrome'
import { Tag, Mention } from '../components/ui'
import { Button, SearchField } from '../components/controls'
import { entities, howtos, topics, KIND_LABEL, clip, pretty } from '../lib/data'
import { filterKnowledge } from '../lib/browsing'

const KINDS = ['molecule', 'biomarker', 'protocol', 'concept', 'howto']
const STAT_ORDER = ['biomarker', 'protocol', 'molecule', 'concept', 'howto']


export default function KnowledgeBase() {
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState(params.get('q') || '')
  useEffect(() => { const v = params.get('q'); if (v !== null) setQ(v) }, [params])
  const { hash } = useLocation()
  const kind = KINDS.includes(params.get('type') || '') ? params.get('type') || 'all' : 'all'
  const setKind = (value: string) => { const next = new URLSearchParams(params); if (value === 'all') next.delete('type'); else next.set('type', value); setParams(next, { replace: true, preventScrollReset: true }) }
  const [topic, setTopic] = useState('all')
  const [openSlug, setOpenSlug] = useState<string | null>(null)
  const statsLayout = 'rail'

  const sorted = useMemo(() => [...entities, ...howtos.map(h => ({ ...h, name: h.title, summary: h.excerpt, type: 'howto' }))].sort((a, b) => a.name.localeCompare(b.name)), [])
  const counts = Object.fromEntries(KINDS.map(k => [k, sorted.filter(e => e.type === k).length]))
  const hits = filterKnowledge(sorted, q, kind, topic)
  useEffect(() => {
    if (!hash) return
    setOpenSlug(decodeURIComponent(hash.slice(1)))
    const frame = requestAnimationFrame(() => document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView({ block: 'start' }))
    return () => cancelAnimationFrame(frame)
  }, [hash, kind])

  const statList = <div className={'kb-counts kb-counts--' + statsLayout} role="group" aria-label="Entries by type">
    {statsLayout === 'rail' && <span className="kb-counts-head">In the Knowledge Base</span>}
    <button type="button" className={'kb-count' + (kind === 'all' ? ' is-active' : '')} aria-pressed={kind === 'all'} onClick={() => setKind('all')}>
      <b>{sorted.length}</b><span>All</span>
    </button>
    {STAT_ORDER.map((k) => <button key={k} type="button" className={'kb-count' + (kind === k ? ' is-active' : '')} aria-pressed={kind === k}
      onClick={() => setKind(kind === k ? 'all' : k)}>
      <b>{counts[k]}</b><span>{k === 'howto' ? 'How To guides' : `${KIND_LABEL[k]}s`}</span>
    </button>)}
  </div>

  return (    <>
      <PageHead compact accent="#4243B0" title="Knowledge Base"
        lede="Molecules, biomarkers, protocols, concepts and How To guides — connected to the topics, articles and episodes that reference them.">
        <svg className="kb-head-icon" viewBox="0 0 824 824" fill="none" aria-hidden="true">
          <path fill="currentColor" d="M370.8 710.357C359.127 699.828 352.146 686.667 349.857 670.873H474.143C471.855 686.667 464.873 699.828 453.2 710.357C441.527 720.885 427.793 726.15 412 726.15C396.207 726.15 382.473 720.885 370.8 710.357ZM311.833 640.103V605.77H512.167V640.103H311.833Z" />
          <path fill="currentColor" d="M216.987 433.973C235.756 466.704 269.391 493.713 301.893 515H530.107V480.667H311.85C285.986 462.127 258.072 439.467 244.11 412.687C230.148 385.907 223.167 357.067 223.167 326.167C223.167 273.522 241.478 228.889 278.1 192.267C314.722 155.644 359.356 137 412 137L420 103C343.5 103 296.983 124.63 253.723 167.89C210.463 211.15 188.833 263.909 188.833 326.167C188.833 365.307 198.218 401.242 216.987 433.973Z" />
          <path d="M412 483.5V111" stroke="currentColor" strokeWidth="34" strokeLinejoin="round" />
          <path d="M529 497.8C561.5 497.8 623 497.8 584 423.962C654 423.962 648 350.962 605 324.962C661 299.5 644 230.462 584 230.462C616.5 180.5 567 137 518 156C518 87 430 79.5 397.5 127" stroke="currentColor" strokeWidth="34.3" strokeLinejoin="round" />
          <path d="M459.949 192C488.949 180 520.949 205 520.949 233" stroke="currentColor" strokeWidth="22" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M514.449 385C530.449 388.5 565.3 388.3 548.5 345.5M468 374.5C457 411.5 444 448.5 514.449 439.5M464 267C514.449 260.5 482.5 299 503 310C523.5 321 541.449 274.5 574 292" stroke="currentColor" strokeWidth="22" strokeLinecap="round" strokeLinejoin="round" />
          <path fill="currentColor" d="M311.833 547V581.333H512.167V547H311.833Z" />
        </svg>
      </PageHead>

      <section className="section--tight" style={{ paddingTop: 40 }}><div className="wrap">
        <div className={'kb-shell kb-shell--' + statsLayout}><div className="kb-shell-main">
        <div className="content-filter-bar">
          <div className="kb-search-row">
            <SearchField label="Filter the Knowledge Base" placeholder="Filter entries — try HRV, magnesium, fasting…" value={q} onChange={setQ} />
            
          </div>
          <div className="kb-filter-row">
            <div className="chip-row knowledge-topic-filters" role="group" aria-label="Entry topics">
              <Button className={'chip' + (topic === 'all' ? ' is-active' : '')} aria-pressed={topic === 'all'} onClick={() => setTopic('all')}>All topics</Button>
              {topics.map((t) => <Button key={t.slug} className={'chip' + (topic === t.slug ? ' is-active' : '')} aria-pressed={topic === t.slug} onClick={() => setTopic(t.slug)}>{t.name}</Button>)}
            </div>
          </div>
        </div>
        <p className="content-result-count" aria-live="polite">Showing {hits.length} of {sorted.length} entries</p>
        <div className="kb-results">
          {hits.map((e) => e.type === 'howto' ? (
            <article key={e.slug} id={e.slug} className={'erow erow--expand' + (openSlug === e.slug ? ' is-open' : '')}>
              <button type="button" className="erow-toggle" aria-expanded={openSlug === e.slug} aria-controls={`${e.slug}-more`}
                onClick={() => setOpenSlug(openSlug === e.slug ? null : e.slug)}>
                <div className="erow-main"><div className="erow-name">{e.name}</div><div className="erow-sum">{clip(e.summary, 150)}</div></div>
                <div className="erow-side">
                  <Tag kind="howto" />
                  <svg className="erow-caret" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
                </div>
              </button>
              {openSlug === e.slug && <div className="erow-more" id={`${e.slug}-more`}>
                <div className="knowledge-guide-meta"><span>{e.steps} steps · {e.time}</span><span>{pretty(e.date)}</span></div>
                {e.entities.length > 0 && <p className="erow-more-label">Related entries</p>}
                {e.entities.length > 0 && <div className="mentions">{e.entities.map((slug: string) => <Mention key={slug} slug={slug} />)}</div>}
              </div>}
            </article>
          ) : (
            <Link key={e.slug} className="erow" to={`/knowledge/${e.slug}`}>
              <div className="erow-main"><div className="erow-name">{e.name}</div><div className="erow-sum">{clip(e.summary, 150)}</div></div>
              <div className="erow-side">
                <span className="evidence evidence--tip" data-lvl={e.evidence} data-tip="Evidence" aria-label={`Evidence: ${e.evidence}`} style={{ color: 'var(--muted)' }}>{e.evidence}</span>
                <Tag kind={e.type} />
              </div>
            </Link>
          ))}
        </div>
        {hits.length === 0 && <p className="lede">No entries match those filters yet. Try a broader combination, or <Link to="/search">search the whole Hub</Link>.</p>}
        </div>{statsLayout === 'rail' && <aside className="kb-shell-side">{statList}</aside>}</div>
      </div></section>
    </>
  )
}
