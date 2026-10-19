import { useParams, Link } from 'react-router-dom'
import { PageHead } from '../components/chrome'
import { Crumbs, Tag, ArticleCard, EpisodeCard } from '../components/ui'
import { E, T, PR, BRAND_URL, ACADEMY_URL, pretty } from '../lib/data'
import NotFound from './NotFound'

export default function Entity() {
  const { slug } = useParams()
  const e = E[slug!]
  if (!e) return <NotFound />
  const tl = (e.topics || []).filter((t: string) => t in T)
  const rel = [...e._related].sort((a: string, b: string) => E[a].name.localeCompare(E[b].name))
  const meas = [...new Set([...e._measuredBy, ...e._measures])].sort((a: any, b: any) => E[a].name.localeCompare(E[b].name)) as string[]
  const measLabel = e._measuredBy.size && e._measures.size ? 'Related tests' : e._measuredBy.size ? 'Measured by' : 'Measures'
  const topicName = tl.length ? T[tl[0]].name : 'biohacking'

  return (
    <>
      <section className="page-head">
        <div className="wrap">
          <Crumbs items={[['Hub', '/'], ['Knowledge Base', '/knowledge-base'], [e.name, null]]} />
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
            <Tag kind={e.type} />
            <span className="evidence" data-lvl={e.evidence} style={{ color: 'rgba(255,255,255,.6)' }}>{e.evidence} evidence</span>
          </div>
          <h1 className="display">{e.name}</h1>
          {e.aka?.length > 0 && <p style={{ color: 'rgba(255,255,255,.42)', fontSize: '.86rem', margin: '14px 0 0' }}>Also known as: {e.aka.join(', ')}</p>}
        </div>
      </section>

      <section className="section"><div className="wrap">
        <div className="entity-layout">
          <div>
            <div className="answer-box"><p className="eyebrow">In one paragraph</p><p>{e.summary}</p></div>
            <div className="facts">{(e.keyFacts || []).map((f: any, i: number) => <div key={i}><dt>{f.label}</dt><dd>{f.value}</dd></div>)}</div>
            <div className="prose">
              {(e.sections || []).map((s: any, i: number) => (
                <div key={i}>
                  <h2>{s.h}</h2>
                  {(s.body || []).map((p: string, j: number) => <p key={j}>{p}</p>)}
                  {s.list && <ul>{s.list.map((li: string, j: number) => <li key={j}>{li}</li>)}</ul>}
                </div>
              ))}
              {e.faq?.length > 0 && (<>
                <h2>Common questions</h2>
                {e.faq.map((f: any, i: number) => <div key={i} className="faq-item"><p className="faq-q">{f.q}</p><p className="faq-a">{f.a}</p></div>)}
              </>)}
            </div>
            <div className="disclaimer"><strong>Educational content, not medical advice.</strong> The Biohacking Hub summarises published research for general education. Talk to your doctor before changing medication, starting a supplement, or acting on any test result.</div>
          </div>
          <aside className="side">
            {tl.length > 0 && <div className="side-block"><h4>Topics</h4>{tl.map((s: string) => <Link key={s} className="side-link" to={`/topics/${s}`}><span className="t">{T[s].name}</span><span>→</span></Link>)}</div>}
            {rel.length > 0 && <div className="side-block"><h4>Connected entities</h4>{rel.map((s: string) => <Link key={s} className="side-link" to={`/knowledge/${s}`}><span className="t">{E[s].name}</span><Tag kind={E[s].type} /></Link>)}</div>}
            {meas.length > 0 && <div className="side-block"><h4>{measLabel}</h4>{meas.map((s) => <Link key={s} className="side-link" to={`/knowledge/${s}`}><span className="t">{E[s].name}</span><span>→</span></Link>)}</div>}
            {e._problems.length > 0 && <div className="side-block" style={{ background: 'var(--surface)', border: 0 }}><h4>Helps with</h4>{e._problems.map((s: string) => <Link key={s} className="side-link" to={`/problems/${s}`} style={{ borderColor: 'rgba(0,0,0,.07)' }}><span className="t">{PR[s].name}</span><span>→</span></Link>)}</div>}
            <div className="side-block"><h4>Entry details</h4>
              <a className="side-link" style={{ cursor: 'default' }}><span className="t">Type</span><Tag kind={e.type} /></a>
              <a className="side-link" style={{ cursor: 'default' }}><span className="t">Evidence</span><span className="evidence" data-lvl={e.evidence}>{e.evidence}</span></a>
              <a className="side-link" style={{ cursor: 'default' }}><span className="t">Updated</span><span>{pretty(e.updated)}</span></a>
            </div>
          </aside>
        </div>
      </div></section>

      {(e._articles.length > 0 || e._episodes.length > 0) && (
        <section className="section section--tight" style={{ background: 'var(--surface)' }}><div className="wrap">
          <div className="section-head"><div>
            <p className="eyebrow">Go deeper</p><h2 className="display">{e.name} across the Hub</h2>
            <p className="lede">Every article and episode that covers this entry, linked automatically through the knowledge graph.</p>
          </div></div>
          <div className="grid g3">
            {e._articles.slice(0, 3).map((s: string) => <ArticleCard key={s} slug={s} />)}
            {e._episodes.slice(0, 3).map((s: string) => <EpisodeCard key={s} slug={s} />)}
          </div>
        </div></section>
      )}

      <section className="section dark"><div className="wrap">
        <p className="eyebrow">Continue</p>
        <h2 className="display" style={{ marginBottom: 34 }}>Where to go next</h2>
        <div className="next-grid">
          <Link className="next-card" to={`/topics/${tl[0] || 'sleep'}`}><span className="k">Topic</span><h4>{topicName}</h4><p>See how {e.name} fits into the wider {topicName.toLowerCase()} picture — molecules, markers and protocols together.</p></Link>
          <a className="next-card" href={`${BRAND_URL}/events`}><span className="k">Conference</span><h4>Biohackers World Miami</h4><p>Two days of keynotes, expo and 1:1 access to the experts working on exactly this. January 16–17, 2027.</p></a>
          <a className="next-card" href={ACADEMY_URL}><span className="k">Academy</span><h4>Learn it properly</h4><p>Structured courses that take {e.name} and the rest of {topicName.toLowerCase()} from reference material to practice.</p></a>
        </div>
      </div></section>
    </>
  )
}
