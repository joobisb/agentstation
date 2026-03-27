import { simpleGit } from 'simple-git'
import { pathExists } from '../utils/fs.js'

export interface WorktreeInfo {
  path: string
  branch: string
  commit: string
}

export async function createWorktree(
  repoRoot: string,
  worktreePath: string,
  branchName: string,
  baseBranch: string
): Promise<void> {
  const git = simpleGit(repoRoot)

  // Check if worktree path already exists (e.g. crash recovery)
  if (await pathExists(worktreePath)) {
    throw new Error(
      `Worktree path already exists: ${worktreePath}\n` +
        'If this is stale, remove it with: git worktree remove --force <path>'
    )
  }

  // Check if branch already exists
  const branches = await git.branchLocal()
  const branchExists = branches.all.includes(branchName)

  if (branchExists) {
    // Reuse existing branch without -b flag
    await git.raw(['worktree', 'add', worktreePath, branchName])
  } else {
    // Create new branch from base
    await git.raw(['worktree', 'add', '-b', branchName, worktreePath, baseBranch])
  }
}

export async function removeWorktree(repoRoot: string, worktreePath: string): Promise<void> {
  const git = simpleGit(repoRoot)
  await git.raw(['worktree', 'remove', '--force', worktreePath])
}

export async function listWorktrees(repoRoot: string): Promise<WorktreeInfo[]> {
  const git = simpleGit(repoRoot)
  const raw = await git.raw(['worktree', 'list', '--porcelain'])

  const worktrees: WorktreeInfo[] = []
  const blocks = raw.trim().split('\n\n')

  for (const block of blocks) {
    const lines = block.trim().split('\n')
    const info: Partial<WorktreeInfo> = {}
    for (const line of lines) {
      if (line.startsWith('worktree ')) info.path = line.slice(9)
      if (line.startsWith('HEAD ')) info.commit = line.slice(5)
      if (line.startsWith('branch ')) info.branch = line.slice(7)
    }
    if (info.path && info.commit) {
      worktrees.push(info as WorktreeInfo)
    }
  }

  return worktrees
}

export async function deleteBranch(repoRoot: string, branchName: string): Promise<void> {
  const git = simpleGit(repoRoot)
  await git.deleteLocalBranch(branchName, true)
}

export async function getUncommittedFiles(worktreePath: string): Promise<string[]> {
  const git = simpleGit(worktreePath)
  const status = await git.status()
  return status.files.map((f) => f.path)
}

export async function commitAllInWorktree(worktreePath: string, message: string): Promise<void> {
  const git = simpleGit(worktreePath)
  await git.add('.')
  await git.commit(message)
}

export async function mergeBranch(
  repoRoot: string,
  branchName: string,
  targetBranch: string
): Promise<void> {
  const git = simpleGit(repoRoot)
  await git.checkout(targetBranch)
  await git.merge([branchName, '--no-ff', '-m', `Merge task branch: ${branchName}`])
}
