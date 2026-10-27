import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MoreLink, SearchField } from '../components/controls'
import { guideUrl } from '../lib/browsing'
import { Story, Motif, ArticleCard, EvMeter, Tag, PersonPhoto } from '../components/ui'
import { PlayButton } from '../components/Player'
import { SocLogo } from '../components/social'
import { IconArrow } from '../components/icons'
import blogTilePhoto from '../assets/home/blog-tile.png.asset.json'
import {
  feed, problems, FRONT_PILLARS, T, E, KIND_LABEL, articles, howtos, faqs, social,
  hackers, instagram, instagramTop, clip, pretty,
} from '../lib/data'

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const BUILT = new Date()

// the blog's own category taxonomy (name + link on the live blog)
const BLOG_CATEGORIES: [string, string][] = [
  ['Event Releases', 'https://www.biohackers.world/blog?categories=454'],
  ['Health & Wellness', 'https://www.biohackers.world/blog?categories=456'],
  ['Fitness & Recovery', 'https://www.biohackers.world/blog?categories=458'],
  ['Sleep', 'https://www.biohackers.world/blog?categories=459'],
  ['Longevity & Anti-Aging', 'https://www.biohackers.world/blog?categories=460'],
  ['Skin & Body Care', 'https://www.biohackers.world/blog?categories=452'],
  ['Devices', 'https://www.biohackers.world/blog?categories=444'],
  ['Nutrition', 'https://www.biohackers.world/blog?categories=445'],
  ['Cognitive Enhancement', 'https://www.biohackers.world/blog?categories=446'],
  ['Fitness', 'https://www.biohackers.world/blog?categories=447'],
  ['Regenerative', 'https://www.biohackers.world/blog?categories=448'],
  ['Testing & Monitoring', 'https://www.biohackers.world/blog?categories=453'],
]

const trackOf = (i: any) => (i.audio ? { src: i.audio, title: i.t, img: i.img, url: i.listen } : undefined)

function Tile({ item, cls }: { item: any; cls: string }) {
  const photo = !!item.img
  return (
    <Link className={`tile ${cls}${photo ? ' tile--photo' : ''}`} data-k={item.k} to={item.u}>
      {photo && <span className="tile-photo"><img src={item.img} alt="" loading="lazy" decoding="async" />{item.audio && <PlayButton track={trackOf(item)} />}</span>}
      <div className="tile-kick"><span className="kick" data-k={item.k}>{item.kick}</span></div>
      <h3>{item.t}</h3><p>{clip(item.d, 400)}</p>
      <div className="meta"><b>{item.meta}</b><span>{pretty(item.date)}</span></div>
      <Motif kind={item.k} />
    </Link>
  )
}

