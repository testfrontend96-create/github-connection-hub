import { useMemo, useState } from 'react'
import { PageHead } from '../components/chrome'
import { EpisodeCard } from '../components/ui'
import { Button, SearchField } from '../components/controls'
import { episodes, T } from '../lib/data'
import { filterEpisodes } from '../lib/browsing'

export default function Podcast() {
  const [query, setQuery] = useState('')
  const [topic, setTopic] = useState('all')
  const topicList = useMemo(() => [...new Set(episodes.flatMap(p => p.topics || []))].filter(s => T[s]) as string[], [])
  const hits = filterEpisodes(episodes, query, topic)
  return (
    <>
      <PageHead compact accent="#5757D7" title="Podcast"
        lede="Conversations with researchers, physicians and practitioners on the science of biohacking." />
      <section className="section blog-listing"><div className="wrap">
        <div className="content-filter-bar">
          <SearchField label="Search podcast episodes" placeholder="Search episodes or guests…" value={query} onChange={setQuery} />
          <div className="chip-row" aria-label="Episode topics">
            <Button className={`chip${topic === 'all' ? ' is-active' : ''}`} aria-pressed={topic === 'all'} onClick={() => setTopic('all')}>All topics</Button>
            {topicList.map(s => <Button key={s} className={`chip${topic === s ? ' is-active' : ''}`} aria-pressed={topic === s} onClick={() => setTopic(s)}>{T[s].name}</Button>)}
          </div>
        </div>
        <p className="content-result-count" aria-live="polite">{hits.length} {hits.length === 1 ? 'episode' : 'episodes'}</p>
        <div className="grid g3">
          {hits.map((p) => <EpisodeCard key={p.slug} slug={p.slug} />)}
        </div>
        {hits.length === 0 && <div className="content-empty"><p>No episodes match your search and topic.</p><Button className="chip" onClick={() => { setQuery(''); setTopic('all') }}>Clear filters</Button></div>}
      </div></section>
    </>
  )
}
