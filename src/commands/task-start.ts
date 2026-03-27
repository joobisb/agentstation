import { requireWorkspace } from '../core/workspace.js'
import { readState, writeState, upsertTask, getDraftTasks, getActiveTask } from '../core/state.js'
import { parseSpec, updateSpecFrontmatter } from '../core/spec.js'
import { getBranchName, getWorktreePath } from '../core/task.js'
import { createWorktree } from '../git/worktree.js'
import { getAdapter } from '../agents/index.js'
import { selectAgent, selectTask } from '../ui/prompts.js'
import { withSpinner } from '../ui/spinner.js'
import { success, warn, blank, fatal, info, divider, muted } from '../ui/output.js'
import { which } from '../utils/which.js'
import chalk from 'chalk'

interface TaskStartOptions {
  agent?: string
  task?: string
}

export async function runTaskStart(opts: TaskStartOptions): Promise<void> {
  const workspace = await requireWorkspace(process.cwd())
  const state = await readState(workspace.stateFile)

  // Warn if there's already an active task
  const active = getActiveTask(state)
  if (active) {
    warn(`There is already an active task: "${active.title}"`)
    warn('Complete or review it before starting another.')
    blank()
    process.exit(1)
  }

  // Find the task to start
  let task = opts.task
    ? state.tasks.find((t) => t.id === opts.task || t.title.toLowerCase().includes(opts.task!.toLowerCase()))
    : null

  if (!task) {
    const drafts = getDraftTasks(state)
    if (drafts.length === 0) {
      fatal('No draft tasks found.\nCreate one with: agentstation task new "Title"')
    }
    task = await selectTask(drafts)
  }

  // Load the spec to get/set the agent
  const spec = await parseSpec(task.spec_path)

  // Determine agent
  let agentName = opts.agent ?? spec.frontmatter.agent
  if (!agentName) {
    agentName = await selectAgent()
  }

  const adapter = getAdapter(agentName)

  // Check agent binary availability
  const available = await which(agentName)
  if (!available) {
    warn(`Agent binary "${agentName}" not found in PATH — proceeding anyway.`)
  }

  const branchName = getBranchName(task)
  const worktreePath = getWorktreePath(workspace.worktreesDir, task)

  blank()
  console.log(chalk.bold(`Starting task: ${task.title}`))
  divider()
  info(`Branch:   ${branchName}`)
  info(`Worktree: .agentstation/worktrees/${worktreePath.split('/').pop()}`)
  info(`Agent:    ${adapter.displayName}`)
  blank()

  // Create worktree
  await withSpinner('Creating git worktree', () =>
    createWorktree(workspace.gitRoot, worktreePath, branchName, state.base_branch)
  )

  // Inject spec context
  await withSpinner(`Injecting spec → ${agentName === 'claude' ? 'CLAUDE.md' : 'context'}`, () =>
    adapter.inject(worktreePath, spec)
  )

  // Update task state
  task = {
    ...task,
    status: 'active',
    branch: branchName,
    worktree_path: worktreePath,
    started: new Date().toISOString(),
  }
  await writeState(workspace.stateFile, upsertTask(state, task))

  // Update spec frontmatter
  await updateSpecFrontmatter(task.spec_path, {
    status: 'active',
    agent: agentName,
    branch: branchName,
    worktree: worktreePath,
  })

  blank()
  console.log(chalk.bold(`Launching ${adapter.displayName}...`))
  divider()
  blank()

  // Launch agent (blocks for CLI agents, returns immediately for GUI)
  await adapter.launch(worktreePath)

  blank()
  divider()
  console.log(chalk.gray('Agent session ended.'))
  blank()
  info(`Task status: active`)
  blank()
  muted(`Next: agentstation task review`)
  blank()
}
