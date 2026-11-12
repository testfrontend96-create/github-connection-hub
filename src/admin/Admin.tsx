// Biohacking Hub administration — layout, hierarchy and access rules follow the
// Sales (Invited Only) admin: Google sign-in, company-domain admins, email overrides.
import { useCallback, useRef, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../integrations/supabase/client'
import { lovable } from '../integrations/lovable/index'
import { KINDS, type Kind } from '../lib/contentKinds'
import { mergeRows, keyOf } from '../lib/overrides'
import type { ContentRow, HomeFeature } from '../lib/remote'
import { builtInDetail } from '../lib/articleDetails'
import { KIND_DEFS, getPath, setPath, type KindDef } from './schemas'
import { FieldInput, Modal } from './fields'
import { I } from './icons'
import { DraftProvider, useDrafts } from './Drafts'
import { overlayRows } from './draftState'
import { History, changeTypes } from './History'
import { askDelete, ConfirmHost } from './Confirm'
import { resolveHero, startHereValue, type StartHere } from '../lib/homeSelection'
import './admin.css'

const OWNER = 'mykyta.b@biohackers.world'
const saved = () => window.dispatchEvent(new Event('hub-admin-saved'))

/* ---------------- access ---------------- */

type Access = { session: Session | null; ready: boolean; isAdmin: boolean; checking: boolean }

function useAccess(): Access {
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [checking, setChecking] = useState(false)
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_e, s) => { setSession(s); setReady(true) })
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true) })
    return () => data.subscription.unsubscribe()
  }, [])
  useEffect(() => {
    if (!session) { setIsAdmin(false); return }
    setChecking(true)
    supabase.rpc('is_admin').then(({ data }) => { setIsAdmin(!!data); setChecking(false) })
  }, [session?.user?.id])
  return { session, ready, isAdmin, checking }
}

const signOut = async () => { await supabase.auth.signOut(); location.reload() }

function GoogleButton() {
  const [err, setErr] = useState('')
  const go = async () => {
    setErr('')
    const r = await lovable.auth.signInWithOAuth('google', { redirect_uri: window.location.origin + '/admin' })
    if (r.error) setErr(r.error.message || 'Sign-in failed')
  }
  return (
    <>
      <button type="button" className="adm-google" onClick={go}>
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>
        Sign in with Google
      </button>
      {err && <p className="adm-err">{err}</p>}
    </>
  )
}

function AccessCard({ title, body, children }: { title: string; body: string; children?: React.ReactNode }) {
  return (
    <main className="adm adm-center">
      <div className="adm-access">
        <span className="adm-badge">{I.shield} Biohacking Hub</span>
        <h1>{title}</h1>
        <p>{body}</p>
        {children}
      </div>
    </main>
  )
}

function RequestAccess() {
  const [state, setState] = useState<'idle' | 'sent' | 'error'>('idle')
  useEffect(() => {
    supabase.from('admin_requests').select('status').maybeSingle().then(({ data }) => { if (data?.status === 'pending') setState('sent') })
  }, [])
  if (state === 'sent') return <p className="adm-note">Request sent — an administrator will review it.</p>
  return (
    <button type="button" className="adm-btn" onClick={async () => {
      const { error } = await supabase.rpc('request_admin_access')
      setState(error ? 'error' : 'sent')
    }}>Request admin access</button>
  )
}

import { Tooltips } from './Tooltip'
export default function Admin() {
  const a = useAccess()
  useEffect(() => {
    document.title = 'Site administration — Biohacking Hub'
    const m = document.createElement('meta'); m.name = 'robots'; m.content = 'noindex, nofollow'
    document.head.appendChild(m)
    return () => { m.remove() }
  }, [])
  if (!a.ready || a.checking) return <AccessCard title="Checking access…" body="One moment." />
  if (!a.session) return (
    <AccessCard title="Site administration" body="This area is for the Biohacking Hub editorial team. Sign in with an administrator account to continue.">
      <GoogleButton />
    </AccessCard>
  )
  if (!a.isAdmin) return (
    <AccessCard title="Administrators only" body={`${a.session.user.email ?? 'This account'} does not have administrator access. You can request it — the administrators will see your request and approve it.`}>
      <div className="adm-stack">
        <RequestAccess />
        <button type="button" className="adm-pill adm-pill--block" onClick={signOut}>Use another account</button>
      </div>
    </AccessCard>
  )
  return <DraftProvider><Dashboard session={a.session} /><Tooltips /><ConfirmHost /></DraftProvider>
}

/* ---------------- workspace ---------------- */

type View = 'panel' | 'split' | 'live'
type Tab = 'home' | Kind | 'inbox' | 'admins' | 'history'

function ViewSwitcher({ view, setView, swapped, setSwapped, tab, setTab }: { view: View; setView: (v: View) => void; swapped: boolean; setSwapped: (v: boolean) => void; tab: Tab; setTab: (t: Tab) => void }) {
  const items: [View, string, React.ReactNode][] = [['panel', 'Admin panel', I.panel], ['split', 'Split view', I.split], ['live', 'Live site', I.monitor]]
  return (
    <div className="adm-switch-row">
      <div className="adm-seg">
        {items.map(([k, l, ic]) => <button key={k} type="button" className={view === k ? 'is-on' : ''} onClick={() => setView(k)}>{ic}<span>{l}</span></button>)}
      </div>
      {view === 'split' && <button type="button" className="adm-pill" onClick={() => setSwapped(!swapped)}>{I.swap} Swap sides</button>}
      <a className="adm-pill" href="/" target="_blank" rel="noreferrer">{I.ext} Live site in a new window</a>
      <button type="button" className={tab === 'history' ? 'adm-pill adm-switch-end is-on' : 'adm-pill adm-switch-end'} onClick={() => { setTab('history'); if (view === 'live') setView('panel') }}>{I.history} History</button>
    </div>
  )
}

function LivePane() {
  const [n, setN] = useState(0)
  useEffect(() => {
    const f = () => setN((x) => x + 1)
    window.addEventListener('hub-admin-saved', f)
    return () => window.removeEventListener('hub-admin-saved', f)
  }, [])
  return (
    <div className="adm-live">
      <div className="adm-live-bar">
        <span>{I.monitor} Live site</span>
        <span className="adm-live-tools">
          <button type="button" className="adm-link" onClick={() => setN(n + 1)}>{I.refresh} Refresh</button>
          <a className="adm-link" href="/" target="_blank" rel="noreferrer">{I.ext} Open</a>
        </span>
      </div>
      <iframe key={n} src="/" title="Live site" />
    </div>
  )
}

