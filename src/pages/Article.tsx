import { Fragment, useState, type ReactNode, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { PageHead } from '../components/chrome'
import { Mention, ArticleCard } from '../components/ui'
import { SocLogo } from '../components/social'
import { A, E, T, ACADEMY_URL, pretty, articles, faqs } from '../lib/data'
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

const EV_TONE: Record<string, string> = { 'Miami, FL': 'miami', 'San Francisco, CA': 'sf', 'Chicago, IL': 'chi', 'Los Angeles, CA': 'la' }

function Events() {
  const track = useRef<HTMLDivElement>(null)
  const go = (dir: number) => {
    const el = track.current
    if (!el) return
    const card = el.firstElementChild as HTMLElement | null
    el.scrollBy({ left: dir * ((card?.offsetWidth || 300) + 20), behavior: 'smooth' })
  }
  return (
    <section className="art-events" aria-labelledby="art-events-h">
      <div className="art-events-head">
        <div>
          <h2 id="art-events-h" className="art-events-title">Upcoming events</h2>
          <p className="art-events-sub">Join one of our health &amp; wellness events in your city!</p>
        </div>
        <div className="art-events-nav">
          <button type="button" aria-label="Previous events" onClick={() => go(-1)}>←</button>
          <button type="button" aria-label="Next events" onClick={() => go(1)}>→</button>
        </div>
      </div>
      <div className="art-events-track" ref={track}>
        {events.map((ev) => (
          <a key={ev.url} className={`art-event art-event--${EV_TONE[ev.city] || 'miami'}`} href={ev.url} target="_blank" rel="noopener" style={{ ['--ev-img' as any]: `url("${ev.logo}")` }}>
            <span className="art-event-art"><img src={ev.logo} alt={ev.name} loading="lazy" /></span>
            <span className="art-event-strip"><b>{ev.city}</b><b>{ev.dates}</b></span>
            <span className="art-event-foot"><span className="art-event-cta">Buy tickets</span></span>
          </a>
        ))}
      </div>
    </section>
  )
}

function Academy() {
  return (
    <section className="art-academy" aria-labelledby="art-academy-h">
      <div className="art-academy-copy">
        <h2 id="art-academy-h" className="art-academy-title">Longevity Science Academy</h2>
        <p className="art-academy-lede">Become a <em>Trusted Guide</em> in Health Optimization &amp; <em>Longevity</em></p>
        <div className="art-academy-stats"><div><b>6</b><span>months</span></div><div><b>14</b><span>modules</span></div></div>
        <p className="art-academy-text">A world-class coaching certification in longevity science, optimal health and applied biohacking — designed to help you build the knowledge, confidence and practical skills to coach others towards the healthiest, most thriving version of themselves.</p>
        <a className="art-academy-cta" href={ACADEMY_URL} target="_blank" rel="noopener">Enroll now <span aria-hidden="true">→</span></a>
      </div>
      <a className="art-academy-lead" href={ACADEMY_URL} target="_blank" rel="noopener">
        <img src="https://www.biohackers.world/wp-content/uploads/2026/10/Dr.-Mark-Atkinson-Lead-Instructor-optimized.png" alt="Dr. Mark Atkinson" loading="lazy" />
        <span className="art-academy-lead-copy"><small className="art-academy-ledby">Led by</small><b>Dr. Mark Atkinson</b><small>MBBS · FRSPH · Chief Instructor</small></span>
      </a>
    </section>
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
    case 'h4': return <h3>{b.text}</h3>
    case 'table': return <div className="art-table"><table><tbody>{b.rows.map((r: string[], i: number) => <tr key={i}>{r.map((c, j) => i === 0 ? <th key={j}>{c}</th> : <td key={j}>{c}</td>)}</tr>)}</tbody></table></div>
    case 'video': return <div className="art-video"><iframe src={`https://www.youtube-nocookie.com/embed/${b.id}`} title="Video" loading="lazy" allowFullScreen /></div>
    case 'events': return <Events />
    case 'academy': return <Academy />
    default: return null
  }
}

function Faq({ items }: { items: { q: string; a: string }[] }) {
  if (!items.length) return null
  return (
    <section className="art-faq" aria-labelledby="art-faq-h">
      <h2 id="art-faq-h">Frequently asked questions</h2>
      {items.map((f, i) => (
        <details key={i} className="art-faq-item" open={i === 0}>
          <summary>{f.q}</summary>
          <p>{f.a}</p>
        </details>
      ))}
    </section>
  )
}

// Related = most shared topics/entities, newest first.
function related(a: any) {
  const score = (b: any) => (b.topics || []).filter((t: string) => (a.topics || []).includes(t)).length * 2 + (b.entities || []).filter((t: string) => (a.entities || []).includes(t)).length
  return articles.filter((b) => b.slug !== a.slug).map((b) => [score(b), b] as const)
    .sort((x, y) => y[0] - x[0] || (x[1].date < y[1].date ? 1 : -1)).slice(0, 3).map(([, b]) => b)
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
  // Article's own question headings; topped up with general Hub questions.
  const own = d?.faq || []
  const faqItems = [...own, ...faqs.filter((f) => !own.some((o: any) => o.q === f.q))].slice(0, Math.max(own.length, 4)).slice(0, 6)

  return (
    <>
      <PageHead compact crumbs={[['Hub', '/'], ['Blog', '/blog'], [a.title, null]]} />
      <section className="section art-top"><div className="wrap">
        <div className="art-hero">
          <div className="art-hero-title"><h1 className="display">{a.title}</h1></div>
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
            <Faq items={faqItems} />
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

      <section className="section art-bottom"><div className="wrap">
        <Newsletter />
        <div className="rail-head art-related-head">Related articles</div>
        <div className="grid g3 art-related">{related(a).map((b) => <ArticleCard key={b.slug} slug={b.slug} />)}</div>
      </div></section>
    </>
  )
}
