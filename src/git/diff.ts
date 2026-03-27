import { simpleGit } from 'simple-git'

export interface DiffStats {
  additions: number
  deletions: number
  filesChanged: number
}

export async function getWorktreeDiff(
  repoRoot: string,
  branchName: string,
  baseBranch: string
): Promise<string> {
  const git = simpleGit(repoRoot)
  // Three-dot diff: shows only what the branch added, not upstream changes
  return git.diff([`${baseBranch}...${branchName}`])
}

export async function getChangedFiles(
  repoRoot: string,
  branchName: string,
  baseBranch: string
): Promise<string[]> {
  const git = simpleGit(repoRoot)
  const result = await git.diff([`${baseBranch}...${branchName}`, '--name-only'])
  return result
    .trim()
    .split('\n')
    .filter((f) => f.length > 0)
}

export async function getDiffStats(
  repoRoot: string,
  branchName: string,
  baseBranch: string
): Promise<DiffStats> {
  const git = simpleGit(repoRoot)
  const result = await git.diff([`${baseBranch}...${branchName}`, '--stat'])

  // Parse the final summary line: "3 files changed, 134 insertions(+), 0 deletions(-)"
  const summaryMatch = result.match(
    /(\d+) files? changed(?:, (\d+) insertions?\(\+\))?(?:, (\d+) deletions?\(-\))?/
  )

  return {
    filesChanged: summaryMatch ? parseInt(summaryMatch[1], 10) : 0,
    additions: summaryMatch && summaryMatch[2] ? parseInt(summaryMatch[2], 10) : 0,
    deletions: summaryMatch && summaryMatch[3] ? parseInt(summaryMatch[3], 10) : 0,
  }
}

export async function splitDiffByFile(diff: string): Promise<Map<string, string>> {
  const fileMap = new Map<string, string>()
  // Split on "diff --git a/..." boundaries
  const chunks = diff.split(/^(?=diff --git )/m)

  for (const chunk of chunks) {
    const match = chunk.match(/^diff --git a\/.+ b\/(.+)/)
    if (match) {
      fileMap.set(match[1], chunk)
    }
  }

  return fileMap
}
