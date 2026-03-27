import { describe, it, expect } from 'vitest'
import { toSlug, shortId } from '../../utils/slug.js'

describe('toSlug', () => {
  it('lowercases words', () => {
    expect(toSlug('Hello World')).toBe('hello-world')
  })

  it('replaces spaces with hyphens', () => {
    expect(toSlug('add unit tests')).toBe('add-unit-tests')
  })

  it('removes special characters', () => {
    expect(toSlug('Fix: auth bug!')).toBe('fix-auth-bug')
  })

  it('trims leading and trailing whitespace', () => {
    expect(toSlug('  hello world  ')).toBe('hello-world')
  })

  it('handles already slugified input', () => {
    expect(toSlug('hello-world')).toBe('hello-world')
  })

  it('handles mixed case and punctuation', () => {
    expect(toSlug('Add Unit Tests (v2)')).toBe('add-unit-tests-v2')
  })

  it('collapses multiple spaces', () => {
    expect(toSlug('hello   world')).toBe('hello-world')
  })
})

describe('shortId', () => {
  it('returns an 8-character string', () => {
    expect(shortId()).toHaveLength(8)
  })

  it('generates unique ids', () => {
    const ids = new Set(Array.from({ length: 20 }, shortId))
    expect(ids.size).toBe(20)
  })

  it('returns only URL-safe characters', () => {
    for (let i = 0; i < 10; i++) {
      expect(shortId()).toMatch(/^[A-Za-z0-9_-]+$/)
    }
  })
})
