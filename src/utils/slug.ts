// slugify ships as CJS with a namespace declaration — import via createRequire for ESM compat
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
// eslint-disable-next-line @typescript-eslint/no-var-requires
const slugify = require('slugify') as (str: string, opts?: object) => string
import { nanoid } from 'nanoid'

export function toSlug(title: string): string {
  return slugify(title, {
    lower: true,
    strict: true,
    trim: true,
  })
}

export function shortId(): string {
  return nanoid(8)
}
