import { useParams, Link } from 'react-router-dom'
import { Tag, EntityCard, ArticleCard, EpisodeCard } from '../components/ui'
import { PageHead } from '../components/chrome'
import { IconArrow } from '../components/icons'
import { T, E, KIND_LABEL, clip } from '../lib/data'
import NotFound from './NotFound'

const HEADS: Record<string, string> = {
  molecule: 'Molecules & compounds', biomarker: 'What to measure',
  protocol: 'Protocols & practices', concept: 'Core concepts',
}

export default function Topic() {
  const { slug } = useParams()
  const t = slug ? T[slug] : undefined
  if (!t) return <NotFound />
  const byKind: Record<string, string[]> = {}
  for (const s of t._entities) (byKind[E[s].type] ||= []).push(s)

  return (
    <>
      <PageHead compact crumbs={[['Hub', '/'], ['Topics', '/#topics'], ['Topic', null]]}>
        <p className="eyebrow">{t.tagline}</p>
        <h1 className="display">{t.name}</h1>
        <p className="lede">{t.summary}</p>
        <div className="detail-head-counts">
          <span className="count-pill">{t._entities.length} knowledge entries</span>
          <span className="count-pill">{t._articles.length} articles</span>
          <span className="count-pill">{t._episodes.length} episodes</span>
        </div>
      </PageHead>

      <section className="section--tight" style={{ paddingTop: 48 }}><div className="wrap">
        <div className="entity-layout">
          <div className="prose">
            <div className="answer-box"><p className="eyebrow">The question people arrive with</p><p>{t.question}</p></div>
            {t.intro.map((p: string, i: number) => <p key={i}>{p}</p>)}
          </div>
          <aside className="side">
            <div className="side-block" style={{ background: 'var(--surface)', border: 0 }}>
              <h4>Start here</h4>
              <p style={{ fontSize: '.86rem', color: 'var(--muted)', margin: '0 0 6px', lineHeight: 1.55 }}>
                A five-step path through {t.name.toLowerCase()} for someone starting from zero.
              </p>
            </div>
          </aside>
        </div>
      </div></section>

      <section className="section--tight"><div className="wrap">
        <div className="section-head"><div><p className="eyebrow">Beginner path</p><h2 className="display">Where to start, in order</h2></div></div>
        {(t.beginnerPath || []).filter((s: string) => s in E).map((s: string, i: number) => (
          <Link key={s} className="erow" to={`/knowledge/${s}`}>
            <span style={{ fontWeight: 900, color: 'var(--ink)', fontSize: '1.1rem', minWidth: 26 }}>{i + 1}</span>
            <div className="erow-main"><div className="erow-name">{E[s].name}</div><div className="erow-sum">{clip(E[s].summary, 130)}</div></div>
            <Tag kind={E[s].type} />
          </Link>
        ))}
      </div></section>

      <section className="section topic-kinds"><div className="wrap">
        {['concept', 'biomarker', 'molecule', 'protocol'].filter((k) => byKind[k]).map((kind) => (
          <div key={kind} style={{ marginBottom: 48 }}>
            <div className="section-head">
              <div><p className="eyebrow">{HEADS[kind]}</p><h3 className="display">{KIND_LABEL[kind]}s</h3></div>
              <span className="count-pill" style={{ background: 'rgba(0,0,0,.05)', color: 'var(--muted)' }}>{byKind[kind].length} entries</span>
            </div>
            <div className="grid g3">{[...byKind[kind]].sort((a, b) => E[a].name.localeCompare(E[b].name)).map((s) => <EntityCard key={s} slug={s} />)}
              {Array.from({ length: Math.max(0, 3 - byKind[kind].length) }, (_, i) => (
                <div key={`ph${i}`} aria-hidden="true" className={`kind-ph${(byKind[kind].length + i) % 2 === 0 && byKind[kind].length + i >= 2 ? ' kind-ph--tab-hide' : ''}`}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8" /><path d="M1 3h22v5H1z" /><path d="M10 12h4" /></svg>
                  <span>More coming soon</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div></section>

      {(t._articles.length > 0 || t._episodes.length > 0) && (
        <section className="section topic-content"><div className="wrap">
          <div className="section-head"><div><p className="eyebrow">Articles & episodes</p><h2 className="display">{t.name} content</h2></div>
            <span className="topic-ctas"><Link className="topic-cta" to={`/blog?topic=${slug}`}>Articles<IconArrow /></Link><Link className="topic-cta" to={`/podcast?topic=${slug}`}>Episodes<IconArrow /></Link></span></div>
          <div className="grid g3">
            {t._articles.slice(0, 3).map((s: string) => <ArticleCard key={s} slug={s} author />)}
            {t._episodes.slice(0, 3).map((s: string) => <EpisodeCard key={s} slug={s} />)}
          </div>
        </div></section>
      )}
    </>
  )
}
