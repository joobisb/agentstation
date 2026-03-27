import { join } from 'node:path'
import { toSlug, shortId } from '../utils/slug.js'
import type { TaskRecord } from './state.js'

export function getSlug(task: Pick<TaskRecord, 'title'>): string {
  return toSlug(task.title)
}

export function getBranchName(task: Pick<TaskRecord, 'title'>): string {
  return `task/${getSlug(task)}`
}

export function getSpecPath(tasksDir: string, task: Pick<TaskRecord, 'title'>): string {
  return join(tasksDir, `${getSlug(task)}.md`)
}

export function getWorktreePath(worktreesDir: string, task: Pick<TaskRecord, 'title'>): string {
  return join(worktreesDir, getSlug(task))
}

export function createTask(title: string, baseBranch: string): TaskRecord {
  return {
    id: shortId(),
    title,
    status: 'draft',
    spec_path: '',   // filled in by the command after paths are known
    worktree_path: null,
    branch: null,
    created: new Date().toISOString(),
    started: null,
    reviewed: null,
    done: null,
  }
}
