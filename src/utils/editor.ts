import { spawn } from 'node:child_process'
import { which } from './which.js'

const EDITOR_FALLBACKS = ['code', 'nano', 'vim', 'vi']

async function detectEditor(): Promise<string> {
  const fromEnv = process.env.VISUAL ?? process.env.EDITOR
  if (fromEnv) return fromEnv

  for (const editor of EDITOR_FALLBACKS) {
    if (await which(editor)) return editor
  }

  throw new Error(
    'No editor found. Set $EDITOR or $VISUAL environment variable.'
  )
}

export async function openInEditor(filePath: string): Promise<void> {
  const editor = await detectEditor()

  return new Promise((resolve, reject) => {
    const child = spawn(editor, [filePath], {
      stdio: 'inherit',
      shell: false,
    })

    child.on('exit', (code) => {
      if (code === 0 || code === null) {
        resolve()
      } else {
        reject(new Error(`Editor exited with code ${code}`))
      }
    })

    child.on('error', (err) => {
      reject(new Error(`Failed to open editor "${editor}": ${err.message}`))
    })
  })
}
