// Shared presentational primitives, ported from build.py render helpers so the
// existing hub.css classes style them unchanged.
import { Link } from 'react-router-dom'
import { Any, E, T, A, EP, KIND_LABEL, clip, pretty } from '../lib/data'
import { PlayButton } from './Player'
import { articleTopic } from '../lib/browsing'

export const initials = (name: string) =>
  name.replace(/,/g, '').split(/\s+/).slice(0, 2).map((w) => w[0]).join('')

export const Tag = ({ kind }: { kind: string }) => (
  <span className={`tag tag--${kind}`}>{KIND_LABEL[kind] || kind[0].toUpperCase() + kind.slice(1)}</span>
)

export const EvMeter = ({ level }: { level: string }) => (
  <span className="ev" data-lvl={level} title={`${level} evidence`}><i /><i /><i /></span>
)

export const Mention = ({ slug }: { slug: string }) => {
  const e = E[slug]
  if (!e) return null
  return <Link className="mention" data-t={e.type} to={`/knowledge/${slug}`}><i />{e.name}</Link>
}

export const CardThumb = ({ img, k = 'entity', track }: { img?: string; k?: string; track?: any }) =>
  img ? (
    <span className="card-thumb" data-k={k}>
      <img src={img} alt="" loading="lazy" decoding="async" />
      {track && <PlayButton track={track} />}
    </span>
  ) : null

const MOTIF: Record<string, number[]> = {
  report: [30, 45, 40, 62, 58, 80, 74, 100],
  wave: [40, 70, 30, 85, 55, 95, 45, 60, 80, 35, 70, 50, 90, 40, 65, 75, 30, 88, 52, 68, 44, 92],
  steps: [14, 28, 42, 56, 70, 84, 98],
}
export const Motif = ({ kind }: { kind: string }) => {
  if (kind === 'episode') return <div className="motif wave">{MOTIF.wave.map((h, i) => <i key={i} style={{ height: `${h}%` }} />)}</div>
  if (kind === 'report') return <div className="motif bars">{MOTIF.report.map((h, i) => <i key={i} style={{ height: `${h}%` }} />)}</div>
  if (kind === 'howto') return <div className="motif steps">{MOTIF.steps.map((h, i) => <i key={i} style={{ height: `${h}%` }} />)}</div>
  return <div className="motif dots">{Array.from({ length: 32 }).map((_, i) => <i key={i} />)}</div>
}

export const Art = ({ item, extra = '' }: { item: Any; extra?: string }) => {
  const tc = item.topics?.[0] && T[item.topics[0]] ? T[item.topics[0]].color : '#21C781'
  return (
    <div className={`art ${extra}${item.img ? ' art--photo' : ''}`} data-k={item.k} data-mark={item.mark} style={{ ['--art-a' as any]: tc }}>
      {item.img && <img src={item.img} alt="" loading="lazy" decoding="async" />}
      {item.audio && <PlayButton track={{ src: item.audio, title: item.t, img: item.img, url: item.listen }} />}
    </div>
  )
}

export function Story({ item, size = 'sm', withArt = true, dek = true }: { item: Any; size?: string; withArt?: boolean; dek?: boolean }) {
  const H = size === 'lead' ? 'h2' : 'h3'
  const art = withArt ? <Art item={item} extra={size === 'lead' ? 'art--wide' : ''} /> : null
  const body = (
    <>
      <span className="kick" data-k={item.k}>{item.kick}</span>
      <H>{item.t}</H>
      {dek && <p>{clip(item.d, size === 'lead' ? 200 : 110)}</p>}
      <div className="meta"><b>{item.meta}</b><span>{pretty(item.date)}</span></div>
    </>
  )
  if (size === 'sm' && withArt)
    return <Link className="story story--sm" to={item.u}><div>{body}</div>{art}</Link>
  return <Link className={`story story--${size}`} to={item.u}>{art}{body}</Link>
}

export function ArticleCard({ slug, dark = false }: { slug: string; dark?: boolean }) {
  const a = A[slug]
  return (
    <Link className={dark ? 'card card--dark' : 'card'} to={`/articles/${slug}`}>
      <CardThumb img={a.image} k="article" />
      <span className="tag tag--article">{articleTopic(a, T)}</span>
      <h3>{a.title}</h3><p>{clip(a.excerpt, 118)}</p>
      <div className="card-meta"><span>{pretty(a.date)}</span><span>{a.readTime} min read</span></div>
    </Link>
  )
}

export function EpisodeCard({ slug, dark = false }: { slug: string; dark?: boolean }) {
  const p = EP[slug]
  const track = p.audio ? { src: p.audio, title: p.title, img: p.image, url: p.listenUrl } : undefined
  return (
    <div className="card-wrap">
      <Link className={dark ? 'card card--dark' : 'card'} to={`/podcast/${slug}`}>
        <CardThumb img={p.image} k="episode" track={track} />
        <span className="tag tag--episode">{p.number ? `Episode ${p.number}` : 'Podcast'}</span>
        <h3>{p.title}</h3><p>{clip(p.description, 110)}</p>
        <div className="card-meta"><span>{p.guest}</span><span>{p.duration}</span></div>
      </Link>
    </div>
  )
}

export function EntityCard({ slug, dark = false }: { slug: string; dark?: boolean }) {
  const e = E[slug]
  return (
    <Link className={dark ? 'card card--dark' : 'card'} to={`/knowledge/${slug}`}>
      <Tag kind={e.type} /><h3>{e.name}</h3><p>{clip(e.summary, 120)}</p>
    </Link>
  )
}

export function PersonPhoto({ b, cls, eager = false }: { b: Any; cls: string; eager?: boolean }) {
  if (b.image) return <span className={cls}><img src={b.image} alt="" {...(eager ? {} : { loading: 'lazy' as const })} decoding="async" /></span>
  return <span className={`${cls} ${cls}--none`} aria-hidden="true"><b>{initials(b.name)}</b></span>
}

export function Crumbs({ items }: { items: [string, string | null][] }) {
  return (
    <nav className="crumbs">
      {items.map(([label, href], i) => (
        <span key={i}>
          {href ? <Link to={href}>{label}</Link> : label}
          {i < items.length - 1 && <span>/</span>}
        </span>
      ))}
    </nav>
  )
}
