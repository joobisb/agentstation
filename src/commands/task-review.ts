import { requireWorkspace } from '../core/workspace.js'
import { readState, writeState, upsertTask, getActiveTask } from '../core/state.js'
import { parseSpec } from '../core/spec.js'
import { updateSpecFrontmatter } from '../core/spec.js'
import { getUncommittedFiles, commitAllInWorktree } from '../git/worktree.js'
import { getAdapter } from '../agents/index.js'
import { runReview } from '../review/engine.js'
import { formatReview } from '../review/reporter.js'
import { withSpinner } from '../ui/spinner.js'
import { selectUncommittedAction } from '../ui/prompts.js'
import { blank, fatal, muted, success, divider } from '../ui/output.js'
import chalk from 'chalk'

export async function runTaskReview(): Promise<void> {
  const workspace = await requireWorkspace(process.cwd())
  const state = await readState(workspace.stateFile)

  const task = getActiveTask(state)
  if (!task) {
    fatal(
      'No active task found.\n' +
        'Start a task first: agentstation task start'
    )
  }

  if (!task.branch) {
    fatal('Task has no branch — was it started with agentstation task start?')
  }

  const spec = await parseSpec(task.spec_path)

  // Gate: check for uncommitted changes in the worktree before diffing
  if (task.worktree_path) {
    const uncommitted = await getUncommittedFiles(task.worktree_path)
    if (uncommitted.length > 0) {
      const action = await selectUncommittedAction(uncommitted)

      if (action === 'commit') {
        await withSpinner('Committing agent work', () =>
          commitAllInWorktree(task.worktree_path!, 'chore: commit agent work')
        )
        success('Changes committed.')
        blank()
      } else if (action === 'reopen') {
        const agentName = spec.frontmatter.agent || 'claude'
        const adapter = getAdapter(agentName)
        blank()
        console.log(chalk.bold(`Reopening ${adapter.displayName}...`))
        divider()
        blank()
        await adapter.inject(task.worktree_path, spec)
        await adapter.launch(task.worktree_path)
        blank()
        divider()
        console.log(chalk.gray('Agent session ended.'))
        muted("Run 'agentstation task review' when you're ready.")
        blank()
        return
      }
      // 'skip' falls through to the review as-is
    }
  }

  const result = await withSpinner('Analyzing diff', () =>
    runReview(spec, workspace.gitRoot, task.branch!, state.base_branch)
  )

  // Print review report
  console.log(formatReview(result))

  // Update task status → review (persist summary for task done checkpoint)
  const updated = {
    ...task,
    status: 'review' as const,
    reviewed: new Date().toISOString(),
    review_summary: {
      ...result.summary,
      criteria: result.criteria.map((c) => ({ text: c.criterion.text, status: c.status })),
    },
  }
  await writeState(workspace.stateFile, upsertTask(state, updated))
  await updateSpecFrontmatter(task.spec_path, { status: 'review' })

  console.log(chalk.gray('Task status → review'))
  blank()
  muted('Next: agentstation task done')
  muted('      (or continue working and re-run agentstation task review)')
  blank()
}
