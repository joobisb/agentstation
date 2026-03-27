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
- Remind them the agent will open in an isolated git worktree with the spec injected as context

**If the developer wants to review** (`review`):
- Run `agentstation task review`
- Interpret the ✅ / ⚠️ / ❌ output for them — explain what was built, what's partial, what's missing
- If criteria are missing, suggest going back to the agent to complete them before running `task done`

**If the developer wants to ship** (`done`):
- Run `agentstation task done`
- Walk them through the PR vs merge choice

**If $ARGUMENTS is empty**:
- Show the current task state and ask what they want to do next
