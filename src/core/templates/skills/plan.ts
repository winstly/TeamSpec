/**
 * Skill Template: teamspec-plan
 *
 * Triggered after teamspec-team is complete.
 * Decomposes work into actionable tasks, determines execution mode,
 * and produces detailed task plans for approval.
 */
import type { SkillTemplate } from '../../shared/command-generation/types.js';

export function getPlanSkillTemplate(): SkillTemplate {
  return {
    name: 'teamspec-plan',
    description:
      'Decompose project work into tasks with execution strategy and produce detailed plans for review. Use when a team has been assembled.',
    instructions: `Enter plan mode. Your goal is to decompose the project into actionable tasks, choose the right execution strategy, and produce detailed plans ready for implementation.

**Input**: Optionally specify a project name. If omitted:
- Infer from conversation context if the user mentioned a project
- Auto-select if only one active project exists
- If ambiguous, list available projects and use the **AskUserQuestion tool** to let the user select

Always announce: "Planning project: <name>"

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

\`\`\`
WORK STREAM MAP
══════════════════════════════════════════════════

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
\`\`\`

For each work stream, define:
- **Name** - what it covers
- **Owner agent** - from the team
- **Dependencies** - what it needs from other streams
- **Deliverables** - what gets produced

### Step 3: Task Decomposition

For each work stream, decompose into individual tasks using the **TodoWrite tool** to track:

\`\`\`
### Work Stream: [Name]

| #  | Task                          | Owner      | Complexity | Est. Time |
|----|-------------------------------|------------|------------|-----------|
| 1  | [Task description]            | [agent]    | Low/Med/Hi | [duration]|
| 2  | [Task description]            | [agent]    | Low/Med/Hi | [duration]|
| ...| ...                           | ...        | ...        | ...       |
\`\`\`

Mark each task with:
- **Owner** - which agent will do it
- **Complexity** - Low / Medium / High (based on uncertainty, scope, and technical risk)
- **Estimated duration** - for scheduling reference
- **Dependencies** - which tasks must complete first

### Step 4: Determine Execution Mode

Based on complexity, team size, and task interdependencies, determine the execution model:

**Mode A - Single Agent**
Used when: only 1 agent is needed, tasks are sequential, low interdependency.
\`\`\`
EXECUTION MODE: SINGLE AGENT
─────────────────────────────
Agent: [agent-name]
Strategy: Work through tasks sequentially.
No parallelization needed.
\`\`\`

**Mode B - Plan-Subagent**
Used when: 1 primary agent coordinates, spawning subagents for specific subtasks.
Good for: medium complexity, 2-3 agents, some parallel work.
\`\`\`
EXECUTION MODE: PLAN-SUBAGENT
──────────────────────────────
Lead: [agent-name]
Subagents spawned for: [specific tasks]
Coordination: Lead agent tracks all subagent outputs.
\`\`\`

**Mode C - Agent Teams**
Used when: multiple independent agents work in parallel, each owning a work stream.
Good for: high complexity, 3+ agents, large project.
\`\`\`
EXECUTION MODE: AGENT TEAMS
─────────────────────────────
Stream A -> Agent A (parallel)
Stream B -> Agent B (parallel)
Stream C -> Agent C (parallel)
Integration -> Agent A (lead)
\`\`\`

Choose the simplest mode that fits the project's needs. Prefer Mode A over B, B over C.

### Step 5: Document the Plan

Write the full plan to:
\`\`\`
teamspec/knowledge/projects/<project>/plan.md
\`\`\`

Structure:
\`\`\`
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
\`\`\`

### Step 6: Produce Detailed Task Plans (Approval)

After the high-level plan is documented, decompose each task into concrete sub-steps for implementation readiness.

For each task assigned to an agent, break it into concrete steps:

\`\`\`
### Task: [Task name from plan.md]

**Goal**: [What "done" looks like]
**Dependencies**: [what must be ready first]
**Risks**: [what could go wrong]

#### Sub-steps:
1. [Concrete action - e.g., "Create the user table migration"]
2. [Concrete action - e.g., "Add the UserRepository class"]
3. [Concrete action - e.g., "Write unit tests for UserRepository"]

**Files touched**:
- 'src/models/user.ts' (create)
- 'src/db/migrations/001_user.sql' (create)

**Verification**:
- [ ] Tests pass: 'npm test -- --grep user'
- [ ] Migration applies cleanly: 'npm run migrate'
\`\`\`

Identify cross-agent touchpoints for each task:
- Shared files or interfaces
- API contracts
- Data schemas
- Configuration

Write the consolidated approval document to:
\`\`\`
teamspec/knowledge/projects/<project>/approvals.md
\`\`\`

Structure:
\`\`\`
## Approval Document: [Project Name]

**Date**: [date]

---

## Task Breakdown

### Work Stream: [Name] - [Agent]

| #  | Task                        | Sub-steps | Complexity | Est. Time |
|----|-----------------------------|-----------|------------|-----------|
| 1  | [task]                      | [N steps] | Medium     | 2 hours   |
| 2  | [task]                      | [N steps] | High       | 4 hours   |

### Detailed Plans

#### Task 1: [name]

**Goal**: [concrete completion criteria]
**Verification**: [how to confirm it's done]

**Steps**:
1. ...
2. ...
3. ...

**Files**: [list]
**Cross-agent touchpoints**: [if any]

---

## Coordination Points

| Touchpoint                    | Agent          | Agreement Needed       |
|-------------------------------|----------------|------------------------|
| [shared interface or file]    | [agent-name]   | [what to agree on]     |

---

## Risks & Mitigations

| Risk                          | Likelihood | Impact    | Mitigation            |
|-------------------------------|------------|-----------|----------------------|
| [risk description]            | Low/Med/Hi | Low/Med/Hi| [how to handle]      |

---

## Ready to Proceed

[ ] All tasks reviewed and decomposed into sub-steps.
[ ] Coordination points identified.
[ ] Risks assessed.
[ ] Cross-agent interfaces agreed upon.
\`\`\`

### Step 7: Prompt User for Approval

After the plan and detailed task breakdowns are documented:

> "Plan ready at 'teamspec/knowledge/projects/<project>/plan.md' with detailed task breakdowns. Review the plan, then confirm with 'approved' or request changes. Once approved, we proceed to teamspec-execute."

If the user confirms:

> "Approved. Proceeding to teamspec-execute to begin implementation."

---

## Handoff Protocol

After approval, create a handoff file for each agent:
\`teamspec/knowledge/projects/<project>/handoffs/<agent-name>.md\`

Handoff file contains:
- Assigned tasks (from plan.md)
- Sub-steps (from approvals)
- Dependencies on other agents (which handoff files to read first)
- Output contracts (what files/APIs this agent must produce)
- Verification steps (how to confirm the work is done)

Other agents READ your handoff file BEFORE starting their dependent tasks.

---

## Guardrails

- **Don't over-decompose** - Tasks should be actionable by a single agent session. If a task is too large to estimate, split it further.
- **Don't mix ownership** - Each task should have one clear owner. Ambiguous ownership leads to dropped work.
- **Don't vague-step tasks** - "Implement X" is not a task. Break it into atomic actions: "create file Y", "add function Z", "write test for Z".
- **Do flag complexity honestly** - Mark High complexity when there is real uncertainty. This triggers closer monitoring in teamspec-execute.
- **Do choose the simplest execution mode** - More coordination overhead is not a sign of progress. Choose the mode that fits the project, not the one that sounds most sophisticated.
- **Do note blockers upfront** - If a task depends on an external decision, document it and flag it for human resolution.
- **Do include verification criteria** - Each task should have a clear "done" condition. Without it, tasks can be marked complete while still broken.
- **Do flag unknowns as tasks** - If you're not sure how to do something, that uncertainty is a task: "Research X approach" or "Spike: evaluate Y library".

**Phase Navigation**

You can move between phases fluidly - you are NOT locked to a linear path:
- If plan reveals context is incomplete -> update 'context.md' and re-run teamspec-context
- If plan reveals team gaps -> update 'team.md' and re-run teamspec-team
- If execution discovers blockers requiring scope change -> pause, update 'plan.md' or 'context.md', then re-assign
- After fixing any phase -> continue from that point forward

DO NOT silently absorb problems into the current phase. If the source of the issue is upstream, flag it and offer to loop back.`,
    license: 'MIT',
    compatibility: 'Requires teamspec workspace structure and prior context + team artifacts.',
    metadata: { author: 'teamspec', version: '1.0' },
  };
}
