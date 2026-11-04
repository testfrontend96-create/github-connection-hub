import { useId, useState } from 'react'
import { Link } from 'react-router-dom'
import { Mention } from './ui'
import { IconArrow } from './icons'
import { E } from '../lib/data'

export type FaqItem = { q: string; a: string; topic: string; entities: string[]; href?: string; entity?: string }

export function FaqList({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<string | null>(null)
  const id = useId()
  return <ol className="fq-list">{items.map((it, i) => {
    const isOpen = open === it.q
    const mentions = it.entities.filter(x => x in E)
    const answerId = `${id}-${i}`
    return <li key={`${it.q}-${i}`} className={'fq' + (isOpen ? ' is-open' : '')}>
      <button className="fq-q" type="button" aria-expanded={isOpen} aria-controls={answerId} onClick={() => setOpen(isOpen ? null : it.q)}>
        <span className="fq-text">{it.q}</span><span className="fq-topic">{it.topic}</span><span className="fq-icon" aria-hidden="true" />
      </button>
      <div className="fq-a" id={answerId} role="region" aria-hidden={!isOpen}><div className="fq-a-in">
        <p>{it.a}</p>
        {(mentions.length > 0 || it.href) && <div className="fq-foot">
          {mentions.length > 0 && <div className="mentions">{mentions.map(x => <Mention key={x} slug={x} />)}</div>}
          {it.href && <Link className="faq-more" to={it.href}>Read the full {it.entity} entry<IconArrow /></Link>}
        </div>}
      </div></div>
    </li>
  })}</ol>
}