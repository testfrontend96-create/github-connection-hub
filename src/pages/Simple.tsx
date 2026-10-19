import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHead } from '../components/chrome'
import { Mention, ArticleCard, EpisodeCard, EntityCard } from '../components/ui'
import { reports, howtos, entities, articles, episodes, pretty, clip } from '../lib/data'
import { IconSearch } from '../components/icons'

export default function Simple({ which }: { which: 'reports' | 'howto' | 'about' | 'search' }) {
  if (which === 'reports') {
    return (
      <>
        <PageHead crumbs={[['Hub', '/'], ['Reports', null]]} title="Reports" lede="Industry statistics, original surveys and conference reports." />
        <section className="section"><div className="wrap">
          {reports.map((r) => (
            <article key={r.slug} id={r.slug} className="story--row" style={{ padding: '28px 0', borderTop: '1px solid var(--line)' }}>
              <span className="kick" data-k="report">{r.kind}</span>
              <h2 style={{ fontSize: '1.5rem', letterSpacing: '-.03em', margin: '8px 0 10px', color: 'var(--ink)' }}>{r.title}</h2>
              <p style={{ color: '#3A3A42', maxWidth: '70ch' }}>{r.excerpt}</p>
              <div className="stats stats--3" style={{ margin: '18px 0', maxWidth: 640 }}>
                {r.stats.map((s: any, i: number) => <div key={i} className="stat"><b>{s.v}</b><span>{s.l}</span></div>)}
              </div>
              <div className="mentions">{r.entities.map((s: string) => <Mention key={s} slug={s} />)}</div>
            </article>
          ))}
        </div></section>
      </>
    )
  }
  if (which === 'howto') {
    return (
      <>
        <PageHead crumbs={[['Hub', '/'], ['How-To', null]]} title="How-To" lede="Step-by-step guides you can run this week." />
        <section className="section"><div className="wrap"><div className="grid g2">
          {howtos.map((h) => (
            <article key={h.slug} id={h.slug} className="card" style={{ display: 'block' }}>
              <span className="tag">{h.steps} steps · {h.time}</span>
              <h3>{h.title}</h3><p>{h.excerpt}</p>
              <div className="card-meta"><span>{pretty(h.date)}</span></div>
              <div className="mentions" style={{ marginTop: 10 }}>{h.entities.map((s: string) => <Mention key={s} slug={s} />)}</div>
            </article>
          ))}
        </div></div></section>
      </>
    )
  }
  if (which === 'about') {
    return (
      <>
        <PageHead crumbs={[['Hub', '/'], ['How the Hub works', null]]} title="How the Hub works" lede="Organised around what you're trying to fix — not around our content formats." />
        <section className="section"><div className="wrap" style={{ maxWidth: '72ch' }}>
          <div className="prose">
            <p>Most health sites file everything by format — a blog here, a podcast there, a glossary somewhere else. The Biohacking Hub is built on three levels instead:</p>
            <ul>
              <li><strong>Level 1 — Problems and goals.</strong> Poor sleep, brain fog, chronic stress, low energy, slow recovery, metabolic drift. Where most people actually start.</li>
              <li><strong>Level 2 — Topics.</strong> Sleep, longevity, cognition, metabolic health, skincare, nutrition. The subject areas that hold related knowledge together.</li>
              <li><strong>Level 3 — Knowledge entities.</strong> Individual molecules, biomarkers, protocols and concepts. Each is a page; each page is a node with edges to everything related.</li>
            </ul>
          </div>
        </div></section>
      </>
    )
  }
  // search
  const [q, setQ] = useState('')
  const needle = q.trim().toLowerCase()
  const hits = needle.length < 2 ? [] : [
    ...entities.filter((e) => (e.name + ' ' + e.summary).toLowerCase().includes(needle)).map((e) => ({ t: e.name, d: clip(e.summary, 120), u: `/knowledge/${e.slug}`, kind: 'entity' })),
    ...articles.filter((a) => a.title.toLowerCase().includes(needle)).map((a) => ({ t: a.title, d: clip(a.excerpt, 120), u: `/articles/${a.slug}`, kind: 'article' })),
    ...episodes.filter((p) => p.title.toLowerCase().includes(needle)).map((p) => ({ t: p.title, d: clip(p.description, 120), u: `/podcast/${p.slug}`, kind: 'episode' })),
  ].slice(0, 40)
  return (
    <>
      <PageHead crumbs={[['Hub', '/'], ['Search', null]]} title="Search" lede="Search across molecules, biomarkers, protocols, articles and episodes." />
      <section className="section"><div className="wrap">
        <label className="dir-search" style={{ maxWidth: 560 }}>
          <IconSearch />
          <input type="search" placeholder="Try HRV, magnesium, fasting…" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
        </label>
        <div className="grid g3" style={{ marginTop: 28 }}>
          {hits.map((h, i) => (
            <Link key={i} className="card" to={h.u}><span className={`tag tag--${h.kind}`}>{h.kind}</span><h3>{h.t}</h3><p>{h.d}</p></Link>
          ))}
        </div>
        {needle.length >= 2 && hits.length === 0 && <p style={{ color: 'var(--muted)', marginTop: 20 }}>Nothing matches “{q}”.</p>}
      </div></section>
    </>
  )
}