function Dashboard({ session }: { session: Session }) {
  const [view, setView] = useState<View>('panel')
  const [swapped, setSwapped] = useState(false)
  const [tab, setTab] = useState<Tab>('home')
  const body = <PanelBody session={session} tab={tab} setTab={setTab} />
  if (view === 'live') return (
    <main className="adm adm-full"><ViewSwitcher view={view} setView={setView} swapped={swapped} setSwapped={setSwapped} tab={tab} setTab={setTab} /><LivePane /></main>
  )
  if (view === 'split') {
    const panel = <div className="adm-split-panel">{body}</div>
    return (
      <main className="adm adm-full">
        <ViewSwitcher view={view} setView={setView} swapped={swapped} setSwapped={setSwapped} tab={tab} setTab={setTab} />
        <div className="adm-split">{swapped ? <><LivePane />{panel}</> : <>{panel}<LivePane /></>}</div>
      </main>
    )
  }
  return (
    <main className="adm adm-page">
      <div className="adm-glow" aria-hidden />
      <div className="adm-wrap">
        <ViewSwitcher view={view} setView={setView} swapped={swapped} setSwapped={setSwapped} tab={tab} setTab={setTab} />
        {body}
      </div>
    </main>
  )
}

const KB_TABS: [Tab, string][] = [['entity', 'Knowledge base'], ['howto', 'How To'], ['topic', 'Topics'], ['problem', 'Problems']]
const TABS: [Tab, string][] = [
  ['home', 'Homepage'], ['article', 'Blog'], ['episode', 'Podcast'], ['entity', 'Knowledge Base'],
  ['biohacker', 'Top Biohackers'], ['faq', 'FAQ'], ['event', 'Events'], ['social', 'Social Media'],
]

function PanelBody({ session, tab, setTab }: { session: Session; tab: Tab; setTab: (t: Tab) => void }) {
  const u = session.user
  const name = (u.user_metadata?.full_name || u.user_metadata?.name || u.email) as string
  const avatar = (u.user_metadata?.avatar_url || u.user_metadata?.picture) as string | undefined
  const inbox = useCount('submissions')
  const requests = useCount('admin_requests')
  const def = KIND_DEFS.find((d) => d.kind === tab)
  return (
    <div className="adm-body">
      <header className="adm-head">
        <div className="adm-me">
          {avatar ? <img src={avatar} alt="" referrerPolicy="no-referrer" /> : <span className="adm-avatar">{name[0]?.toUpperCase()}</span>}
          <div>
            <span className="adm-kicker">Site administration</span>
            <h1>Biohacking Hub</h1>
            <p>Signed in as {u.email}</p>
          </div>
        </div>
        <div className="adm-head-tools">
          <button type="button" className={tab === 'inbox' ? 'adm-pill is-on' : 'adm-pill'} onClick={() => setTab('inbox')}>{I.inbox} Inbox{inbox ? <b className="adm-count">{inbox}</b> : null}</button>
          <button type="button" className={tab === 'admins' ? 'adm-pill is-on' : 'adm-pill'} onClick={() => setTab('admins')}>{I.shield} Admins{requests ? <b className="adm-count">{requests}</b> : null}</button>
          <button type="button" className="adm-pill" onClick={signOut}>{I.logout} Sign out</button>
        </div>
      </header>
      <nav className="adm-tabs" aria-label="Sections">
        {TABS.map(([k, l]) => k === 'entity' ? <KbTab key={k} tab={tab} setTab={setTab} /> : <button key={k} type="button" className={tab === k ? 'adm-pill is-on' : 'adm-pill'} onClick={() => setTab(k)}>{l}</button>)}
      </nav>
      {tab === 'home' ? <HomepageManager /> : tab === 'history' ? <History /> : tab === 'inbox' ? <Inbox /> : tab === 'admins' ? <AdminsManager email={u.email || ''} /> : def ? <ContentManager key={def.kind} def={def} /> : null}
    </div>
  )
}

function KbTab({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (!open) return
    const off = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', off); return () => document.removeEventListener('mousedown', off)
  }, [open])
  const cur = KB_TABS.find(([k]) => k === tab)
  return (
    <span className="adm-star-wrap adm-kb-tab" ref={ref}>
      <button type="button" className={cur ? 'adm-pill is-on' : 'adm-pill'} aria-expanded={open} onClick={() => setOpen(!open)}>Knowledge Base{cur && cur[0] !== 'entity' ? ` · ${cur[1]}` : ''} {I.down}</button>
      {open && (
        <span className="adm-menu">
          {KB_TABS.map(([k, l]) => <button key={k} type="button" className={tab === k ? 'is-on' : ''} onClick={() => { setTab(k); setOpen(false) }}>{l}</button>)}
        </span>
      )}
    </span>
  )
}

function useCount(table: 'submissions' | 'admin_requests') {
  const [n, setN] = useState(0)
  useEffect(() => {
    const q = table === 'submissions'
      ? supabase.from('submissions').select('id', { count: 'exact', head: true }).eq('done', false)
      : supabase.from('admin_requests').select('user_id', { count: 'exact', head: true }).eq('status', 'pending')
    q.then(({ count }) => setN(count || 0))
  }, [table])
  return n
}

/* ---------------- shared data hooks ---------------- */

function useRows(kind: Kind) {
  const { changes, revision } = useDrafts()
  const [rows, setRows] = useState<ContentRow[] | null>(null)
  const reload = useCallback(async () => {
    const { data } = await supabase.from('content_items').select('kind,slug,data,visible,deleted,sort,updated_at').eq('kind', kind)
    setRows((data as ContentRow[]) || [])
  }, [kind, revision])
  useEffect(() => { reload() }, [reload])
  return { rows: rows ? overlayRows(rows, changes, 'content_items', kind) : null, reload }
}

function useFeatures() {
  const { changes, stage, revision } = useDrafts()
  const [base, setBase] = useState<HomeFeature[]>([])
  const reload = useCallback(async () => {
    const { data } = await supabase.from('home_features').select('slot,mode,item_kind,item_slug')
    setBase((data as HomeFeature[]) || [])
  }, [revision])
  useEffect(() => { reload() }, [reload])
  const features = overlayRows(base, changes, 'home_features')
  const set = async (slot: string, patch: Partial<HomeFeature>) => {
    const cur = features.find(f => f.slot === slot) || { slot, mode: 'latest', item_kind: null, item_slug: null }
    stage({ table: 'home_features', key: slot, operation: 'upsert', value: { ...cur, ...patch } })
  }
  return { features, set, reload }
}

const SLOT_LABEL: Record<string, string> = { lead: 'Lead story', blog: 'Blog card', podcast: 'Podcast card' }

