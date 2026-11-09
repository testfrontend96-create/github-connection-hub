import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../integrations/supabase/client'
import { stageChange, type DraftChange } from './draftState'

const DraftContext = createContext({ changes: [] as DraftChange[], stage: (_c: DraftChange) => {}, revision: 0 })
export const useDrafts = () => useContext(DraftContext)
export function DraftProvider({ children }: { children: ReactNode }) {
  const [changes, setChanges] = useState<DraftChange[]>([])
  const [revision, setRevision] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    if (!changes.length) return
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [changes.length])
  const publish = async () => {
    setBusy(true); setError('')
    const { error } = await supabase.rpc('publish_admin_changes', { changes })
    setBusy(false)
    if (error) { setError(error.message); return }
    setChanges([]); setRevision(x => x + 1)
    window.dispatchEvent(new Event('hub-admin-saved'))
  }
  return <DraftContext.Provider value={{ changes, stage: c => setChanges(prev => stageChange(prev, c)), revision }}>
    <div className="adm adm-savebar" role="region" aria-label="Publish changes">
      <span>{busy ? 'Saving changes…' : changes.length ? `${changes.length} unpublished change${changes.length === 1 ? '' : 's'}` : 'All changes saved'}</span>
      {error && <span className="adm-err" role="alert">{error}</span>}
      <div><button type="button" className="adm-pill" disabled={!changes.length || busy} onClick={() => { setChanges([]); setError(''); setRevision(x => x + 1) }}>Discard changes</button>
      <button type="button" className="adm-btn" disabled={!changes.length || busy} onClick={publish}>Save changes</button></div>
    </div>
    <fieldset className="adm-workspace" disabled={busy}>{children}</fieldset>
  </DraftContext.Provider>
}