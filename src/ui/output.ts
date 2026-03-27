import chalk from 'chalk'

export const DIVIDER = chalk.gray('─'.repeat(50))

export function header(text: string): void {
  console.log()
  console.log(chalk.bold(text))
  console.log(DIVIDER)
}

export function success(text: string): void {
  console.log(chalk.green('  ✓ ') + text)
}

export function warn(text: string): void {
  console.log(chalk.yellow('  ⚠ ') + text)
}

export function error(text: string): void {
  console.error(chalk.red('  ✗ ') + text)
}

export function info(text: string): void {
  console.log('  ' + text)
}

export function muted(text: string): void {
  console.log(chalk.gray('  ' + text))
}

export function divider(): void {
  console.log(DIVIDER)
}

export function blank(): void {
  console.log()
}

export function fatal(message: string): never {
  console.error()
  console.error(chalk.red.bold('Error: ') + message)
  console.error()
  process.exit(1)
}
