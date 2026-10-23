import { PageHead } from '../components/chrome'
import { NetIcon, NET_COLOR, SocLogo } from '../components/social'
import { social, instagramTop } from '../lib/data'

const PlayGlyph = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" fill="currentColor" /></svg>

function NetArt({ name }: { name: string }) {
  if (name === 'Instagram') {
    return (
      <span className="net-art net-art--posts">
        {instagramTop(3).map((p, i) => (
          <span key={i} className="net-tile">
            {p.media_type === 'REELS' && <i className="net-reel" aria-hidden="true" />}
            <img src={'/' + p.image} alt="" loading="lazy" width={320} height={320} />
            {p.media_type === 'REELS' && <i className="net-play" aria-hidden="true"><PlayGlyph /></i>}
          </span>
        ))}
        <span className="net-scrim" />
      </span>
    )
  }
  return (
    <span className="net-art net-art--mark">
      <img className="net-logo" src="/assets/logo.svg" alt="" width={104} height={70} loading="lazy" />
      <span className={`net-watermark net-watermark--${name.toLowerCase()}`} aria-hidden="true"><NetIcon name={name} /></span>
    </span>
  )
}

export default function Social() {
  return (
    <>
      <PageHead compact accent="#6B6CFF" title="Social Media" lede="Connect with the community wherever you already are." />
      <section className="section"><div className="wrap">
        <div className="netgrid">
          {social.map((x) => (
            <a key={x.name} className="net" href={x.url} target="_blank" rel="noopener" style={{ ['--sc' as any]: NET_COLOR[x.name] || '#6B6CFF' }}>
              <span className="net-head"><span className="net-glyph" aria-hidden="true"><NetIcon name={x.name} /></span><b>{x.name}</b></span>
              <NetArt name={x.name} />
              <span className="net-body"><i>{x.handle}</i><span className="net-blurb">{x.blurb}</span></span>
            </a>
          ))}
        </div>
      </div></section>
    </>
  )
}
