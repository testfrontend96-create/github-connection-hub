import { useParams, Link } from 'react-router-dom'
import { PersonPhoto, Mention } from '../components/ui'
import { PageHead } from '../components/chrome'
import { IconLink } from '../components/icons'
import { SOCIAL_ORDER, SocialIcon, socialLabel } from '../components/social'
import { H, E, T, hackers, firstName, personSortKey, clip, TICKETS_URL } from '../lib/data'
import NotFound from './NotFound'

const EVENT_LABEL: Record<string, string> = { 'miami-2027': 'Speaker at Miami 2027' }

export default function Profile() {
  const { slug } = useParams()
  const b = slug ? H[slug] : undefined
  if (!b) return <NotFound />
  const miami = (b.events || []).includes('miami-2027')
  const focus = (b.focus || []).filter((x: string) => x in E)
  const topicLinks = (b.topics || []).filter((t: string) => t in T)
  const site = b.website ? b.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '') : ''
  const socials = SOCIAL_ORDER.filter((k) => b.social?.[k])
  const hasPro = b.website || b.organizations?.length || socials.length

  const peers = hackers.filter((x) => x.slug !== b.slug).sort((x, y) => {
    const ov = (z: any) => (z.topics || []).filter((t: string) => (b.topics || []).includes(t)).length
    return ov(y) - ov(x) || (y.image ? 1 : 0) - (x.image ? 1 : 0) || personSortKey(x).localeCompare(personSortKey(y))
  }).slice(0, 3)

  return (
    <>
      <PageHead compact crumbs={[['Hub', '/'], ['Top Biohackers', '/biohackers'], [b.name, null]]}>
        <div className="prof-hero">
          <PersonPhoto b={b} cls="prof-photo" eager />
          <div className="prof-id">
            <p className="lede prof-title">{b.title}</p>
            <h1 className="display">{b.name}</h1>
            {(miami || (b.speaker && !miami)) && (
              <div className="prof-chips">
                {(b.events || []).filter((e: string) => EVENT_LABEL[e]).map((e: string) => <span key={e} className="p-chip"><i />{EVENT_LABEL[e]}</span>)}
                {b.speaker && !miami && <span className="p-chip p-chip--quiet"><i />Biohackers World speaker</span>}
              </div>
            )}
            {!b.speaker && <p className="lede">{clip(b.known, 240)}</p>}
          </div>
        </div>
      </PageHead>

      <section className="section prof-body"><div className="wrap prof-grid">
        <div className="prof-main">
          <h2 className="prof-h">About {firstName(b.name)}</h2>
          <div className="prose prof-bio">{(b.bio?.length ? b.bio : [b.known]).map((p: string, i: number) => <p key={i}>{p}</p>)}</div>
          {b.highlights?.length > 0 && (<>
            <h2 className="prof-h">Highlights</h2>
            <ul className="prof-list">{b.highlights.map((x: string, i: number) => <li key={i}>{x}</li>)}</ul>
          </>)}
          {b.imageCredit && <p className="prof-src">Photo: {b.imageCredit}, via Wikimedia Commons.</p>}
          <section className="prof-more">
            <h2 className="prof-h">More biohackers</h2>
            <div className="peers">
              {peers.map((x) => (
                <Link key={x.slug} className="peer" to={`/biohackers/${x.slug}`}>
                  <PersonPhoto b={x} cls="peer-photo" />
                  <span><b>{x.name}</b><i>{clip(x.title, 60)}</i></span>
                </Link>
              ))}
            </div>
            <Link className="link-more" to="/biohackers">All profiles</Link>
          </section>
        </div>

        <aside className="prof-aside">
          {miami && (
            <div className="prof-event">
              <p className="prof-event-h">Hear {firstName(b.name)} live at Biohackers World Miami</p>
              <p className="prof-event-when">January 16–17, 2027 · InterContinental Miami</p>
              <p>Two days of keynotes, expo and experiences at 100 Chopin Plaza.</p>
              <a className="btn btn--green" href={TICKETS_URL}>Get tickets</a>
            </div>
          )}
          {(focus.length > 0 || topicLinks.length > 0) && (
            <div className="prof-box"><h3>Focus</h3>
              {focus.length > 0 && <div className="mentions">{focus.map((x: string) => <Mention key={x} slug={x} />)}</div>}
              {topicLinks.length > 0 && <div className="prof-topics">{topicLinks.map((t: string) => <Link key={t} className="chip" to={`/topics/${t}`}>{T[t].name}</Link>)}</div>}
            </div>
          )}
          {hasPro && (
            <div className="prof-box prof-pro">
              <h3>Professional</h3>
              <p className="pro-role">{b.title}</p>
              <dl className="pro-dl">
                {b.website && (
                  <div className="pro-row"><dt>Website</dt><dd>
                    <a className="pro-site" href={b.website} target="_blank" rel="noopener"><IconLink />{site}</a>
                  </dd></div>
                )}
                {socials.length > 0 && (
                  <div className="pro-row"><dt>Follow</dt><dd><div className="pro-social">
                    {socials.map((k) => (
                      <a key={k} className="pro-soc" href={b.social[k]} target="_blank" rel="noopener me" aria-label={`${b.name} on ${socialLabel(k)}`}><SocialIcon k={k} /></a>
                    ))}
                  </div></dd></div>
                )}
                {b.organizations?.length > 0 && (
                  <div className="pro-row"><dt>{b.organizations.length === 1 ? 'Organisation' : 'Organisations'}</dt><dd>
                    <ul className="pro-orgs">
                      {b.organizations.map((o: any, i: number) => (
                        <li key={i}>{o.url ? <a href={o.url} target="_blank" rel="noopener">{o.name}</a> : <span>{o.name}</span>}{o.role && <i>{o.role}</i>}</li>
                      ))}
                    </ul>
                  </dd></div>
                )}
              </dl>
            </div>
          )}
        </aside>
      </div></section>
    </>
  )
}
