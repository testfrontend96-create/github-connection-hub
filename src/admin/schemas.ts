// Form definitions for every editable kind of Hub content.
import { KINDS, type Kind } from '../lib/contentKinds'

export type Opt = [value: string, label: string]
export type Field =
  | { k: string; label: string; type: 'text' | 'textarea' | 'url' | 'date' | 'number' | 'image' | 'bool' | 'lines'; help?: string; wide?: boolean; required?: boolean; cls?: string; ph?: string; group?: { title: string; sub: string } }
  | { k: string; label: string; type: 'select'; options: () => Opt[]; help?: string; wide?: boolean; required?: boolean; cls?: string; ph?: string; group?: { title: string; sub: string } }
  | { k: string; label: string; type: 'chips'; options: () => Opt[]; custom?: boolean; help?: string; wide?: boolean; required?: boolean; cls?: string; ph?: string; group?: { title: string; sub: string } }
  | { k: string; label: string; type: 'records'; sub: { k: string; label: string; type: 'text' | 'textarea' | 'url' | 'lines' }[]; help?: string; wide?: boolean; required?: boolean; cls?: string; ph?: string; group?: { title: string; sub: string } }
  | { k: string; label: string; type: 'dict'; keys: string[]; help?: string; wide?: boolean; required?: boolean; cls?: string; ph?: string; group?: { title: string; sub: string } }
  | { k: string; label: string; type: 'blocks'; help?: string; wide?: boolean; required?: boolean; cls?: string; ph?: string; group?: { title: string; sub: string } }

const list = (kind: Kind, label: (x: any) => string): Opt[] =>
  KINDS[kind].base().map((x: any) => [KINDS[kind].key(x), label(x)] as Opt).sort((a, b) => a[1].localeCompare(b[1]))

export const TOPIC_OPTS = (): Opt[] => list('topic', (t) => t.name).filter(([s]) => s !== 'recovery').concat([['recovery', 'Physical Activity']])
export const ENTITY_OPTS = (): Opt[] => list('entity', (e) => e.name)
export const CATEGORY_OPTS = (): Opt[] =>
  ['Blog', 'Event Releases', 'Health & Wellness', 'Fitness & Recovery', 'Sleep', 'Longevity & Anti-Aging', 'Skin & Body Care', 'Devices', 'Nutrition', 'Cognitive Enhancement', 'Fitness', 'Regenerative', 'Testing & Monitoring'].map((c) => [c, c])
// Backlog: evidence indicator hidden until a ranking approach is decided.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _EVIDENCE: Opt[] = [['Strong', 'Strong'], ['Moderate', 'Moderate'], ['Emerging', 'Emerging']]
const ENTITY_TYPES: Opt[] = [['molecule', 'Molecule'], ['biomarker', 'Biomarker'], ['protocol', 'Protocol'], ['concept', 'Concept']]
const SOCIALS = ['instagram', 'x', 'linkedin', 'youtube', 'tiktok', 'facebook', 'podcast']

export type KindDef = {
  kind: Kind
  label: string
  singular: string
  title: (x: any) => string
  sub: (x: any) => string
  author?: (x: any) => { name?: string; image?: string; email?: string } | null
  image?: (x: any) => string | undefined
  date?: (x: any) => string | undefined
  star?: ('lead' | 'blog' | 'podcast')[]
  url?: (slug: string) => string
  fields: Field[]
}

