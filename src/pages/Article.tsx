import { useParams } from 'react-router-dom'
import { Crumbs, Mention } from '../components/ui'
import { A, E, T, pretty } from '../lib/data'
import { articleTopic } from '../lib/browsing'
import NotFound from './NotFound'

export default function Article() {
  const { slug } = useParams()
  const a = slug ? A[slug] : undefined
  if (!a) return <NotFound />
  const ents = (a.entities || []).filter((s: string) => s in E)
  return (
    <>
      <section className="page-head"><div className="wrap">
        <Crumbs items={[['Hub', '/'], ['Blog', '/blog'], [a.title, null]]} />
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
          <span className="tag tag--article">{articleTopic(a, T)}</span>
          <span style={{ color: 'rgba(255,255,255,.5)', fontSize: '.84rem' }}>{pretty(a.date)} · {a.readTime} min read</span>
        </div>
        <h1 className="display">{a.title}</h1>
      </div></section>
      <section className="section"><div className="wrap" style={{ maxWidth: '72ch' }}>
        {a.image && <img src={a.image} alt="" style={{ width: '100%', borderRadius: 16, marginBottom: 28 }} loading="lazy" />}
        <div className="prose">{a.body.map((p: string, i: number) => <p key={i}>{p}</p>)}</div>
        {ents.length > 0 && <div className="mentions" style={{ marginTop: 28 }}>{ents.map((s: string) => <Mention key={s} slug={s} />)}</div>}
        {a.sourceUrl && <p style={{ marginTop: 28, fontSize: '.88rem', color: 'var(--muted)' }}>Originally published on the <a href={a.sourceUrl} style={{ color: 'var(--indigo)' }}>Biohackers World blog</a>.</p>}
      </div></section>
    </>
  )
}
