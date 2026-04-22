/**
 * Skill Template: teamspec-propose
 *
 * One-step project setup for small, well-defined tasks.
 * Creates context + team + plan in a single workflow.
 */
import type { SkillTemplate } from '../../shared/command-generation/types.js';

export function getProposeSkillTemplate(): SkillTemplate {
  return {
    name: 'teamspec-propose',
    description:
      'One-step project setup for small tasks. Creates context, team, plan, and detailed task breakdowns in one pass. Use for well-defined tasks needing 1-2 agents.',
    instructions: `Enter propose mode. For small, well-defined projects (1-2 tasks, single agent recommended), create all planning artifacts in one step.

**This is a quick-mode workflow.** If the project is complex or needs 3+ agents, recommend switching to teamspec-context for the full pipeline.

**Input**: The user will describe a task or small project. They may also point to an existing project directory.

If the input is ambiguous, use the **AskUserQuestion tool** to clarify:
- What problem does this solve?
- Who are the users?
- What is the tech stack (or what is the current stack)?

If the user provides a detailed description, skip the questions and derive answers from it.

---

## Step-by-Step Process

### Step 1: Quick Context Gathering

Derive from the user's description (or the 3 clarifying questions):
- Core problem
- Target users
- Tech stack

### Step 2: Read the Agent Manifest

Read 'teamspec/agents/manifest.json' to find suitable agents.

Recommend 1 agent for simple tasks, 2 at most for small projects.
If no suitable agent exists, note the capability gap.

### Step 3: Generate All Artifacts

Create these files in sequence using the **TodoWrite tool** to track progress:

#### 3a. Context - 'teamspec/knowledge/projects/<project>/context.md'

\`\`\`markdown
## Project Context Summary

**Project Name**: [name]
**Type**: [web app / CLI / library / service / etc.]
**Core Problem**: [what problem this solves]
**Target Users**: [who will use this]
**Tech Stack**: [languages, frameworks]

### Goals
- [Primary goal]

### Scope
- In scope: [what we are building]
- Out of scope: [what we are NOT building]

### Key Constraints
- [any constraints]

### Open Questions
- [things to resolve during implementation, if any]
\`\`\`

#### 3b. Team - 'teamspec/knowledge/projects/<project>/team.md'

\`\`\`markdown
## Agent Team Recommendation

### Team Size: [N agents]

| Agent | Role | Rationale | Contribution |
|-------|------|-----------|-------------|
| agent-name | [role] | [why] | High |

### Team Lead
[agent-name]

### Excluded Agents
| Agent | Reason |
|-------|--------|
| agent-name-x | [not needed] |
\`\`\`

#### 3c. Plan - 'teamspec/knowledge/projects/<project>/plan.md'

\`\`\`markdown
## Project Execution Plan

**Project**: [name]
**Generated**: [date]
**Team**: [list of agents]
**Execution Mode**: Single Agent

---

## Work Streams

### Implementation - [owner]

Tasks:
| # | Task | Owner | Complexity | Est. |
|---|------|-------|------------|------|
| 1 | [task] | [agent] | Low/Med/Hi | [time] |

---

## Execution Mode

Mode A - Single Agent
Strategy: Work through tasks sequentially. No parallelization needed.

### Coordination Protocol

Simple status updates after each task.

### Integration Plan

Verify each task completes successfully before moving to next.

---

## Open Questions / Risks

- [things to monitor]
\`\`\`

#### 3d. Approvals - 'teamspec/knowledge/projects/<project>/approvals.md'

\`\`\`markdown
## Approval Document: [Project Name]

**Date**: [date]

---

## Task Breakdown

| # | Task | Sub-steps | Complexity | Est. Time |
|---|------|-----------|------------|-----------|
| 1 | [task] | [N steps] | [Low/Med/Hi] | [time] |

---

## Detailed Plans

### Task 1: [name]

**Goal**: [concrete completion criteria]
**Verification**: [how to confirm it is done]

**Steps**:
1. [Concrete action]
2. [Concrete action]

**Files**: [list]
**Cross-agent touchpoints**: [if any]

---

## Ready to Proceed

- [ ] All tasks reviewed and decomposed.
- [ ] Coordination points identified.
\`\`\`

### Step 4: Prompt Continuation

After writing all artifacts:

> "All artifacts created! Ready for implementation."
> "Run teamspec-execute to begin implementation. When complete, run teamspec-verify to validate."

---

## Guardrails

- **Only use for small projects** - If the project has >5 tasks or >2 agents, recommend switching to teamspec-context for the full pipeline
- **Always write artifacts** - Even in quick mode, knowledge capture matters. Write context.md, team.md, plan.md, and approvals
- **Don't over-decompose** - Keep it simple. 1-3 tasks is the sweet spot
- **If context is vague, ask first** - Don't guess at project requirements. Use the **AskUserQuestion tool**.

**Phase Navigation**

This is a condensed workflow. If the project turns out to be more complex than expected:
- Stop and recommend switching to teamspec-context for the full pipeline
- The artifacts you have already written will serve as a starting point
- Continue from the point where complexity was discovered`,
    license: 'MIT',
    compatibility: 'Requires teamspec workspace structure.',
    metadata: { author: 'teamspec', version: '1.0' },
  };
}
