import { Fragment, useState, type ReactNode, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { PageHead } from '../components/chrome'
import { Mention } from '../components/ui'
import { SocLogo } from '../components/social'
import { A, E, T, ACADEMY_URL, pretty } from '../lib/data'
import { articleTopic } from '../lib/browsing'
import { sentenceCase } from '../lib/sentenceCase'
import events from '../data/events.json'
import NotFound from './NotFound'

// Full article bodies pulled from biohackers.world, keyed by slug. Articles
// without one fall back to the short body in articles.json.
const DETAILS = import.meta.glob('../data/article-details/*.json', { eager: true, import: 'default' }) as Record<string, any>
const detailFor = (slug: string) => DETAILS[`../data/article-details/${slug}.json`]

// Minimal inline markdown: [text](url) and **bold**.
function Inline({ text }: { text: string }) {
  const out: ReactNode[] = []
  const re = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*/g
  let last = 0, m: RegExpExecArray | null, i = 0
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index))
    if (m[1]) out.push(<a key={i++} href={m[2]} target="_blank" rel="noopener">{m[1]}</a>)
    else out.push(<strong key={i++}>{m[3]}</strong>)
    last = m.index + m[0].length
  }
  out.push(text.slice(last))
  return <>{out}</>
}

const MailIcon = () => <span className="soc-logo" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2.5" y="4.5" width="19" height="15" rx="2.5" /><path d="m3 6 9 7 9-7" /></svg></span>

function Share({ title, url }: { title: string; url: string }) {
  const u = encodeURIComponent(url), t = encodeURIComponent(title)
  const links: [string, string, ReactNode][] = [
    ['Facebook', `https://www.facebook.com/sharer/sharer.php?u=${u}`, <SocLogo name="Facebook" />],
    ['X', `https://twitter.com/intent/tweet?url=${u}&text=${t}`, <SocLogo name="X" />],
    ['LinkedIn', `https://www.linkedin.com/sharing/share-offsite/?url=${u}`, <SocLogo name="LinkedIn" />],
    ['Reddit', `https://www.reddit.com/submit?url=${u}&title=${t}`, <SocLogo name="Reddit" />],
    ['Email', `mailto:?subject=${t}&body=${u}`, <MailIcon />],
  ]
  return (
    <div className="art-share">
      <span className="art-share-label">Share article</span>
      <div className="art-share-row">
        {links.map(([n, href, icon]) => <a key={n} href={href} target="_blank" rel="noopener" aria-label={`Share on ${n}`} title={n}>{icon}</a>)}
      </div>
    </div>
  )
}

function Newsletter() {
  const [done, setDone] = useState(false)
  const submit = (e: FormEvent) => { e.preventDefault(); setDone(true) }
  return (
    <div className="art-news">
      <div>
        <h3>Subscribe to our blog</h3>
        <p>Get the latest articles, research and biohacking updates right to your inbox.</p>
      </div>
      {done ? <p className="art-news-done">Thank you for subscribing!</p> : (
        <form onSubmit={submit}>
          <input type="email" required placeholder="Your email" aria-label="Email address" />
          <button type="submit">Subscribe</button>
        </form>
      )}
    </div>
  )
}

function Events() {
  return (
    <div className="art-events">
      <h3>Upcoming events</h3>
      <p>Join one of our health and wellness events in your city.</p>
      <div className="art-events-grid">
        {events.map((ev) => (
          <a key={ev.url} className="art-event" href={ev.url} target="_blank" rel="noopener">
            <span className="art-event-logo"><img src={ev.logo} alt={ev.name} loading="lazy" /></span>
            <b>{ev.city}</b><span>{ev.dates}</span>
            <span className="art-event-cta">Buy tickets</span>
          </a>
        ))}
      </div>
    </div>
  )
}

function Academy() {
  return (
    <div className="art-academy">
      <p className="art-academy-kick">Longevity Science Academy</p>
      <h3>Become a trusted guide in health optimization and longevity</h3>
      <div className="art-academy-stats"><div><b>6</b><span>Months</span></div><div><b>14</b><span>Modules</span></div></div>
      <p>A world-class coaching certification in longevity science, optimal health and applied biohacking — designed to help you build the knowledge, confidence and practical skills to coach others towards the healthiest, most thriving version of themselves.</p>
      <div className="art-academy-foot">
        <a className="art-academy-cta" href={ACADEMY_URL} target="_blank" rel="noopener">Enroll now</a>
        <a className="art-academy-lead" href={ACADEMY_URL} target="_blank" rel="noopener">
          <img src="https://www.biohackers.world/wp-content/uploads/2026/10/Dr.-Mark-Atkinson-Lead-Instructor-optimized.png" alt="" loading="lazy" />
          <span><small>Led by</small><b>Dr. Mark Atkinson</b><small>MBBS · FRSPH · Chief Instructor</small></span>
        </a>
      </div>
    </div>
  )
}

