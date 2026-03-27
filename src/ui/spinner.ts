import ora from 'ora'

export async function withSpinner<T>(text: string, fn: () => Promise<T>): Promise<T> {
  const spinner = ora(text).start()
  try {
    const result = await fn()
    spinner.succeed(text)
    return result
  } catch (err) {
    spinner.fail(text)
    throw err
  }
}
