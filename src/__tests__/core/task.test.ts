import { describe, it, expect } from 'vitest'
import { getSlug, getBranchName, getSpecPath, getWorktreePath, createTask } from '../../core/task.js'

describe('getSlug', () => {
  it('converts a title to kebab-case slug', () => {
    expect(getSlug({ title: 'Add Unit Tests' })).toBe('add-unit-tests')
  })

  it('handles special characters', () => {
    expect(getSlug({ title: 'Fix: auth bug!' })).toBe('fix-auth-bug')
  })

  it('lowercases the slug', () => {
    expect(getSlug({ title: 'MY TASK' })).toBe('my-task')
  })
})

describe('getBranchName', () => {
  it('prefixes slug with task/', () => {
    expect(getBranchName({ title: 'Add Unit Tests' })).toBe('task/add-unit-tests')
  })
})

describe('getSpecPath', () => {
  it('joins tasksDir with slug and .md extension', () => {
    const result = getSpecPath('/repo/.agentstation/tasks', { title: 'Add Unit Tests' })
    expect(result).toBe('/repo/.agentstation/tasks/add-unit-tests.md')
  })
})

describe('getWorktreePath', () => {
  it('joins worktreesDir with slug', () => {
    const result = getWorktreePath('/repo/.agentstation/worktrees', { title: 'Add Unit Tests' })
    expect(result).toBe('/repo/.agentstation/worktrees/add-unit-tests')
  })
})

describe('createTask', () => {
  it('creates a task record with draft status', () => {
    const task = createTask('My Task', 'main')
    expect(task.status).toBe('draft')
    expect(task.title).toBe('My Task')
  })

  it('sets null for all timing fields except created', () => {
    const task = createTask('My Task', 'main')
    expect(task.started).toBeNull()
    expect(task.reviewed).toBeNull()
    expect(task.done).toBeNull()
    expect(task.worktree_path).toBeNull()
    expect(task.branch).toBeNull()
  })

  it('generates a unique id', () => {
    const a = createTask('Task A', 'main')
    const b = createTask('Task B', 'main')
    expect(a.id).not.toBe(b.id)
  })

  it('sets created to a valid ISO date string', () => {
    const task = createTask('Task', 'main')
    expect(() => new Date(task.created)).not.toThrow()
    expect(new Date(task.created).toISOString()).toBe(task.created)
  })

  it('sets spec_path to empty string', () => {
    const task = createTask('Task', 'main')
    expect(task.spec_path).toBe('')
  })
})
