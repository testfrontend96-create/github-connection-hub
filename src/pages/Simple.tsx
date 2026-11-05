import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { PageHead } from '../components/chrome'
import { Mention, ArticleCard, EpisodeCard, EntityCard } from '../components/ui'
import { reports, howtos, entities, articles, episodes, pretty, clip } from '../lib/data'
import { SearchField } from '../components/controls'
import { guideUrl } from '../lib/browsing'

export default function Simple({ which }: { which: 'reports' | 'about' | 'search' }) {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') || ''
  const setQ = (value: string) => setParams(value ? { q: value } : {}, { replace: true, preventScrollReset: true })
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
  const needle = q.trim().toLowerCase()
  const TYPE_WORDS: Record<string, string> = { molecule: 'molecule', molecules: 'molecule', biomarker: 'biomarker', biomarkers: 'biomarker', protocol: 'protocol', protocols: 'protocol', concept: 'concept', concepts: 'concept', entity: '*', entities: '*' }
  const typeHit = TYPE_WORDS[needle]
  const has = (...parts: any[]) => parts.flat().filter(Boolean).join(' ').toLowerCase().includes(needle)
  const hits = needle.length < 2 ? [] : [
    ...entities.filter((e) => typeHit ? (typeHit === '*' || e.type === typeHit) : has(e.name, e.aka, e.type, e.summary, e.keyFacts?.map?.((f: any) => typeof f === 'string' ? f : JSON.stringify(f)))).map((e) => ({ t: e.name, d: clip(e.summary, 120), u: `/knowledge/${e.slug}`, kind: e.type })),
    ...howtos.filter(h => typeHit ? false : has(h.title, h.excerpt)).map(h => ({ t: h.title, d: clip(h.excerpt, 120), u: guideUrl(h.slug), kind: 'howto' })),
    ...articles.filter((a) => !typeHit && has(a.title, a.excerpt)).map((a) => ({ t: a.title, d: clip(a.excerpt, 120), u: `/articles/${a.slug}`, kind: 'article' })),
    ...episodes.filter((p) => !typeHit && has(p.title, p.guest)).map((p) => ({ t: p.title, d: clip(p.description, 120), u: `/podcast/${p.slug}`, kind: 'episode' })),
  ].slice(0, 60)
  return (
    <>
      <PageHead compact title="Search" lede="Search across molecules, biomarkers, protocols, articles, episodes and How To guides." />
      <section className="section blog-listing search-page"><div className="wrap">
        <SearchField label="Search the Hub" placeholder="Try HRV, magnesium, fasting…" value={q} onChange={setQ} />
        <div className="grid g3" style={{ marginTop: 28 }}>
          {hits.map((h, i) => (
            <Link key={i} className="card" to={h.u}><span className={`tag tag--${h.kind}`}>{h.kind === 'howto' ? 'How To' : h.kind[0].toUpperCase() + h.kind.slice(1)}</span><h3>{h.t}</h3><p>{h.d}</p></Link>
          ))}
        </div>
        {needle.length >= 2 && hits.length === 0 && <p style={{ color: 'var(--muted)', marginTop: 20 }}>Nothing matches “{q}”.</p>}
      </div></section>
    </>
  )
}
