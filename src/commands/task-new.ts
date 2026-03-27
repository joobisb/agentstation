import { promises as fs } from 'node:fs'
import { requireWorkspace } from '../core/workspace.js'
import { readState, writeState, upsertTask } from '../core/state.js'
import { createTask, getSpecPath, getSlug } from '../core/task.js'
import { renderSpecTemplate } from '../templates/spec-template.js'
import { openInEditor } from '../utils/editor.js'
import { pathExists } from '../utils/fs.js'
import { promptTitle } from '../ui/prompts.js'
import { success, muted, blank, fatal, info } from '../ui/output.js'
import chalk from 'chalk'

interface TaskNewOptions {
  title?: string
}

export async function runTaskNew(titleArg: string | undefined, _opts: TaskNewOptions): Promise<void> {
  const workspace = await requireWorkspace(process.cwd())

  const state = await readState(workspace.stateFile)

  const title = titleArg?.trim() || (await promptTitle())

  // Check for duplicate title/slug
  const slug = getSlug({ title })
  const specPath = getSpecPath(workspace.tasksDir, { title })

  if (await pathExists(specPath)) {
    fatal(
      `A task with this title already exists: ${specPath}\n` +
        'Choose a different title or edit the existing spec.'
    )
  }

  const task = createTask(title, state.base_branch)
  task.spec_path = specPath

  blank()
  console.log(chalk.bold(`Creating task: ${title}`))
  info(`ID:   ${task.id}`)
  info(`Spec: openspec/tasks/${slug}.md`)
  blank()

  // Render and write spec
  const specContent = renderSpecTemplate({
    id: task.id,
    title,
    created: new Date().toISOString().split('T')[0],
    base: state.base_branch,
  })

  await fs.writeFile(specPath, specContent, 'utf-8')

  // Save task to state
  const newState = upsertTask(state, task)
  await writeState(workspace.stateFile, newState)

  muted('Opening in editor...')
  await openInEditor(specPath)

  blank()
  success('Spec saved.')
  blank()
  console.log(chalk.bold('Task ready.'))
  info(`ID:     ${task.id}`)
  info(`File:   openspec/tasks/${slug}.md`)
  info(`Status: draft`)
  blank()
  muted(`Next: agentstation task start --agent=claude`)
  blank()
}
