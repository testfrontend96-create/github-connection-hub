import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { PageHead } from '../components/chrome'
import { ArticleCard } from '../components/ui'
import { articles, clip, pretty } from '../lib/data'

export default function Blog() {
  const sorted = useMemo(() => [...articles].sort((a, b) => (a.date < b.date ? 1 : -1)), [])
  const [lead, ...rest] = sorted
  return (
    <>
      <PageHead accent="#2E2E88" title="Blog" lede="Biohacking insights: the source to unleash your potential." />
      <section className="section"><div className="wrap">
        <div className="grid g3">
          <Link className="card card--lead" to={`/articles/${lead.slug}`} style={{ gridColumn: 'span 1' }}>
            {lead.image && <span className="card-thumb" data-k="article"><img src={lead.image} alt="" loading="lazy" /></span>}
            <span className="tag tag--article">Blog</span>
            <h3>{lead.title}</h3><p>{clip(lead.excerpt, 150)}</p>
            <div className="card-meta"><span>{pretty(lead.date)}</span><span>{lead.readTime} min read</span></div>
          </Link>
          {rest.map((a) => <ArticleCard key={a.slug} slug={a.slug} />)}
        </div>
      </div></section>
    </>
  )
}
