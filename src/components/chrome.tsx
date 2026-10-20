// Top navigation, page-head hero and footer — ported from build.py's header()/
// footer() plus the nav-scroll and cursor-lit-grid behaviour from hub.js.
import { useEffect, useRef, useState, ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { SUB_CHANNELS, BRAND_URL, ACADEMY_URL, TICKETS_URL, topics } from '../lib/data'
import { TnArrow, IconClose } from './icons'
import { Crumbs } from './ui'
import navLogo from '../assets/sales-nav-logo.png.asset.json'

const isInternal = (href: string) => href.startsWith('/')
const NavLink = ({ href, label, active }: { href: string; label: string; active?: boolean }) =>
  isInternal(href)
    ? <Link to={href} {...(active ? { 'aria-current': 'page' as const } : {})}>{label}</Link>
    : <a href={href}>{label}</a>

export function TopNav() {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const headerRef = useRef<HTMLElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const active = SUB_CHANNELS.find(([href]) => pathname === href || pathname.startsWith(href + '/'))
    ?? (pathname.startsWith('/articles/') ? SUB_CHANNELS[0] : pathname.startsWith('/knowledge/') ? SUB_CHANNELS[4] : undefined)
  useEffect(() => setOpen(false), [pathname])

  useEffect(() => {
    const onScroll = () => {
      const header = headerRef.current
      if (!header) return
      header.classList.toggle('is-condensed', window.scrollY > 40)
      const range = document.documentElement.scrollHeight - window.innerHeight
      header.style.setProperty('--nav-progress', String(range > 0 ? Math.max(.02, Math.min(1, window.scrollY / range)) : 1))
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!open) return
    const startY = window.scrollY
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setOpen(false); toggleRef.current?.focus() }
    }
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !headerRef.current?.contains(event.target)) setOpen(false)
    }
    const scroll = () => { if (Math.abs(window.scrollY - startY) > 60) setOpen(false) }
    document.addEventListener('keydown', close)
    document.addEventListener('pointerdown', outside)
    window.addEventListener('scroll', scroll, { passive: true })
    return () => {
      document.removeEventListener('keydown', close)
      document.removeEventListener('pointerdown', outside)
      window.removeEventListener('scroll', scroll)
    }
  }, [open])

  const ring = <svg className="hub-nav-ring" aria-hidden="true"><rect x=".5" y=".5" width="calc(100% - 1px)" height="calc(100% - 1px)" rx="16" fill="none" pathLength="1" /></svg>

  return (
    <>
      <header className="hub-nav" ref={headerRef}>
        <div className="hub-nav-bar">
          <Link className="hub-nav-brand" to="/" aria-label="Biohacking Hub home">
            <img src={navLogo.url} alt="Biohackers World" />
            <span className="hub-nav-brand-divider" aria-hidden="true" />
            <span className="hub-nav-lockup"><span>Biohacking</span><span>Hub</span></span>
          </Link>
          <nav className="hub-nav-links" aria-label="Biohacking Hub">
            {SUB_CHANNELS.map(([href, label]) => <Link key={href} to={href} aria-current={active?.[0] === href ? 'page' : undefined}>
              {active?.[0] === href && ring}<span>{label}</span>
            </Link>)}
          </nav>
          <button ref={toggleRef} className="hub-nav-toggle" type="button" aria-label={open ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={open} aria-controls="hub-navigation-menu" onClick={() => setOpen(value => !value)}>
            {ring}<span className="hub-nav-current">{active?.[1] ?? 'Menu'}</span>
            {open ? <IconClose /> : <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true"><path d="M4 6h12M4 10h12M4 14h12" /></svg>}
          </button>
          <a className="hub-nav-cta" href={TICKETS_URL}>Buy Tickets<TnArrow /></a>
        </div>
        {open && <nav id="hub-navigation-menu" className="hub-nav-menu" aria-label="Hub pages">
          {SUB_CHANNELS.map(([href, label]) => <Link key={href} to={href} onClick={() => setOpen(false)} aria-current={active?.[0] === href ? 'page' : undefined}>{label}{active?.[0] === href && <span className="hub-nav-dot" aria-hidden="true" />}</Link>)}
        </nav>}
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
    const head = ref.current
    if (!head) return
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
