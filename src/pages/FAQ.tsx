import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHead } from '../components/chrome'
import { Mention } from '../components/ui'
import { IconSearch, IconClose, IconArrow } from '../components/icons'
import { faqs, entities, topics, T, E, KIND_LABEL } from '../lib/data'

type Item = { q: string; a: string; topic: string; entities: string[]; href?: string; entity?: string }

function allFaqs(): Item[] {
  const out: Item[] = faqs.map((f) => ({ q: f.q, a: f.a, topic: 'Getting started', entities: f.entities || [] }))
  const order = Object.fromEntries(topics.map((t, i) => [t.slug, i]))
  const ents = entities.filter((e) => e.faq?.length).sort((a, b) => {
    const oa = order[(a.topics || ['~'])[0]] ?? 99, ob = order[(b.topics || ['~'])[0]] ?? 99
    return oa - ob || a.name.localeCompare(b.name)
  })
  for (const e of ents) {
    const t = (e.topics || [null])[0]
    for (const f of e.faq)
      out.push({ q: f.q, a: f.a, topic: t && t in T ? T[t].name : KIND_LABEL[e.type], entities: [e.slug], href: `/knowledge/${e.slug}`, entity: e.name })
  }
  return out
}

export default function FAQ() {
  const items = useMemo(allFaqs, [])
  const [q, setQ] = useState('')
  const [open, setOpen] = useState<number | null>(null)
  const needle = q.trim().toLowerCase()
  const shown = items.map((it, i) => ({ it, i })).filter(({ it }) =>
    !needle || [it.q, it.a, it.topic, it.entity || ''].join(' ').toLowerCase().includes(needle))

  return (
    <>
      <PageHead accent="#38389C" title="FAQ" lede="Answers to the questions people bring to the Hub most often. Select a question to read the answer." />
      <section className="section faqx"><div className="wrap faqx-wrap">
        <div className="dir-bar faqx-bar">
          <label className="dir-search">
            <IconSearch />
            <input type="search" placeholder={`Search ${items.length} questions`} autoComplete="off" spellCheck={false} value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search the FAQ" />
            {q && <button className="dir-clear" type="button" aria-label="Clear search" onClick={() => setQ('')}><IconClose /></button>}
          </label>
        </div>
        <p className="dir-count">Showing {needle ? shown.length : <>all <b>{items.length}</b></>} questions</p>
        <ol className="fq-list">
          {shown.map(({ it, i }) => {
            const isOpen = open === i
            const ments = it.entities.filter((x) => x in E)
            return (
              <li key={i} className={'fq' + (isOpen ? ' is-open' : '')}>
                <button className="fq-q" type="button" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : i)}>
                  <span className="fq-text">{it.q}</span><span className="fq-topic">{it.topic}</span>
                  <span className="fq-icon" aria-hidden="true" />
                </button>
                <div className="fq-a" role="region" style={isOpen ? { maxHeight: 600 } : undefined}><div className="fq-a-in">
                  <p>{it.a}</p>
                  {(ments.length > 0 || it.href) && (
                    <div className="fq-foot">
                      {ments.length > 0 && <div className="mentions">{ments.map((x) => <Mention key={x} slug={x} />)}</div>}
                      {it.href && <Link className="faq-more" to={it.href}>Read the full {it.entity} entry<IconArrow /></Link>}
                    </div>
                  )}
                </div></div>
              </li>
            )
          })}
        </ol>
        {needle && shown.length === 0 && <p className="lede">No questions match “{q}”. Try a broader word, or <Link to="/search">search the whole Hub</Link>.</p>}
      </div></section>
    </>
  )
}
