import { promises as fs } from 'node:fs'
import { join, basename } from 'node:path'
import { spawn } from 'node:child_process'
import { requireWorkspace } from '../core/workspace.js'
import { readState, writeState, upsertTask, getActiveTask } from '../core/state.js'
import { parseSpec } from '../core/spec.js'
import { removeWorktree, mergeBranch, deleteBranch } from '../git/worktree.js'
import { getDiffStats } from '../git/diff.js'
import { selectCompletionMethod, confirmShip } from '../ui/prompts.js'
import { withSpinner } from '../ui/spinner.js'
import { success, blank, fatal, info, divider, warn } from '../ui/output.js'
import { moveFile } from '../utils/fs.js'
import chalk from 'chalk'

export async function runTaskDone(): Promise<void> {
  const workspace = await requireWorkspace(process.cwd())
  const state = await readState(workspace.stateFile)

  const task = getActiveTask(state)
  if (!task) {
    fatal(
      'No active or review task found.\n' +
        'Start a task: agentstation task start'
    )
  }

  if (!task.branch || !task.worktree_path) {
    fatal('Task is missing branch or worktree path — was it started correctly?')
  }

  // Show summary
  blank()
  console.log(chalk.bold(`Completing: ${task.title}`))
  info(`Branch: ${task.branch}`)

  try {
    const stats = await getDiffStats(workspace.gitRoot, task.branch, state.base_branch)
    info(`${stats.filesChanged} file${stats.filesChanged !== 1 ? 's' : ''} · +${stats.additions} -${stats.deletions} lines`)
  } catch {
    // diff stats are best-effort
  }

  // Review checkpoint
  if (task.status === 'active') {
    fatal(
      'This task has never been reviewed.\n' +
        'Run: agentstation task review'
    )
  }

  const summary = task.review_summary
  if (summary && summary.missing > 0) {
    blank()
    console.log(chalk.red.bold('Last review had missing criteria:'))
    for (const c of summary.criteria.filter((c) => c.status === 'missing')) {
      info(chalk.red(`❌  ${c.text}`))
    }
    for (const c of summary.criteria.filter((c) => c.status === 'partial')) {
      info(chalk.yellow(`⚠️   ${c.text}`))
    }
    blank()
    const ship = await confirmShip('Ship anyway? [y/N]')
    if (!ship) process.exit(0)
    blank()
  } else if (summary && summary.partial > 0) {
    blank()
    warn('Last review had partial criteria:')
    for (const c of summary.criteria.filter((c) => c.status === 'partial')) {
      info(chalk.yellow(`⚠️   ${c.text}`))
    }
    blank()
    const ship = await confirmShip('Ship anyway? [y/N]')
    if (!ship) process.exit(0)
    blank()
  }

  const method = await selectCompletionMethod()

  blank()

  if (method === 'pr') {
    await createPR(workspace, { ...task, branch: task.branch! }, state.base_branch)
  } else {
    await mergeDirect(workspace, { branch: task.branch! }, state.base_branch)
  }

  // Archive spec: move from openspec/tasks/ → openspec/changes/
  const specFilename = basename(task.spec_path)
  const archivePath = join(workspace.changesDir, specFilename)

  await withSpinner('Archiving spec', () => moveFile(task.spec_path, archivePath))

  // Remove worktree
  await withSpinner('Removing worktree', () =>
    removeWorktree(workspace.gitRoot, task.worktree_path!)
  )

  // Update task state
  const updated = {
    ...task,
    status: 'done' as const,
    spec_path: archivePath,
    done: new Date().toISOString(),
  }
  await writeState(workspace.stateFile, upsertTask(state, updated))

  blank()
  success('Task done.')
  blank()
}

async function createPR(
  workspace: { gitRoot: string; changesDir: string },
  task: { title: string; branch: string; spec_path: string },
  baseBranch: string
): Promise<void> {
  const spec = await parseSpec(task.spec_path)
  const body = buildPRBody(spec.content)

  return new Promise((resolve, reject) => {
    const child = spawn(
      'gh',
      ['pr', 'create', '--title', task.title, '--body', body, '--base', baseBranch],
      {
        cwd: workspace.gitRoot,
        stdio: 'inherit',
        shell: false,
      }
    )

    child.on('exit', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`gh pr create exited with code ${code}`))
    })

    child.on('error', (err) => {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        reject(new Error('gh not found. Install: https://cli.github.com'))
      } else {
        reject(err)
      }
    })
  })
}

async function mergeDirect(
  workspace: { gitRoot: string },
  task: { branch: string },
  baseBranch: string
): Promise<void> {
  await withSpinner(`Merging ${task.branch} → ${baseBranch}`, () =>
    mergeBranch(workspace.gitRoot, task.branch, baseBranch)
  )
  await withSpinner('Deleting task branch', () =>
    deleteBranch(workspace.gitRoot, task.branch)
  )
}

function buildPRBody(specContent: string): string {
  return `${specContent}

---
*Created with [Agent Station](https://github.com/agentstation/agentstation)*`
}
