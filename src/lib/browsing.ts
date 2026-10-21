type Content = Record<string, any>

export const normalizeSearch = (value: string) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
export const matchesSearch = (values: string[], query: string) => normalizeSearch(values.join(' ')).includes(normalizeSearch(query.trim()))
export const guideUrl = (slug: string) => `/knowledge-base?type=howto#${slug}`

export function filterArticles(items: Content[], query: string, category: string) {
  return items.filter(item => (category === 'all' || (item.categories || []).includes(category)) &&
    matchesSearch([item.title, item.excerpt, ...(item.categories || []), ...(item.topics || [])], query))
}

export function filterKnowledge(items: Content[], query: string, type: string, topic: string) {
  return items.filter(item => (type === 'all' || item.type === type) &&
    (topic === 'all' || (item.topics || []).includes(topic)) &&
    matchesSearch([item.name, item.summary, ...(item.aka || [])], query))
}

export function articleTopic(item: Content, topics: Record<string, Content>) {
  const topic = (item.topics || []).find((slug: string) => topics[slug])
  return topic ? topics[topic].name : (item.categories || []).find((category: string) => category !== 'Blog') || 'Biohacking'
}
export function filterEpisodes(items: Content[], query: string, topic: string) {
  return items.filter(item => (topic === 'all' || (item.topics || []).includes(topic)) &&
    matchesSearch([item.title, item.description, item.guest, ...(item.topics || [])], query))
}

export const episodeLabel = (item: Content) =>
  item.season ? `Season ${item.season} · Episode ${item.number}` : `Episode ${item.number}`

export function listenLinks(title: string): [string, string][] {
  const q = encodeURIComponent(`Biohackers World ${title}`)
  return [
    ['YouTube', `https://www.youtube.com/results?search_query=${q}`],
    ['Apple Podcasts', `https://podcasts.apple.com/search?term=${q}`],
    ['Spotify', `https://open.spotify.com/search/${q}/episodes`],
    ['Google Podcasts', `https://music.youtube.com/search?q=${q}`],
  ]
}
