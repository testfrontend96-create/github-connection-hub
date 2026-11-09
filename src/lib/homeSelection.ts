export const START_HERE_DEFAULTS = {
  title: 'What are you interested in?',
  body: 'Pick the symptom. Each page routes you to what to measure and what to consider.',
}
export type StartHere = { title: string; body: string; chips: string[] }
export function startHereValue(value: Partial<StartHere> | undefined, problemSlugs: string[]): StartHere {
  return { ...START_HERE_DEFAULTS, ...value, chips: value?.chips ?? problemSlugs }
}
export function resolveHero(features: any[], lists: Record<string, any[]>, popularity: Record<string, string[]>) {
  const used = new Set<string>()
  const result: Record<string, any> = {}
  for (const [slot, fallback] of [['lead', 'article'], ['blog', 'article'], ['podcast', 'episode']]) {
    const f = features.find(x => x.slot === slot)
    const kind = f?.mode === 'pinned' && ['article', 'episode'].includes(f.item_kind) ? f.item_kind : fallback
    const list = lists[kind] || []
    const wanted = f?.mode === 'pinned' ? [f.item_slug] : f?.mode === 'popular' ? popularity[kind] || [] : []
    const item = wanted.map(slug => list.find(x => (x._slug || x.slug) === slug)).find(Boolean)
      || list.find(x => !used.has(kind + ':' + (x._slug || x.slug)))
    if (item) { used.add(kind + ':' + (item._slug || item.slug)); result[slot] = item }
  }
  return result
}