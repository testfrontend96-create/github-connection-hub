import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHead } from '../components/chrome'
import { ArticleCard } from '../components/ui'
import { articles, T, clip, pretty } from '../lib/data'
import { Button, SearchField } from '../components/controls'
import { articleTopic, filterArticles } from '../lib/browsing'

export default function Blog() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const sorted = useMemo(() => [...articles].sort((a, b) => (a.date < b.date ? 1 : -1)), [])
  const categories = useMemo(() => [...new Set(articles.flatMap(a => a.categories || []))].filter(value => value !== 'Blog').sort() as string[], [])
  const hits = filterArticles(sorted, query, category)
  const [lead, ...rest] = hits
  return (
    <>
      <PageHead compact title="Blog" lede="Biohacking insights: the source to unleash your potential." />
      <section className="section blog-listing"><div className="wrap">
        <div className="content-filter-bar">
          <SearchField label="Search blog articles" placeholder="Search articles…" value={query} onChange={setQuery} />
          <div className="chip-row" aria-label="Article categories">
            <Button className={`chip${category === 'all' ? ' is-active' : ''}`} aria-pressed={category === 'all'} onClick={() => setCategory('all')}>All categories</Button>
            {categories.map(value => <Button key={value} className={`chip${category === value ? ' is-active' : ''}`} aria-pressed={category === value} onClick={() => setCategory(value)}>{value}</Button>)}
          </div>
        </div>
        <p className="content-result-count" aria-live="polite">{hits.length} {hits.length === 1 ? 'article' : 'articles'}</p>
        <div className="grid g3">
          {lead && <Link className="card card--lead" to={`/articles/${lead.slug}`}>
            {lead.image && <span className="card-thumb" data-k="article"><img src={lead.image} alt="" loading="lazy" /></span>}
            <span className="tag tag--article">{articleTopic(lead, T)}</span>
            <h3>{lead.title}</h3><p>{clip(lead.excerpt, 150)}</p>
            <div className="card-meta"><span>{pretty(lead.date)}</span><span>{lead.readTime} min read</span></div>
          </Link>}
          {rest.map((a) => <ArticleCard key={a.slug} slug={a.slug} />)}
        </div>
        {hits.length === 0 && <div className="content-empty"><p>No articles match your search and category.</p><Button className="chip" onClick={() => { setQuery(''); setCategory('all') }}>Clear filters</Button></div>}
      </div></section>
    </>
  )
}
