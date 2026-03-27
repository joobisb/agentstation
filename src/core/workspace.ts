import { promises as fs } from 'node:fs'
import { join, dirname } from 'node:path'
import { pathExists } from '../utils/fs.js'

export interface WorkspacePaths {
  gitRoot: string
  agentstationDir: string
  configFile: string
  stateFile: string
  worktreesDir: string
  openspecDir: string
  tasksDir: string
  changesDir: string
}

export async function findGitRoot(startDir: string): Promise<string | null> {
  let current = startDir

  while (true) {
    const gitDir = join(current, '.git')
    if (await pathExists(gitDir)) return current

    const parent = dirname(current)
    if (parent === current) return null // reached filesystem root
    current = parent
  }
}

export function buildWorkspacePaths(gitRoot: string): WorkspacePaths {
  const agentstationDir = join(gitRoot, '.agentstation')
  const openspecDir = join(gitRoot, 'openspec')
  return {
    gitRoot,
    agentstationDir,
    configFile: join(agentstationDir, 'config.json'),
    stateFile: join(agentstationDir, 'state.json'),
    worktreesDir: join(agentstationDir, 'worktrees'),
    openspecDir,
    tasksDir: join(openspecDir, 'tasks'),
    changesDir: join(openspecDir, 'changes'),
  }
}

export async function findWorkspace(cwd: string): Promise<WorkspacePaths | null> {
  const gitRoot = await findGitRoot(cwd)
  if (!gitRoot) return null

  const paths = buildWorkspacePaths(gitRoot)
  if (!(await pathExists(paths.agentstationDir))) return null

  return paths
}

export async function requireWorkspace(cwd: string): Promise<WorkspacePaths> {
  const workspace = await findWorkspace(cwd)
  if (!workspace) {
    throw new Error(
      'Agent Station is not initialized in this repository.\n' +
        'Run: agentstation init'
    )
  }
  return workspace
}
