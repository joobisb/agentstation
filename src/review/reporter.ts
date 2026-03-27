import chalk from 'chalk'
import type { ReviewResult } from './engine.js'
import type { CriterionResult } from './matcher.js'

const DIVIDER = chalk.gray('─'.repeat(50))

function statusIcon(result: CriterionResult): string {
  switch (result.status) {
    case 'found':   return chalk.green('✅')
    case 'partial': return chalk.yellow('⚠️ ')
    case 'missing': return chalk.red('❌')
  }
}

function formatCriterion(result: CriterionResult): string {
  const icon = statusIcon(result)
  const text = result.criterion.text
  const lines: string[] = [`  ${icon}  ${text}`]

  if (result.status === 'found' && result.mentionedInFiles.length > 0) {
    lines.push(chalk.gray(`        matched in: ${result.mentionedInFiles.join(', ')}`))
  } else if (result.status === 'partial') {
    const missing = result.missedKeywords.slice(0, 3).join(', ')
    lines.push(
      chalk.gray(
        `        partial (${result.matchedKeywords.length}/${result.criterion.keywords.length} keywords)` +
          (missing ? ` — missing: ${missing}` : '')
      )
    )
  } else if (result.status === 'missing') {
    lines.push(chalk.gray('        no matching content found in diff'))
  }

  return lines.join('\n')
}

function formatFileList(result: ReviewResult): string {
  if (result.changedFiles.length === 0) {
    return chalk.gray('  No files changed.')
  }

  const { additions, deletions, filesChanged } = result.diffStats
  const header = chalk.bold(
    `Files Changed  (${filesChanged} file${filesChanged !== 1 ? 's' : ''} · +${additions} -${deletions} lines)`
  )

  const files = result.changedFiles.map((f) => {
    return `  ${chalk.cyan(f)}`
  })

  return [header, DIVIDER, ...files].join('\n')
}

function formatSummary(result: ReviewResult): string {
  const { found, partial, missing, total } = result.summary
  const parts: string[] = []
  if (found > 0) parts.push(chalk.green(`${found} found`))
  if (partial > 0) parts.push(chalk.yellow(`${partial} partial`))
  if (missing > 0) parts.push(chalk.red(`${missing} missing`))

  const pct = total > 0 ? Math.round((found / total) * 100) : 0
  return `Coverage: ${parts.join(' · ')}  ${chalk.gray(`(${pct}% complete)`)}`
}

export function formatReview(result: ReviewResult): string {
  const lines: string[] = []

  lines.push('')
  lines.push(chalk.bold(`Reviewing: ${result.taskTitle}`))
  lines.push(chalk.gray(`  Branch: ${result.branch} → ${result.baseBranch}`))
  lines.push('')
  lines.push(DIVIDER)
  lines.push(chalk.bold('Acceptance Criteria Coverage'))
  lines.push(DIVIDER)
  lines.push('')

  if (result.criteria.length === 0) {
    lines.push(chalk.yellow('  No acceptance criteria found in spec.'))
    lines.push(chalk.gray('  Add criteria under ## Acceptance Criteria in your spec file.'))
  } else {
    for (const criterion of result.criteria) {
      lines.push(formatCriterion(criterion))
      lines.push('')
    }
    lines.push(formatSummary(result))
  }

  lines.push('')
  lines.push(DIVIDER)
  lines.push(formatFileList(result))
  lines.push('')

  return lines.join('\n')
}