export default function Home() {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const items = feed()
  const used = new Set<string>()
  const take = (pred: (i: any) => boolean, n: number) => {
    const out: any[] = []
    for (const it of items) {
      if (used.has(it.u) || !pred(it)) continue
      out.push(it); used.add(it.u)
      if (out.length === n) break
    }
    return out
  }
  const lead = take((i) => i.k === 'article', 1)[0]
  const tileA = take((i) => i.k === 'article', 1)[0]
  const tileB = take((i) => i.k === 'episode', 1)[0]
  const brief = take((i) => i.k !== 'entity', 5)
  const latest = [...articles].sort((a, b) => (a.date < b.date ? 1 : -1)).filter((a) => !used.has(`/articles/${a.slug}`)).slice(0, 2)
  const weekday = WEEKDAYS[(BUILT.getDay() + 6) % 7]

  // explainers: Term of the month (peptides) + three
  const feat = E['peptides']
  const moreTerms = ['fasting-insulin', 'autophagy', 'vo2-max'].map((s) => E[s]).filter(Boolean)

  // pillar sections
  const pillarUsed = new Set<string>()
  const pillarSections = FRONT_PILLARS.map(([slug, label], n) => {
    const t = T[slug]
    const pool = items.filter((i) => (i.topics || []).includes(slug))
    if (pool.length < 2) return null
    pool.sort((a, b) => (a.k === 'entity' ? 1 : 0) - (b.k === 'entity' ? 1 : 0))
    const fresh = pool.filter((i) => !pillarUsed.has(i.u)).length ? pool.filter((i) => !pillarUsed.has(i.u)) : pool
    const leadI = fresh[0], rest = fresh.slice(1, 4);
    [leadI, ...rest].forEach((i) => pillarUsed.add(i.u))
    return (
      <section key={slug} className={'pillar' + (n % 2 ? ' pillar--flip' : '')} style={{ ['--sc' as any]: t.color }}>
        <div className="sec-head"><h2>{t.question}</h2><MoreLink to={`/topics/${slug}`}>All {label.toLowerCase()}</MoreLink></div>
        <div className="spine"><span>{label}</span></div>
        <div className="sec-grid"><Story item={leadI} size="md" />{rest.map((i) => <Story key={i.u} item={i} size="sm" />)}</div>
      </section>
    )
  })

  const frontPeople = (() => {
    const famous = hackers.filter((b) => !b.speaker && b.image).slice(0, 3)
    const miami = hackers.filter((b) => (b.events || []).includes('miami-2027'))
    return [...famous, ...miami].slice(0, 4)
  })()

  return (
    <div className="home">
      <section className="board on-dark">
        <span className="board-glow" aria-hidden="true" />
        <span className="board-glow board-glow--b" aria-hidden="true" />
        <span className="board-atmos" aria-hidden="true" />
        <div className="wrap">
        <div className="hub-masthead">
          <h1>Biohacking Hub</h1>
          <form role="search" onSubmit={event => { event.preventDefault(); if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`) }}>
            <SearchField label="Search the Hub" placeholder="Search the Hub…" value={query} onChange={setQuery} />
          </form>
        </div>
        <div className="bento">
          <Link className={'tile tile--lead' + (lead.img ? ' tile--photo' : '')} data-k={lead.k} to={lead.u}>
            {lead.img && <span className="tile-photo"><img src={lead.img} alt="" loading="lazy" decoding="async" /></span>}
            <span className="kick" data-k={lead.k}>{lead.kick} · {pretty(lead.date)}</span>
            <h2>{lead.t}</h2><p>{clip(lead.d, 180)}</p>
            <div className="meta"><b>{lead.meta}</b></div>
          </Link>
          <div className="tile tile--problems" id="problems">
            <div className="tile-kick"><span className="kick" data-k="event">Start here</span></div>
            <h3 style={{ fontSize: '1.1rem' }}>What are you interested in?</h3>
            <p>Pick the symptom. Each page routes you to what to measure, what to do and what to consider.</p>
            <div className="prob-chips">{problems.map((p) => <Link key={p.slug} to={`/problems/${p.slug}`}>{p.name}</Link>)}</div>
          </div>
          <div className="tile tile--brief">
            <div className="tile-kick"><span className="kick" data-k="article">New</span><span style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.5)' }}>{weekday}, {pretty(BUILT.toISOString().slice(0, 10))}</span></div>
            <h3 style={{ fontSize: '1.1rem' }}>Five things to know</h3>
            <ol className="brief">{brief.map((i) => <li key={i.u}><Link to={i.u}>{i.t}</Link><small>{i.kick} · {pretty(i.date)}</small></li>)}</ol>
          </div>
          <Tile item={{ ...tileA, img: blogTilePhoto.url }} cls="tile--a" />
          <Tile item={tileB} cls="tile--b" />
        </div>
      </div></section>

      <div className="wrap">
        <div className="rail-head" style={{ marginTop: 24 }}>Latest from the blog <MoreLink to="/blog">All articles</MoreLink></div>
        <div className="grid g2" style={{ marginTop: 4 }}>{latest.map((a) => <ArticleCard key={a.slug} slug={a.slug} />)}</div>
      </div>

      <div className="wrap">
        <div className="rail-head" style={{ marginTop: 30 }}>Top Terms — Knowledge Base <MoreLink to="/knowledge-base">All {E && Object.keys(E).length} entries</MoreLink></div>
        <div className="explainers">
          {feat && (
            <Link className="explainer explainer--feature" to={`/knowledge/${feat.slug}`}>
              <span className="kick" data-k="entity" style={{ color: 'rgba(255,255,255,.55)' }}>Term of the month · {KIND_LABEL[feat.type]}</span>
              <span className="term" style={{ marginTop: 8 }}>{feat.name}</span><p>{feat.summary}</p><EvMeter level={feat.evidence} />
            </Link>
          )}
          {moreTerms.map((e) => (
            <Link key={e.slug} className="explainer" to={`/knowledge/${e.slug}`}>
              <span className="term">{e.name}<Tag kind={e.type} /></span><p>{clip(e.summary, 105)}</p><EvMeter level={e.evidence} />
            </Link>
          ))}
        </div>
        <div id="topics">
          <div className="pillar-cats pillar-cats--global">
            <span className="pillar-cats-label">Browse all categories</span>
            <div className="chip-row">{BLOG_CATEGORIES.map(([name, url]) => <a key={name} className="chip cat-chip" href={url} rel="noopener">{name}</a>)}</div>
          </div>
          {pillarSections}
        </div>
      </div>

      <section className="igband on-dark"><div className="wrap">
        <div className="sec-head" style={{ marginBottom: 24 }}>
          <h2 style={{ color: '#fff' }}>From Instagram</h2>
          <p className="q" style={{ color: 'rgba(255,255,255,.5)' }}>Latest posts from @{instagram.account.handle} · {instagram.account.followers} followers</p>
          <MoreLink href={instagram.account.url}>Follow on Instagram</MoreLink>
        </div>
        <div className="igrid">
          {instagramTop(4).map((p, i) => (
            <a key={i} className="ig" href={p.permalink} rel="noopener">
              <span className="ig-media"><img src={'/' + p.image} alt="" loading="lazy" decoding="async" /></span>
              <span className="ig-body"><span className="ig-kind">{p.media_type === 'REELS' ? 'Reel' : p.media_type === 'CAROUSEL_ALBUM' ? 'Carousel' : 'Post'}</span><span className="ig-date">{pretty(p.timestamp.slice(0, 10))}</span></span>
            </a>
          ))}
        </div>
      </div></section>

      <div className="wrap">
        <section className="sec" style={{ ['--sc' as any]: 'var(--indigo)' }}>
          <div className="sec-head"><h2>Top Biohackers</h2><p className="q">The people shaping the field</p><MoreLink to="/biohackers">All profiles</MoreLink></div>
          <div className="pgrid" style={{ paddingBottom: 30 }}>
            {frontPeople.map((b) => {
              const focus = (b.focus || []).filter((x: string) => x in E)
              return (
                <article key={b.slug} className="pcard">
                  <Link className="pcard-link" to={`/biohackers/${b.slug}`}>
                    <span className="pcard-media">
                      <PersonPhoto b={b} cls="pcard-photo" />
                      <span className="pcard-more">
                        <span className="pcard-summary">{clip(b.known || b.summary, 190)}</span>
                        {focus.length > 0 && <span className="pcard-focus">{focus.map((x: string) => <span key={x}>{E[x].name}</span>)}</span>}
                        <span className="pcard-cta">View full profile<IconArrow /></span>
                      </span>
                    </span>
                    <span className="pcard-body"><h3 className="pcard-name">{b.name}</h3><span className="pcard-title">{b.title}</span></span>
                  </Link>
                </article>
              )
            })}
          </div>
        </section>

        <section className="sec" style={{ ['--sc' as any]: 'var(--teal)' }}>
          <div className="sec-head"><h2>How-To</h2><p className="q">Step-by-step guides you can run this week</p><MoreLink to="/knowledge-base?type=howto">All guides</MoreLink></div>
          <div className="howtos" style={{ paddingBottom: 30 }}>
            {howtos.slice(0, 4).map((h) => (
              <Link key={h.slug} className="howto" to={guideUrl(h.slug)}>
                <span className="n">{h.steps}</span><h3>{h.title}</h3><p>{clip(h.excerpt, 90)}</p><div className="meta">{h.steps} steps · {h.time}</div>
              </Link>
            ))}
          </div>
        </section>

        <section className="sec">
          <div className="sec-head"><h2>Common questions</h2><p className="q">Straight answers to what people ask most</p><MoreLink to="/faq">All FAQ</MoreLink></div>
          <div className="faqs" style={{ paddingBottom: 30 }}>
            {faqs.slice(0, 6).map((f, i) => <div key={i} className="faq-item"><p className="faq-q">{f.q}</p><p className="faq-a">{clip(f.a, 200)}</p></div>)}
          </div>
        </section>

        <section className="sec" style={{ ['--sc' as any]: 'var(--ink)' }}>
          <div className="sec-head"><h2>Social</h2><p className="q">Connect with the community wherever you already are</p><MoreLink to="/social">All platforms</MoreLink></div>
          <div className="social" style={{ paddingBottom: 30 }}>
            {social.map((s) => (
              <a key={s.name} className="soc" href={s.url}><span className="soc-head"><SocLogo name={s.name} /><b>{s.name}</b></span><i>{s.handle}</i><span>{s.blurb}</span></a>
            ))}
          </div>
        </section>
      </div>

      <div className="wrap"><p className="fp-footer-note">Placement on this page is driven by the knowledge graph: every item is tagged to pillars and entities, and each section gathers the newest content across all formats.</p></div>
    </div>
  )
}
