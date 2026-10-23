import { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { IconSearch } from './icons'

export function Button(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" {...props} />
}

// One "see more" call-to-action used by every section on a page.
export function MoreLink({ to, href, children }: { to?: string; href?: string; children: ReactNode }) {
  const body = <>{children}<span aria-hidden="true" className="section-cta-arrow">→</span></>
  return href
    ? <a className="section-cta" href={href} rel="noopener">{body}</a>
    : <Link className="section-cta" to={to || '#'}>{body}</Link>
}

export function SearchField({ value, onChange, label, placeholder }: {
  value: string; onChange: (value: string) => void; label: string; placeholder: string
}) {
  return <label className="dir-search content-search">
    <IconSearch />
    <input type="search" aria-label={label} placeholder={placeholder} value={value} onChange={event => onChange(event.target.value)} />
  </label>
}