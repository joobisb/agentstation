import type { AcceptanceCriterion } from './parser.js'
import { splitDiffByFile } from '../git/diff.js'

export type CriterionStatus = 'found' | 'partial' | 'missing'

export interface CriterionResult {
  criterion: AcceptanceCriterion
  status: CriterionStatus
  matchedKeywords: string[]
  missedKeywords: string[]
  score: number
  mentionedInFiles: string[]
}

const FOUND_THRESHOLD = 0.6
const PARTIAL_THRESHOLD = 0.25

function scoreKeywordsInText(keywords: string[], text: string): {
  matched: string[]
  missed: string[]
  score: number
} {
  if (keywords.length === 0) {
    return { matched: [], missed: [], score: 0 }
  }

  const matched = keywords.filter((kw) =>
    text.toLowerCase().includes(kw.toLowerCase())
  )
  const missed = keywords.filter((kw) =>
    !text.toLowerCase().includes(kw.toLowerCase())
  )
  const score = matched.length / keywords.length

  return { matched, missed, score }
}

function classifyScore(score: number): CriterionStatus {
  if (score >= FOUND_THRESHOLD) return 'found'
  if (score >= PARTIAL_THRESHOLD) return 'partial'
  return 'missing'
}

export async function matchCriterion(
  criterion: AcceptanceCriterion,
  fullDiff: string,
  changedFiles: string[]
): Promise<CriterionResult> {
  const { matched, missed, score } = scoreKeywordsInText(criterion.keywords, fullDiff)

  // Find which specific files contain the matches
  const fileMap = await splitDiffByFile(fullDiff)
  const mentionedInFiles: string[] = []

  for (const file of changedFiles) {
    const fileDiff = fileMap.get(file) ?? ''
    const { score: fileScore } = scoreKeywordsInText(criterion.keywords, fileDiff)
    if (fileScore > 0) {
      mentionedInFiles.push(file)
    }
  }

  return {
    criterion,
    status: classifyScore(score),
    matchedKeywords: matched,
    missedKeywords: missed,
    score,
    mentionedInFiles,
  }
}

export async function matchAllCriteria(
  criteria: AcceptanceCriterion[],
  fullDiff: string,
  changedFiles: string[]
): Promise<CriterionResult[]> {
  return Promise.all(criteria.map((c) => matchCriterion(c, fullDiff, changedFiles)))
}
