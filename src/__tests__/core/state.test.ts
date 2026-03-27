import { describe, it, expect } from 'vitest'
import {
  emptyState,
  upsertTask,
  getActiveTask,
  getDraftTasks,
  getTaskById,
} from '../../core/state.js'
import type { TaskRecord, WorkspaceState } from '../../core/state.js'

function makeTask(overrides: Partial<TaskRecord> = {}): TaskRecord {
  return {
    id: 'task-1',
    title: 'Test task',
    status: 'draft',
    spec_path: 'tasks/test-task.md',
    worktree_path: null,
    branch: null,
    created: new Date().toISOString(),
    started: null,
    reviewed: null,
    done: null,
    ...overrides,
  }
}

describe('emptyState', () => {
  it('creates state with empty tasks list', () => {
    const state = emptyState('main')
    expect(state.tasks).toEqual([])
    expect(state.base_branch).toBe('main')
    expect(state.version).toBe('0.1.0')
  })
})

describe('upsertTask', () => {
  it('inserts a new task when id is not present', () => {
    const state = emptyState('main')
    const task = makeTask()
    const next = upsertTask(state, task)
    expect(next.tasks).toHaveLength(1)
    expect(next.tasks[0].id).toBe('task-1')
  })

  it('replaces an existing task with the same id', () => {
    const state = emptyState('main')
    const task = makeTask()
    const withTask = upsertTask(state, task)
    const updated = makeTask({ status: 'active' })
    const next = upsertTask(withTask, updated)
    expect(next.tasks).toHaveLength(1)
    expect(next.tasks[0].status).toBe('active')
  })

  it('does not mutate the original state', () => {
    const state = emptyState('main')
    upsertTask(state, makeTask())
    expect(state.tasks).toHaveLength(0)
  })

  it('appends when multiple tasks exist', () => {
    const state = emptyState('main')
    const s1 = upsertTask(state, makeTask({ id: 'a' }))
    const s2 = upsertTask(s1, makeTask({ id: 'b' }))
    expect(s2.tasks).toHaveLength(2)
  })
})

describe('getActiveTask', () => {
  it('returns null when no tasks exist', () => {
    expect(getActiveTask(emptyState('main'))).toBeNull()
  })

  it('returns the active task', () => {
    const state = emptyState('main')
    const task = makeTask({ status: 'active' })
    const next = upsertTask(state, task)
    expect(getActiveTask(next)?.id).toBe('task-1')
  })

  it('returns a task with review status', () => {
    const state = upsertTask(emptyState('main'), makeTask({ status: 'review' }))
    expect(getActiveTask(state)?.status).toBe('review')
  })

  it('ignores draft and done tasks', () => {
    let state = emptyState('main')
    state = upsertTask(state, makeTask({ id: 'a', status: 'draft' }))
    state = upsertTask(state, makeTask({ id: 'b', status: 'done' }))
    expect(getActiveTask(state)).toBeNull()
  })
})

describe('getDraftTasks', () => {
  it('returns empty array when no drafts', () => {
    const state = upsertTask(emptyState('main'), makeTask({ status: 'active' }))
    expect(getDraftTasks(state)).toEqual([])
  })

  it('returns only draft tasks', () => {
    let state = emptyState('main')
    state = upsertTask(state, makeTask({ id: 'a', status: 'draft' }))
    state = upsertTask(state, makeTask({ id: 'b', status: 'active' }))
    state = upsertTask(state, makeTask({ id: 'c', status: 'draft' }))
    const drafts = getDraftTasks(state)
    expect(drafts).toHaveLength(2)
    expect(drafts.every((t) => t.status === 'draft')).toBe(true)
  })
})

describe('getTaskById', () => {
  it('returns null for unknown id', () => {
    expect(getTaskById(emptyState('main'), 'missing')).toBeNull()
  })

  it('returns the task matching the id', () => {
    const state = upsertTask(emptyState('main'), makeTask({ id: 'xyz' }))
    expect(getTaskById(state, 'xyz')?.id).toBe('xyz')
  })
})
