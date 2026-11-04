import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHead } from '../components/chrome'
import { FaqList, type FaqItem } from '../components/FaqList'
import { SearchField } from '../components/controls'
import { faqs, entities, topics, T, KIND_LABEL } from '../lib/data'

type Item = FaqItem

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
  const needle = q.trim().toLowerCase()
  const shown = items.map((it, i) => ({ it, i })).filter(({ it }) =>
    !needle || [it.q, it.a, it.topic, it.entity || ''].join(' ').toLowerCase().includes(needle))

  return (
    <>
      <PageHead compact accent="#38389C" title="FAQ" lede="Answers to the questions people bring to the Hub most often. Select a question to read the answer." />
      <section className="section faqx"><div className="wrap faqx-wrap">
        <div className="dir-bar faqx-bar">
          <SearchField label="Search the FAQ" placeholder={`Search ${items.length} questions`} value={q} onChange={setQ} onClear={() => setQ('')} />
        </div>
        <p className="dir-count">Showing {needle ? shown.length : <>all <b>{items.length}</b></>} questions</p>
        <FaqList items={shown.map(({ it }) => it)} />
        {needle && shown.length === 0 && <p className="lede">No questions match “{q}”. Try a broader word, or <Link to="/search">search the whole Hub</Link>.</p>}
      </div></section>
    </>
  )
}
