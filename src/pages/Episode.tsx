import { Link, useParams } from 'react-router-dom'
import { PageHead } from '../components/chrome'
import { Mention } from '../components/ui'
import { PlayButton } from '../components/Player'
import { EP, E, T, pretty } from '../lib/data'
import { episodeLabel, listenLinks } from '../lib/browsing'
import NotFound from './NotFound'
import youtubeLogo from '../assets/platforms/youtube_logo.svg.asset.json'
import appleLogo from '../assets/platforms/apple_podcasts_logo.svg.asset.json'
import spotifyLogo from '../assets/platforms/spotify_logo.svg.asset.json'

const PLATFORM_LOGO: Record<string, string> = { YouTube: youtubeLogo.url, 'Apple Podcasts': appleLogo.url, Spotify: spotifyLogo.url }

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
      <PageHead compact crumbs={crumbs} />
      <section className="section art-top ep-top"><div className="wrap">
        <div className="ep-layout">
          <div className="ep-head-id">
            <div className="detail-head-meta">
              <span className="tag tag--episode">{episodeLabel(p)}</span>
              <span>{p.guest} · {p.duration} · {pretty(p.date)}</span>
            </div>
            <h1 className="display">{p.title}</h1>
          </div>
          <aside className="ep-side"><div className="ep-side-inner">
            {p.image && <img className="ep-hero-cover" src={p.image} alt="" />}
            {track && <div className="ep-side-block ep-listen-play"><span className="ep-detail-play"><PlayButton track={track} className="play-btn" /></span><span><b>Play episode</b><i>{p.duration}</i></span></div>}
            <div className="ep-side-block">
              <span className="art-share-label">Listen on</span>
              <div className="ep-listen-links">
                {listenLinks(p.title).map(([label, href]) => <a key={label} className="btn btn--outline ep-platform" href={href} target="_blank" rel="noopener">
                  {PLATFORM_LOGO[label] && <img src={PLATFORM_LOGO[label]} alt="" width={18} height={18} />}{label}</a>)}
              </div>
            </div>
            <div className="ep-side-block ep-about">
              <span className="art-share-label">About this episode</span>
              <div className="prose"><p>{p.description}</p></div>
              {p.takeaways?.length > 0 && (<><span className="art-share-label" style={{ marginTop: 16 }}>Key takeaways</span><ul className="prof-list">{p.takeaways.map((t: string, i: number) => <li key={i}>{t}</li>)}</ul></>)}
            </div>
            {(tops.length > 0 || ents.length > 0) && <div className="ep-side-block">
              <span className="art-share-label">In this episode</span>
              <div className="ep-tags mentions">
                {tops.map((s: string) => <Link key={s} className="chip" to={`/topics/${s}`}>{T[s].name}</Link>)}
                {ents.map((s: string) => <Mention key={s} slug={s} />)}
              </div>
            </div>}
          </div></aside>
        </div>
      </div></section>
    </>
  )
}
