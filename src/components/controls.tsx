import { ButtonHTMLAttributes } from 'react'
import { IconSearch } from './icons'

export function Button(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" {...props} />
}

export function SearchField({ value, onChange, label, placeholder }: {
  value: string; onChange: (value: string) => void; label: string; placeholder: string
}) {
  return <label className="dir-search content-search">
    <IconSearch />
    <input type="search" aria-label={label} placeholder={placeholder} value={value} onChange={event => onChange(event.target.value)} />
  </label>
}