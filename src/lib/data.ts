// Data + knowledge-graph layer — a faithful TypeScript port of the relationship
// resolution in the original build.py. The JSON content is reused verbatim; the
// edges declared one-directionally in the data are made symmetric here and every
// inbound blog/podcast/report/how-to reference is attached, exactly as the Python
// generator did.
import molecules from '../data/entities-molecules.json'
import biomarkers from '../data/entities-biomarkers.json'
import protocols from '../data/entities-protocols.json'
import articlesRaw from '../data/articles.json'
import episodesRaw from '../data/episodes.json'
import problemsRaw from '../data/problems.json'
import reportsRaw from '../data/reports.json'
import howtosRaw from '../data/howtos.json'
import topicsRaw from '../data/topics.json'
import biohackersRaw from '../data/biohackers.json'
import famousRaw from '../data/biohackers-famous.json'
import faqRaw from '../data/faq.json'
import socialRaw from '../data/social.json'
import instagramRaw from '../data/instagram.json'
import { guideUrl } from './browsing'
import { sentenceCase } from './sentenceCase'

export type Any = Record<string, any>

export const SITE = 'https://www.biohackers.world/hub'
export const BRAND_URL = 'https://www.biohackers.world'
export const ACADEMY_URL = 'https://academy.biohackers.world/'
export const TICKETS_URL = 'https://luma.com/event/evt-LApwCxBD0kyGLyd'

export const KIND_LABEL: Record<string, string> = {
  molecule: 'Molecule', biomarker: 'Biomarker', protocol: 'Protocol', concept: 'Concept',
  howto: 'How To',
}

// Topics withdrawn from the Hub (data keeps their tags; the app drops them).
const RETIRED = new Set(['recovery'])

// ---- load & normalise -----------------------------------------------------
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x))

export const topics: Any[] = clone(topicsRaw).filter((t: Any) => !RETIRED.has(t.slug))
export const entities: Any[] = [...clone(molecules), ...clone(biomarkers), ...clone(protocols)]
export const articles: Any[] = clone(articlesRaw)
export const episodes: Any[] = clone(episodesRaw)
export const problems: Any[] = clone(problemsRaw)
export const reports: Any[] = clone(reportsRaw)
export const howtos: Any[] = clone(howtosRaw)
for (const list of [articles, episodes, reports, howtos]) for (const x of list) x.title = sentenceCase(x.title)
export const faqs: Any[] = clone(faqRaw)
export const social: Any[] = clone(socialRaw)
export const instagram: Any = clone(instagramRaw)

// biohackers: speaker roster + famous figures (famous only when slug is new)
export const hackers: Any[] = clone(biohackersRaw)
{
  const have = new Set(hackers.map((b) => b.slug))
  for (const b of clone(famousRaw)) if (!have.has(b.slug)) hackers.push(b)
  for (const b of hackers) {
    b.title ??= b.known ?? ''
    b.known ??= b.title
    b.bio ??= []
    b.summary ??= b.known
    b.social ??= {}
    b.speaker ??= false
    b.organizations ??= []
    b.events ??= []
    b.focus ??= []
    b.topics ??= []
    b.highlights ??= []
  }
  const sortKey = (b: Any) => (b.name || '').toLowerCase().replace(/^(dr|prof)\.?\s+/, '')
  hackers.sort((a, b) => sortKey(a).localeCompare(sortKey(b)))
}

// strip retired topics from every record's tags
for (const rec of [...entities, ...articles, ...episodes, ...problems, ...reports, ...howtos, ...hackers])
  if (rec.topics) rec.topics = rec.topics.filter((t: string) => !RETIRED.has(t))

// ---- lookup maps ----------------------------------------------------------
export const E: Record<string, Any> = Object.fromEntries(entities.map((e) => [e.slug, e]))
export const T: Record<string, Any> = Object.fromEntries(topics.map((t) => [t.slug, t]))
export const A: Record<string, Any> = Object.fromEntries(articles.map((a) => [a.slug, a]))
export const EP: Record<string, Any> = Object.fromEntries(episodes.map((p) => [p.slug, p]))
export const PR: Record<string, Any> = Object.fromEntries(problems.map((p) => [p.slug, p]))
export const H: Record<string, Any> = Object.fromEntries(hackers.map((b) => [b.slug, b]))

