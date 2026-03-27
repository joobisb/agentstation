import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import { spawn } from 'node:child_process'
import type { AgentAdapter } from './index.js'
import type { ParsedSpec } from '../core/spec.js'

function buildClaudeContext(spec: ParsedSpec): string {
  return `# Agent Task Brief

You are working on a specific, scoped task. Read this spec carefully before writing any code.

---

## Task: ${spec.frontmatter.title}

${spec.content}

---

**Instructions:**
- Complete all acceptance criteria listed above before finishing.
- Do not modify files outside the constraints listed.
- When done, summarize what you built and which acceptance criteria were completed.
`
}

export class ClaudeAdapter implements AgentAdapter {
  name = 'claude'
  displayName = 'Claude Code'

  async inject(worktreePath: string, spec: ParsedSpec): Promise<void> {
    const claudeMd = join(worktreePath, 'CLAUDE.md')
    await fs.writeFile(claudeMd, buildClaudeContext(spec), 'utf-8')
  }

  async launch(worktreePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn('claude', [], {
        cwd: worktreePath,
        stdio: 'inherit',
        shell: false,
      })

      child.on('exit', () => resolve())
      child.on('error', (err) => {
        if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
          reject(new Error('Claude Code not found. Install it with: npm install -g @anthropic-ai/claude-code'))
        } else {
          reject(err)
        }
      })
    })
  }
}
