import { useParams, Link } from 'react-router-dom'
import { Tag, EntityCard, ArticleCard, EpisodeCard } from '../components/ui'
import { PageHead } from '../components/chrome'
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
      <PageHead compact crumbs={[['Hub', '/'], ['Topics', '/#topics'], [t.name, null]]}>
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
            <span style={{ fontWeight: 900, color: 'var(--green)', fontSize: '1.1rem', minWidth: 26 }}>{i + 1}</span>
            <div className="erow-main"><div className="erow-name">{E[s].name}</div><div className="erow-sum">{clip(E[s].summary, 130)}</div></div>
            <Tag kind={E[s].type} />
          </Link>
        ))}
      </div></section>

      <section className="section"><div className="wrap">
        {['concept', 'biomarker', 'molecule', 'protocol'].filter((k) => byKind[k]).map((kind) => (
          <div key={kind} style={{ marginBottom: 48 }}>
            <div className="section-head">
              <div><p className="eyebrow">{HEADS[kind]}</p><h3 className="display">{KIND_LABEL[kind]}s</h3></div>
              <span className="count-pill" style={{ background: 'rgba(0,0,0,.05)', color: 'var(--muted)' }}>{byKind[kind].length} entries</span>
            </div>
            <div className="grid g3">{[...byKind[kind]].sort((a, b) => E[a].name.localeCompare(E[b].name)).map((s) => <EntityCard key={s} slug={s} />)}</div>
          </div>
        ))}
      </div></section>

      {(t._articles.length > 0 || t._episodes.length > 0) && (
        <section className="section dark"><div className="wrap">
          <div className="section-head"><div><p className="eyebrow">Articles & episodes</p><h2 className="display">{t.name} content</h2></div>
            <Link className="link-more" to="/blog">All articles →</Link></div>
          <div className="grid g3">
            {t._articles.slice(0, 3).map((s: string) => <ArticleCard key={s} slug={s} dark />)}
            {t._episodes.slice(0, 3).map((s: string) => <EpisodeCard key={s} slug={s} dark />)}
          </div>
        </div></section>
      )}
    </>
  )
}
