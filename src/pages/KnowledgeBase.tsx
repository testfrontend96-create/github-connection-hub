import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHead } from '../components/chrome'
import { Tag } from '../components/ui'
import { entities, topics, KIND_LABEL, clip } from '../lib/data'

const KINDS = ['molecule', 'biomarker', 'protocol', 'concept']
const STAT_ORDER = ['biomarker', 'protocol', 'molecule', 'concept']
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

export default function KnowledgeBase() {
  const [q, setQ] = useState('')
  const [kind, setKind] = useState('all')
  const [topic, setTopic] = useState('all')

  const sorted = useMemo(() => [...entities].sort((a, b) => a.name.localeCompare(b.name)), [])
  const counts = Object.fromEntries(KINDS.map((k) => [k, entities.filter((e) => e.type === k).length]))
  const needle = norm(q.trim())
  const hits = sorted.filter((e) => {
    if (kind !== 'all' && e.type !== kind) return false
    if (topic !== 'all' && !(e.topics || []).includes(topic)) return false
    if (needle && !norm([e.name, ...(e.aka || []), e.summary].join(' ')).includes(needle)) return false
    return true
  })

  return (
    <>
      <PageHead accent="#4243B0" title="Knowledge Base"
        lede="Every molecule, biomarker, protocol and concept in the Hub — each one a page, each one connected to the topics, articles and episodes that reference it.">
        <div style={{ maxWidth: 560, marginTop: 28 }}>
          <div className="searchbox" style={{ margin: 0 }}>
            <input type="search" placeholder="Filter entries — try HRV, magnesium, fasting…" aria-label="Filter the Knowledge Base" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
      </PageHead>

      <section className="section--tight" style={{ paddingTop: 40 }}><div className="wrap">
        <div className="stats" style={{ marginBottom: 40 }}>
          {STAT_ORDER.map((k) => <div key={k} className="stat"><b>{counts[k]}</b><span>{KIND_LABEL[k]}s</span></div>)}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 14 }}>
          <div className="chip-row">
            <button className={'chip' + (kind === 'all' ? ' is-active' : '')} onClick={() => setKind('all')}>All types</button>
            {KINDS.map((k) => <button key={k} className={'chip' + (kind === k ? ' is-active' : '')} onClick={() => setKind(k)}>{KIND_LABEL[k]}s</button>)}
          </div>
          <div className="chip-row">
            <button className={'chip' + (topic === 'all' ? ' is-active' : '')} onClick={() => setTopic('all')}>All topics</button>
            {topics.map((t) => <button key={t.slug} className={'chip' + (topic === t.slug ? ' is-active' : '')} onClick={() => setTopic(t.slug)}>{t.name}</button>)}
          </div>
        </div>
        <p style={{ fontSize: '.8rem', color: 'var(--muted)', margin: '0 0 22px' }}>Showing {hits.length} of {entities.length} entries</p>
        <div>
          {hits.map((e) => (
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
