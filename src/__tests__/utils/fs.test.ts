import { describe, it, expect, afterEach } from 'vitest'
import { promises as fsp } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { atomicWriteJson, pathExists } from '../../utils/fs.js'

function tmpFile(name: string): string {
  return join(tmpdir(), `agentstation-test-${name}-${Date.now()}`)
}

describe('atomicWriteJson', () => {
  const files: string[] = []

  afterEach(async () => {
    for (const f of files.splice(0)) {
      await fsp.unlink(f).catch(() => {})
    }
  })

  it('writes JSON data to a file', async () => {
    const path = tmpFile('write')
    files.push(path)
    await atomicWriteJson(path, { key: 'value' })
    const raw = await fsp.readFile(path, 'utf-8')
    expect(JSON.parse(raw)).toEqual({ key: 'value' })
  })

  it('formats output with 2-space indentation', async () => {
    const path = tmpFile('indent')
    files.push(path)
    await atomicWriteJson(path, { a: 1 })
    const raw = await fsp.readFile(path, 'utf-8')
    expect(raw).toBe(JSON.stringify({ a: 1 }, null, 2))
  })

  it('overwrites an existing file', async () => {
    const path = tmpFile('overwrite')
    files.push(path)
    await atomicWriteJson(path, { first: true })
    await atomicWriteJson(path, { second: true })
    const raw = await fsp.readFile(path, 'utf-8')
    expect(JSON.parse(raw)).toEqual({ second: true })
  })

  it('writes nested objects', async () => {
    const path = tmpFile('nested')
    files.push(path)
    const data = { tasks: [{ id: '1', title: 'Test' }] }
    await atomicWriteJson(path, data)
    const raw = await fsp.readFile(path, 'utf-8')
    expect(JSON.parse(raw)).toEqual(data)
  })

  it('does not leave behind a .tmp file on success', async () => {
    const path = tmpFile('notmp')
    files.push(path)
    await atomicWriteJson(path, { ok: true })
    const tmpExists = await pathExists(path + '.tmp')
    expect(tmpExists).toBe(false)
  })
})

describe('pathExists', () => {
  it('returns true for an existing file', async () => {
    const path = tmpFile('exists')
    await fsp.writeFile(path, 'hello')
    try {
      expect(await pathExists(path)).toBe(true)
    } finally {
      await fsp.unlink(path).catch(() => {})
    }
  })

  it('returns false for a non-existent file', async () => {
    expect(await pathExists(tmpFile('missing-xyz'))).toBe(false)
  })

  it('returns true for an existing directory', async () => {
    expect(await pathExists(tmpdir())).toBe(true)
  })
})
