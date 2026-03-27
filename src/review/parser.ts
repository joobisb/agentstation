const STOP_WORDS = new Set([
  'a', 'an', 'the', 'for', 'with', 'and', 'or', 'in', 'to', 'of',
  'that', 'this', 'it', 'is', 'are', 'was', 'be', 'as', 'at', 'by',
  'on', 'from', 'all', 'should', 'must', 'will', 'have', 'has', 'not',
  'no', 'new', 'do', 'make', 'add', 'use', 'get', 'set', 'run',
])

export interface AcceptanceCriterion {
  raw: string
  text: string
  checked: boolean
  keywords: string[]
}

function extractKeywords(text: string): string[] {
  // Extract quoted phrases as exact terms
  const quoted: string[] = []
  const withoutQuotes = text.replace(/"([^"]+)"/g, (_, phrase) => {
    quoted.push(phrase.toLowerCase())
    return ' '
  })

  // Split remaining text into words, filter stop words and short tokens
  const words = withoutQuotes
    .toLowerCase()
    .replace(/[^\w\s/.-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w))

  // Generate bigrams from adjacent words
  const bigrams: string[] = []
  for (let i = 0; i < words.length - 1; i++) {
    bigrams.push(`${words[i]} ${words[i + 1]}`)
  }

  return [...new Set([...quoted, ...words, ...bigrams])]
}

export function parseCriteria(rawLines: string[]): AcceptanceCriterion[] {
  return rawLines.map((line) => {
    const match = line.match(/^- \[([ x])\] (.+)$/)
    if (!match) {
      return {
        raw: line,
        text: line,
        checked: false,
        keywords: [],
      }
    }
    const checked = match[1] === 'x'
    const text = match[2].trim()
    return {
      raw: line,
      text,
      checked,
      keywords: extractKeywords(text),
    }
  })
}
