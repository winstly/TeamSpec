/**
 * Skill Template: teamspec-monitor
 *
 * Triggered after user approval to begin implementation.
 * Agents pick up tasks and execute, with regular progress summaries.
 */
import type { SkillTemplate } from '../../shared/command-generation/types.js';

export function getMonitorSkillTemplate(): SkillTemplate {
  return {
    name: 'teamspec-monitor',
    description:
      'Use when an approved plan is ready and agents need coordination to execute tasks and report progress.',
    instructions: `Enter monitor mode. The plan is approved. Execution begins. Your role is to coordinate, track progress, and surface blockers.

---

## What You Receive

Input:
- 'teamspec/knowledge/projects/<project>/approvals.md' - approved task plans per agent
- 'teamspec/knowledge/projects/<project>/plan.md' - execution plan
- 'teamspec/knowledge/projects/<project>/team.md' - team roster

---

## Execution Architecture

${'`\`\`\`'}
┌──────────────────────────────────────────────────────────┐
│                  TEAMS PEC MONITOR                       │
├──────────────────────────────────────────────────────────┤
│                                                          │
│   ┌────────────┐    ┌────────────┐    ┌────────────┐   │
│   │  Agent A   │    │  Agent B   │    │  Agent C   │   │
│   │  [tasks]   │    │  [tasks]   │    │  [tasks]   │   │
│   └─────┬──────┘    └─────┬──────┘    └─────┬──────┘   │
│         │                 │                 │           │
│         └────────┬────────┴────────┬────────┘           │
│                  │                  │                    │
│                  ▼                  ▼                    │
│         ┌────────────────┐  ┌────────────────┐         │
│         │  Integration   │  │    Status      │         │
│         │    Point       │  │   Update       │         │
│         └────────────────┘  └────────────────┘         │
│                                                          │
└──────────────────────────────────────────────────────────┘
${'`\`\`\`'}

---

## Step-by-Step Process

### Phase 1: Kickoff

#### 1a. Assign Initial Tasks

For each agent in the team, identify their first ready-to-work tasks:
- Tasks with no unresolved dependencies
- Tasks marked High complexity get priority for early execution (to surface risk early)

Broadcast to each agent:
${'`\`\`\`'}
Your first tasks from the approved plan:

Task 1: [name] - [complexity] - start now
Task 2: [name] - [complexity] - after Task 1 completes

Coordination points to agree on before starting:
- [touchpoint 1: discuss with Agent X]
- [touchpoint 2: agree on interface with Agent Y]
${'`\`\`\`'}

#### 1b. Establish Check-in Cadence

Agree on a regular status cadence. Options:
- After each task completion
- Every N minutes / hours
- At explicit milestones

Default: check in after completing each task.

### Phase 2: Track and Coordinate

#### 2a. Status Collection

After each agent completes a task (or milestone), collect:
- **What was done**
- **What was changed** (files, interfaces, configs)
- **Any blockers encountered**
- **What they plan to do next**

#### 2b. Progress Dashboard

Maintain a living status view:

${'`\`\`\`'}
## Execution Status: [Project Name]

**Started**: [date]
**Last Updated**: [date/time]

### Task Board

| Task                  | Owner      | Status      | Updated     |
|-----------------------|------------|-------------|-------------|
| [task 1]              | Agent A    | DONE        | [date]      |
| [task 2]              | Agent A    | IN PROGRESS | [date]      |
| [task 3]              | Agent B    | READY       | -           |
| [task 4]              | Agent B    | BLOCKED     | [date]      |
| [task 5]              | Agent C    | READY       | -           |

### Blockers

| Blocker               | Task       | Owner      | Since      |
|-----------------------|------------|------------|------------|
| [description]         | [task]     | [agent]    | [date]     |

### Completed This Session

- [task 1] - [agent] - [files changed]
- [task 2] - [agent] - [files changed]
${'`\`\`\`'}

### Phase 3: Handle Blockers

When an agent reports a blocker:

1. **Diagnose** - Is it a technical blocker, a dependency blocker, or a scope question?
2. **Route** -
   - Technical: escalate to another agent or human
   - Dependency: check if the blocking task can be expedited
   - Scope: flag for human review
3. **Log** - Record the blocker in the status document
4. **Resolve or work around** - Aim to unblock within 1 cycle

### Phase 4: Integration Points

When agents reach an integration point:
- Pause and verify both sides of the interface are compatible
- Run a quick smoke test if possible
- If mismatch found: resolve before proceeding

### Phase 5: Status Updates

Write progress to:
${'`\`\`\`'}
teamspec/knowledge/projects/<project>/status.md
${'`\`\`\`'}

Update this file after every check-in cycle. It is the source of truth for "where are we."

---

## Progress Reporting Prompts

**To prompt an agent after task completion:**
> "Task complete. What's your next task? Any blockers or coordination needed?"

**To prompt a status summary for the user:**
> "Here is the current status: [N] tasks done, [N] in progress, [N] blocked. [Summary of notable events]. Continue, or do you want to pause or adjust scope?"

---

## Guardrails

- **Don't let blockers fester** - A blocker sitting for more than one cycle without a resolution plan is a problem. Escalate proactively.
- **Don't allow scope drift** - If an agent proposes adding work not in the approved plan, flag it: "That's outside the approved scope. Should we add it formally?"
- **Do update status.md on every cycle** - A stale status document is worse than none. Keep it current.
- **Do flag complexity surprises** - If a task is taking significantly longer than estimated, surface it immediately so the plan can be adjusted.
- **Do enforce interface agreements** - Cross-agent integrations must follow what was agreed in the approval phase. If an agent unilaterally changes a shared interface, roll it back.`,
    license: 'MIT',
    compatibility: 'Requires teamspec workspace structure and approved plan.',
    metadata: { author: 'teamspec', version: '1.0' },
  };
}