/* ---------------- content manager ---------------- */

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
function shortDate(v?: string) {
  if (!v) return ''
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v)
  const d = m ? { mo: +m[2] - 1, day: +m[3] } : (() => { const t = new Date(v); return isNaN(+t) ? null : { mo: t.getMonth(), day: t.getDate() } })()
  return d ? `${MON[d.mo]} ${d.day}` : ''
}
function readMins(x: any) {
  const r = x.readTime
  if (typeof r === 'number') return r
  const n = parseInt(String(r || ''), 10)
  return isNaN(n) ? 0 : n
}
function RowMeta({ def, x, updated, views }: { def: KindDef; x: any; updated?: string; views?: number }) {
  const pub = shortDate(def.date?.(x))
  const upd = x._origin !== 'built-in' ? shortDate(updated) : ''
  const a = def.author?.(x)
  const first = (a?.name || '').trim().split(/\s+/)[0]
  const isArticle = def.kind === 'article'
  const mins = isArticle ? readMins(x) : 0
  const rest = isArticle ? '' : def.sub(x)
  return (
    <span className="adm-meta">
      {upd && <span className="adm-mpill" data-tip="Last updated">{I.pencil}{upd}</span>}
      {pub && <span className="adm-mpill" data-tip="Published">{I.globe}{pub}</span>}
      {def.author && <span className="adm-mpill adm-mpill--who" data-who-name={a?.name || 'No writer set'} data-who-img={a?.image || ''} data-who-mail={a?.email || 'No email on file'}>{a?.image ? <img src={a.image} alt="" loading="lazy" /> : <i className="adm-mpill-ph">{I.user}</i>}{first || 'No writer'}</span>}
      {views !== undefined && <span className="adm-mpill" data-tip="Page views, last 30 days">{I.eye}{views.toLocaleString('en-US')}</span>}
      {isArticle && mins > 0 && <span className="adm-mpill" data-tip="Reading time">{mins} min</span>}
      {rest && <span className="adm-meta-rest">{rest}</span>}
    </span>
  )
}

let adminNames: Promise<Record<string, string>> | null = null
const getNames = () => adminNames ||= Promise.resolve(supabase.rpc('list_admins')).then(({ data }) => Object.fromEntries((data || []).map((a: any) => [String(a.email).toLowerCase(), a.name || ''])))
const getAt = (o: any, path: string) => path.split('.').reduce((v, k) => v?.[k], o)
function changedParts(def: KindDef, h: any): string[] {
  if (!h.before && h.after) return ['Created']
  if (h.before && !h.after) return ['Removed']
  const a = h.before?.data || {}, b = h.after?.data || {}
  const out: string[] = []
  if (h.before?.visible !== h.after?.visible) out.push(h.after?.visible ? 'Shown on site' : 'Hidden from site')
  if (h.before?.deleted !== h.after?.deleted) out.push(h.after?.deleted ? 'Removed' : 'Restored')
  for (const f of def.fields) if (JSON.stringify(getAt(a, f.k) ?? null) !== JSON.stringify(getAt(b, f.k) ?? null)) out.push(f.label)
  return out.length ? out : changeTypes(h)
}
function EditorFilter({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
  const [open, setOpen] = useState(false)
  const [admins, setAdmins] = useState<any[]>([])
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => { supabase.rpc('list_admins').then(({ data }) => setAdmins((data || []).filter((a: any) => a.has_access))) }, [])
  useEffect(() => {
    if (!open) return
    const off = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', off); return () => document.removeEventListener('mousedown', off)
  }, [open])
  const cur = admins.find((a) => a.email.toLowerCase() === value)
  const face = (a: any) => a.avatar ? <img src={a.avatar} alt="" referrerPolicy="no-referrer" /> : <i className="adm-mpill-ph">{I.user}</i>
  return (
    <span className="adm-star-wrap adm-ed" ref={ref}>
      <button type="button" className={'adm-pill' + (cur ? ' is-on' : '')} aria-expanded={open} onClick={() => setOpen(!open)}>
        {cur ? <>{face(cur)}{(cur.name || cur.email).split(' ')[0]}</> : 'Sort by editor'} {I.down}
      </button>
      {open && (
        <span className="adm-menu adm-ed-menu">
          <span className="adm-ed-label">Sort by editor</span>
          <button type="button" className={!value ? 'is-on' : ''} onClick={() => { onChange(null); setOpen(false) }}>Everyone</button>
          {admins.map((a) => (
            <button key={a.email} type="button" className={value === a.email.toLowerCase() ? 'is-on' : ''} onClick={() => { onChange(a.email.toLowerCase()); setOpen(false) }}>
              {face(a)}<span><b>{a.name || a.email.split('@')[0]}</b><small>{a.email}</small></span>
            </button>
          ))}
        </span>
      )}
    </span>
  )
}

