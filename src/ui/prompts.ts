import inquirer from 'inquirer'
import { SUPPORTED_AGENTS } from '../agents/index.js'
import type { TaskRecord } from '../core/state.js'

export async function promptTitle(): Promise<string> {
  const { title } = await inquirer.prompt<{ title: string }>([
    {
      type: 'input',
      name: 'title',
      message: 'Task title:',
      validate: (input: string) =>
        input.trim().length > 0 ? true : 'Title cannot be empty',
    },
  ])
  return title.trim()
}

export async function selectAgent(current?: string): Promise<string> {
  const agentDescriptions: Record<string, string> = {
    claude: 'Claude Code (recommended) — injects spec via CLAUDE.md',
    cursor: 'Cursor — opens worktree directory in GUI',
    codex: 'OpenAI Codex CLI — prints spec for manual paste',
    gemini: 'Gemini CLI — prints spec for manual paste',
  }

  const { agent } = await inquirer.prompt<{ agent: string }>([
    {
      type: 'list',
      name: 'agent',
      message: 'Which agent?',
      default: current ?? 'claude',
      choices: SUPPORTED_AGENTS.map((name) => ({
        name: agentDescriptions[name] ?? name,
        value: name,
      })),
    },
  ])
  return agent
}

export async function selectTask(tasks: TaskRecord[]): Promise<TaskRecord> {
  if (tasks.length === 1) return tasks[0]

  const { taskId } = await inquirer.prompt<{ taskId: string }>([
    {
      type: 'list',
      name: 'taskId',
      message: 'Which task?',
      choices: tasks.map((t) => ({
        name: `${t.title} ${t.id}`,
        value: t.id,
      })),
    },
  ])

  return tasks.find((t) => t.id === taskId)!
}

export async function confirmBaseBranch(detected: string): Promise<string> {
  const { branch } = await inquirer.prompt<{ branch: string }>([
    {
      type: 'input',
      name: 'branch',
      message: 'Base branch:',
      default: detected,
    },
  ])
  return branch.trim() || detected
}

export async function selectCompletionMethod(): Promise<'pr' | 'merge'> {
  const { method } = await inquirer.prompt<{ method: 'pr' | 'merge' }>([
    {
      type: 'list',
      name: 'method',
      message: 'How would you like to complete this task?',
      choices: [
        { name: 'Create PR via gh', value: 'pr' },
        { name: 'Merge directly to base branch', value: 'merge' },
      ],
    },
  ])
  return method
}

export async function confirmAction(message: string): Promise<boolean> {
  const { confirmed } = await inquirer.prompt<{ confirmed: boolean }>([
    {
      type: 'confirm',
      name: 'confirmed',
      message,
      default: true,
    },
  ])
  return confirmed
}
