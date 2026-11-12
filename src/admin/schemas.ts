// Form definitions for every editable kind of Hub content.
import { KINDS, type Kind } from '../lib/contentKinds'

export type Opt = [value: string, label: string]
export type Field =
  | { k: string; label: string; type: 'text' | 'textarea' | 'url' | 'date' | 'number' | 'image' | 'bool' | 'lines' | 'list'; min?: number; add?: string; bullet?: boolean; help?: string; wide?: boolean; required?: boolean; cls?: string; ph?: string; group?: { title: string; sub: string; ex?: string } }
  | { k: string; label: string; type: 'select'; options: () => Opt[]; help?: string; wide?: boolean; required?: boolean; cls?: string; ph?: string; group?: { title: string; sub: string; ex?: string } }
  | { k: string; label: string; type: 'chips'; options: () => Opt[]; custom?: boolean; help?: string; wide?: boolean; required?: boolean; cls?: string; ph?: string; group?: { title: string; sub: string; ex?: string } }
  | { k: string; label: string; type: 'records'; sub: { k: string; label: string; type: 'text' | 'textarea' | 'url' | 'lines'; ph?: string }[]; min?: number; help?: string; wide?: boolean; required?: boolean; cls?: string; ph?: string; group?: { title: string; sub: string; ex?: string } }
  | { k: string; label: string; type: 'dict'; keys: string[]; help?: string; wide?: boolean; required?: boolean; cls?: string; ph?: string; group?: { title: string; sub: string; ex?: string } }
  | { k: string; label: string; type: 'blocks'; help?: string; wide?: boolean; required?: boolean; cls?: string; ph?: string; group?: { title: string; sub: string; ex?: string } }

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
      { k: 'detail.highlights', label: 'Key takeaways', type: 'list', min: 3, add: 'Add highlight', bullet: true, wide: true, ph: 'A key takeaway, in one sentence', group: { title: 'Highlights', sub: 'Short bullet points shown in the Highlights box near the top of the article.' } },
      { k: 'detail.blocks', label: 'Article body', type: 'blocks', wide: true, group: { title: 'Article body', sub: 'Build the article section by section: text, headings, images, lists and more.' } },
      { k: 'topics', label: 'Hub topic', type: 'chips', options: TOPIC_OPTS, wide: true, group: { title: 'Tags', sub: 'Where the article shows up across the Hub and the Blog filters.' } },
      { k: 'categories', label: 'Blog categories', type: 'chips', options: CATEGORY_OPTS, custom: true, wide: true },
      { k: 'entities', label: 'Knowledge Base mentions', type: 'chips', options: ENTITY_OPTS, wide: true },
      { k: 'detail.author.image', label: 'Writer photo', type: 'image', cls: 'adm-writer-photo', group: { title: 'Writer', sub: 'Who wrote it and how readers can reach them.' } },
      { k: 'detail.author.name', label: 'Writer name', type: 'text', ph: 'e.g. Jane Smith' },
      { k: 'detail.author.role', label: 'Writer role', type: 'text', ph: 'e.g. Health writer' },
      { k: 'detail.author.email', label: 'Writer email', type: 'text', ph: 'e.g. jane@biohackers.world' },
      { k: 'sources', label: 'Source links', type: 'list', min: 1, add: 'Add source', wide: true, ph: 'https://… where the article first appeared', group: { title: 'Sources', sub: 'Where the article was first published. The first link is used as the original.' } },
      { k: 'detail.faq', label: 'Article FAQ', type: 'records', min: 1, wide: true, group: { title: 'FAQ', sub: 'Common questions and answers shown at the end of the article.' }, sub: [{ k: 'q', label: 'Question', type: 'text', ph: 'e.g. How long does it take to see results?' }, { k: 'a', label: 'Answer', type: 'textarea', ph: 'A clear, short answer.' }] },
    ],
  },
  {
    kind: 'episode', label: 'Podcast', singular: 'episode', star: ['podcast'],
    title: (x) => x.title, sub: (x) => [x.season && `S${x.season} · Ep. ${x.number}`, x.guest].filter(Boolean).join(' · '),
    image: (x) => x.image, date: (x) => x.date, url: (s) => `/podcast/${s}`,
    fields: [
      { k: 'title', label: 'Title', type: 'text', wide: true, required: true, ph: 'e.g. Why normal tests don’t mean you’re healthy', group: { title: 'Basics', sub: 'Episode title, numbering, publish date and length.', ex: 'ep-basics' } },
      { k: 'season', label: 'Season', type: 'number', ph: 'e.g. 2' },
      { k: 'number', label: 'Episode number', type: 'number', ph: 'e.g. 14' },
      { k: 'date', label: 'Published', type: 'date', required: true },
      { k: 'duration', label: 'Length', type: 'text', ph: 'e.g. 42 min' },
      { k: 'guest', label: 'Guest, host', type: 'text', ph: 'e.g. Jane Smith, John Doe', help: 'Guest first, then host, separated by a comma.', group: { title: 'People', sub: 'Who is on the episode and what the guest does.', ex: 'ep-people' } },
      { k: 'guestTitle', label: 'Guest role', type: 'text', ph: 'e.g. Longevity physician' },
      { k: 'image', label: 'Thumbnail', type: 'image', wide: true, group: { title: 'Artwork and audio', sub: 'The episode thumbnail and the file the player streams.', ex: 'ep-media' } },
      { k: 'audio', label: 'Audio file link', type: 'url', wide: true, ph: 'https://… .mp3' },
      { k: 'listenUrl', label: 'Episode page link', type: 'url', group: { title: 'Listening links', sub: 'Where listeners can open the episode on each platform.', ex: 'ep-links' } },
      { k: 'youtubeUrl', label: 'YouTube link', type: 'url' },
      { k: 'appleUrl', label: 'Apple Podcasts link', type: 'url' },
      { k: 'spotifyUrl', label: 'Spotify link', type: 'url' },
      { k: 'description', label: 'About this episode', type: 'textarea', wide: true, ph: 'What the conversation covers. Leave an empty line between paragraphs.', group: { title: 'About this episode', sub: 'The description shown under the episode heading.', ex: 'ep-about' } },
      { k: 'takeaways', label: 'Key takeaways', type: 'list', min: 3, add: 'Add takeaway', bullet: true, wide: true, ph: 'A key takeaway, in one sentence', group: { title: 'Takeaways', sub: 'Short bullet points shown in the Key takeaways box.', ex: 'ep-takeaways' } },
      { k: 'topics', label: 'Topics', type: 'chips', options: TOPIC_OPTS, wide: true, group: { title: 'Tags', sub: 'Where the episode shows up across the Hub.', ex: 'ep-tags' } },
      { k: 'entities', label: 'Knowledge Base items', type: 'chips', options: ENTITY_OPTS, wide: true },
    ],
  },
  {
    kind: 'entity', label: 'Knowledge Base', singular: 'entry',
    title: (x) => x.name, sub: (x) => [ENTITY_TYPES.find(([v]) => v === x.type)?.[1], ].filter(Boolean).join(' · '),
    date: (x) => x.updated, url: (s) => `/knowledge/${s}`,
    fields: [
      { k: 'name', label: 'Name', type: 'text', required: true, ph: 'e.g. Heart rate variability', group: { title: 'Basics', sub: 'Entry name, type, aliases and when it was last reviewed.', ex: 'kb-basics' } },
      { k: 'type', label: 'Type', type: 'select', options: () => ENTITY_TYPES, required: true },
      { k: 'updated', label: 'Last updated', type: 'date' },
      { k: 'aka', label: 'Also known as', type: 'list', min: 1, add: 'Add name', wide: true, ph: 'e.g. HRV' },
      { k: 'summary', label: 'Summary', type: 'textarea', wide: true, ph: 'Explain the entry in one short paragraph.', group: { title: 'Summary', sub: 'The one-paragraph answer at the top of the entry.', ex: 'kb-summary' } },
      { k: 'keyFacts', label: 'Key facts', type: 'records', wide: true, group: { title: 'Key facts', sub: 'Label and value pairs shown in the facts table.', ex: 'kb-facts' }, sub: [{ k: 'label', label: 'Label', type: 'text' }, { k: 'value', label: 'Value', type: 'text' }] },
      { k: 'sections', label: 'Sections', type: 'records', wide: true, group: { title: 'Body', sub: 'Headed sections that explain the entry in depth.', ex: 'kb-body' }, sub: [{ k: 'h', label: 'Heading', type: 'text' }, { k: 'body', label: 'Paragraphs (one per line)', type: 'lines' }] },
      { k: 'faq', label: 'FAQ', type: 'records', min: 1, wide: true, group: { title: 'FAQ', sub: 'Common questions and answers shown under the body.', ex: 'kb-faq' }, sub: [{ k: 'q', label: 'Question', type: 'text', ph: 'e.g. What is a healthy range?' }, { k: 'a', label: 'Answer', type: 'textarea', ph: 'A clear, short answer.' }] },
      { k: 'topics', label: 'Topics', type: 'chips', options: TOPIC_OPTS, wide: true, group: { title: 'Connections', sub: 'Topics and related entries listed beside the entry.', ex: 'kb-links' } },
      { k: 'related', label: 'Related entries', type: 'chips', options: ENTITY_OPTS, wide: true },
      { k: 'measuredBy', label: 'Measured by', type: 'chips', options: ENTITY_OPTS, wide: true },
    ],
  },
  {
    kind: 'howto', label: 'How To', singular: 'guide',
    title: (x) => x.title, sub: (x) => [`${x.steps} steps`, x.time].filter(Boolean).join(' · '), date: (x) => x.date,
    fields: [
      { k: 'title', label: 'Title', type: 'text', wide: true, required: true, ph: 'e.g. How to track your HRV', group: { title: 'Basics', sub: 'Guide title, number of steps, duration and date.' } },
      { k: 'steps', label: 'Number of steps', type: 'number', ph: 'e.g. 5' },
      { k: 'time', label: 'Duration', type: 'text', ph: 'e.g. 10 min' },
      { k: 'date', label: 'Date', type: 'date' },
      { k: 'excerpt', label: 'Summary', type: 'textarea', wide: true, ph: 'One or two sentences on what the guide helps with.', group: { title: 'Summary', sub: 'Shown on the guide card in the Knowledge Base.' } },
      { k: 'topics', label: 'Topics', type: 'chips', options: TOPIC_OPTS, wide: true, group: { title: 'Tags', sub: 'Where the guide shows up across the Hub.' } },
      { k: 'entities', label: 'Knowledge Base items', type: 'chips', options: ENTITY_OPTS, wide: true },
    ],
  },
  {
    kind: 'biohacker', label: 'Top Biohackers', singular: 'biohacker',
    title: (x) => x.name, sub: (x) => x.title || x.known || '', image: (x) => x.image, url: (s) => `/biohackers/${s}`,
    fields: [
      { k: 'image', label: 'Photo', type: 'image', cls: 'adm-writer-photo', group: { title: 'Profile', sub: 'Photo, name and role shown at the top of the profile.', ex: 'bh-profile' } },
      { k: 'name', label: 'Name', type: 'text', required: true, ph: 'e.g. Jane Smith' },
      { k: 'title', label: 'Role', type: 'text', ph: 'e.g. Longevity researcher' },
      { k: 'imageCredit', label: 'Photo credit', type: 'text', ph: 'e.g. Jane Smith / CC BY-SA 4.0' },
      { k: 'known', label: 'Known for', type: 'textarea', wide: true, ph: 'One or two sentences on what they are known for.', group: { title: 'About', sub: 'The short intro and the About paragraphs.', ex: 'bh-about' } },
      { k: 'bio', label: 'About paragraphs', type: 'list', min: 1, add: 'Add paragraph', wide: true, ph: 'A paragraph about them' },
      { k: 'highlights', label: 'Professional highlights', type: 'list', min: 3, add: 'Add highlight', bullet: true, wide: true, ph: 'A highlight, in one sentence', group: { title: 'Highlights', sub: 'Bullet points shown in the Highlights box.', ex: 'bh-highlights' } },
      { k: 'topics', label: 'Topics', type: 'chips', options: TOPIC_OPTS, wide: true, group: { title: 'Topics and focus', sub: 'The two chip boxes on the profile.', ex: 'bh-tags' } },
      { k: 'focus', label: 'Focus', type: 'chips', options: ENTITY_OPTS, wide: true },
      { k: 'organizations', label: 'Organisations', type: 'records', wide: true, group: { title: 'Professional', sub: 'Organisations, website and social links in the Professional box.', ex: 'bh-pro' }, sub: [{ k: 'name', label: 'Name', type: 'text' }, { k: 'role', label: 'Role', type: 'text' }, { k: 'url', label: 'Link', type: 'url' }] },
      { k: 'website', label: 'Website', type: 'url', wide: true },
      { k: 'social', label: 'Social links', type: 'dict', keys: SOCIALS, wide: true },
      { k: 'speaker', label: 'Biohackers World speaker', type: 'bool', wide: true, group: { title: 'Speaker', sub: 'Marks the profile as a Biohackers World speaker.', ex: 'bh-speaker' } },
      { k: 'sources', label: 'Source links', type: 'list', min: 1, add: 'Add source', wide: true, ph: 'https://… where the facts come from', group: { title: 'Sources', sub: 'Links that back up the facts on the profile.' } },
    ],
  },
  {
    kind: 'topic', label: 'Topics', singular: 'topic',
    title: (x) => x.name, sub: (x) => x.question || '', url: (s) => `/topics/${s}`,
    fields: [
      { k: 'name', label: 'Name', type: 'text', required: true, ph: 'e.g. Sleep', group: { title: 'Basics', sub: 'Topic name and its accent colour.' } },
      { k: 'color', label: 'Colour', type: 'text', ph: 'Hex, e.g. #38389C' },
      { k: 'question', label: 'Question', type: 'text', wide: true, ph: 'e.g. How do I sleep better?', group: { title: 'Heading', sub: 'The question, tagline and summary in the topic heading.' } },
      { k: 'tagline', label: 'Tagline', type: 'text', wide: true, ph: 'A short line under the question' },
      { k: 'summary', label: 'Summary', type: 'textarea', wide: true, ph: 'One or two sentences about the topic.' },
      { k: 'intro', label: 'Intro paragraphs', type: 'list', min: 1, add: 'Add paragraph', wide: true, ph: 'A paragraph of the intro', group: { title: 'Intro', sub: 'The opening paragraphs on the topic page.' } },
      { k: 'beginnerPath', label: 'Where to start, in order', type: 'chips', options: ENTITY_OPTS, wide: true, group: { title: 'Where to start', sub: 'Knowledge Base entries a beginner should read first, in order.' } },
    ],
  },
  {
    kind: 'problem', label: 'Problems', singular: 'problem',
    title: (x) => x.name, sub: (x) => x.question || '', url: (s) => `/problems/${s}`,
    fields: [
      { k: 'name', label: 'Name', type: 'text', required: true, wide: true, ph: 'e.g. Low energy', group: { title: 'Basics', sub: 'Problem name, question and tagline in the page heading.' } },
      { k: 'question', label: 'Question', type: 'text', wide: true, ph: 'e.g. Why am I always tired?' },
      { k: 'tagline', label: 'Tagline', type: 'text', wide: true, ph: 'A short line under the question' },
      { k: 'summary', label: 'Summary', type: 'textarea', wide: true, ph: 'One or two sentences about the problem.', group: { title: 'Overview', sub: 'Summary, common signs and likely causes.' } },
      { k: 'signs', label: 'Signs', type: 'list', min: 3, add: 'Add sign', bullet: true, wide: true, ph: 'A common sign' },
      { k: 'causes', label: 'Causes', type: 'list', min: 3, add: 'Add cause', bullet: true, wide: true, ph: 'A likely cause' },
      { k: 'topics', label: 'Topics', type: 'chips', options: TOPIC_OPTS, wide: true, group: { title: 'Connections', sub: 'Topics and Knowledge Base entries linked from the page.' } },
      { k: 'measure', label: 'What to measure', type: 'chips', options: ENTITY_OPTS, wide: true },
      { k: 'protocols', label: 'Protocols', type: 'chips', options: ENTITY_OPTS, wide: true },
      { k: 'molecules', label: 'Molecules', type: 'chips', options: ENTITY_OPTS, wide: true },
      { k: 'concepts', label: 'Concepts', type: 'chips', options: ENTITY_OPTS, wide: true },
      { k: 'firstStep', label: 'First step', type: 'textarea', wide: true, ph: 'One simple thing to try first.', group: { title: 'Next steps', sub: 'What to try first and when to get medical help.' } },
      { k: 'clinical', label: 'When to see a clinician', type: 'textarea', wide: true, ph: 'Signs that mean it is time to see a doctor.' },
    ],
  },
  {
    kind: 'faq', label: 'FAQ', singular: 'question',
    title: (x) => x.q, sub: (x) => (x.a || '').slice(0, 110),
    fields: [
      { k: 'q', label: 'Question', type: 'text', wide: true, required: true, ph: 'e.g. What is biohacking?', group: { title: 'Question and answer', sub: 'Shown in the FAQ directory and on the homepage.' } },
      { k: 'a', label: 'Answer', type: 'textarea', wide: true, required: true, ph: 'A clear, short answer.' },
      { k: 'entities', label: 'Tags', type: 'chips', options: ENTITY_OPTS, wide: true, group: { title: 'Tags', sub: 'Knowledge Base entries this question relates to.' } },
    ],
  },
  {
    kind: 'event', label: 'Events', singular: 'event',
    title: (x) => x.name || x.city, sub: (x) => [x.city, x.dates].filter(Boolean).join(' · '), image: (x) => x.bg,
    fields: [
      { k: 'name', label: 'Event name', type: 'text', wide: true, required: true, ph: 'e.g. Biohackers World Miami', group: { title: 'Basics', sub: 'Event name, city, dates and ticket link.' } },
      { k: 'city', label: 'City', type: 'text', required: true, ph: 'e.g. Miami' },
      { k: 'dates', label: 'Dates', type: 'text', ph: 'e.g. January 16-17, 2027' },
      { k: 'url', label: 'Ticket / event link', type: 'url', wide: true },
      { k: 'bg', label: 'Background photo', type: 'image', wide: true, group: { title: 'Images', sub: 'The background photo and logo on the event card.' } },
      { k: 'logo', label: 'Logo', type: 'image', wide: true },
    ],
  },
  {
    kind: 'social', label: 'Social Media', singular: 'account',
    title: (x) => x.name, sub: (x) => x.handle || '',
    fields: [
      { k: 'name', label: 'Platform', type: 'text', required: true, ph: 'e.g. Instagram', group: { title: 'Account', sub: 'Platform, handle and link.' } },
      { k: 'handle', label: 'Handle', type: 'text', ph: 'e.g. @biohackersworld' },
      { k: 'url', label: 'Link', type: 'url', wide: true },
      { k: 'blurb', label: 'Description', type: 'textarea', wide: true, ph: 'What followers get on this account.', group: { title: 'Description', sub: 'The short line shown on the social card.' } },
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