// ---- relationship resolution (mirrors build.py) ---------------------------
for (const e of entities) {
  e.related ??= []
  e.measuredBy ??= []
  e._related = new Set<string>(e.related.filter((s: string) => s in E))
  e._measuredBy = new Set<string>(e.measuredBy.filter((s: string) => s in E))
  e._measures = new Set<string>()
  e._articles = []
  e._episodes = []
  e._reports = []
  e._howtos = []
  e._problems = []
}
for (const e of entities) {
  for (const s of Array.from(e._related)) E[s as string]._related.add(e.slug)
  for (const s of Array.from(e._measuredBy)) E[s as string]._measures.add(e.slug)
}
for (const a of articles) {
  a.entities = (a.entities || []).filter((s: string) => s in E)
  for (const s of a.entities) E[s]._articles.push(a.slug)
}
for (const p of episodes) {
  p.entities = (p.entities || []).filter((s: string) => s in E)
  for (const s of p.entities) E[s]._episodes.push(p.slug)
}
for (const r of reports) {
  r.entities = (r.entities || []).filter((x: string) => x in E)
  for (const x of r.entities) E[x]._reports.push(r.slug)
}
for (const h of howtos) {
  h.entities = (h.entities || []).filter((x: string) => x in E)
  for (const x of h.entities) E[x]._howtos.push(h.slug)
}
for (const t of topics) {
  t._entities = entities.filter((e) => (e.topics || []).includes(t.slug)).map((e) => e.slug)
  t._articles = articles.filter((a) => (a.topics || []).includes(t.slug)).map((a) => a.slug)
  t._episodes = episodes.filter((p) => (p.topics || []).includes(t.slug)).map((p) => p.slug)
  t._count = t._entities.length + t._articles.length + t._episodes.length
  t._problems = []
}
for (const pr of problems) {
  pr._all = []
  for (const key of ['measure', 'protocols', 'molecules', 'concepts']) {
    pr[key] = (pr[key] || []).filter((s: string) => s in E)
    for (const s of pr[key]) {
      if (!pr._all.includes(s)) pr._all.push(s)
      if (!E[s]._problems.includes(pr.slug)) E[s]._problems.push(pr.slug)
    }
  }
  pr.topics = (pr.topics || []).filter((s: string) => s in T)
  for (const s of pr.topics) T[s]._problems.push(pr.slug)
  const pt = new Set(pr.topics)
  pr._articles = articles.filter((a) => (a.topics || []).some((x: string) => pt.has(x))).slice(0, 3).map((a) => a.slug)
  pr._episodes = episodes.filter((p) => (p.topics || []).some((x: string) => pt.has(x))).slice(0, 3).map((p) => p.slug)
}

// ---- navigation -----------------------------------------------------------
export const PRODUCT_NAV: [string, string][] = [
  ['Events', BRAND_URL + '/events'], ['Biohack Store', BRAND_URL + '/shop'],
  ['Academy', ACADEMY_URL], ['Biohacking Hub', '/'],
  ['Community', BRAND_URL + '/community'], ['About Us', BRAND_URL + '/about-us'],
]
export const SUB_CHANNELS: [string, string][] = [
  ['/blog', 'Blog'], ['/podcast', 'Podcast'], ['/social', 'Social Media'],
  ['/biohackers', 'Top Biohackers'], ['/knowledge-base', 'Knowledge Base'], ['/faq', 'FAQ'],
]
export const PILLARS: [string, string][] = ([
  ['longevity', 'Longevity'], ['sleep', 'Sleep'], ['nutrition', 'Nutrition'],
  ['recovery', 'Physical Activity'], ['cognition', 'Cognitive Performance'],
  ['metabolic-health', 'Metabolic Health'], ['skincare', 'Skincare'],
] as [string, string][]).filter(([s]) => !RETIRED.has(s))
export const FRONT_PILLARS = PILLARS.filter(([s]) => s !== 'metabolic-health')
export const SUB_TOPICS: [string, string][] = FRONT_PILLARS.map(([s, l]) => [`/topics/${s}`, l])

// ---- helpers --------------------------------------------------------------
export const clip = (s: string, n: number) => {
  s = (s || '').trim()
  return s.length <= n ? s : s.slice(0, n).replace(/\s+\S*$/, '') + '…'
}
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export const pretty = (iso: string) => {
  const [y, m, d] = iso.split('-')
  return `${MONTHS[+m - 1]} ${+d}, ${y}`
}
export const firstName = (name: string) => name.replace(/^(Dr|Prof)\.?\s+/, '').split(' ')[0]
export const personSortKey = (b: Any) => (b.name || '').toLowerCase().replace(/^(dr|prof)\.?\s+/, '')

// unified feed item (newest first), as build.py's feed()
export type FeedItem = Any
export function feed(): FeedItem[] {
  const items: FeedItem[] = []
  for (const a of articles) items.push({ k: 'article', kick: 'Blog', t: a.title, d: a.excerpt, u: `/articles/${a.slug}`, date: a.date, topics: a.topics, meta: `${a.readTime} min read`, mark: a.title.slice(0, 2), img: a.image || '' })
  for (const p of episodes) items.push({ k: 'episode', kick: `Podcast · Ep. ${p.number}`, t: p.title, d: p.description, u: `/podcast/${p.slug}`, date: p.date, topics: p.topics, meta: `${p.guest} · ${p.duration}`, mark: 'EP', img: p.image || '', audio: p.audio || '', listen: p.listenUrl || '' })
  for (const r of reports) items.push({ k: 'report', kick: r.kind, t: r.title, d: r.excerpt, u: `/reports#${r.slug}`, date: r.date, topics: r.topics, meta: 'Report', mark: r.stats[0].v })
  for (const h of howtos) items.push({ k: 'howto', kick: 'How-To', t: h.title, d: h.excerpt, u: guideUrl(h.slug), date: h.date, topics: h.topics, meta: `${h.steps} steps · ${h.time}`, mark: String(h.steps) })
  for (const e of entities) items.push({ k: 'entity', kick: KIND_LABEL[e.type], t: e.name, d: e.summary, u: `/knowledge/${e.slug}`, date: e.updated, topics: e.topics, meta: `${e.evidence} evidence`, mark: e.name.slice(0, 2) })
  items.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
  return items
}

export const instagramTop = (n = 4) =>
  [...instagram.posts].sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1)).slice(0, n)
