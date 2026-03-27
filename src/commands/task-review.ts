import { requireWorkspace } from '../core/workspace.js'
import { readState, writeState, upsertTask, getActiveTask } from '../core/state.js'
import { parseSpec } from '../core/spec.js'
import { updateSpecFrontmatter } from '../core/spec.js'
import { runReview } from '../review/engine.js'
import { formatReview } from '../review/reporter.js'
import { withSpinner } from '../ui/spinner.js'
import { blank, fatal, muted } from '../ui/output.js'
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

  const result = await withSpinner('Analyzing diff', () =>
    runReview(spec, workspace.gitRoot, task.branch!, state.base_branch)
  )

  // Print review report
  console.log(formatReview(result))

  // Update task status → review
  const updated = { ...task, status: 'review' as const, reviewed: new Date().toISOString() }
  await writeState(workspace.stateFile, upsertTask(state, updated))
  await updateSpecFrontmatter(task.spec_path, { status: 'review' })

  console.log(chalk.gray('Task status → review'))
  blank()
  muted('Next: agentstation task done')
  muted('      (or continue working and re-run agentstation task review)')
  blank()
}
