import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHead } from '../components/chrome'
import { PersonPhoto, Mention } from '../components/ui'
import { IconArrow } from '../components/icons'
import { SearchField } from '../components/controls'
import { hackers, E, personSortKey, clip } from '../lib/data'

const fold = (s: string) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

export default function Biohackers() {
  const famous = useMemo(() => hackers.filter((b) => !b.speaker), [])
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<'az' | 'za'>('az')

  const needle = fold(q.trim())
  const list = famous
    .filter((b) => !needle || fold(b.name).includes(needle))
    .sort((a, b) => {
      const r = personSortKey(a).localeCompare(personSortKey(b))
      return sort === 'za' ? -r : r
    })

  return (
    <>
      <PageHead compact accent="#5757D7" title="Top Biohackers" lede="The best-known names in biohacking and longevity." />
      <section className="section dir" data-noun="biohackers"><div className="wrap dir-wrap">
        <div className="dir-bar">
          <SearchField label="Search biohackers by name" placeholder="Search by name" value={q} onChange={setQ} onClear={() => setQ('')} />
          <div className="dir-controls">
            <div className="seg" role="group" aria-label="Sort by name">
              <button type="button" aria-pressed={sort === 'az'} onClick={() => setSort('az')}>A–Z</button>
              <button type="button" aria-pressed={sort === 'za'} onClick={() => setSort('za')}>Z–A</button>
            </div>
          </div>
        </div>
        <p className="dir-count">Showing {list.length} {list.length === 1 ? 'biohacker' : 'biohackers'}{q ? ` matching “${q}”` : ''}</p>
        <div className="pgrid">
          {list.map((b) => {
            const focus = (b.focus || []).filter((x: string) => x in E)
            return (
              <article key={b.slug} className="pcard">
                <Link className="pcard-link" to={`/biohackers/${b.slug}`}>
                  <span className="pcard-media">
                    <PersonPhoto b={b} cls="pcard-photo" />
                    <span className="pcard-more">
                      <span className="pcard-summary">{clip(b.known || b.summary, 190)}</span>
                      {focus.length > 0 && <span className="pcard-focus">{focus.map((x: string) => <span key={x}>{E[x].name}</span>)}</span>}
                      <span className="pcard-cta">View full profile<IconArrow /></span>
                    </span>
                  </span>
                  <span className="pcard-body"><h3 className="pcard-name">{b.name}</h3><span className="pcard-title">{b.title}</span></span>
                </Link>
              </article>
            )
          })}
        </div>
        <p className="dir-note">Profiles are compiled from public sources; each profile page lists its sources and photo credit.</p>
      </div></section>
    </>
  )
}
