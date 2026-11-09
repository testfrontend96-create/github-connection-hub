import { test, expect } from 'bun:test'
import { stageChange, overlayRows } from './draftState.ts'
import { startHereValue, resolveHero } from '../lib/homeSelection.ts'
test('Start here defaults select every existing problem chip', () => {
  expect(startHereValue(undefined, ['poor-sleep', 'brain-fog']).chips).toEqual(['poor-sleep', 'brain-fog'])
})
test('Explicit chip selections survive including no chips', () => {
  expect(startHereValue({ chips: [] }, ['poor-sleep']).chips).toEqual([])
})
test('Staged changes do not mutate the published rows and discard restores them', () => {
  const rows = [{ slot: 'lead', mode: 'latest' }]
  const draft = stageChange([], { table: 'home_features', key: 'lead', operation: 'upsert', value: { slot: 'lead', mode: 'pinned' } })
  expect(overlayRows(rows, draft, 'home_features')[0].mode).toBe('pinned')
  expect(rows[0].mode).toBe('latest')
  expect(overlayRows(rows, [], 'home_features')).toEqual(rows)
})
test('Repeated edits create one pending change per item', () => {
  const c = { table: 'home_features', key: 'lead', operation: 'upsert', value: { slot: 'lead', mode: 'latest' } }
  expect(stageChange(stageChange([], c), { ...c, value: { slot: 'lead', mode: 'pinned' } }).length).toBe(1)
})
test('Each hero slot can explicitly select a blog article or podcast episode', () => {
  const lists = { article: [{ slug: 'blog-a' }], episode: [{ slug: 'episode-a' }] }
  for (const slot of ['lead', 'blog', 'podcast']) for (const kind of ['article', 'episode']) {
    const slug = lists[kind][0].slug
    expect(resolveHero([{ slot, mode: 'pinned', item_kind: kind, item_slug: slug }], lists, {})[slot].slug).toBe(slug)
  }
})