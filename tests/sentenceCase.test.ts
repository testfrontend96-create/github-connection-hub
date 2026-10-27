import { describe, it, expect } from 'bun:test'
import { sentenceCase } from '../src/lib/sentenceCase'
describe('title sentence case', () => {
  it('lowercases ordinary words after the first', () => {
    expect(sentenceCase('A Complete Guide To The Biohacking Diet With Examples')).toBe('A complete guide to the biohacking diet with examples')
  })
  it('keeps names and acronyms capitalised', () => {
    expect(sentenceCase('Why Your Brain Shrinks At Night (And How To Fix It) | Dr. Patrick Porter')).toBe('Why your brain shrinks at night (and how to fix it) | Dr. Patrick Porter')
    expect(sentenceCase('The NAD Crisis: Why Most Biohackers Are Deficient')).toBe('The NAD crisis: Why most biohackers are deficient')
  })
})
