import { useParams } from 'react-router-dom'
import { Crumbs, Mention } from '../components/ui'
import { PlayButton } from '../components/Player'
import { EP, E, pretty } from '../lib/data'
import NotFound from './NotFound'

export default function Episode() {
  const { slug } = useParams()
  const p = EP[slug!]
  if (!p) return <NotFound />
  const ents = (p.entities || []).filter((s: string) => s in E)
  const track = p.audio ? { src: p.audio, title: p.title, img: p.image, url: p.listenUrl } : undefined
  return (
    <>
      <section className="page-head"><div className="wrap">
        <Crumbs items={[['Hub', '/'], ['Podcast', '/podcast'], [`Episode ${p.number}`, null]]} />
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
          <span className="kick" data-k="episode" style={{ color: '#A9AAFF' }}>Podcast · Ep. {p.number}</span>
          <span style={{ color: 'rgba(255,255,255,.5)', fontSize: '.84rem' }}>{p.guest} · {p.duration} · {pretty(p.date)}</span>
        </div>
        <h1 className="display">{p.title}</h1>
      </div></section>
      <section className="section"><div className="wrap" style={{ maxWidth: '72ch' }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 24 }}>
          {p.image && <img src={p.image} alt="" width={120} height={120} style={{ borderRadius: 16 }} />}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {track && <span className="ep-detail-play"><PlayButton track={track} className="play-btn" /></span>}
            {p.listenUrl && <a className="btn btn--outline" href={p.listenUrl} target="_blank" rel="noopener">Open on Simplecast</a>}
          </div>
        </div>
        <div className="prose"><p>{p.description}</p></div>
        {p.takeaways?.length > 0 && (<><h2 className="prof-h" style={{ marginTop: 28 }}>Key takeaways</h2><ul className="prof-list">{p.takeaways.map((t: string, i: number) => <li key={i}>{t}</li>)}</ul></>)}
        {ents.length > 0 && <div className="mentions" style={{ marginTop: 28 }}>{ents.map((s: string) => <Mention key={s} slug={s} />)}</div>}
      </div></section>
    </>
  )
}