export const KIND_DEFS: KindDef[] = [
  {
    kind: 'article', label: 'Blog', singular: 'article', star: ['lead', 'blog'],
    title: (x) => x.title, sub: (x) => { const c: string[] = x.categories || []; return c.length > 2 ? c.slice(0, 2).join(', ') + ' +' + (c.length - 2) : c.join(', ') }, author: (x) => x.detail?.author || null,
    image: (x) => x.image, date: (x) => x.date, url: (s) => `/articles/${s}`,
    fields: [
      { k: 'title', label: 'Title', type: 'text', wide: true, required: true, ph: 'e.g. How sleep shapes your metabolism', group: { title: 'Basics', sub: 'Headline, publish date and reading time.' } },
      { k: 'date', label: 'Publish date', type: 'date', required: true },
      { k: 'readTime', label: 'Reading time (minutes)', type: 'number', ph: 'Auto from body, e.g. 8', help: 'Leave empty to calculate it from the body.' },
      { k: 'image', label: 'Cover image', type: 'image', wide: true, group: { title: 'Cover and summary', sub: 'What readers see on cards, in search and at the top of the article.' } },
      { k: 'excerpt', label: 'Card description', type: 'textarea', wide: true, ph: 'One or two sentences that sum up the article.', help: 'Shown on cards and in search.' },
      { k: 'detail.intro', label: 'Opening paragraph', type: 'textarea', wide: true, ph: 'The first paragraph readers see, right under the subscribe box.' },
      { k: 'detail.blocks', label: 'Article body', type: 'blocks', wide: true, group: { title: 'Article body', sub: 'Build the article section by section: text, headings, images, lists and more.' } },
      { k: 'topics', label: 'Hub topic', type: 'chips', options: TOPIC_OPTS, wide: true, group: { title: 'Tags', sub: 'Where the article shows up across the Hub and the Blog filters.' } },
      { k: 'categories', label: 'Blog categories', type: 'chips', options: CATEGORY_OPTS, custom: true, wide: true },
      { k: 'entities', label: 'Knowledge Base mentions', type: 'chips', options: ENTITY_OPTS, wide: true },
      { k: 'detail.author.image', label: 'Writer photo', type: 'image', cls: 'adm-writer-photo', group: { title: 'Writer and source', sub: 'Who wrote it and where it was first published.' } },
      { k: 'detail.author.name', label: 'Writer name', type: 'text', ph: 'e.g. Jane Smith' },
      { k: 'detail.author.role', label: 'Writer role', type: 'text', ph: 'e.g. Health writer' },
      { k: 'detail.author.email', label: 'Writer email', type: 'text', ph: 'e.g. jane@biohackers.world' },
      { k: 'sourceUrl', label: 'Original link', type: 'url', wide: true, cls: 'adm-wide adm-source', ph: 'https://… where the article first appeared' },
      { k: 'detail.highlights', label: 'Highlights', type: 'lines', wide: true, ph: 'One key takeaway per line', group: { title: 'Highlights and FAQ', sub: 'Key takeaways and common questions shown in the article.' }, help: 'One highlight per line.' },
      { k: 'detail.faq', label: 'Article FAQ', type: 'records', wide: true, sub: [{ k: 'q', label: 'Question', type: 'text' }, { k: 'a', label: 'Answer', type: 'textarea' }] },
    ],
  },
  {
    kind: 'episode', label: 'Podcast', singular: 'episode', star: ['podcast'],
    title: (x) => x.title, sub: (x) => [x.season && `S${x.season} · Ep. ${x.number}`, x.guest].filter(Boolean).join(' · '),
    image: (x) => x.image, date: (x) => x.date, url: (s) => `/podcast/${s}`,
    fields: [
      { k: 'title', label: 'Title', type: 'text', wide: true, required: true },
      { k: 'season', label: 'Season', type: 'number' },
      { k: 'number', label: 'Episode number', type: 'number' },
      { k: 'date', label: 'Published', type: 'date', required: true },
      { k: 'duration', label: 'Length', type: 'text', help: 'e.g. 42 min' },
      { k: 'guest', label: 'Guest, host', type: 'text', help: 'Guest first, then host, separated by a comma.' },
      { k: 'guestTitle', label: 'Guest role', type: 'text' },
      { k: 'image', label: 'Thumbnail', type: 'image', wide: true },
      { k: 'audio', label: 'Audio file link', type: 'url', wide: true },
      { k: 'listenUrl', label: 'Episode page link', type: 'url' },
      { k: 'youtubeUrl', label: 'YouTube link', type: 'url' },
      { k: 'appleUrl', label: 'Apple Podcasts link', type: 'url' },
      { k: 'spotifyUrl', label: 'Spotify link', type: 'url' },
      { k: 'description', label: 'About this episode', type: 'textarea', wide: true },
      { k: 'takeaways', label: 'Takeaways', type: 'lines', wide: true, help: 'One per line.' },
      { k: 'topics', label: 'Topics', type: 'chips', options: TOPIC_OPTS, wide: true },
      { k: 'entities', label: 'Knowledge Base items', type: 'chips', options: ENTITY_OPTS, wide: true },
    ],
  },
  {
    kind: 'entity', label: 'Knowledge Base', singular: 'entry',
    title: (x) => x.name, sub: (x) => [ENTITY_TYPES.find(([v]) => v === x.type)?.[1], ].filter(Boolean).join(' · '),
    date: (x) => x.updated, url: (s) => `/knowledge/${s}`,
    fields: [
      { k: 'name', label: 'Name', type: 'text', required: true },
      { k: 'type', label: 'Type', type: 'select', options: () => ENTITY_TYPES, required: true },
      { k: 'updated', label: 'Last updated', type: 'date' },
      { k: 'aka', label: 'Also known as', type: 'lines', help: 'One per line.' },
      { k: 'summary', label: 'Summary', type: 'textarea', wide: true },
      { k: 'topics', label: 'Topics', type: 'chips', options: TOPIC_OPTS, wide: true },
      { k: 'keyFacts', label: 'Key facts', type: 'records', wide: true, sub: [{ k: 'label', label: 'Label', type: 'text' }, { k: 'value', label: 'Value', type: 'text' }] },
      { k: 'sections', label: 'Sections', type: 'records', wide: true, sub: [{ k: 'h', label: 'Heading', type: 'text' }, { k: 'body', label: 'Paragraphs (one per line)', type: 'lines' }] },
      { k: 'faq', label: 'FAQ', type: 'records', wide: true, sub: [{ k: 'q', label: 'Question', type: 'text' }, { k: 'a', label: 'Answer', type: 'textarea' }] },
      { k: 'related', label: 'Related entries', type: 'chips', options: ENTITY_OPTS, wide: true },
      { k: 'measuredBy', label: 'Measured by', type: 'chips', options: ENTITY_OPTS, wide: true },
    ],
  },
  {
    kind: 'howto', label: 'How To', singular: 'guide',
    title: (x) => x.title, sub: (x) => [`${x.steps} steps`, x.time].filter(Boolean).join(' · '), date: (x) => x.date,
    fields: [
      { k: 'title', label: 'Title', type: 'text', wide: true, required: true },
      { k: 'steps', label: 'Number of steps', type: 'number' },
      { k: 'time', label: 'Duration', type: 'text', help: 'e.g. 10 min' },
      { k: 'date', label: 'Date', type: 'date' },
      { k: 'excerpt', label: 'Summary', type: 'textarea', wide: true },
      { k: 'topics', label: 'Topics', type: 'chips', options: TOPIC_OPTS, wide: true },
      { k: 'entities', label: 'Knowledge Base items', type: 'chips', options: ENTITY_OPTS, wide: true },
    ],
  },
  {
    kind: 'biohacker', label: 'Top Biohackers', singular: 'biohacker',
    title: (x) => x.name, sub: (x) => x.title || x.known || '', image: (x) => x.image, url: (s) => `/biohackers/${s}`,
    fields: [
      { k: 'name', label: 'Name', type: 'text', required: true },
      { k: 'title', label: 'Role', type: 'text' },
      { k: 'image', label: 'Photo', type: 'image' },
      { k: 'imageCredit', label: 'Photo credit', type: 'text' },
      { k: 'known', label: 'Known for', type: 'textarea', wide: true },
      { k: 'bio', label: 'About (one paragraph per line)', type: 'lines', wide: true },
      { k: 'focus', label: 'Focus', type: 'lines', help: 'One per line.' },
      { k: 'highlights', label: 'Professional highlights', type: 'lines', help: 'One per line.' },
      { k: 'organizations', label: 'Organisations', type: 'records', wide: true, sub: [{ k: 'name', label: 'Name', type: 'text' }, { k: 'role', label: 'Role', type: 'text' }, { k: 'url', label: 'Link', type: 'url' }] },
      { k: 'website', label: 'Website', type: 'url' },
      { k: 'social', label: 'Social links', type: 'dict', keys: SOCIALS, wide: true },
      { k: 'topics', label: 'Topics', type: 'chips', options: TOPIC_OPTS, wide: true },
      { k: 'speaker', label: 'Biohackers World speaker', type: 'bool' },
      { k: 'sources', label: 'Sources', type: 'lines', wide: true, help: 'One link per line.' },
    ],
  },
  {
    kind: 'topic', label: 'Topics', singular: 'topic',
    title: (x) => x.name, sub: (x) => x.question || '', url: (s) => `/topics/${s}`,
    fields: [
      { k: 'name', label: 'Name', type: 'text', required: true },
      { k: 'color', label: 'Colour', type: 'text', help: 'Hex, e.g. #38389C' },
      { k: 'question', label: 'Question', type: 'text', wide: true },
      { k: 'tagline', label: 'Tagline', type: 'text', wide: true },
      { k: 'summary', label: 'Summary', type: 'textarea', wide: true },
      { k: 'intro', label: 'Intro (one paragraph per line)', type: 'lines', wide: true },
      { k: 'beginnerPath', label: 'Where to start, in order', type: 'chips', options: ENTITY_OPTS, wide: true },
    ],
  },
  {
    kind: 'problem', label: 'Problems', singular: 'problem',
    title: (x) => x.name, sub: (x) => x.question || '', url: (s) => `/problems/${s}`,
    fields: [
      { k: 'name', label: 'Name', type: 'text', required: true },
      { k: 'question', label: 'Question', type: 'text', wide: true },
      { k: 'tagline', label: 'Tagline', type: 'text', wide: true },
      { k: 'summary', label: 'Summary', type: 'textarea', wide: true },
      { k: 'signs', label: 'Signs', type: 'lines', wide: true },
      { k: 'causes', label: 'Causes', type: 'lines', wide: true },
      { k: 'topics', label: 'Topics', type: 'chips', options: TOPIC_OPTS, wide: true },
      { k: 'measure', label: 'What to measure', type: 'chips', options: ENTITY_OPTS, wide: true },
      { k: 'protocols', label: 'Protocols', type: 'chips', options: ENTITY_OPTS, wide: true },
      { k: 'molecules', label: 'Molecules', type: 'chips', options: ENTITY_OPTS, wide: true },
      { k: 'concepts', label: 'Concepts', type: 'chips', options: ENTITY_OPTS, wide: true },
      { k: 'firstStep', label: 'First step', type: 'textarea', wide: true },
      { k: 'clinical', label: 'When to see a clinician', type: 'textarea', wide: true },
    ],
  },
  {
    kind: 'faq', label: 'FAQ', singular: 'question',
    title: (x) => x.q, sub: (x) => (x.a || '').slice(0, 110),
    fields: [
      { k: 'q', label: 'Question', type: 'text', wide: true, required: true },
      { k: 'a', label: 'Answer', type: 'textarea', wide: true, required: true },
      { k: 'entities', label: 'Tags', type: 'chips', options: ENTITY_OPTS, wide: true },
    ],
  },
  {
    kind: 'event', label: 'Events', singular: 'event',
    title: (x) => x.name || x.city, sub: (x) => [x.city, x.dates].filter(Boolean).join(' · '), image: (x) => x.bg,
    fields: [
      { k: 'name', label: 'Event name', type: 'text', wide: true, required: true },
      { k: 'city', label: 'City', type: 'text', required: true },
      { k: 'dates', label: 'Dates', type: 'text', help: 'e.g. January 16-17, 2027' },
      { k: 'url', label: 'Ticket / event link', type: 'url', wide: true },
      { k: 'bg', label: 'Background photo', type: 'image' },
      { k: 'logo', label: 'Logo', type: 'image' },
    ],
  },
  {
    kind: 'social', label: 'Social Media', singular: 'account',
    title: (x) => x.name, sub: (x) => x.handle || '',
    fields: [
      { k: 'name', label: 'Platform', type: 'text', required: true },
      { k: 'handle', label: 'Handle', type: 'text' },
      { k: 'url', label: 'Link', type: 'url', wide: true },
      { k: 'blurb', label: 'Description', type: 'textarea', wide: true },
    ],
  },
]

export const getPath = (o: any, path: string) => path.split('.').reduce((a, k) => (a == null ? a : a[k]), o)
export const setPath = (o: any, path: string, v: any) => {
  const keys = path.split('.')
  const out = { ...o }
  let cur: any = out
  keys.slice(0, -1).forEach((k) => { cur[k] = { ...(cur[k] || {}) }; cur = cur[k] })
  cur[keys[keys.length - 1]] = v
  return out
}