function RowHistory({ def, slug }: { def: KindDef; slug: string }) {
  const [rows, setRows] = useState<any[] | null>(null)
  const [names, setNames] = useState<Record<string, string>>({})
  useEffect(() => {
    supabase.from('activity_log').select('*').eq('kind', def.kind).eq('slug', slug).order('created_at', { ascending: false }).limit(3).then(({ data }) => setRows(data || []))
    getNames().then(setNames).catch(() => {})
  }, [def.kind, slug])
  return (
    <div className="adm-xhist">
      <div className="adm-xhist-head"><span>Recent changes</span><button type="button" className="adm-xlink">All history {I.ext}</button></div>
      {!rows ? <p className="adm-xhist-empty">Loading…</p> : !rows.length ? <p className="adm-xhist-empty">No changes published yet.</p> : (
        <ul>{rows.map((h) => {
          const mail = h.actor_email || ''
          const who = names[mail.toLowerCase()] || mail.split('@')[0] || 'System'
          return <li key={h.id}><b>{who}</b><span className="adm-xhist-mail">{mail}</span><span className="adm-mpill" data-tip="Changed on">{I.pencil}{shortDate(h.created_at)}, {new Date(h.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span><em>{changedParts(def, h).join(', ')}</em></li>
        })}</ul>
      )}
    </div>
  )
}

function firstSentences(t: string, n = 2) {
  const parts = (t || '').replace(/\s+/g, ' ').trim().match(/[^.!?]+[.!?]+/g)
  return parts ? parts.slice(0, n).join(' ').trim() : (t || '').slice(0, 220)
}
function RowDetails({ def, x }: { def: KindDef; x: any }) {
  const desc = firstSentences(x.excerpt || x.detail?.intro || x.summary || x.description || x.question || x.a || '')
  const list = (label: string, v?: string[]) => v && v.length ? <div className="adm-xrow"><span>{label}</span><div className="adm-xchips">{v.map((c) => <b key={c}>{c}</b>)}</div></div> : null
  const fact = (label: string, v: any) => v || v === 0 ? <div className="adm-xfact"><span>{label}</span><b>{v}</b></div> : null
  const blocks: any[] = x.detail?.blocks || []
  const imgs = blocks.filter((b) => b?.type === 'img').length
  return (
    <div className="adm-xpanel">
      {desc && <p className="adm-xdesc">{desc}</p>}
      {list('Blog categories', x.categories)}
      {list('Hub topics', x.topics)}
      <div className="adm-xfacts">
        {def.author && fact('Writer', [x.detail?.author?.name, x.detail?.author?.role].filter(Boolean).join(', ') || 'Not set')}
        {def.kind === 'article' && fact('Body sections', blocks.length || 'Short body only')}
        {def.kind === 'article' && imgs > 0 && fact('Images in body', imgs)}
        {def.kind === 'article' && fact('Highlights', (x.detail?.highlights || []).length)}
        {def.kind === 'article' && fact('FAQ questions', (x.detail?.faq || []).length)}
        {def.kind === 'episode' && fact('Guest', x.guest)}
        {def.kind === 'episode' && fact('Length', x.duration)}
        {fact('Status', x._visible ? 'Shown on the site' : 'Hidden')}
        {fact('Web address', def.url ? def.url(x._slug) : x._slug)}
      </div>
      <RowHistory def={def} slug={x._slug} />
      {x.sourceUrl && <a className="adm-xlink" href={x.sourceUrl} target="_blank" rel="noreferrer">Original source {I.ext}</a>}
    </div>
  )
}

function ContentManager({ def }: { def: KindDef }) {
  const { stage } = useDrafts()
  const { rows, reload } = useRows(def.kind)
  const { features, set: setFeature } = useFeatures()
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<'all' | 'updated' | 'hidden'>('all')
  const [editing, setEditing] = useState<any | null>(null)
  const [starMenu, setStarMenu] = useState<string | null>(null)
  const [limit, setLimit] = useState(60)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [editor, setEditor] = useState<string | null>(null)
  const [lastBy, setLastBy] = useState<Record<string, string>>({})
  useEffect(() => {
    supabase.from('activity_log').select('slug,actor_email,created_at').eq('kind', def.kind).order('created_at', { ascending: false }).limit(5000).then(({ data }) => {
      const m: Record<string, string> = {}
      for (const r of data || []) if (r.slug && r.actor_email && !m[r.slug]) m[r.slug] = r.actor_email.toLowerCase()
      setLastBy(m)
    })
  }, [def.kind])
  const [views, setViews] = useState<Record<string, number> | null>(null)
  useEffect(() => {
    if (def.kind !== 'article' && def.kind !== 'episode') return
    supabase.rpc('popular_items', { _kind: def.kind, _limit: 5000 }).then(({ data }) => setViews(Object.fromEntries((data || []).map((r: any) => [r.slug, Number(r.views) || 0]))))
  }, [def.kind])

  const items = useMemo(() => {
    if (!rows) return []
    const all = mergeRows(KINDS[def.kind].base(), rows, KINDS[def.kind].key, true)
    const sorted = def.date ? [...all].sort((a, b) => ((def.date?.(a) || '') < (def.date?.(b) || '') ? 1 : -1)) : all
    return sorted
  }, [rows, def])
  const shown = items.filter((x) => {
    if (filter === 'updated' && x._origin !== 'edited') return false
    if (filter === 'hidden' && x._visible) return false
    if (editor && lastBy[x._slug] !== editor) return false
    if (!q) return true
    const s = (def.title(x) + ' ' + def.sub(x)).toLowerCase()
    return s.includes(q.toLowerCase())
  })

  const rowOf = (slug: string) => rows?.find((r) => r.slug === slug)
  const write = async (slug: string, patch: Partial<ContentRow>, action: string) => {
    const before = rowOf(slug) || null
    const base = before || { kind: def.kind, slug, data: {}, visible: true, deleted: false }
    stage({ table: 'content_items', kind: def.kind, key: slug, operation: 'upsert', value: { ...base, ...patch, kind: def.kind, slug } })
    return true
  }
  const toggleVisible = (x: any) => write(x._slug, { visible: !x._visible, data: rowOf(x._slug)?.data || {} }, x._visible ? 'hide' : 'show')
  const remove = async (x: any) => {
    if (!(await askDelete(def.title(x), 'It will disappear from the site once you save your changes. You can undo this from History.'))) return
    if (x._origin === 'new') {
      stage({ table: 'content_items', kind: def.kind, key: x._slug, operation: 'delete' })
    } else await write(x._slug, { deleted: true, data: rowOf(x._slug)?.data || {} }, 'delete')
  }
  const restore = async (slug: string) => {
    if (!confirm('Discard all edits and return to the original version?')) return
    stage({ table: 'content_items', kind: def.kind, key: slug, operation: 'delete' }); setEditing(null)
  }

  const starredSlots = (slug: string) => (def.star || []).filter((s) => { const f = features.find((x) => x.slot === s); return f?.mode === 'pinned' && f.item_slug === slug })
  const star = async (slug: string, slot: string) => {
    const on = starredSlots(slug).includes(slot as any)
    await setFeature(slot, on ? { mode: 'latest', item_kind: null, item_slug: null } : { mode: 'pinned', item_kind: def.kind, item_slug: slug })
    setStarMenu(null)
  }

  const open = (x?: any) => {
    if (!x) return setEditing({ _new: true })
    let item = { ...x }
    if (def.kind === 'article') item.detail = { ...(builtInDetail(x._slug) || {}), ...(x.detail || {}) }
    setEditing(item)
  }

  return (
    <section className="adm-card">
      <div className="adm-card-head">
        <div>
          <h2>{def.label}</h2>
          <p>{items.length} {def.singular}{items.length === 1 ? '' : 's'} · {items.filter((x) => x._origin === 'edited').length} updated · {items.filter((x) => x._origin === 'new').length} added{def.star ? ' · Star an item to feature it in the homepage hero' : ''}</p>
        </div>
        <button type="button" className="adm-btn" onClick={() => open()}>{I.plus} Add {def.singular}</button>
      </div>
      <div className="adm-toolbar">
        <input className="adm-field adm-search" placeholder={`Search ${def.label.toLowerCase()}…`} value={q} onChange={(e) => setQ(e.target.value)} />
        <EditorFilter value={editor} onChange={setEditor} />
        <div className="adm-seg adm-seg--sm">
          {(['all', 'updated', 'hidden'] as const).map((f) => <button key={f} type="button" className={filter === f ? 'is-on' : ''} onClick={() => setFilter(f)}>{f === 'all' ? 'All' : f === 'updated' ? 'Updated' : 'Hidden'}</button>)}
        </div>
      </div>
      {!rows ? <p className="adm-hint">Loading…</p> : (
        <ul className="adm-list">
          {shown.slice(0, limit).map((x) => {
            const stars = starredSlots(x._slug)
            const img = def.image?.(x)
            return (
              <li key={x._slug} className={'adm-row' + (x._visible ? '' : ' is-hidden')}>
                {def.image && <span className="adm-thumb">{img ? <img src={img} alt="" loading="lazy" /> : I.image}</span>}
                <button type="button" className="adm-row-main" onClick={() => open(x)}>
                  <b>{def.title(x) || <em>Untitled</em>}</b>
                  <RowMeta def={def} x={x} updated={rowOf(x._slug)?.updated_at} views={views ? views[x._slug] || 0 : undefined} />
                <span className="adm-row-tags adm-row-tags--in">
                  {x._origin !== 'built-in' && <span className="adm-tag">{x._origin === 'new' ? 'Added' : 'Updated'}</span>}
                  {!x._visible && <span className="adm-tag adm-tag--muted">Hidden</span>}
                  {stars.map((s) => <span key={s} className="adm-tag adm-tag--star">{SLOT_LABEL[s]}</span>)}
                </span>
                </button>
                <span className="adm-row-tags adm-row-tags--out">
                  {x._origin !== 'built-in' && <span className="adm-tag">{x._origin === 'new' ? 'Added' : 'Updated'}</span>}
                  {!x._visible && <span className="adm-tag adm-tag--muted">Hidden</span>}
                  {stars.map((s) => <span key={s} className="adm-tag adm-tag--star">{SLOT_LABEL[s]}</span>)}
                </span>
                <span className="adm-row-tools">
                  {def.star && (
                    <span className="adm-star-wrap">
                      <button type="button" className={'adm-icon-btn adm-star' + (stars.length ? ' is-on' : '')} data-tip={stars.length ? 'Featured on the homepage. Click to change' : 'Feature on the homepage'}
                        aria-label="Feature on the homepage" onClick={() => def.star?.length === 1 ? star(x._slug, def.star[0]) : setStarMenu(starMenu === x._slug ? null : x._slug)}>
                        {stars.length ? I.starFill : I.star}
                      </button>
                      {starMenu === x._slug && (
                        <span className="adm-menu">
                          {def.star.map((s) => <button key={s} type="button" onClick={() => star(x._slug, s)}>{starredSlots(x._slug).includes(s) ? I.starFill : I.star} {starredSlots(x._slug).includes(s) ? `Remove from ${SLOT_LABEL[s]}` : `Feature as ${SLOT_LABEL[s]}`}</button>)}
                        </span>
                      )}
                    </span>
                  )}
                  {def.url && x._visible && <a className="adm-icon-btn" href={def.url(x._slug)} target="_blank" rel="noreferrer" data-tip="Open this page on the site" aria-label="View on site">{I.ext}</a>}
                  <button type="button" className="adm-icon-btn" onClick={() => toggleVisible(x)} data-tip={x._visible ? 'Shown on the site. Click to hide it' : 'Hidden from the site. Click to show it'} aria-label="Toggle visibility">{x._visible ? I.eye : I.eyeOff}</button>
                  <button type="button" className="adm-icon-btn" onClick={() => open(x)} aria-label="Edit" data-tip="Edit this item">{I.pencil}</button>
                  <button type="button" className="adm-icon-btn adm-danger" onClick={() => remove(x)} aria-label="Delete" data-tip="Delete this item">{I.trash}</button>
                  <button type="button" className={'adm-icon-btn adm-xbtn' + (expanded === x._slug ? ' is-open' : '')} onClick={() => setExpanded(expanded === x._slug ? null : x._slug)} aria-expanded={expanded === x._slug} aria-label="More details" data-tip={expanded === x._slug ? 'Hide details' : 'Show more details'}>{I.down}</button>
                </span>
                {expanded === x._slug && <RowDetails def={def} x={x} />}
              </li>
            )
          })}
        </ul>
      )}
      {shown.length > limit && <button type="button" className="adm-pill adm-more" onClick={() => setLimit(limit + 60)}>Show more ({shown.length - limit} left)</button>}
      {rows && !shown.length && <p className="adm-hint">Nothing matches.</p>}
      {editing && (
        <Editor def={def} item={editing} existing={new Set(items.map((x) => x._slug))}
          onClose={() => setEditing(null)}
          onRestore={editing._origin === 'edited' ? () => restore(editing._slug) : undefined}
          onSave={async (slug, data) => {
            const row = rowOf(slug)
            const ok = await write(slug, { data, visible: row?.visible ?? true, deleted: false }, editing._new ? 'create' : 'edit')
            if (ok) setEditing(null)
          }} />
      )}
    </section>
  )
}

function wordsIn(d: any) {
  const blocks = d?.blocks || []
  const text = [d?.intro || '', ...blocks.map((b: any) => [b.text, ...(b.items || [])].filter(Boolean).join(' '))].join(' ')
  return text.split(/\s+/).filter(Boolean).length
}

function Editor({ def, item, existing, onClose, onSave, onRestore }: { def: KindDef; item: any; existing: Set<string>; onClose: () => void; onSave: (slug: string, data: any) => Promise<void>; onRestore?: () => void }) {
  const { _slug, _origin, _visible, _deleted, _new, ...initial } = item
  const [v, setV] = useState<any>(() => def.kind === 'article' && !initial.sources && initial.sourceUrl ? { ...initial, sources: [initial.sourceUrl] } : initial)
  const [slug, setSlug] = useState<string>(_slug || '')
  const [slugTouched, setSlugTouched] = useState(false)
  const [example, setExample] = useState<string | null>(null)
  useEffect(() => { if (!example) return; const k = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); setExample(null) } }; addEventListener('keydown', k, true); return () => removeEventListener('keydown', k, true) }, [example])
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const titleKey = def.fields[0].k
  const autoSlug = _new && !slugTouched ? keyOf(getPath(v, titleKey) || '') : slug

  const save = async () => {
    const missing = def.fields.filter((f) => f.required && !getPath(v, f.k))
    if (missing.length) return setErr(`Please fill in: ${missing.map((f) => f.label).join(', ')}`)
    const finalSlug = _new ? autoSlug : _slug
    if (!finalSlug) return setErr('Please add a web address (slug).')
    if (_new && existing.has(finalSlug)) return setErr('Another item already uses this web address — change the slug.')
    let data = { ...v }
    for (const f of def.fields) if (f.type === 'lines' || f.type === 'list') { const x = getPath(data, f.k); if (Array.isArray(x)) data = setPath(data, f.k, x.map((s: string) => s.trim()).filter(Boolean)) }
    if (def.kind === 'article') {
      data.sourceUrl = data.sources?.[0] || undefined
      if (!data.readTime) data.readTime = Math.max(1, Math.round(wordsIn(data.detail) / 220))
      if (!data.categories?.length) data.categories = ['Blog']
      if (!data.excerpt && data.detail?.intro) data.excerpt = data.detail.intro.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').slice(0, 200)
    }
    if (_new) data.slug = finalSlug
    setBusy(true); setErr('')
    await onSave(finalSlug, data)
    setBusy(false)
  }

  return (
    <Modal wide title={_new ? `New ${def.singular}` : `Edit ${def.singular}`} onClose={onClose}
      footer={<>
        {err && <p className="adm-err adm-grow">{err}</p>}
        {!err && <span className="adm-grow adm-hint">{_origin === 'edited' ? 'This item has edits saved over the original.' : _new ? 'New items stay unpublished until Save changes.' : 'Apply edits, then publish with Save changes.'}</span>}
        {onRestore && <button type="button" className="adm-pill" onClick={onRestore}>{I.restore} Restore original</button>}
        <button type="button" className="adm-pill" onClick={onClose}>Cancel</button>
        <button type="button" className="adm-btn" onClick={save} disabled={busy}>{busy ? 'Applying…' : _new ? 'Create' : 'Apply edits'}</button>
      </>}>
      <div className="adm-form">
        {_new && (
          <label className="adm-wide">
            <span className="adm-label">Web address</span>
            <div className="adm-slug"><span>{def.url ? def.url('').replace(/\/$/, '') + '/' : ''}</span>
              <input className="adm-field" value={autoSlug} onChange={(e) => { setSlugTouched(true); setSlug(keyOf(e.target.value)) }} placeholder="filled from the title" /></div>
          </label>
        )}
        {(() => {
          const cell = (f: any) => (
            <div key={f.k} className={f.cls ? f.cls : f.wide || ['blocks', 'records', 'chips', 'image'].includes(f.type) ? 'adm-wide' : ''}>
              <span className="adm-label">{f.label}{f.required ? ' *' : ''}</span>
              <FieldInput f={f} value={getPath(v, f.k)} onChange={(x) => setV((cur: any) => setPath(cur, f.k, x))} folder={def.kind} />
              {f.help && <small className="adm-help">{f.help}</small>}
            </div>
          )
          const groups: { g?: { title: string; sub: string; ex?: string }; fs: any[] }[] = []
          def.fields.forEach((f: any) => { if (f.group || !groups.length) groups.push({ g: f.group, fs: [] }); groups[groups.length - 1].fs.push(f) })
          return groups.map((gr, i) => gr.g ? (
            <section key={i} className="adm-sec adm-wide">
              <div className="adm-sec-head"><div>
                <h3 className="adm-sec-title">{gr.g.title}</h3>
                <p className="adm-sec-sub">{gr.g.sub}</p>
              </div>{EX_PAGE[def.kind] && (gr.g.ex || (def.kind === 'article' && EX_KEY[gr.g.title])) && (
                <button type="button" className="adm-icon-btn" data-tip={`See where this shows on a real ${def.singular}`} aria-label="See an example" onClick={() => setExample(gr.g!.ex || EX_KEY[gr.g!.title])}>{I.expand}</button>
              )}</div>
              <div className="adm-form">{gr.fs.map(cell)}</div>
            </section>
          ) : gr.fs.map(cell))
        })()}
      </div>
      {example && createPortal(
        <div className="adm adm-example" role="dialog" aria-label={`Example ${def.singular}`}>
          <iframe src={`${EX_PAGE[def.kind]}?example=${example}`} title={`Example ${def.singular}`} />
          <button type="button" className="adm-icon-btn adm-example-x" data-tip="Close example" aria-label="Close example" onClick={() => setExample(null)}>{I.x}</button>
        </div>, document.body)}
    </Modal>
  )
}

