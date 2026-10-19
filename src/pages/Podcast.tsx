import { PageHead } from '../components/chrome'
import { EpisodeCard } from '../components/ui'
import { episodes } from '../lib/data'

export default function Podcast() {
  return (
    <>
      <PageHead accent="#5757D7" title="Podcast"
        lede="Conversations with researchers, physicians and practitioners — indexed by the entities they discuss, so an episode about HRV appears on the HRV page automatically." />
      <section className="section"><div className="wrap"><div className="grid g3">
        {episodes.map((p) => <EpisodeCard key={p.slug} slug={p.slug} />)}
      </div></div></section>
    </>
  )
}
