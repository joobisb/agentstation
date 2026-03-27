import type { ParsedSpec } from '../core/spec.js'
import { ClaudeAdapter } from './claude.js'
import { CursorAdapter } from './cursor.js'
import { CodexAdapter } from './codex.js'
import { GeminiAdapter } from './gemini.js'

export interface AgentAdapter {
  name: string
  displayName: string
  /** Write context files so the agent understands the task */
  inject(worktreePath: string, spec: ParsedSpec): Promise<void>
  /** Launch the agent in the worktree. Resolves when agent session ends (or immediately for GUI apps). */
  launch(worktreePath: string): Promise<void>
}

const ADAPTERS: Record<string, AgentAdapter> = {
  claude: new ClaudeAdapter(),
  cursor: new CursorAdapter(),
  codex: new CodexAdapter(),
  gemini: new GeminiAdapter(),
}

export const SUPPORTED_AGENTS = Object.keys(ADAPTERS)

export function getAdapter(agentName: string): AgentAdapter {
  const adapter = ADAPTERS[agentName.toLowerCase()]
  if (!adapter) {
    throw new Error(
      `Unknown agent: "${agentName}"\n` +
        `Supported agents: ${SUPPORTED_AGENTS.join(', ')}`
    )
  }
  return adapter
}
