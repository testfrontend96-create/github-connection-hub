import { useParams, Link } from 'react-router-dom'
import { Crumbs, Tag, ArticleCard, EpisodeCard } from '../components/ui'
import { PR, E, pretty } from '../lib/data'
import NotFound from './NotFound'

export default function Problem() {
  const { slug } = useParams()
  const pr = PR[slug!]
  if (!pr) return <NotFound />
  return (
    <>
      <section className="page-head" style={{ paddingBottom: 52 }}><div className="wrap">
        <Crumbs items={[['Hub', '/'], ['Where it hurts', '/#problems'], [pr.name, null]]} />
        <p className="eyebrow">{pr.tagline}</p>
        <h1 className="display">{pr.name}</h1>
        <p className="lede">{pr.summary}</p>
      </div></section>
      <section className="section--tight" style={{ paddingTop: 48 }}><div className="wrap">
        <div className="entity-layout">
          <div className="prose">
            <div className="answer-box"><p className="eyebrow">The question people arrive with</p><p>{pr.question}</p></div>
            {pr.causes?.length > 0 && (<><h2>What's usually going on</h2>{pr.causes.map((c: any, i: number) => <div key={i}><h3>{c.h}</h3><p>{c.p}</p></div>)}</>)}
            {pr.firstStep && (<><h2>Where to start</h2><p>{pr.firstStep}</p></>)}
          </div>
          <aside className="side">
            {pr._all.length > 0 && (
              <div className="side-block"><h4>What to measure & try</h4>
                {pr._all.map((s: string) => <Link key={s} className="side-link" to={`/knowledge/${s}`}><span className="t">{E[s].name}</span><Tag kind={E[s].type} /></Link>)}
              </div>
            )}
          </aside>
        </div>
      </div></section>
      {(pr._articles.length > 0 || pr._episodes.length > 0) && (
        <section className="section dark"><div className="wrap">
          <div className="section-head"><div><p className="eyebrow">Go deeper</p><h2 className="display">Related reading & listening</h2></div></div>
          <div className="grid g3">
            {pr._articles.map((s: string) => <ArticleCard key={s} slug={s} dark />)}
            {pr._episodes.map((s: string) => <EpisodeCard key={s} slug={s} dark />)}
          </div>
        </div></section>
      )}
    </>
  )
}