const EX_PAGE: Record<string, string> = { article: '/articles/15-longevity-biomarkers-everyone-should-track', episode: '/podcast/why-normal-tests-don-t-mean-you-re-healthy', entity: '/knowledge/hrv', biohacker: '/biohackers/kris-gethin' }
const EX_KEY: Record<string, string> = { 'Basics': 'basics', 'Cover and summary': 'cover', 'Article body': 'body', 'Tags': 'tags', 'Writer': 'writer', 'Highlights': 'highlights', 'Sources': 'writer', 'FAQ': 'highlights' }

/* ---------------- homepage ---------------- */

function HomepageManager() {
  const { changes, stage, revision } = useDrafts()
  const [chooser, setChooser] = useState<string | null>(null)
  const [chooseKind, setChooseKind] = useState<'article' | 'episode'>('article')
  const [chooseQuery, setChooseQuery] = useState('')
  const [slotKinds, setSlotKinds] = useState<Record<string, 'article' | 'episode'>>({ lead: 'article', blog: 'article', podcast: 'episode' })
  const { rows: pRows } = useRows('problem')
  const problemList = useMemo(() => mergeRows(KINDS.problem.base(), pRows || [], KINDS.problem.key), [pRows])
  const { features, set } = useFeatures()
  const { rows: aRows } = useRows('article')
  const { rows: eRows } = useRows('episode')
  const [pop, setPop] = useState<Record<string, { slug: string; views: number }[]>>({})
  const [popKind, setPopKind] = useState<'both' | 'article' | 'episode'>('both')
  const [popAll, setPopAll] = useState(false)
  const [startBase, setStartBase] = useState<Partial<StartHere> | undefined>()
  const startRow = changes.find(c => c.table === 'site_settings' && c.key === 'start_here')
  const start = startHereValue(startRow ? startRow.operation === 'delete' ? undefined : startRow.value : startBase, problemList.map(p => p._slug))
  const setStart = (value: StartHere) => stage({ table: 'site_settings', key: 'start_here', operation: 'upsert', value })
  useEffect(() => {
    Promise.all([supabase.rpc('popular_items', { _kind: 'article', _limit: 10 }), supabase.rpc('popular_items', { _kind: 'episode', _limit: 10 })])
      .then(([a, e]) => setPop({ article: (a.data as any) || [], episode: (e.data as any) || [] }))
    supabase.from('site_settings').select('value').eq('key', 'start_here').maybeSingle().then(({ data }) => setStartBase(data?.value as any))
  }, [revision])
  const lists = useMemo(() => ({
    article: aRows ? mergeRows(KINDS.article.base(), aRows, KINDS.article.key).sort((a: any, b: any) => (a.date < b.date ? 1 : -1)) : [],
    episode: eRows ? mergeRows(KINDS.episode.base(), eRows, KINDS.episode.key).sort((a: any, b: any) => (a.date < b.date ? 1 : -1)) : [],
  }), [aRows, eRows])

  const resolved = useMemo(() => resolveHero(features, lists, Object.fromEntries(Object.entries(pop).map(([k, v]) => [k, v.map(x => x.slug)]))), [features, lists, pop])

  if (chooser) return <section className="adm-card">
    <div className="adm-card-head"><div><h2>Choose content · {SLOT_LABEL[chooser]}</h2></div><button type="button" className="adm-pill" onClick={() => setChooser(null)}>Back to Homepage</button></div>
    <div className="adm-toolbar"><select className="adm-field adm-picker-kind" aria-label="Content type" value={chooseKind} onChange={e => setChooseKind(e.target.value as 'article' | 'episode')}><option value="article">Blog article</option><option value="episode">Podcast episode</option></select>
    <input className="adm-field adm-search" aria-label="Search content to feature" placeholder="Search all content…" value={chooseQuery} onChange={e => setChooseQuery(e.target.value)} /></div>
    <ul className="adm-list">{lists[chooseKind].filter(x => [x.title, x.guest, x.date].join(' ').toLowerCase().includes(chooseQuery.toLowerCase())).map(x => <li className="adm-row" key={x._slug}>
      <span className="adm-thumb">{x.image ? <img src={x.image} alt="" loading="lazy" /> : I.image}</span><div className="adm-row-main adm-row-static"><b>{x.title}</b><span>{x.date}{x.guest ? ` · ${x.guest}` : ''}</span></div>
      <button type="button" className="adm-pill" onClick={() => { set(chooser, { mode: 'pinned', item_kind: chooseKind, item_slug: x._slug }); setChooser(null) }}>Select</button>
    </li>)}</ul>
  </section>

  return (
    <>
      <section className="adm-card">
        <div className="adm-card-head"><div><h2>Homepage hero</h2><p>Choose what each hero card shows. Starring an item in Blog or Podcast pins it here too.</p></div></div>
        <div className="adm-slots">
          {(['lead', 'blog', 'podcast'] as const).map((slot) => {
            const f = features.find((x) => x.slot === slot)
            const k: 'article' | 'episode' = f?.mode === 'pinned' && f.item_kind === 'episode' ? 'episode' : slot === 'podcast' ? 'episode' : 'article'
            const it = resolved[slot]
            const mode = f?.mode || 'latest'
            return (
              <div className="adm-slot" key={slot}>
                <span className="adm-kicker">{SLOT_LABEL[slot]}</span>
                <div className="adm-slot-art">{it?.image ? <img src={it.image} alt="" /> : I.image}</div>
                <b className="adm-slot-title">{it?.title || '—'}</b>
                <span className="adm-hint adm-slot-date">{it?.date || ''}</span>
                <div className="adm-seg adm-seg--sm adm-seg--fill">
                  {(['latest', 'popular', 'pinned'] as const).map((m) => (
                    <button key={m} type="button" className={mode === m ? 'is-on' : ''} onClick={() => set(slot, m === 'pinned' ? { mode: 'pinned', item_kind: k, item_slug: f?.item_slug || it?._slug } : { mode: m, item_kind: null, item_slug: null })}>
                      {m === 'latest' ? 'Latest' : m === 'popular' ? 'Most popular' : 'Starred'}
                    </button>
                  ))}
                </div>
                <div className="adm-choose-row"><select className="adm-field adm-field--sm" aria-label={`Content type for ${SLOT_LABEL[slot]}`} value={slotKinds[slot]} onChange={e => setSlotKinds(prev => ({ ...prev, [slot]: e.target.value as 'article' | 'episode' }))}><option value="article">Blog article</option><option value="episode">Podcast episode</option></select>
                <button type="button" className="adm-pill" onClick={() => { setChooseKind(slotKinds[slot]); setChooser(slot); setChooseQuery('') }}>Choose</button></div>
                <small className="adm-help adm-slot-help">{mode === 'popular' ? ((pop[k] || []).length ? `Most viewed in the last 30 days (${pop[k][0].views} views for the top one).` : 'No views counted yet — showing the latest until visitors start reading.') : mode === 'latest' ? `Newest ${k === 'article' ? 'blog post' : 'episode'} not already shown.` : ''}</small>
              </div>
            )
          })}
        </div>
      </section>
      <section className="adm-card">
        <div className="adm-card-head"><div><h2>“Start here” card</h2><p>The card in the hero that lists the problem pages.</p></div></div>
        <div className="adm-form">
          <label className="adm-wide"><span className="adm-label">Heading</span><input className="adm-field" value={start.title || ''} placeholder="What are you interested in?" onChange={(e) => setStart({ ...start, title: e.target.value })} /></label>
          <label className="adm-wide"><span className="adm-label">Text</span><textarea className="adm-field" rows={2} value={start.body || ''} placeholder="Pick the symptom. Each page routes you to what to measure and what to consider." onChange={(e) => setStart({ ...start, body: e.target.value })} /></label>
        </div>
        <div className="adm-wide"><span className="adm-label">Problem chips</span><FieldInput folder="home" f={{ k: 'chips', label: 'Problem chips', type: 'chips', options: () => problemList.map(p => [p._slug, p.name]) }} value={start.chips} onChange={chips => setStart({ ...start, chips })} /></div>
      </section>
      <section className="adm-card">
        <div className="adm-card-head"><div><h2>Most popular right now</h2><p>Page views over the last 30 days, counted once per visitor session.</p></div>
          <div className="adm-seg adm-seg--sm">
            {([['both', 'Both'], ['article', 'Blog'], ['episode', 'Podcast']] as const).map(([m, l]) => <button key={m} type="button" className={popKind === m ? 'is-on' : ''} onClick={() => setPopKind(m)}>{l}</button>)}
          </div></div>
        <div className={'adm-pop' + (popKind === 'both' ? '' : ' adm-pop--one')}>
          {(['article', 'episode'] as const).filter((k) => popKind === 'both' || popKind === k).map((k) => (
            <div key={k}>
              <span className="adm-kicker">{k === 'article' ? 'Blog posts' : 'Podcast episodes'}</span>
              {(pop[k] || []).length ? <ol className="adm-pop-list">{pop[k].slice(0, popAll ? 10 : 5).map((p, i) => {
                const x: any = lists[k].find((y: any) => y._slug === p.slug)
                return <li key={p.slug}><span className="adm-pop-n">{i + 1}</span><span className="adm-thumb">{x?.image ? <img src={x.image} alt="" loading="lazy" /> : I.image}</span>
                  <span className="adm-pop-title" data-tip={x?.title || p.slug}>{x?.title || p.slug}</span>
                  <span className="adm-mpill" data-tip="Page views, last 30 days">{I.eye}{Number(p.views).toLocaleString('en-US')}</span></li>
              })}</ol> : <p className="adm-hint">No views yet.</p>}
            </div>
          ))}
        </div>
        {(['article', 'episode'] as const).some((k) => (popKind === 'both' || popKind === k) && (pop[k] || []).length > 5) && (
          <button type="button" className="adm-pill adm-more" onClick={() => setPopAll(!popAll)}>{popAll ? 'Show top 5' : 'Show top 10'}</button>
        )}
      </section>
    </>
  )
}

