import { spawn } from 'node:child_process'
import chalk from 'chalk'
import type { AgentAdapter } from './index.js'
import type { ParsedSpec } from '../core/spec.js'

export class CodexAdapter implements AgentAdapter {
  name = 'codex'
  displayName = 'OpenAI Codex CLI'

  async inject(_worktreePath: string, spec: ParsedSpec): Promise<void> {
    console.log()
    console.log(chalk.bold.yellow('── Paste this as your Codex prompt ──────────────────'))
    console.log()
    console.log(`Task: ${spec.frontmatter.title}`)
    console.log()
    console.log(spec.content)
    console.log()
    console.log(chalk.bold.yellow('─────────────────────────────────────────────────────'))
    console.log()
  }

  async launch(worktreePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn('codex', [], {
        cwd: worktreePath,
        stdio: 'inherit',
        shell: false,
      })

      child.on('exit', () => resolve())
      child.on('error', (err) => {
        if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
          reject(new Error('Codex CLI not found. See: https://github.com/openai/codex'))
        } else {
          reject(err)
        }
      })
    })
  }
}
