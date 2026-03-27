import { spawn } from 'node:child_process'
import chalk from 'chalk'
import type { AgentAdapter } from './index.js'
import type { ParsedSpec } from '../core/spec.js'

export class CursorAdapter implements AgentAdapter {
  name = 'cursor'
  displayName = 'Cursor'

  async inject(_worktreePath: string, spec: ParsedSpec): Promise<void> {
    // Print the spec as a reminder for the developer to paste into Cursor's chat
    console.log()
    console.log(chalk.bold.yellow('── Paste this into Cursor chat ──────────────────────'))
    console.log()
    console.log(chalk.cyan(`Task: ${spec.frontmatter.title}`))
    console.log()
    console.log('Acceptance criteria:')
    for (const criterion of spec.sections.acceptanceCriteria) {
      console.log('  ' + criterion)
    }
    if (spec.sections.constraints) {
      console.log()
      console.log('Constraints:')
      console.log(spec.sections.constraints)
    }
    console.log()
    console.log(chalk.bold.yellow('─────────────────────────────────────────────────────'))
    console.log()
  }

  async launch(worktreePath: string): Promise<void> {
    // Cursor is a GUI app — launch detached and return immediately
    const child = spawn('cursor', [worktreePath], {
      detached: true,
      stdio: 'ignore',
      shell: false,
    })
    child.unref()

    // Give it a moment to start
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
}
