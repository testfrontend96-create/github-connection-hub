import { useEffect, useState } from 'react'
import { supabase } from '../integrations/supabase/client'
import { useDrafts } from './Drafts'

const LABELS: Record<string, string> = {
  title: 'Title', name: 'Name', excerpt: 'Description', description: 'Description', summary: 'Description', intro: 'Description', body: 'Body text',
  image: 'Thumbnail', thumbnail: 'Thumbnail', thumb: 'Thumbnail', photo: 'Photo', cover: 'Thumbnail', artwork: 'Artwork',
  topics: 'Topics', topic: 'Topic', pillar: 'Topic', tags: 'Tags', categories: 'Categories', chips: 'Chips',
  date: 'Date', author: 'Author', readTime: 'Read time', guest: 'Guest', audio: 'Audio', appleUrl: 'Apple link', spotifyUrl: 'Spotify link', youtubeUrl: 'YouTube link',
  url: 'Link', link: 'Link', faq: 'FAQ', takeaways: 'Takeaways', steps: 'Steps', visible: 'Visibility', sort: 'Order', mode: 'Selection mode', item_slug: 'Featured item', item_kind: 'Content type',
}
const same = (a: any, b: any) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null)
const label = (k: string) => LABELS[k] || k.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/^./, c => c.toUpperCase())
const isImg = (b: any) => b && ['img', 'image', 'video'].includes(b.type)
/** Readable change types, worked out from the saved before/after copies (nothing extra stored). */
export function changeTypes(h: any): string[] {
  if (!h.before && h.after) return ['Created']
  if (h.before && !h.after) return ['Removed']
  if (!h.before || !h.after) return []
  const out = new Set<string>()
  const flat = (r: any) => ({ ...(r.data || {}), ...(r.value && typeof r.value === 'object' ? r.value : {}), ...Object.fromEntries(Object.entries(r).filter(([k]) => !['data', 'value', 'updated_at', 'updated_by', 'kind', 'slug', 'key', 'slot'].includes(k))) })
  const a = flat(h.before), b = flat(h.after)
  if (h.kind === 'home' && h.slug === 'start_here') { LABELS.title = 'Heading'; }
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
    if (same(a[k], b[k])) continue
    if (k === 'deleted') { out.add(b[k] ? 'Removed' : 'Restored'); continue }
    if (k === 'visible') { out.add(b[k] ? 'Shown on site' : 'Hidden from site'); continue }
    if ((k === 'blocks' || k === 'body') && Array.isArray(a[k] ?? b[k])) {
      const A: any[] = a[k] || [], B: any[] = b[k] || []
      if (!same(A.filter(isImg), B.filter(isImg))) out.add('Image in article')
      if (!same(A.filter(x => !isImg(x)), B.filter(x => !isImg(x)))) out.add('Body text')
      continue
    }
    out.add(label(k))
  }
  LABELS.title = 'Title'
  return [...out]
}

export function History() {
  const { stage, revision } = useDrafts()
  const [rows, setRows] = useState<any[]>([])
  const [q, setQ] = useState('')
  const [limit, setLimit] = useState(60)
  const [error, setError] = useState('')
  useEffect(() => {
    supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(limit).then(({ data, error }) => {
      if (error) setError(error.message)
      else setRows(data || [])
    })
  }, [limit, revision])
  const undo = (h: any) => {
    const table = h.kind === 'home' ? h.action === 'feature' ? 'home_features' : 'site_settings' : 'content_items'
    stage({ table, kind: table === 'content_items' ? h.kind : undefined, key: h.slug, operation: h.before ? 'upsert' : 'delete', value: table === 'site_settings' ? h.before?.value : h.before })
  }
  return <section className="adm-card">
    <div className="adm-card-head"><div><h2>History</h2><p>Published website changes, with the editor and time.</p></div></div>
    <input className="adm-field adm-search" aria-label="Search history" placeholder="Search by email, content or action…" value={q} onChange={e => setQ(e.target.value)} />
    {error && <p className="adm-err">{error}</p>}
    <ul className="adm-list">{rows.filter(h => [h.actor_email, h.action, h.kind, h.slug, ...changeTypes(h)].join(' ').toLowerCase().includes(q.toLowerCase())).map(h => <li key={h.id} className="adm-row">
      <div className="adm-row-main adm-row-static"><b>{h.action} · {h.kind === 'home' ? 'Homepage' : h.kind} · {h.slug}</b><span>{h.actor_email || 'System'} · {new Date(h.created_at).toLocaleString()}</span>
      {changeTypes(h).length > 0 && <span className="adm-change-tags">{changeTypes(h).map(t => <em key={t}>{t} {['Created', 'Removed', 'Restored', 'Shown on site', 'Hidden from site'].includes(t) ? '' : 'changed'}</em>)}</span>}</div>
      {(h.after || h.before) && <button className="adm-pill" type="button" onClick={() => undo(h)}>Undo</button>}
    </li>)}</ul>
    {!rows.length && <p className="adm-hint">No published changes yet.</p>}
    {rows.length === limit && <button type="button" className="adm-pill adm-more" onClick={() => setLimit(x => x + 60)}>Load older changes</button>}
  </section>
}