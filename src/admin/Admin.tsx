// Biohacking Hub administration — layout, hierarchy and access rules follow the
// Sales (Invited Only) admin: Google sign-in, company-domain admins, email overrides.
import { useCallback, useEffect, useMemo, useState } from 'react'
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
import { History } from './History'
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
  return <DraftProvider><Dashboard session={a.session} /></DraftProvider>
}

/* ---------------- workspace ---------------- */

type View = 'panel' | 'split' | 'live'
type Tab = 'home' | Kind | 'inbox' | 'admins' | 'history'

function ViewSwitcher({ view, setView, swapped, setSwapped }: { view: View; setView: (v: View) => void; swapped: boolean; setSwapped: (v: boolean) => void }) {
  const items: [View, string, React.ReactNode][] = [['panel', 'Admin panel', I.panel], ['split', 'Split view', I.split], ['live', 'Live site', I.monitor]]
  return (
    <div className="adm-switch-row">
      <div className="adm-seg">
        {items.map(([k, l, ic]) => <button key={k} type="button" className={view === k ? 'is-on' : ''} onClick={() => setView(k)}>{ic}<span>{l}</span></button>)}
      </div>
      {view === 'split' && <button type="button" className="adm-pill" onClick={() => setSwapped(!swapped)}>{I.swap} Swap sides</button>}
      <a className="adm-pill" href="/" target="_blank" rel="noreferrer">{I.ext} Live site in a new window</a>
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
    <main className="adm adm-full"><ViewSwitcher view={view} setView={setView} swapped={swapped} setSwapped={setSwapped} /><LivePane /></main>
  )
  if (view === 'split') {
    const panel = <div className="adm-split-panel">{body}</div>
    return (
      <main className="adm adm-full">
        <ViewSwitcher view={view} setView={setView} swapped={swapped} setSwapped={setSwapped} />
        <div className="adm-split">{swapped ? <><LivePane />{panel}</> : <>{panel}<LivePane /></>}</div>
      </main>
    )
  }
  return (
    <main className="adm adm-page">
      <div className="adm-glow" aria-hidden />
      <div className="adm-wrap">
        <ViewSwitcher view={view} setView={setView} swapped={swapped} setSwapped={setSwapped} />
        {body}
      </div>
    </main>
  )
}

