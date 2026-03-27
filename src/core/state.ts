import { readJson, atomicWriteJson } from '../utils/fs.js'

export type TaskStatus = 'draft' | 'active' | 'review' | 'done'

export interface ReviewSummary {
  found: number
  partial: number
  missing: number
  total: number
  criteria: Array<{ text: string; status: 'found' | 'partial' | 'missing' }>
}

export interface TaskRecord {
  id: string
  title: string
  status: TaskStatus
  spec_path: string
  worktree_path: string | null
  branch: string | null
  created: string
  started: string | null
  reviewed: string | null
  done: string | null
  review_summary: ReviewSummary | null
}

export interface WorkspaceState {
  version: string
  base_branch: string
  tasks: TaskRecord[]
}

export function emptyState(baseBranch: string): WorkspaceState {
  return {
    version: '0.1.0',
    base_branch: baseBranch,
    tasks: [],
  }
}

export async function readState(stateFile: string): Promise<WorkspaceState> {
  return readJson<WorkspaceState>(stateFile)
}

export async function writeState(stateFile: string, state: WorkspaceState): Promise<void> {
  await atomicWriteJson(stateFile, state)
}

export function getActiveTask(state: WorkspaceState): TaskRecord | null {
  return state.tasks.find((t) => t.status === 'active' || t.status === 'review') ?? null
}

export function getDraftTasks(state: WorkspaceState): TaskRecord[] {
  return state.tasks.filter((t) => t.status === 'draft')
}

export function upsertTask(state: WorkspaceState, task: TaskRecord): WorkspaceState {
  const idx = state.tasks.findIndex((t) => t.id === task.id)
  const tasks = [...state.tasks]
  if (idx >= 0) {
    tasks[idx] = task
  } else {
    tasks.push(task)
  }
  return { ...state, tasks }
}

export function getTaskById(state: WorkspaceState, id: string): TaskRecord | null {
  return state.tasks.find((t) => t.id === id) ?? null
}