/* ---------------- inbox ---------------- */

function Inbox() {
  const [kind, setKind] = useState<'biohacker' | 'newsletter'>('biohacker')
  const [rows, setRows] = useState<any[] | null>(null)
  const [showDone, setShowDone] = useState(false)
  const reload = useCallback(async () => {
    const { data } = await supabase.from('submissions').select('*').eq('kind', kind).order('created_at', { ascending: false }).limit(500)
    setRows(data || [])
  }, [kind])
  useEffect(() => { setRows(null); reload() }, [reload])
  const shown = (rows || []).filter((r) => showDone || !r.done)
  const exportCsv = () => {
    const keys = Array.from(new Set((rows || []).flatMap((r) => Object.keys(r.data))))
    const esc = (s: any) => `"${String(s ?? '').replace(/"/g, '""')}"`
    const csv = [['date', ...keys].join(','), ...(rows || []).map((r) => [r.created_at, ...keys.map((k) => r.data[k])].map(esc).join(','))].join('\n')
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = `${kind}-submissions.csv`; a.click()
  }
  return (
    <section className="adm-card">
      <div className="adm-card-head">
        <div><h2>Inbox</h2><p>Entries from the forms on the site.</p></div>
        <button type="button" className="adm-pill" onClick={exportCsv}>{I.download} Export CSV</button>
      </div>
      <div className="adm-toolbar">
        <div className="adm-seg adm-seg--sm">
          <button type="button" className={kind === 'biohacker' ? 'is-on' : ''} onClick={() => setKind('biohacker')}>Top Biohackers suggestions</button>
          <button type="button" className={kind === 'newsletter' ? 'is-on' : ''} onClick={() => setKind('newsletter')}>Newsletter sign-ups</button>
        </div>
        <label className="adm-check"><input type="checkbox" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} /> Show handled</label>
      </div>
      {!rows ? <p className="adm-hint">Loading…</p> : !shown.length ? <p className="adm-hint">Nothing new here.</p> : (
        <ul className="adm-list">
          {shown.map((r) => (
            <li key={r.id} className={'adm-row adm-row--top' + (r.done ? ' is-hidden' : '')}>
              <div className="adm-row-main adm-row-static">
                {kind === 'biohacker' ? <>
                  <b><span className="adm-tag">{r.data.action}</span> {r.data.firstName} {r.data.lastName}</b>
                  {r.data.link && <a href={r.data.link} target="_blank" rel="noreferrer noopener" className="adm-link">{r.data.link}</a>}
                  <span className="adm-pre">{r.data.description}</span>
                  <span>From {r.data.name} · <a className="adm-link" href={`mailto:${r.data.email}`}>{r.data.email}</a> · {new Date(r.created_at).toLocaleString()}</span>
                </> : <>
                  <b>{[r.data.firstName, r.data.lastName].filter(Boolean).join(' ') || r.data.email}</b>
                  <span>{r.data.email}{r.data.phone ? ` · ${r.data.phone}` : ''} · {r.data.source} · {new Date(r.created_at).toLocaleString()}</span>
                </>}
              </div>
              <span className="adm-row-tools">
                <button type="button" className="adm-pill" onClick={async () => { await supabase.from('submissions').update({ done: !r.done }).eq('id', r.id); reload() }}>{r.done ? 'Reopen' : <>{I.check} Mark handled</>}</button>
                <button type="button" className="adm-icon-btn adm-danger" aria-label="Delete" data-tip="Delete this entry" onClick={async () => { if (await askDelete(r.name || r.email || 'this entry', 'This inbox entry is deleted right away and cannot be recovered.')) { await supabase.from('submissions').delete().eq('id', r.id); reload() } }}>{I.trash}</button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

/* ---------------- admins ---------------- */

function AdminsManager({ email }: { email: string }) {
  const [admins, setAdmins] = useState<any[] | null>(null)
  const [requests, setRequests] = useState<any[]>([])
  const [add, setAdd] = useState('')
  const [err, setErr] = useState('')
  const reload = useCallback(async () => {
    const [a, r] = await Promise.all([
      supabase.rpc('list_admins'),
      supabase.from('admin_requests').select('*').eq('status', 'pending').order('created_at', { ascending: false }),
    ])
    setAdmins((a.data as any[]) || []); setRequests(r.data || [])
  }, [])
  useEffect(() => { reload() }, [reload])
  const setAccess = async (target: string, allow: boolean) => {
    setErr('')
    const { error } = await supabase.rpc('set_admin_email_access', { target_email: target, allow_access: allow })
    if (error) setErr(error.message)
    reload()
  }
  const me = email.toLowerCase()
  return (
    <>
      {requests.length > 0 && (
        <section className="adm-card">
          <div className="adm-card-head"><div><h2>Access requests</h2><p>People who signed in and asked for admin access.</p></div></div>
          <ul className="adm-list">
            {requests.map((r) => (
              <li key={r.user_id} className="adm-row">
                <div className="adm-row-main adm-row-static"><b>{r.name || r.email}</b><span>{r.email} · {new Date(r.created_at).toLocaleDateString()}</span></div>
                <span className="adm-row-tools">
                  <button type="button" className="adm-btn" onClick={() => setAccess(r.email, true)}>Approve</button>
                  <button type="button" className="adm-pill" onClick={async () => { await supabase.rpc('decline_admin_request', { target_user: r.user_id }); reload() }}>Decline</button>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
      <section className="adm-card">
        <div className="adm-card-head"><div><h2>Administrators</h2><p>Anyone with a verified @biohackers.world Google account is an admin automatically. Add other people by email, or revoke access — a revoked email stays blocked.</p></div></div>
        <form className="adm-toolbar" onSubmit={(e) => { e.preventDefault(); if (add.trim()) { setAccess(add.trim(), true); setAdd('') } }}>
          <input className="adm-field adm-search" type="email" placeholder="name@example.com" value={add} onChange={(e) => setAdd(e.target.value)} maxLength={255} />
          <button type="submit" className="adm-btn">{I.plus} Give access</button>
        </form>
        {err && <p className="adm-err">{err}</p>}
        {!admins ? <p className="adm-hint">Loading…</p> : (
          <ul className="adm-list">
            {admins.map((a) => {
              const protectedOne = a.email === OWNER || a.email === me
              return (
                <li key={a.email} className={'adm-row' + (a.source === 'Revoked' ? ' is-hidden' : '')}>
                  <span className="adm-thumb adm-thumb--round">{a.avatar ? <img src={a.avatar} alt="" referrerPolicy="no-referrer" /> : (a.name || a.email)[0].toUpperCase()}</span>
                  <div className="adm-row-main adm-row-static">
                    <b>{a.name || a.email}{a.email === me ? ' (you)' : ''}</b>
                    <span>{a.email} · {a.last_sign_in_at ? `last signed in ${new Date(a.last_sign_in_at).toLocaleDateString()}` : 'has not signed in yet'}</span>
                  </div>
                  <span className="adm-row-tags"><span className={'adm-tag' + (a.source === 'Revoked' ? ' adm-tag--muted' : '')}>{a.source}</span></span>
                  <span className="adm-row-tools">
                    {a.source === 'Revoked'
                      ? <button type="button" className="adm-pill" onClick={() => setAccess(a.email, true)}>Restore access</button>
                      : !protectedOne && <button type="button" className="adm-pill adm-danger" onClick={() => confirm(`Revoke admin access for ${a.email}?`) && setAccess(a.email, false)}>Revoke</button>}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </section>

    </>
  )
}
