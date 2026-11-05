// Decides where the header search sends a query: a Hub area, a preset Knowledge Base filter, or full search.
import { entities, articles, episodes, howtos, topics } from './data'

const enc = encodeURIComponent
const AREAS: [RegExp, string][] = [
  [/^(the )?(blog|blogs|articles?|news)$/, '/blog'],
  [/^(the )?(podcasts?|episodes?|show)$/, '/podcast'],
  [/^(the )?(knowledge( base)?|kb|glossary|library)$/, '/knowledge-base'],
  [/^(top )?(biohackers?|people|experts?)$/, '/biohackers'],
  [/^(social( media)?|instagram|youtube|tiktok)$/, '/social'],
  [/^(faqs?|questions?|help)$/, '/faq'],
  [/^(home|hub|biohacking hub)$/, '/'],
]
const KINDS: [RegExp, string][] = [
  [/^molecules?$/, 'molecule'], [/^biomarkers?$/, 'biomarker'], [/^protocols?$/, 'protocol'],
  [/^concepts?$/, 'concept'], [/^(how ?tos?|how-tos?|guides?)$/, 'howto'],
]

export function searchRoute(raw: string): string {
  const q = raw.trim()
  const n = q.toLowerCase().replace(/\s+/g, ' ')
  for (const [re, to] of AREAS) if (re.test(n)) return to
  for (const [re, type] of KINDS) if (re.test(n)) return `/knowledge-base?type=${type}`
  const topic = topics.find(t => t.name?.toLowerCase() === n || t.slug === n)
  if (topic) return `/topics/${topic.slug}`
  const kb = [...entities.map(e => ({ name: e.name, type: e.type, text: e.name + ' ' + (e.summary || '') })),
    ...howtos.map(h => ({ name: h.title, type: 'howto', text: h.title + ' ' + (h.excerpt || '') }))]
  const exact = kb.find(e => e.name.toLowerCase() === n)
  if (exact) return `/knowledge-base?type=${exact.type}&q=${enc(q)}`
  const kbHits = kb.filter(e => e.name.toLowerCase().includes(n))
  if (kbHits.length) {
    const types = new Set(kbHits.map(e => e.type))
    return `/knowledge-base?${types.size === 1 ? `type=${kbHits[0].type}&` : ''}q=${enc(q)}`
  }
  const art = articles.filter(a => (a.title + ' ' + (a.excerpt || '')).toLowerCase().includes(n)).length
  const ep = episodes.filter(p => (p.title + ' ' + (p.guest || '') + ' ' + (p.description || '')).toLowerCase().includes(n)).length
  if (ep > art) return `/podcast?q=${enc(q)}`
  if (art) return `/blog?q=${enc(q)}`
  if (kb.some(e => e.text.toLowerCase().includes(n))) return `/knowledge-base?q=${enc(q)}`
  return `/search?q=${enc(q)}`
}
