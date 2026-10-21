import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { PageHead } from '../components/chrome'
import { Tag, Mention } from '../components/ui'
import { Button } from '../components/controls'
import { entities, howtos, topics, KIND_LABEL, clip, pretty } from '../lib/data'
import { filterKnowledge } from '../lib/browsing'

const KINDS = ['molecule', 'biomarker', 'protocol', 'concept', 'howto']
const STAT_ORDER = ['biomarker', 'protocol', 'molecule', 'concept', 'howto']

export default function KnowledgeBase() {
  const [q, setQ] = useState('')
  const [params, setParams] = useSearchParams()
  const { hash } = useLocation()
  const kind = KINDS.includes(params.get('type') || '') ? params.get('type') || 'all' : 'all'
  const setKind = (value: string) => { const next = new URLSearchParams(params); if (value === 'all') next.delete('type'); else next.set('type', value); setParams(next, { replace: true, preventScrollReset: true }) }
  const [topic, setTopic] = useState('all')

  const sorted = useMemo(() => [...entities, ...howtos.map(h => ({ ...h, name: h.title, summary: h.excerpt, type: 'howto' }))].sort((a, b) => a.name.localeCompare(b.name)), [])
  const counts = Object.fromEntries(KINDS.map(k => [k, sorted.filter(e => e.type === k).length]))
  const hits = filterKnowledge(sorted, q, kind, topic)
  useEffect(() => {
    if (!hash) return
    const frame = requestAnimationFrame(() => document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView({ block: 'start' }))
    return () => cancelAnimationFrame(frame)
  }, [hash, kind])

  return (
    <>
      <PageHead accent="#4243B0" title="Knowledge Base"
        lede="Molecules, biomarkers, protocols, concepts and How To guides — connected to the topics, articles and episodes that reference them.">
        <div style={{ maxWidth: 560, marginTop: 28 }}>
          <div className="searchbox" style={{ margin: 0 }}>
            <input type="search" placeholder="Filter entries — try HRV, magnesium, fasting…" aria-label="Filter the Knowledge Base" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
      </PageHead>

      <section className="section--tight" style={{ paddingTop: 40 }}><div className="wrap">
        <div className="stats" style={{ marginBottom: 40 }}>
          {STAT_ORDER.map((k) => <div key={k} className="stat"><b>{counts[k]}</b><span>{k === 'howto' ? 'How To guides' : `${KIND_LABEL[k]}s`}</span></div>)}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 14 }}>
          <div className="chip-row">
            <Button className={'chip' + (kind === 'all' ? ' is-active' : '')} aria-pressed={kind === 'all'} onClick={() => setKind('all')}>All types</Button>
            {KINDS.map((k) => <Button key={k} className={'chip' + (kind === k ? ' is-active' : '')} aria-pressed={kind === k} onClick={() => setKind(k)}>{k === 'howto' ? 'How To' : `${KIND_LABEL[k]}s`}</Button>)}
          </div>
          <div className="chip-row">
            <Button className={'chip' + (topic === 'all' ? ' is-active' : '')} aria-pressed={topic === 'all'} onClick={() => setTopic('all')}>All topics</Button>
            {topics.map((t) => <Button key={t.slug} className={'chip' + (topic === t.slug ? ' is-active' : '')} aria-pressed={topic === t.slug} onClick={() => setTopic(t.slug)}>{t.name}</Button>)}
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
