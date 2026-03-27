import { program } from 'commander'
import { runInit } from './commands/init.js'
import { runTaskNew } from './commands/task-new.js'
import { runTaskStart } from './commands/task-start.js'
import { runTaskReview } from './commands/task-review.js'
import { runTaskDone } from './commands/task-done.js'
import { runTaskList } from './commands/task-list.js'
import { fatal } from './ui/output.js'

program
  .name('agentstation')
  .description('Spec-first task lifecycle for AI-assisted development')
  .version('0.3.0')

// ── agentstation init ────────────────────────────────────────────
program
  .command('init')
  .description('Initialize Agent Station in the current git repository')
  .action(wrap(runInit))

// ── agentstation task <subcommand> ───────────────────────────────
const task = program.command('task').description('Manage agent tasks')

task
  .command('new [title]')
  .description('Create a new task spec and open it in your editor')
  .action((title: string | undefined, opts) => wrap(() => runTaskNew(title, opts))())

task
  .command('start')
  .description('Create an isolated git worktree and launch the agent')
  .option('--agent <name>', 'Agent to use: claude, cursor, codex, gemini')
  .option('--task <id>', 'Task ID or partial title (defaults to the single draft task)')
  .action((opts) => wrap(() => runTaskStart(opts))())

task
  .command('review')
  .description('Analyze spec coverage against the current git diff')
  .action(wrap(runTaskReview))

task
  .command('list')
  .description('List all active tasks')
  .action(wrap(runTaskList))

task
  .command('done')
  .description('Archive the spec and merge or create a PR')
  .action(wrap(runTaskDone))

program.parseAsync(process.argv).catch((err: unknown) => {
  fatal(err instanceof Error ? err.message : String(err))
})

// Wrap command handlers with consistent error handling
function wrap(fn: () => Promise<void>): () => void {
  return () => {
    fn().catch((err: unknown) => {
      fatal(err instanceof Error ? err.message : String(err))
    })
  }
}
