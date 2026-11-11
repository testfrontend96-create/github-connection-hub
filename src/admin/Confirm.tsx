// Shared delete confirmation: askDelete() opens a modal with an "I understand" checkbox and resolves true on delete.
import { useEffect, useState } from 'react'
import { Modal } from './fields'

type Req = { name: string; note?: string; resolve: (ok: boolean) => void }
let push: ((r: Req) => void) | null = null

export function askDelete(name: string, note?: string): Promise<boolean> {
  return new Promise((resolve) => (push ? push({ name, note, resolve }) : resolve(window.confirm(`Delete “${name}”?`))))
}

export function ConfirmHost() {
  const [req, setReq] = useState<Req | null>(null)
  const [ok, setOk] = useState(false)
  useEffect(() => { push = (r) => { setOk(false); setReq(r) }; return () => { push = null } }, [])
  if (!req) return null
  const done = (v: boolean) => { req.resolve(v); setReq(null) }
  return (
    <Modal title="Delete this item?" onClose={() => done(false)} footer={<>
      <button type="button" className="adm-pill" onClick={() => done(false)}>Cancel</button>
      <button type="button" className="adm-btn adm-btn--danger" disabled={!ok} onClick={() => done(true)}>Delete</button>
    </>}>
      <div className="adm-confirm">
        <p>You're about to delete <b>“{req.name || 'Untitled'}”</b>. {req.note || 'It will disappear from the site once you save your changes.'}</p>
        <label className="adm-confirm-check"><input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} /> I understand this item will be removed and I want to delete it</label>
      </div>
    </Modal>
  )
}
