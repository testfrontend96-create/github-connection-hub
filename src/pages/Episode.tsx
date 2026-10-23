import { Link, useParams } from 'react-router-dom'
import { PageHead } from '../components/chrome'
import { Mention } from '../components/ui'
import { PlayButton } from '../components/Player'
import { EP, E, T, pretty } from '../lib/data'
import { episodeLabel, listenLinks } from '../lib/browsing'
import NotFound from './NotFound'

export default function Episode() {
  const { slug } = useParams()
  const p = slug ? EP[slug] : undefined
  if (!p) return <NotFound />
  const ents = (p.entities || []).filter((s: string) => s in E)
  const tops = (p.topics || []).filter((s: string) => T[s])
  const track = p.audio ? { src: p.audio, title: p.title, img: p.image, url: p.listenUrl } : undefined
  const crumbs: [string, string | null][] = [['Hub', '/'], ['Podcast', '/podcast']]
  if (p.season) crumbs.push([`Season ${p.season}`, null])
  crumbs.push([`Episode ${p.number}`, null])
  return (
    <>
      <PageHead compact crumbs={crumbs}>
        <div className="ep-head">
          {p.image && <img className="ep-head-cover" src={p.image} alt="" width={148} height={148} />}
          <div>
            <div className="detail-head-meta">
              <span className="tag tag--episode">{episodeLabel(p)}</span>
              <span>{p.guest} · {p.duration} · {pretty(p.date)}</span>
            </div>
            <h1 className="display">{p.title}</h1>
          </div>
        </div>
      </PageHead>
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
