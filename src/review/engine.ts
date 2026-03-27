import type { ParsedSpec } from '../core/spec.js'
import type { CriterionResult } from './matcher.js'
import { parseCriteria } from './parser.js'
import { matchAllCriteria } from './matcher.js'
import { getWorktreeDiff, getChangedFiles, getDiffStats, type DiffStats } from '../git/diff.js'

export interface ReviewResult {
  taskTitle: string
  branch: string
  baseBranch: string
  criteria: CriterionResult[]
  changedFiles: string[]
  diffStats: DiffStats
  summary: {
    found: number
    partial: number
    missing: number
    total: number
  }
}

export async function runReview(
  spec: ParsedSpec,
  repoRoot: string,
  branchName: string,
  baseBranch: string
): Promise<ReviewResult> {
  const [fullDiff, changedFiles, diffStats] = await Promise.all([
    getWorktreeDiff(repoRoot, branchName, baseBranch),
    getChangedFiles(repoRoot, branchName, baseBranch),
    getDiffStats(repoRoot, branchName, baseBranch),
  ])

  const criteria = parseCriteria(spec.sections.acceptanceCriteria)
  const results = await matchAllCriteria(criteria, fullDiff, changedFiles)

  const summary = {
    found: results.filter((r) => r.status === 'found').length,
    partial: results.filter((r) => r.status === 'partial').length,
    missing: results.filter((r) => r.status === 'missing').length,
    total: results.length,
  }

  return {
    taskTitle: spec.frontmatter.title,
    branch: branchName,
    baseBranch,
    criteria: results,
    changedFiles,
    diffStats,
    summary,
  }
}
