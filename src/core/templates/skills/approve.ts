/**
 * Skill Template: teamspec-approve
 *
 * Triggered after teamspec-plan is complete.
 * Each agent creates detailed task plans for review and approval.
 */
import type { SkillTemplate } from '../../shared/command-generation/types.js';

export function getApproveSkillTemplate(): SkillTemplate {
  return {
    name: 'teamspec-approve',
    description:
      'Use when a high-level plan exists and agents need to produce detailed task plans for review before execution.',
    instructions: `Enter approval mode. Each agent on the team now converts the high-level plan into detailed, actionable task lists for review.

---

## What You Receive

Input:
- 'teamspec/knowledge/projects/<project>/plan.md' - the project execution plan
- 'teamspec/knowledge/projects/<project>/team.md' - team composition
- The agent's assigned role and work streams from the plan

---

## Step-by-Step Process

### Step 1: Read the Project Plan

Read 'teamspec/knowledge/projects/<project>/plan.md' thoroughly. Identify:
- Your assigned work streams and tasks
- Dependencies between your tasks and others'
- The overall execution mode (Single Agent / Plan-Subagent / Agent Teams)

### Step 2: Decompose Your Tasks

For each task assigned to you in the plan, break it into concrete steps:

${'`\`\`\`'}
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
${'`\`\`\`'}

### Step 3: Identify Cross-Agent Touchpoints

For each task, note where it interacts with another agent's work:
- Shared files or interfaces
- API contracts
- Data schemas
- Configuration

Flag these as coordination points that need explicit agreement before implementation.

### Step 4: Produce an Approval Document

Write a per-agent approval document:

${'`\`\`\`'}
teamspec/knowledge/projects/<project>/approvals/[agent-name].md
${'`\`\`\`'}

Or a consolidated approval document if you are the lead:

${'`\`\`\`'}
teamspec/knowledge/projects/<project>/approvals.md
${'`\`\`\`'}

Structure:
${'`\`\`\`'}
## Approval Document: [Project Name]

**Agent**: [agent name]
**Date**: [date]

---

## My Tasks

| #  | Task (from plan)            | Sub-steps | Complexity | Est. Time |
|----|-----------------------------|-----------|------------|-----------|
| 1  | [task]                      | [N steps] | Medium     | 2 hours   |
| 2  | [task]                      | [N steps] | High       | 4 hours   |

---

## Detailed Task Plans

### Task 1: [name]

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

| Risk                          | Likelihood | Impact   | Mitigation            |
|-------------------------------|------------|----------|------------------------|
| [risk description]            | Low/Med/Hi | Low/Med/Hi| [how to handle]       |

---

## I am ready to proceed.

[ ] All tasks reviewed.
[ ] Coordination points identified.
[ ] Risks assessed.
[ ] I have read any shared interfaces I depend on.
${'`\`\`\`'}

### Step 5: Collect Agent Sign-offs

If you are the lead agent:
- Prompt each team agent to produce their approval document
- Review cross-agent touchpoints for consistency
- Flag any conflicts between agents (e.g., two agents writing the same file)

### Step 6: Prompt User for Approval

After all agents have documented their plans:

> "All agents have submitted detailed task plans. Review 'teamspec/knowledge/projects/<project>/approvals.md', then confirm with 'approved' or request changes. Once approved, we proceed to teamspec-monitor."

If the user confirms:

> "Approved. Proceeding to teamspec-monitor to begin execution."

---

## Guardrails

- **Don't skip cross-agent coordination** - Shared interfaces and contracts must be agreed upon before implementation. Unilaterally changing a shared API breaks other agents.
- **Don't vague-step tasks** - "Implement X" is not a task. Break it into atomic actions: "create file Y", "add function Z", "write test for Z".
- **Do include verification criteria** - Each task should have a clear "done" condition. Without it, tasks can be marked complete while still broken.
- **Do flag unknowns as tasks** - If you're not sure how to do something, that uncertainty is a task: "Research X approach" or "Spike: evaluate Y library".
- **Do update plan.md if you refine scope** - If detailed decomposition reveals the original plan was incomplete, update plan.md to reflect the refined understanding.`,
    license: 'MIT',
    compatibility: 'Requires teamspec workspace structure and plan.md artifact.',
    metadata: { author: 'teamspec', version: '1.0' },
  };
}
