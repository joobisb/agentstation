# Agent Station

Define what you want built before your AI agent touches a single file. Review what it actually built when it's done.

```
agentstation task new "Add Stripe webhook handler"
agentstation task start --agent=claude
agentstation task review
agentstation task done
```

---

## The problem

When you hand a task to an AI agent, two things go wrong:

1. The agent doesn't have enough context — it guesses at what you want
2. When it's done, you have to manually diff through everything to check if it did the right thing

Agent Station fixes both. You write a spec first (acceptance criteria, constraints, what's out of scope). The agent gets that spec as context. When it's done, you get a structured report showing exactly which criteria were met and which weren't.

---

## Install

```bash
npm install -g agentstation
```

Requires Node.js 20+.

---

## Usage

### 1. Initialize in your repo

```bash
cd your-project
agentstation init
```

Creates `.agentstation/` (config + worktrees) and `openspec/` (your spec files) in the repo.

---

### 2. Create a task

```bash
agentstation task new "Add Stripe webhook handler"
```

Opens a spec file in your editor. Fill it out before the agent starts:

```markdown
## Context
We use Stripe for payments. Handle incoming webhook events to update order status.

## Acceptance Criteria
- [ ] Add POST /webhooks/stripe endpoint
- [ ] Validate Stripe signature on incoming requests
- [ ] Handle payment_intent.succeeded event
- [ ] Handle payment_intent.payment_failed event
- [ ] Write tests for all handlers

## Constraints
- Use existing Express setup in src/api/
- Do not change the database schema

## Out of Scope
- Stripe dashboard configuration
- Frontend payment UI changes
```

---

### 3. Start the task

```bash
agentstation task start --agent=claude
```

Creates an isolated git worktree for this task, injects your spec as context, and launches the agent. The agent works in its own branch — your main branch stays clean.

Supported agents: `claude`, `cursor`, `codex`, `gemini`

---

### 4. Review what was built

```bash
agentstation task review
```

```
Acceptance Criteria Coverage
──────────────────────────────────────────────────

  ✅  Add POST /webhooks/stripe endpoint
        matched in: src/api/webhooks/stripe.ts

  ✅  Validate Stripe signature on incoming requests
        matched in: src/api/webhooks/stripe.ts

  ✅  Handle payment_intent.succeeded event
        matched in: src/api/webhooks/stripe.ts

  ⚠️   Handle payment_intent.payment_failed event
        partial (2/5 keywords matched)

  ❌  Write tests for all handlers
        no matching content found in diff

Coverage: 3 found · 1 partial · 1 missing

──────────────────────────────────────────────────
Files Changed  (2 files · +134 -0 lines)

  src/api/webhooks/stripe.ts        new file   +87
  src/api/routes/index.ts           modified    +3
```

Go back to the agent for anything that's missing, then re-run `task review` until you're happy.

---

### 5. Ship it

```bash
agentstation task done
```

Choose to create a PR (via `gh`) or merge directly. Your spec gets archived in `openspec/changes/` as a record of what was built and why. The worktree is cleaned up.

---

## How specs are stored

Specs live in `openspec/tasks/` and are committed to your repo — they're first-class artifacts alongside your code. After a task is done they move to `openspec/changes/`, building up a history of every task ever run.

```
your-repo/
├── openspec/
│   ├── tasks/           # active specs
│   └── changes/         # completed specs (history)
└── .agentstation/
    ├── state.json       # task registry
    └── worktrees/       # git worktrees (gitignored)
```

---

## Requirements

- Git
- Node.js 20+
- The agent CLI you want to use (`claude`, `cursor`, etc.)
- `gh` CLI if you want PR creation on `task done`