function Block({ b }: { b: any }) {
  switch (b.t) {
    case 'h2': return <h2 id={b.id}>{sentenceCase(b.text)}</h2>
    case 'h3': return <h3>{b.text}</h3>
    case 'p': return <p><Inline text={b.text} /></p>
    case 'ul': return <ul>{b.items.map((x: string, i: number) => <li key={i}><Inline text={x} /></li>)}</ul>
    case 'ol': return <ol>{b.items.map((x: string, i: number) => <li key={i}><Inline text={x} /></li>)}</ol>
    case 'note': return <blockquote className="art-note"><Inline text={b.text} /></blockquote>
    case 'img': return <img className="art-img" src={b.src} alt={b.alt || ''} loading="lazy" />
    case 'video': return <div className="art-video"><iframe src={`https://www.youtube-nocookie.com/embed/${b.id}`} title="Video" loading="lazy" allowFullScreen /></div>
    case 'events': return <Events />
    case 'academy': return <Academy />
    default: return null
  }
}

export default function Article() {
  const { slug } = useParams()
  const a = slug ? A[slug] : undefined
  if (!a) return <NotFound />
  const d = detailFor(a.slug)
  const ents = (a.entities || []).filter((s: string) => s in E)
  const toc = d ? d.blocks.filter((b: any) => b.t === 'h2') : []
  const author = d?.author || { name: 'Biohackers World', role: 'Editorial team' }
  const url = a.sourceUrl || `https://www.biohackers.world/hub/articles/${a.slug}`
  const paras: string[] = d ? [] : a.body
  const intro = d ? d.intro : paras[0]
  const rest = d ? null : paras.slice(1)

  return (
    <>
      <PageHead compact crumbs={[['Hub', '/'], ['Blog', '/blog'], [a.title, null]]} />
      <section className="section art-top"><div className="wrap">
        <div className="art-hero">
          <h1 className="display">{a.title}</h1>
          {a.image && <img className="art-hero-img" src={a.image} alt="" />}
        </div>
        <div className="art-meta">
          <div className="art-meta-author">
            {author.image ? <img src={author.image} alt="" /> : <span className="art-meta-avatar" aria-hidden="true">{author.name[0]}</span>}
            <div><b>{author.name}</b><span>{author.role}</span></div>
          </div>
          <div><b>{pretty(a.date)}</b><span>Published</span></div>
          <div><b>{a.readTime} min read</b><span>{toc.length ? `${toc.length} sections` : 'Reading time'}</span></div>
          <div><b>{articleTopic(a, T)}</b><span>Topic</span></div>
        </div>
      </div></section>

      <section className="section art-body"><div className="wrap">
        <div className="entity-layout art-layout">
          <article className="prose">
            {intro && <p className="art-intro"><Inline text={intro} /></p>}
            <Newsletter />
            {d?.highlights?.length > 0 && (
              <div className="answer-box art-highlights"><p className="eyebrow">Highlights</p>
                <ul>{d.highlights.map((h: string, i: number) => <li key={i}>{h}</li>)}</ul>
              </div>
            )}
            {d ? d.blocks.map((b: any, i: number) => <Fragment key={i}><Block b={b} /></Fragment>) : (<>
              {rest!.map((p, i) => <p key={i}>{p}</p>)}
              <Events />
              <Academy />
            </>)}
            {ents.length > 0 && <div className="mentions" style={{ marginTop: 28 }}>{ents.map((s: string) => <Mention key={s} slug={s} />)}</div>}
            {a.sourceUrl && <p className="art-source">Originally published on the <a href={a.sourceUrl}>Biohackers World blog</a>.</p>}
          </article>
          <aside className="side">
            <Share title={a.title} url={url} />
            {toc.length > 0 && (
              <div className="art-toc"><span className="art-share-label">In this article</span>
                <ol>{toc.map((h: any) => <li key={h.id}><a href={`#${h.id}`}>{sentenceCase(h.text)}</a></li>)}</ol>
              </div>
            )}
          </aside>
        </div>
      </div></section>
    </>
  )
}
