export interface SpecTemplateVars {
  id: string
  title: string
  created: string
  base: string
}

export function renderSpecTemplate(vars: SpecTemplateVars): string {
  return `---
id: ${vars.id}
title: "${vars.title}"
created: "${vars.created}"
status: draft
agent: ""
worktree: ""
branch: ""
base: "${vars.base}"
---

## Context
<!-- Describe the background the agent needs to understand this task.
     What system is being modified? What problem does this solve? -->


## Acceptance Criteria
- [ ]
- [ ]
<!-- Add one checkbox per verifiable requirement.
     Be specific — these will be used to evaluate what the agent built. -->

## Constraints
<!-- What must the agent NOT change? What existing patterns must be followed? -->


## Out of Scope
<!-- Explicitly list related things that are NOT part of this task. -->
`
}
