import { useState } from 'react'
import { z } from 'zod'
import { useHueTracking } from './chrome'

const schema = z.object({
  firstName: z.string().trim().min(1, 'Enter a first name').max(80),
  lastName: z.string().trim().min(1, 'Enter a last name').max(80),
  link: z.string().trim().url('Enter a full link, e.g. https://…').max(500),
  action: z.enum(['Add', 'Change', 'Remove']),
  description: z.string().trim().min(1, 'Tell us a little more').max(1000),
  name: z.string().trim().min(1, 'Enter your name').max(100),
  email: z.string().trim().email('Enter a valid email').max(255),
})
type Form = z.infer<typeof schema>
const EMPTY: Form = { firstName: '', lastName: '', link: '', action: 'Add', description: '', name: '', email: '' }

export function UpdateList() {
  const [open, setOpen] = useState(false)
  const [f, setF] = useState<Form>(EMPTY)
  const [err, setErr] = useState<Partial<Record<keyof Form, string>>>({})
  const [done, setDone] = useState<string | null>(null)
  const ref = useHueTracking() as any
  const set = (k: keyof Form) => (e: any) => setF({ ...f, [k]: e.target.value })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const r = schema.safeParse(f)
    if (!r.success) {
      const m: any = {}
      r.error.issues.forEach((i) => { m[i.path[0]] ??= i.message })
      return setErr(m)
    }
    setErr({})
    setDone(`${r.data.firstName} ${r.data.lastName}`)
  }
  const again = () => { setF({ ...EMPTY, name: f.name, email: f.email }); setDone(null) }

  const field = (k: keyof Form, label: string, props: any = {}) => (
    <label className={props.wide ? 'ul-wide' : undefined}>
      <span>{label}</span>
      {props.area
        ? <textarea rows={4} value={f[k]} onChange={set(k)} placeholder={props.placeholder} maxLength={1000} />
        : <input value={f[k]} onChange={set(k)} type={props.type || 'text'} placeholder={props.placeholder} />}
      {err[k] && <em className="ul-err">{err[k]}</em>}
    </label>
  )

  return (
    <div className="ul-wrap">
      {!open ? (
        <button type="button" className="ul-open" onClick={() => setOpen(true)}>Update list</button>
      ) : (
        <div className="art-news art-news--full ul-box" ref={ref}>
          <div className="art-news-intro">
            <h3>Update the list</h3>
            <p>Suggest someone we should add, a detail to change, or a profile to remove. We review every submission.</p>
          </div>
          {done ? (
            <div className="ul-done">
              <p className="art-news-done">Thanks! Your suggestion for {done} has been sent.</p>
              <button type="button" onClick={again}>Suggest another biohacker</button>
            </div>
          ) : (
            <form onSubmit={submit} noValidate>
              <label className="ul-wide">
                <span>What would you like to do?</span>
                <select value={f.action} onChange={set('action')}>
                  <option value="Add">Add a biohacker</option>
                  <option value="Change">Change a profile</option>
                  <option value="Remove">Remove a biohacker</option>
                </select>
              </label>
              {field('firstName', 'Biohacker first name')}
              {field('lastName', 'Biohacker last name')}
              {field('link', 'Website or source link', { wide: true, type: 'url', placeholder: 'https://' })}
              {field('description', 'Description', { wide: true, area: true, placeholder: 'Why should we make this change?' })}
              {field('name', 'Your name')}
              {field('email', 'Your email', { type: 'email' })}
              <button type="submit">Submit</button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
