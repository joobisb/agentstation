// inquirer v9 ships ESM without bundled TypeScript types.
// This minimal declaration satisfies the compiler for our usage patterns.
declare module 'inquirer' {
  export interface QuestionBase {
    type: string
    name: string
    message: string
    default?: unknown
    validate?: (input: string) => boolean | string
    choices?: Array<{ name: string; value: unknown } | string>
  }

  export interface InputQuestion extends QuestionBase { type: 'input' }
  export interface ListQuestion extends QuestionBase { type: 'list' }
  export interface ConfirmQuestion extends QuestionBase { type: 'confirm' }

  export type Question = InputQuestion | ListQuestion | ConfirmQuestion

  export function prompt<T>(questions: Question[]): Promise<T>

  export default { prompt }
}
