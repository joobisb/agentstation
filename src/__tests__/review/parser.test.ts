import { describe, it, expect } from 'vitest'
import { parseCriteria } from '../../review/parser.js'

describe('parseCriteria', () => {
  it('parses an unchecked checkbox', () => {
    const result = parseCriteria(['- [ ] Add login page'])
    expect(result).toHaveLength(1)
    expect(result[0].checked).toBe(false)
    expect(result[0].text).toBe('Add login page')
    expect(result[0].raw).toBe('- [ ] Add login page')
  })

  it('parses a checked checkbox', () => {
    const result = parseCriteria(['- [x] Add login page'])
    expect(result[0].checked).toBe(true)
  })

  it('extracts keywords from text', () => {
    const result = parseCriteria(['- [ ] Implement user authentication'])
    const kws = result[0].keywords
    expect(kws).toContain('implement')
    expect(kws).toContain('user')
    expect(kws).toContain('authentication')
  })

  it('filters stop words from keywords', () => {
    const result = parseCriteria(['- [ ] Add the new feature'])
    const kws = result[0].keywords
    expect(kws).not.toContain('the')
    expect(kws).not.toContain('add')
  })

  it('extracts quoted phrases as exact keyword terms', () => {
    const result = parseCriteria(['- [ ] Support "vitest run" command'])
    const kws = result[0].keywords
    expect(kws).toContain('vitest run')
  })

  it('generates bigrams from adjacent words', () => {
    const result = parseCriteria(['- [ ] configure database connection'])
    const kws = result[0].keywords
    expect(kws).toContain('configure database')
    expect(kws).toContain('database connection')
  })

  it('returns non-checkbox lines with empty keywords', () => {
    const result = parseCriteria(['Just a plain line'])
    expect(result[0].text).toBe('Just a plain line')
    expect(result[0].checked).toBe(false)
    expect(result[0].keywords).toEqual([])
  })

  it('handles multiple lines', () => {
    const lines = [
      '- [x] First task done',
      '- [ ] Second task pending',
    ]
    const result = parseCriteria(lines)
    expect(result).toHaveLength(2)
    expect(result[0].checked).toBe(true)
    expect(result[1].checked).toBe(false)
  })

  it('deduplicates keywords', () => {
    const result = parseCriteria(['- [ ] configure configure database'])
    const kws = result[0].keywords
    const configureCount = kws.filter((k) => k === 'configure').length
    expect(configureCount).toBe(1)
  })

  it('filters tokens shorter than 3 characters', () => {
    const result = parseCriteria(['- [ ] run my db script'])
    const kws = result[0].keywords
    expect(kws).not.toContain('my')
    expect(kws).not.toContain('db')
  })
})
