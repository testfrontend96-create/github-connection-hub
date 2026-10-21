import { describe, it, expect } from 'bun:test'
import { filterArticles, filterKnowledge, guideUrl } from '../src/lib/browsing'

describe('content browsing', () => {
  it('combines Blog category and search filters', () => {
    const items = [{title: 'Sleep study', excerpt: '', categories: ['Sleep']}, {title: 'Sleep and diet', excerpt: '', categories: ['Nutrition']}]
    expect(filterArticles(items, 'sleep', 'Sleep')).toEqual([items[0]])
    expect(filterArticles(items, 'diet', 'Sleep')).toEqual([])
  })
  it('includes How To as a Knowledge Base type', () => {
    const items = [{name: 'How to read HRV', summary: '', type: 'howto', topics: ['longevity']}, {name: 'HRV', summary: '', type: 'biomarker', topics: ['longevity']}]
    expect(filterKnowledge(items, 'hrv', 'howto', 'longevity')).toEqual([items[0]])
  })
  it('routes guide links to Knowledge Base rather than a dedicated page', () => {
    expect(guideUrl('how-to-find-your-zone-2')).toBe('/knowledge-base?type=howto#how-to-find-your-zone-2')
  })
})