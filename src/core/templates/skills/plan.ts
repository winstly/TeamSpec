/**
 * Skill Template: teamspec-plan
 *
 * Triggered after teamspec-recruit is complete.
 * Decomposes work into detailed tasks and determines execution mode.
 */
import type { SkillTemplate } from '../../shared/command-generation/types.js';

export function getPlanSkillTemplate(): SkillTemplate {
  return {
    name: 'teamspec-plan',
    description:
      'Use when a team has been assembled and work needs to be decomposed into actionable tasks with an execution strategy.',
    instructions: `Enter plan mode. Your goal is to decompose the project into actionable tasks and choose the right execution strategy.

---

## What You Receive

Input comes from:
- 'teamspec/knowledge/projects/<project>/context.md' - project context
- 'teamspec/knowledge/projects/<project>/team.md' - team composition

---

## Step-by-Step Process

### Step 1: Read Existing Artifacts

Read both 'context.md' and 'team.md' to understand:
- The problem space and goals
- The team members and their roles
- Any constraints or open questions from earlier phases

### Step 2: Identify Work Streams

Break the project down into logical work streams - major areas of responsibility that can be worked on somewhat independently:

${'`\`\`\`'}
WORK STREAM MAP
═══════════════════════════════════════════════════

  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
  │  Work       │   │  Work       │   │  Work       │
  │  Stream A   │   │  Stream B   │   │  Stream C   │
  │             │   │             │   │             │
  │  [owner]    │   │  [owner]    │   │  [owner]    │
  └──────┬──────┘   └──────┬──────┘   └──────┬──────┘
         │                 │                 │
         └────────┬────────┴────────┬────────┘
                  ▼
           ┌──────────────┐
           │ Integration  │
           │ & Validation │
           └──────────────┘
${'`\`\`\`'}

For each work stream, define:
- **Name** - what it covers
- **Owner agent** - from the team
- **Dependencies** - what it needs from other streams
- **Deliverables** - what gets produced

### Step 3: Task Decomposition

For each work stream, decompose into individual tasks:

${'`\`\`\`'}
### Work Stream: [Name]

| #  | Task                          | Owner      | Complexity | Est. Time |
|----|-------------------------------|------------|------------|-----------|
| 1  | [Task description]            | [agent]    | Low/Med/Hi | [duration]|
| 2  | [Task description]            | [agent]    | Low/Med/Hi | [duration]|
| ...| ...                           | ...        | ...        | ...       |
${'`\`\`\`'}

Mark each task with:
- **Owner** - which agent will do it
- **Complexity** - Low / Medium / High (based on uncertainty, scope, and technical risk)
- **Estimated duration** - for scheduling reference
- **Dependencies** - which tasks must complete first

### Step 4: Determine Execution Mode

Based on complexity, team size, and task interdependencies, determine the execution model:

**Mode A - Single Agent**
Used when: only 1 agent is needed, tasks are sequential, low interdependency.
${'`\`\`\`'}
EXECUTION MODE: SINGLE AGENT
─────────────────────────────
Agent: [agent-name]
Strategy: Work through tasks sequentially.
No parallelization needed.
${'`\`\`\`'}

**Mode B - Plan-Subagent**
Used when: 1 primary agent coordinates, spawning subagents for specific subtasks.
Good for: medium complexity, 2–3 agents, some parallel work.
${'`\`\`\`'}
EXECUTION MODE: PLAN-SUBAGENT
──────────────────────────────
Lead: [agent-name]
Subagents spawned for: [specific tasks]
Coordination: Lead agent tracks all subagent outputs.
${'`\`\`\`'}

**Mode C - Agent Teams**
Used when: multiple independent agents work in parallel, each owning a work stream.
Good for: high complexity, 3+ agents, large project.
${'`\`\`\`'}
EXECUTION MODE: AGENT TEAMS
─────────────────────────────
Stream A → Agent A (parallel)
Stream B → Agent B (parallel)
Stream C → Agent C (parallel)
Integration → Agent A (lead)
${'`\`\`\`'}

Choose the simplest mode that fits the project's needs. Prefer Mode A over B, B over C.

### Step 5: Document the Plan

Write the full plan to:
${'`\`\`\`'}
teamspec/knowledge/projects/<project>/plan.md
${'`\`\`\`'}

Structure:
${'`\`\`\`'}
## Project Execution Plan

**Project**: [name]
**Generated**: [date]
**Team**: [list of agents]
**Execution Mode**: [Single Agent / Plan-Subagent / Agent Teams]

---

## Work Streams

### [Stream 1] - [owner]
[description]
**Dependencies**: [list]
**Deliverables**: [list]

Tasks:
| #  | Task  | Owner  | Complexity | Est. | Dependencies |
|----|-------|--------|------------|------|--------------|
| 1  | ...   | ...    | ...        | ...  | ...          |

### [Stream 2] - [owner]
[...]

---

## Execution Mode

[Mode selection with rationale]

### Coordination Protocol

[How agents communicate and synchronize]

### Integration Plan

[How streams come together]

---

## Open Questions / Risks

- [things to monitor during execution]
${'`\`\`\`'}

### Step 6: Prompt Continuation

> "Plan ready at 'teamspec/knowledge/projects/<project>/plan.md'. Ready to proceed to teamspec-approve for detailed task review and sign-off?"

---

## Guardrails

- **Don't over-decompose** - Tasks should be actionable by a single agent session. If a task is too large to estimate, split it further.
- **Don't mix ownership** - Each task should have one clear owner. Ambiguous ownership leads to dropped work.
- **Do flag complexity honestly** - Mark High complexity when there is real uncertainty. This triggers closer monitoring in teamspec-monitor.
- **Do choose the simplest execution mode** - More coordination overhead is not a sign of progress. Choose the mode that fits the project, not the one that sounds most sophisticated.
- **Do note blockers upfront** - If a task depends on an external decision, document it and flag it for human resolution.`,
    license: 'MIT',
    compatibility: 'Requires teamspec workspace structure and prior context + team artifacts.',
    metadata: { author: 'teamspec', version: '1.0' },
  };
}
