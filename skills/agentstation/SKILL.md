---
name: agentstation
description: Use agentstation to manage the current task lifecycle — create a spec, start an agent, review output, or ship. Use this whenever the developer wants to create a new task, check task status, run a review, or complete a task using the agentstation CLI.
argument-hint: "[new|start|review|done] [task title]"
allowed-tools: Bash(agentstation*), Read, Glob
---

# Agentstation Workflow

You are helping the developer use agentstation — a spec-first task lifecycle CLI.
The workflow is always: `task new` → `task start` → `task review` → `task done`.

## Current workspace state

Active tasks:
!`agentstation task list 2>/dev/null || echo "(no active tasks)"`

## Developer request

$ARGUMENTS

---

## How to handle each case

**If the developer wants to create a new task** (`new`, or a task title is given):
- Run `agentstation task new "<title>"` (or prompt for a title if none given)
- After the spec opens in their editor, remind them to fill in Context, Acceptance Criteria, Constraints, and Out of Scope — the more specific the criteria, the better the review will be
- Then suggest: `agentstation task start --agent=claude`

**If the developer wants to start working** (`start`):
- Check if there's a draft task. If multiple, ask which one.
- Run `agentstation task start --agent=claude` (or their preferred agent)
- The agent opens in an isolated git worktree with the spec injected as CLAUDE.md
- If there is already an active task, `task start` will ask if you want to reopen the agent in the existing worktree — say yes to continue working, no to exit

**If the developer wants to review** (`review`):
- Run `agentstation task review`
- Before the diff runs, agentstation checks for uncommitted files in the worktree. If found, the developer is shown three options:
  1. **Commit and review** — commits the agent's work then runs the coverage report. Use this when the agent finished but forgot to commit.
  2. **Reopen the agent** — opens Claude in the worktree so the developer can make more changes. The developer runs `task review` again manually when done.
  3. **Skip** — runs review against what's already committed. Uncommitted changes are not lost and can be committed later.
- After the diff runs, interpret the ✅ / ⚠️ / ❌ output for them — explain what was built, what's partial, what's missing
- If criteria are missing, the developer can either reopen the agent (`task start`) or accept the state and proceed to `task done`
- `task review` is always re-runnable — the task stays open until the developer explicitly runs `task done`

**If the developer wants to ship** (`done`):
- Run `agentstation task done`
- Walk them through the PR vs merge choice

**If $ARGUMENTS is empty**:
- Show the current task state and ask what they want to do next
