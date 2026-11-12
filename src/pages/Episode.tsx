import { useEffect, useRef } from 'react'
import { trackView } from '../lib/remote'
import podLogoB from '../assets/biohack-your-world-logo-black.png.asset.json'
import { Link, useParams } from 'react-router-dom'
import { PageHead } from '../components/chrome'
import { Mention } from '../components/ui'
import { PlayButton } from '../components/Player'
import { EP, E, T, pretty } from '../lib/data'
import { episodeLabel, listenLinks } from '../lib/browsing'
import NotFound from './NotFound'
import ExampleHighlight from '../components/ExampleHighlight'
import appleLogo from '../assets/platforms/apple_podcasts_logo.svg.asset.json'
import spotifyLogo from '../assets/platforms/spotify_logo.svg.asset.json'

// YouTube mark is inline so it follows the button's text colour on hover.
const YouTubeMark = () => <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="currentColor" fillRule="evenodd" d="M24.0479 7.09082C24.1175 7.09083 39.0568 7.09287 42.8008 8.09961C43.82 8.37754 44.7485 8.91855 45.4932 9.66797C46.2379 10.4175 46.7726 11.3499 47.0439 12.3711C48.0473 16.1392 48.0479 23.9955 48.0479 24C48.0479 24 48.0475 31.8598 47.0439 35.6289C46.7726 36.6501 46.2379 37.5825 45.4932 38.332C44.7485 39.0814 43.82 39.6225 42.8008 39.9004C39.0568 40.9071 24.1175 40.9092 24.0479 40.9092C24.0479 40.9092 9.04788 40.9094 5.29492 39.9004C4.27565 39.6225 3.34723 39.0814 2.60254 38.332C1.8578 37.5825 1.32216 36.6501 1.05078 35.6289C0.0472215 31.8597 0.0478516 24 0.0478516 24C0.0478516 23.9955 0.0475066 16.1392 1.05078 12.3711C1.32216 11.3499 1.8578 10.4175 2.60254 9.66797C3.34723 8.9186 4.27565 8.37748 5.29492 8.09961C9.04788 7.09056 24.0479 7.09082 24.0479 7.09082ZM19.1387 31.1377L31.6836 24L19.1387 16.8633V31.1377Z"/></svg>

const PLATFORM_LOGO: Record<string, string> = { 'Apple Podcasts': appleLogo.url, Spotify: spotifyLogo.url }

export default function Episode() {
  const { slug } = useParams()
  const p = slug ? EP[slug] : undefined
  const colRef = useRef<HTMLDivElement>(null)
  const listenRef = useRef<HTMLDivElement>(null)
  useEffect(() => { if (slug && EP[slug]) trackView('episode', slug) }, [slug])
  if (!p) return <NotFound />
  const ents = (p.entities || []).filter((s: string) => s in E)
  const tops = (p.topics || []).filter((s: string) => T[s])
  const track = p.audio ? { src: p.audio, title: p.title, img: p.image, url: p.listenUrl } : undefined
  // Episode credits list the guest first and the host second.
  const [guest, host] = String(p.guest || '').split(/,\s*/)
  const crumbs: [string, string | null][] = [['Hub', '/'], ['Podcast', '/podcast']]
  crumbs.push(['Episode', null])
  return (
    <>
      <PageHead compact crumbs={crumbs}>
      </PageHead>
      <section className="section art-top ep-top"><div className="wrap">
        <div className="ep-layout ep-layout--v3">
          <div className="ep-col" ref={colRef}>
            <div className="ep-head-id">
              <span className="tag tag--episode">{episodeLabel(p)}</span>
              <h1 className="display">{p.title}</h1>
              <div className="ep-facts">
                {guest && <div><b>{guest}</b><span>Guest</span></div>}
                {host && <div><b>{host}</b><span>Host</span></div>}
                <div><b>{pretty(p.date)}</b><span>Published</span></div>
                <div><b>{p.duration}</b><span>Length</span></div>
              </div>
            </div>
            <div className="ep-about">
              <h2 className="prof-h">About this episode</h2>
              <div className="prose">{p.description.split('\n\n').map((para: string, i: number) => <p key={i}>{para}</p>)}</div>
              {p.takeaways?.length > 0 && (<div className="answer-box art-highlights"><p className="eyebrow">Key takeaways</p><ul>{p.takeaways.map((t: string, i: number) => <li key={i}>{t}</li>)}</ul></div>)}
            </div>
          </div>
          <aside className="ep-rail"><div className="ep-rail-inner">
            {p.image && <img className="ep-hero-cover" src={p.image} alt="" />}
            {track && <div className="ep-side-block ep-listen-play"><span className="ep-detail-play"><PlayButton track={track} className="play-btn" /></span><span><b>Play episode</b><i>{p.duration}</i></span><Link to="/podcast" className="ep-play-logo" aria-label="Biohack Your World podcast"><img src={podLogoB.url} alt="" /></Link></div>}
            <div className="ep-side-block" ref={listenRef}>
              <span className="art-share-label">Listen on</span>
              <div className="ep-listen-links">
                {listenLinks(p.title).map(([label, search]) => [label, ({ YouTube: p.youtubeUrl, 'Apple Podcasts': p.appleUrl, Spotify: p.spotifyUrl } as Record<string, string>)[label] || search]).map(([label, href]) => <a key={label} className="btn btn--outline ep-platform" href={href} target="_blank" rel="noopener">
                  {label === 'YouTube' && <YouTubeMark />}{PLATFORM_LOGO[label] && <img src={PLATFORM_LOGO[label]} alt="" width={18} height={18} />}{label}</a>)}
              </div>
            </div>
            {(tops.length > 0 || ents.length > 0) && <div className="ep-side-block ep-in">
              <span className="art-share-label">In this episode</span>
              {tops.length > 0 && <div className="prof-box ep-chip-box"><h3>Topics</h3><div className="mentions">
                {tops.map((s: string) => <Link key={s} className="mention mention--topic" to={`/topics/${s}`}>{T[s].name}</Link>)}
              </div></div>}
              {ents.length > 0 && <div className="prof-box ep-chip-box"><h3>Knowledge base</h3><div className="mentions">
                {ents.map((s: string) => <Mention key={s} slug={s} />)}
              </div></div>}
            </div>}
          </div></aside>
        </div>
      </div></section>
      <ExampleHighlight example={new URLSearchParams(window.location.search).get('example')} />
    </>
  )
}
