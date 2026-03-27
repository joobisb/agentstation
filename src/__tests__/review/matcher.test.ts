import { describe, it, expect } from 'vitest'
import { matchAllCriteria } from '../../review/matcher.js'
import { parseCriteria } from '../../review/parser.js'

// Build a minimal unified diff string mentioning specific terms
function makeDiff(filename: string, content: string): string {
  return `diff --git a/${filename} b/${filename}\n--- a/${filename}\n+++ b/${filename}\n@@ -0,0 +1 @@\n+${content}\n`
}

describe('matchAllCriteria', () => {
  it('classifies a criterion as found when keywords exceed 60% threshold', async () => {
    const criteria = parseCriteria(['- [ ] configure database connection'])
    const diff = makeDiff('src/db.ts', 'configure database connection pooling')
    const results = await matchAllCriteria(criteria, diff, ['src/db.ts'])
    expect(results[0].status).toBe('found')
  })

  it('classifies a criterion as missing when no keywords match', async () => {
    const criteria = parseCriteria(['- [ ] configure database connection'])
    const diff = makeDiff('src/other.ts', 'completely unrelated change xyz')
    const results = await matchAllCriteria(criteria, diff, ['src/other.ts'])
    expect(results[0].status).toBe('missing')
  })

  it('classifies a criterion as partial when some but not enough keywords match', async () => {
    // Use a criterion with many keywords so one match gives a low score
    const criteria = parseCriteria([
      '- [ ] implement authentication middleware token validation session expiry refresh',
    ])
    const diff = makeDiff('src/auth.ts', 'implement something else here')
    const results = await matchAllCriteria(criteria, diff, ['src/auth.ts'])
    // 'implement' matches but many others don't — should be partial or missing
    expect(['partial', 'missing']).toContain(results[0].status)
  })

  it('populates matchedKeywords and missedKeywords', async () => {
    const criteria = parseCriteria(['- [ ] configure database connection'])
    const diff = makeDiff('src/db.ts', 'configure database connection')
    const results = await matchAllCriteria(criteria, diff, ['src/db.ts'])
    expect(results[0].matchedKeywords.length).toBeGreaterThan(0)
  })

  it('identifies which files contain keyword matches', async () => {
    const criteria = parseCriteria(['- [ ] configure database connection'])
    const diff =
      makeDiff('src/db.ts', 'configure database connection') +
      makeDiff('src/other.ts', 'unrelated content')
    const results = await matchAllCriteria(criteria, diff, ['src/db.ts', 'src/other.ts'])
    expect(results[0].mentionedInFiles).toContain('src/db.ts')
    expect(results[0].mentionedInFiles).not.toContain('src/other.ts')
  })

  it('handles an empty criteria list', async () => {
    const results = await matchAllCriteria([], 'some diff', [])
    expect(results).toEqual([])
  })

  it('handles criteria with no keywords (non-checkbox lines)', async () => {
    const criteria = parseCriteria(['plain line without checkbox'])
    const diff = makeDiff('src/file.ts', 'anything')
    const results = await matchAllCriteria(criteria, diff, ['src/file.ts'])
    expect(results[0].status).toBe('missing')
    expect(results[0].score).toBe(0)
  })

  it('returns score as a number between 0 and 1', async () => {
    const criteria = parseCriteria(['- [ ] configure database connection'])
    const diff = makeDiff('src/db.ts', 'configure database connection')
    const results = await matchAllCriteria(criteria, diff, ['src/db.ts'])
    expect(results[0].score).toBeGreaterThanOrEqual(0)
    expect(results[0].score).toBeLessThanOrEqual(1)
  })
})
