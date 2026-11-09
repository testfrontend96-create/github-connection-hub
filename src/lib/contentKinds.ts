// Built-in content per kind and how each item is keyed — shared by the site
// loader (data.ts) and the admin panel so both agree on identities.
import molecules from '../data/entities-molecules.json'
import biomarkers from '../data/entities-biomarkers.json'
import protocols from '../data/entities-protocols.json'
import articlesRaw from '../data/articles.json'
import episodesRaw from '../data/episodes.json'
import problemsRaw from '../data/problems.json'
import howtosRaw from '../data/howtos.json'
import topicsRaw from '../data/topics.json'
import biohackersRaw from '../data/biohackers.json'
import famousRaw from '../data/biohackers-famous.json'
import faqRaw from '../data/faq.json'
import socialRaw from '../data/social.json'
import eventsRaw from '../data/events.json'
import { keyOf } from './overrides'

type Any = Record<string, any>
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x))

const hackerBase = (() => {
  const list: Any[] = clone(biohackersRaw as Any[])
  const have = new Set(list.map((b) => b.slug))
  for (const b of clone(famousRaw as Any[])) if (!have.has(b.slug)) list.push(b)
  return list
})()

export const KINDS = {
  article: { base: () => clone(articlesRaw as Any[]), key: (x: Any) => x.slug },
  episode: { base: () => clone(episodesRaw as Any[]), key: (x: Any) => x.slug },
  entity: { base: () => [...clone(molecules as Any[]), ...clone(biomarkers as Any[]), ...clone(protocols as Any[])], key: (x: Any) => x.slug },
  howto: { base: () => clone(howtosRaw as Any[]), key: (x: Any) => x.slug },
  biohacker: { base: () => clone(hackerBase), key: (x: Any) => x.slug },
  topic: { base: () => clone(topicsRaw as Any[]), key: (x: Any) => x.slug },
  problem: { base: () => clone(problemsRaw as Any[]), key: (x: Any) => x.slug },
  faq: { base: () => clone(faqRaw as Any[]), key: (x: Any) => x.slug || keyOf(x.q) },
  event: { base: () => clone(eventsRaw as Any[]), key: (x: Any) => x.slug || keyOf(x.city) },
  social: { base: () => clone(socialRaw as Any[]), key: (x: Any) => x.slug || keyOf(x.name) },
} as const

export type Kind = keyof typeof KINDS
