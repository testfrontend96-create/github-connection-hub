import { useEffect, useState } from 'react'
import { supabase } from '../integrations/supabase/client'
import { useDrafts } from './Drafts'

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
    <ul className="adm-list">{rows.filter(h => [h.actor_email, h.action, h.kind, h.slug].join(' ').toLowerCase().includes(q.toLowerCase())).map(h => <li key={h.id} className="adm-row">
      <div className="adm-row-main adm-row-static"><b>{h.action} · {h.kind === 'home' ? 'Homepage' : h.kind} · {h.slug}</b><span>{h.actor_email || 'System'} · {new Date(h.created_at).toLocaleString()}</span>
      {h.before && h.after && <span>Changed: {Object.keys(h.after).filter(k => !['updated_at', 'updated_by'].includes(k) && JSON.stringify(h.after[k]) !== JSON.stringify(h.before[k])).join(', ')}</span>}</div>
      {(h.after || h.before) && <button className="adm-pill" type="button" onClick={() => undo(h)}>Undo</button>}
    </li>)}</ul>
    {!rows.length && <p className="adm-hint">No published changes yet.</p>}
    {rows.length === limit && <button type="button" className="adm-pill adm-more" onClick={() => setLimit(x => x + 60)}>Load older changes</button>}
  </section>
}