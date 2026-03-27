# Agent Task Brief

You are working on a specific, scoped task. Read this spec carefully before writing any code.

---

## Task: Enforce review checkpoint in task done


## Context
  agentstation is spec-first — the developer writes acceptance criteria before the agent touches code.
  But task done currently lets you ship without ever running a review, or even if the last review
  showed failing criteria. This breaks the core promise. The checkpoint enforces that the spec
  was actually evaluated before shipping.

## Acceptance Criteria
  - [ ] If task review has never been run (task status is still "active"), block task done with a clear
  error message directing the user to run task review first
  - [ ] If the last review had one or more missing (❌) criteria, show a summary of what's missing and
  ask "Ship anyway? [y/N]" — default no
  - [ ] If the last review had partial (⚠️ ) criteria but no missing ones, show a warning summary and ask
   "Ship anyway? [y/N]" — default no
  - [ ] If all criteria were ✅, proceed to task done without any interruption
  - [ ] The block/warning uses the review data already stored in state.json — no re-running the diff

## Constraints
  - Do not re-run the review — read the last review result from the existing state
  - The hard block (never reviewed) should exit with a non-zero code
  - The soft prompt (missing/partial criteria) should default to No so shipping is an intentional choice

## Out of Scope
  - Storing full review results to disk — keep reading from task status and the last review metadata
  - Changing the review engine or reporter


---

**Instructions:**
- Complete all acceptance criteria listed above before finishing.
- Do not modify files outside the constraints listed.
- When done, summarize what you built and which acceptance criteria were completed.
