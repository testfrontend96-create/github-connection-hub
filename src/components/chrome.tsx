// Top navigation, page-head hero and footer — ported from build.py's header()/
// footer() plus the nav-scroll and cursor-lit-grid behaviour from hub.js.
import { useEffect, useRef, useState, ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { PRODUCT_NAV, SUB_CHANNELS, SUB_TOPICS, BRAND_URL, ACADEMY_URL, TICKETS_URL, topics } from '../lib/data'
import { TnArrow } from './icons'
import { Crumbs } from './ui'

const isInternal = (href: string) => href.startsWith('/')
const NavLink = ({ href, label, active }: { href: string; label: string; active?: boolean }) =>
  isInternal(href)
    ? <Link to={href} {...(active ? { 'aria-current': 'page' as const } : {})}>{label}</Link>
    : <a href={href}>{label}</a>

export function TopNav() {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  useEffect(() => setOpen(false), [pathname])

  useEffect(() => {
    const root = document.documentElement
    let t: number
    const onScroll = () => {
      root.classList.toggle('tn-scrolled', window.scrollY > 40)
      root.classList.add('tn-scrolling')
      window.clearTimeout(t)
      t = window.setTimeout(() => root.classList.remove('tn-scrolling'), 220)
    }
    root.classList.toggle('tn-scrolled', window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <header className="topnav">
        <div className="tn-inner">
          <nav className="tn-main" aria-label="Biohackers World">
            <a className="tn-logo" href={BRAND_URL}><img src="/assets/logo.svg" alt="Biohackers World" width={36} height={24} /></a>
            <div className="tn-links">
              {PRODUCT_NAV.map(([label, href]) => <NavLink key={label} href={href} label={label} active={href === '/' && pathname === '/'} />)}
            </div>
            <a className="tn-cta" href={TICKETS_URL}>Buy Tickets<TnArrow /></a>
            <button className="tn-menu nav-toggle" type="button" aria-label="Menu" onClick={() => setOpen((o) => !o)}>Menu</button>
          </nav>
          <div className={'tn-drop mobile-nav' + (open ? ' open' : '')}>
            {PRODUCT_NAV.map(([label, href]) => <NavLink key={label} href={href} label={label} />)}
            <a href={TICKETS_URL}>Buy Tickets</a>
          </div>
          <nav className="tn-sub" aria-label="Biohacking Hub sections">
            <div className="tn-channels">
              {SUB_CHANNELS.map(([href, label]) => <NavLink key={href} href={href} label={label} active={pathname === href} />)}
            </div>
            <span className="tn-div" aria-hidden="true" />
            <div className="tn-topics">
              {SUB_TOPICS.map(([href, label]) => <NavLink key={href} href={href} label={label} active={pathname === href} />)}
            </div>
          </nav>
        </div>
      </header>
      <div className="tn-spacer" aria-hidden="true" />
    </>
  )
}

// dark hero with a cursor-lit purple grid (ports hub.js page-head tracking)
export function PageHead({ accent, crumbs, title, lede, children }: {
  accent?: string; crumbs?: [string, string | null][]; title?: string; lede?: string; children?: ReactNode
}) {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    const head = ref.current!
    let frame = 0, pending: { x: number; y: number } | null = null
    const apply = () => { frame = 0; if (!pending) return; head.style.setProperty('--mx', pending.x + 'px'); head.style.setProperty('--my', pending.y + 'px') }
    const move = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      const r = head.getBoundingClientRect()
      pending = { x: e.clientX - r.left, y: e.clientY - r.top }
      head.classList.add('is-lit')
      if (!frame) frame = requestAnimationFrame(apply)
    }
    const leave = () => head.classList.remove('is-lit')
    head.addEventListener('pointermove', move)
    head.addEventListener('pointerleave', leave)
    return () => { head.removeEventListener('pointermove', move); head.removeEventListener('pointerleave', leave) }
  }, [])
  return (
    <section className="page-head" ref={ref} style={accent ? { ['--sc' as any]: accent } : undefined}>
      <div className="wrap">
        {crumbs && <Crumbs items={crumbs} />}
        {title && <h1 className="display">{title}</h1>}
        {lede && <p className="lede">{lede}</p>}
        {children}
      </div>
    </section>
  )
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="foot-grid">
          <div>
            <Link className="brand" to="/" style={{ marginBottom: 16 }}>
              <img className="brand-logo" src="/assets/logo.svg" alt="Biohackers World" />
              <span className="brand-name">Biohacking Hub</span>
            </Link>
            <p style={{ fontSize: '.88rem', lineHeight: 1.6, maxWidth: '34ch', margin: 0 }}>
              A connected knowledge platform for biohacking, longevity and health optimisation — organised around your questions, not our content formats.
            </p>
          </div>
          <div><h5>Knowledge</h5>
            <Link to="/knowledge-base">Knowledge Base</Link>
            <Link to="/search">Search the Hub</Link>
            <Link to="/blog">Articles</Link>
            <Link to="/podcast">Podcast</Link>
            <Link to="/about">How the Hub works</Link>
          </div>
          <div><h5>Topics</h5>{topics.map((t) => <Link key={t.slug} to={`/topics/${t.slug}`}>{t.name}</Link>)}</div>
          <div><h5>Biohackers World</h5>
            <a href={`${BRAND_URL}/events`}>Conferences</a>
            <a href={ACADEMY_URL}>Academy</a>
            <a href={`${BRAND_URL}/community`}>Community</a>
            <a href={`${BRAND_URL}/shop`}>Biohack Store</a>
            <Link to="/blog">Blog</Link>
            <a href={`${BRAND_URL}/about-us`}>About Us</a>
          </div>
        </div>
        <div className="foot-bottom">
          <span>© 2026 Biohackers World. All rights reserved.</span>
          <span>Educational content only — not medical advice.</span>
        </div>
      </div>
    </footer>
  )
}
