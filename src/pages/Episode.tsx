import { useLayoutEffect, useRef } from 'react'
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
  const colRef = useRef<HTMLDivElement>(null)
  const listenRef = useRef<HTMLDivElement>(null)
  // Line "About this episode" up with "Listen on" on desktop, keeping at least 56px under the title.
  useLayoutEffect(() => {
    const col = colRef.current, listen = listenRef.current
    if (!col || !listen) return
    const head = col.querySelector('.ep-head-id') as HTMLElement | null
    const about = col.querySelector('.ep-about') as HTMLElement | null
    if (!head || !about) return
    const fit = () => {
      if (window.innerWidth <= 980) { about.style.marginTop = ''; return }
      const target = listen.getBoundingClientRect().top - col.getBoundingClientRect().top
      about.style.marginTop = Math.max(56, target - head.offsetHeight) + 'px'
    }
    fit()
    const ro = new ResizeObserver(fit); ro.observe(col); ro.observe(listen.parentElement!)
    window.addEventListener('resize', fit)
    return () => { ro.disconnect(); window.removeEventListener('resize', fit) }
  }, [slug])
  if (!p) return <NotFound />
  const ents = (p.entities || []).filter((s: string) => s in E)
  const tops = (p.topics || []).filter((s: string) => T[s])
  const track = p.audio ? { src: p.audio, title: p.title, img: p.image, url: p.listenUrl } : undefined
  // Episode credits list the guest first and the host second.
  const [guest, host] = String(p.guest || '').split(/,\s*/)
  const crumbs: [string, string | null][] = [['Hub', '/'], ['Podcast', '/podcast']]
  if (p.season) crumbs.push([`Season ${p.season}`, null])
  crumbs.push([`Episode ${p.number}`, null])
  return (
    <>
      <PageHead compact crumbs={crumbs} />
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
            {track && <div className="ep-side-block ep-listen-play"><span className="ep-detail-play"><PlayButton track={track} className="play-btn" /></span><span><b>Play episode</b><i>{p.duration}</i></span></div>}
            <div className="ep-side-block" ref={listenRef}>
              <span className="art-share-label">Listen on</span>
              <div className="ep-listen-links">
                {listenLinks(p.title).map(([label, href]) => <a key={label} className="btn btn--outline ep-platform" href={href} target="_blank" rel="noopener">
                  {PLATFORM_LOGO[label] && <img src={PLATFORM_LOGO[label]} alt="" width={18} height={18} />}{label}</a>)}
              </div>
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
