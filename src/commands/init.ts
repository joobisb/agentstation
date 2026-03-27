import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import { simpleGit } from 'simple-git'
import { findGitRoot, buildWorkspacePaths } from '../core/workspace.js'
import { emptyState, writeState } from '../core/state.js'
import { ensureDir, pathExists, atomicWriteJson } from '../utils/fs.js'
import { confirmBaseBranch } from '../ui/prompts.js'
import { success, warn, blank, fatal, header, muted } from '../ui/output.js'
import chalk from 'chalk'

export async function runInit(): Promise<void> {
  const cwd = process.cwd()

  const gitRoot = await findGitRoot(cwd)
  if (!gitRoot) {
    fatal('Not inside a git repository. Run: git init')
  }

  const paths = buildWorkspacePaths(gitRoot)

  // Guard against double-init
  if (await pathExists(paths.agentstationDir)) {
    fatal(
      'Agent Station is already initialized in this repository.\n' +
        `  Config: ${paths.configFile}`
    )
  }

  console.log()
  console.log(chalk.bold('Agent Station'))
  console.log('─'.repeat(50))
  console.log(`Initializing in ${chalk.cyan(gitRoot)}`)
  blank()

  // Detect base branch
  const git = simpleGit(gitRoot)
  let detectedBranch = 'main'
  try {
    detectedBranch = (await git.revparse(['--abbrev-ref', 'HEAD'])).trim()
  } catch {
    // fallback to 'main'
  }
  muted(`Detected git repository`)
  muted(`Base branch: ${detectedBranch}`)
  blank()

  const baseBranch = await confirmBaseBranch(detectedBranch)

  blank()

  // Create directory structure
  await withStep('Creating .agentstation/', () => ensureDir(paths.agentstationDir))
  await withStep('Creating .agentstation/worktrees/', () => ensureDir(paths.worktreesDir))
  await withStep('Creating openspec/tasks/', () => ensureDir(paths.tasksDir))
  await withStep('Creating openspec/changes/', () => ensureDir(paths.changesDir))

  // Write config
  await withStep('Writing config.json', () =>
    atomicWriteJson(paths.configFile, {
      version: '0.1.0',
      base_branch: baseBranch,
    })
  )

  // Write empty state
  await withStep('Writing state.json', () =>
    writeState(paths.stateFile, emptyState(baseBranch))
  )

  // Update .gitignore
  await withStep('Updating .gitignore', () => updateGitignore(gitRoot, paths.worktreesDir))

  blank()
  success('Agent Station initialized.')
  blank()
  muted(`Next: agentstation task new "Your first task title"`)
  blank()
}

async function withStep(label: string, fn: () => Promise<void>): Promise<void> {
  await fn()
  success(label)
}

async function updateGitignore(gitRoot: string, worktreesDir: string): Promise<void> {
  const gitignorePath = join(gitRoot, '.gitignore')
  // Make the path relative to the repo root
  const relativePath = worktreesDir.replace(gitRoot + '/', '') + '/'
  const entry = `.agentstation/worktrees/`

  let existing = ''
  try {
    existing = await fs.readFile(gitignorePath, 'utf-8')
  } catch {
    // .gitignore doesn't exist yet, that's fine
  }

  if (existing.includes(entry)) return // already present

  const newline = existing.endsWith('\n') || existing === '' ? '' : '\n'
  await fs.writeFile(gitignorePath, `${existing}${newline}# Agent Station worktrees\n${entry}\n`, 'utf-8')
}
