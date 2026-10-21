import { Link, useParams } from 'react-router-dom'
import { Crumbs, Mention } from '../components/ui'
import { PlayButton } from '../components/Player'
import { EP, E, T, pretty } from '../lib/data'
import { episodeLabel, listenLinks } from '../lib/browsing'
import NotFound from './NotFound'

export default function Episode() {
  const { slug } = useParams()
  const p = EP[slug!]
  if (!p) return <NotFound />
  const ents = (p.entities || []).filter((s: string) => s in E)
  const tops = (p.topics || []).filter((s: string) => T[s])
  const track = p.audio ? { src: p.audio, title: p.title, img: p.image, url: p.listenUrl } : undefined
  const crumbs: [string, string | null][] = [['Hub', '/'], ['Podcast', '/podcast']]
  if (p.season) crumbs.push([`Season ${p.season}`, null])
  crumbs.push([`Episode ${p.number}`, null])
  return (
    <>
      <section className="page-head"><div className="wrap">
        <Crumbs items={crumbs} />
        <div className="ep-head">
          {p.image && <img className="ep-head-cover" src={p.image} alt="" width={148} height={148} />}
          <div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
              <span className="kick" data-k="episode" style={{ color: '#A9AAFF' }}>{episodeLabel(p)}</span>
              <span style={{ color: 'rgba(255,255,255,.5)', fontSize: '.84rem' }}>{p.guest} · {p.duration} · {pretty(p.date)}</span>
            </div>
            <h1 className="display ep-title">{p.title}</h1>
          </div>
        </div>
      </div></section>
      <section className="section"><div className="wrap" style={{ maxWidth: '72ch' }}>
        <div className="ep-actions">
          {track && <span className="ep-detail-play"><PlayButton track={track} className="play-btn" /></span>}
          {listenLinks(p.title).map(([label, href]) => <a key={label} className="btn btn--outline" href={href} target="_blank" rel="noopener">{label}</a>)}
        </div>
        {(tops.length > 0 || ents.length > 0) && <div className="ep-tags mentions">
          {tops.map((s: string) => <Link key={s} className="chip" to={`/topics/${s}`}>{T[s].name}</Link>)}
          {ents.map((s: string) => <Mention key={s} slug={s} />)}
        </div>}
        <div className="prose"><p>{p.description}</p></div>
        {p.takeaways?.length > 0 && (<><h2 className="prof-h" style={{ marginTop: 28 }}>Key takeaways</h2><ul className="prof-list">{p.takeaways.map((t: string, i: number) => <li key={i}>{t}</li>)}</ul></>)}
      </div></section>
    </>
  )
}
