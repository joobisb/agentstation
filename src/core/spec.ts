import { promises as fs } from 'node:fs'
import matter from 'gray-matter'
import type { TaskStatus } from './state.js'

export interface SpecFrontmatter {
  id: string
  title: string
  created: string
  status: TaskStatus
  agent: string
  worktree: string | null
  branch: string | null
  base: string
}

export interface ParsedSpec {
  frontmatter: SpecFrontmatter
  content: string
  sections: {
    context: string
    acceptanceCriteria: string[]
    constraints: string
    outOfScope: string
  }
}

function extractSection(body: string, heading: string): string {
  const pattern = new RegExp(
    `## ${heading}\\n([\\s\\S]*?)(?=\\n## |$)`,
    'i'
  )
  const match = body.match(pattern)
  return match ? match[1].trim() : ''
}

function extractCheckboxes(section: string): string[] {
  return section
    .split('\n')
    .filter((line) => /^- \[[ x]\] .+/.test(line.trim()))
    .map((line) => line.trim())
}

export async function parseSpec(filePath: string): Promise<ParsedSpec> {
  const raw = await fs.readFile(filePath, 'utf-8')
  const { data, content } = matter(raw)

  const frontmatter = data as SpecFrontmatter
  const criteriaSection = extractSection(content, 'Acceptance Criteria')

  return {
    frontmatter,
    content,
    sections: {
      context: extractSection(content, 'Context'),
      acceptanceCriteria: extractCheckboxes(criteriaSection),
      constraints: extractSection(content, 'Constraints'),
      outOfScope: extractSection(content, 'Out of Scope'),
    },
  }
}

export async function writeSpec(filePath: string, spec: ParsedSpec): Promise<void> {
  const output = matter.stringify(spec.content, spec.frontmatter as unknown as Record<string, unknown>)
  await fs.writeFile(filePath, output, 'utf-8')
}

export async function updateSpecFrontmatter(
  filePath: string,
  updates: Partial<SpecFrontmatter>
): Promise<void> {
  const spec = await parseSpec(filePath)
  spec.frontmatter = { ...spec.frontmatter, ...updates }
  await writeSpec(filePath, spec)
}
