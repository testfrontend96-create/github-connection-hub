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
        lede="Molecules, biomarkers, protocols, concepts and How To guides — connected to the topics, articles and episodes that reference them." />

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
