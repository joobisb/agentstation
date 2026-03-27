import { exec } from 'node:child_process'
import { promisify } from 'node:util'

const execAsync = promisify(exec)

export async function which(command: string): Promise<string | null> {
  try {
    const { stdout } = await execAsync(`which ${command}`)
    return stdout.trim() || null
  } catch {
    return null
  }
}