const TABS: [Tab, string][] = [
  ['home', 'Homepage'], ['article', 'Blog'], ['episode', 'Podcast'], ['entity', 'Knowledge Base'], ['howto', 'How To'],
  ['history', 'History'], ['biohacker', 'Top Biohackers'], ['topic', 'Topics'], ['problem', 'Problems'], ['faq', 'FAQ'], ['event', 'Events'], ['social', 'Social Media'],
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
        {TABS.map(([k, l]) => <button key={k} type="button" className={tab === k ? 'adm-pill is-on' : 'adm-pill'} onClick={() => setTab(k)}>{l}</button>)}
      </nav>
      {tab === 'home' ? <HomepageManager /> : tab === 'history' ? <History /> : tab === 'inbox' ? <Inbox /> : tab === 'admins' ? <AdminsManager email={u.email || ''} /> : def ? <ContentManager key={def.kind} def={def} /> : null}
    </div>
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

function ContentManager({ def }: { def: KindDef }) {
  const { stage } = useDrafts()
  const { rows, reload } = useRows(def.kind)
  const { features, set: setFeature } = useFeatures()
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<'all' | 'edited' | 'hidden'>('all')
  const [editing, setEditing] = useState<any | null>(null)
  const [starMenu, setStarMenu] = useState<string | null>(null)
  const [limit, setLimit] = useState(60)

  const items = useMemo(() => {
    if (!rows) return []
    const all = mergeRows(KINDS[def.kind].base(), rows, KINDS[def.kind].key, true)
    const sorted = def.date ? [...all].sort((a, b) => ((def.date?.(a) || '') < (def.date?.(b) || '') ? 1 : -1)) : all
    return sorted
  }, [rows, def])
  const shown = items.filter((x) => {
    if (filter === 'edited' && x._origin === 'built-in') return false
    if (filter === 'hidden' && x._visible) return false
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
    if (!confirm(`Delete “${def.title(x)}”? You can undo this from History.`)) return
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
          <p>{items.length} {def.singular}{items.length === 1 ? '' : 's'} · {items.filter((x) => x._origin !== 'built-in').length} edited or added{def.star ? ' · Star an item to feature it in the homepage hero' : ''}</p>
        </div>
        <button type="button" className="adm-btn" onClick={() => open()}>{I.plus} Add {def.singular}</button>
      </div>
      <div className="adm-toolbar">
        <input className="adm-field adm-search" placeholder={`Search ${def.label.toLowerCase()}…`} value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="adm-seg adm-seg--sm">
          {(['all', 'edited', 'hidden'] as const).map((f) => <button key={f} type="button" className={filter === f ? 'is-on' : ''} onClick={() => setFilter(f)}>{f === 'all' ? 'All' : f === 'edited' ? 'Edited' : 'Hidden'}</button>)}
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
                  <span>{def.sub(x)}</span>
                </button>
                <span className="adm-row-tags">
                  {x._origin !== 'built-in' && <span className="adm-tag">{x._origin === 'new' ? 'Added' : 'Edited'}</span>}
                  {!x._visible && <span className="adm-tag adm-tag--muted">Hidden</span>}
                  {stars.map((s) => <span key={s} className="adm-tag adm-tag--star">{SLOT_LABEL[s]}</span>)}
                </span>
                <span className="adm-row-tools">
                  {def.star && (
                    <span className="adm-star-wrap">
                      <button type="button" className={'adm-icon-btn adm-star' + (stars.length ? ' is-on' : '')} title={stars.length ? 'Featured on the homepage' : 'Feature on the homepage'}
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
                  {def.url && x._visible && <a className="adm-icon-btn" href={def.url(x._slug)} target="_blank" rel="noreferrer" title="View on site" aria-label="View on site">{I.ext}</a>}
                  <button type="button" className="adm-icon-btn" onClick={() => toggleVisible(x)} title={x._visible ? 'Visible — click to hide' : 'Hidden — click to show'} aria-label="Toggle visibility">{x._visible ? I.eye : I.eyeOff}</button>
                  <button type="button" className="adm-icon-btn" onClick={() => open(x)} aria-label="Edit">{I.pencil}</button>
                  <button type="button" className="adm-icon-btn adm-danger" onClick={() => remove(x)} aria-label="Delete">{I.trash}</button>
                </span>
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
  const [v, setV] = useState<any>(initial)
  const [slug, setSlug] = useState<string>(_slug || '')
  const [slugTouched, setSlugTouched] = useState(false)
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
    for (const f of def.fields) if (f.type === 'lines') { const x = getPath(data, f.k); if (Array.isArray(x)) data = setPath(data, f.k, x.map((s: string) => s.trim()).filter(Boolean)) }
    if (def.kind === 'article') {
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
        <button type="button" className="adm-btn" onClick={save} disabled={busy}>{busy ? 'Applying…' : 'Apply edits'}</button>
      </>}>
      <div className="adm-form">
        {_new && (
          <label className="adm-wide">
            <span className="adm-label">Web address</span>
            <div className="adm-slug"><span>{def.url ? def.url('').replace(/\/$/, '') + '/' : ''}</span>
              <input className="adm-field" value={autoSlug} onChange={(e) => { setSlugTouched(true); setSlug(keyOf(e.target.value)) }} placeholder="filled from the title" /></div>
          </label>
        )}
        {def.fields.map((f) => (
          <div key={f.k} className={f.wide || ['blocks', 'records', 'chips', 'image'].includes(f.type) ? 'adm-wide' : ''}>
            <span className="adm-label">{f.label}{f.required ? ' *' : ''}</span>
            <FieldInput f={f} value={getPath(v, f.k)} onChange={(x) => setV((cur: any) => setPath(cur, f.k, x))} folder={def.kind} />
            {f.help && <small className="adm-help">{f.help}</small>}
          </div>
        ))}
      </div>
    </Modal>
  )
}

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
  const [startBase, setStartBase] = useState<Partial<StartHere> | undefined>()
  const startRow = changes.find(c => c.table === 'site_settings' && c.key === 'start_here')
  const start = startHereValue(startRow ? startRow.operation === 'delete' ? undefined : startRow.value : startBase, problemList.map(p => p._slug))
  const setStart = (value: StartHere) => stage({ table: 'site_settings', key: 'start_here', operation: 'upsert', value })
  useEffect(() => {
    Promise.all([supabase.rpc('popular_items', { _kind: 'article', _limit: 5 }), supabase.rpc('popular_items', { _kind: 'episode', _limit: 5 })])
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
                <span className="adm-hint">{it?.date}</span>
                <div className="adm-seg adm-seg--sm adm-seg--fill">
                  {(['latest', 'popular', 'pinned'] as const).map((m) => (
                    <button key={m} type="button" className={mode === m ? 'is-on' : ''} onClick={() => set(slot, m === 'pinned' ? { mode: 'pinned', item_kind: k, item_slug: f?.item_slug || it?._slug } : { mode: m, item_kind: null, item_slug: null })}>
                      {m === 'latest' ? 'Latest' : m === 'popular' ? 'Most popular' : 'Starred'}
                    </button>
                  ))}
                </div>
                <div className="adm-choose-row"><select className="adm-field adm-field--sm" aria-label={`Content type for ${SLOT_LABEL[slot]}`} value={slotKinds[slot]} onChange={e => setSlotKinds(prev => ({ ...prev, [slot]: e.target.value as 'article' | 'episode' }))}><option value="article">Blog article</option><option value="episode">Podcast episode</option></select>
                <button type="button" className="adm-pill" onClick={() => { setChooseKind(slotKinds[slot]); setChooser(slot); setChooseQuery('') }}>Choose</button></div>
                {mode === 'popular' && (
                  <small className="adm-help">{(pop[k] || []).length ? `Most viewed in the last 30 days (${pop[k][0].views} views for the top one).` : 'No views counted yet — showing the latest until visitors start reading.'}</small>
                )}
                {mode === 'latest' && <small className="adm-help">Newest {k === 'article' ? 'blog post' : 'episode'} not already shown.</small>}
              </div>
            )
          })}
        </div>
      </section>
      <section className="adm-card">
        <div className="adm-card-head"><div><h2>Most popular right now</h2><p>Page views over the last 30 days, counted once per visitor session.</p></div></div>
        <div className="adm-pop">
          {(['article', 'episode'] as const).map((k) => (
            <div key={k}>
              <span className="adm-kicker">{k === 'article' ? 'Blog posts' : 'Podcast episodes'}</span>
              {(pop[k] || []).length ? <ol>{pop[k].map((p) => <li key={p.slug}><span>{lists[k].find((x: any) => x._slug === p.slug)?.title || p.slug}</span><b>{p.views}</b></li>)}</ol> : <p className="adm-hint">No views yet.</p>}
            </div>
          ))}
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
                <button type="button" className="adm-icon-btn adm-danger" aria-label="Delete" onClick={async () => { if (confirm('Delete this entry?')) { await supabase.from('submissions').delete().eq('id', r.id); reload() } }}>{I.trash}</button>
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
