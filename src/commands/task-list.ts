import { findWorkspace } from '../core/workspace.js'
import { readState } from '../core/state.js'
import { getSlug } from '../core/task.js'
import chalk from 'chalk'

const STATUS_ICON: Record<string, string> = {
  draft:  chalk.gray('○'),
  active: chalk.green('●'),
  review: chalk.yellow('◐'),
  done:   chalk.gray('✓'),
}

export async function runTaskList(): Promise<void> {
  const workspace = await findWorkspace(process.cwd())
  if (!workspace) {
    console.log(chalk.gray('Not an Agent Station workspace.'))
    return
  }

  const state = await readState(workspace.stateFile)
  const active = state.tasks.filter((t) => t.status !== 'done')

  if (active.length === 0) {
    console.log(chalk.gray('No active tasks. Create one: agentstation task new "Title"'))
    return
  }

  for (const task of active) {
    const icon = STATUS_ICON[task.status] ?? '?'
    console.log(`${icon}  ${chalk.bold(task.title)}  ${chalk.gray(task.id)}  ${chalk.gray('[' + task.status + ']')}`)
  }
}
