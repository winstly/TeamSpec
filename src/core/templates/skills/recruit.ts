/**
 * Skill Template: teamspec-recruit
 *
 * Triggered after teamspec-context is complete.
 * Reads the agent manifest and recommends agents suited to the project.
 */
import type { SkillTemplate } from '../../shared/command-generation/types.js';

export function getRecruitSkillTemplate(): SkillTemplate {
  return {
    name: 'teamspec-recruit',
    description:
      'Use when project context has been gathered and an agent team needs to be assembled from the manifest.',
    instructions: `Enter recruit mode. Your goal is to assemble the right team of agents for the project based on the established context.

---

## What You Receive

Input comes from:
- 'teamspec/knowledge/projects/<project>/context.md' - the project context summary
- 'teamspec/agents/manifest.json' - the agent registry/manifest

---

## Step-by-Step Process

### Step 1: Read the Context

Read 'teamspec/knowledge/projects/<project>/context.md' thoroughly. Note:
- Project type and goals
- Tech stack
- Scale and complexity indicators
- Any explicit constraints

### Step 2: Read the Agent Manifest

Read 'teamspec/agents/manifest.json'. For each listed agent, note:
- **Name and role** - what the agent is designed to do
- **Specialties** - languages, frameworks, domains
- **Capabilities** - what it can do autonomously
- **Limitations** - what it cannot or should not do alone

### Step 3: Analyze the Project's Agent Needs

Map project requirements to agent capabilities. Ask:

${'`\`\`\`'}
┌─────────────────────────────────────────────────────┐
│           PROJECT AGENT NEED ANALYSIS              │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Context needs:                                    │
│  [ ] Frontend / UI layer                           │
│  [ ] Backend / API layer                           │
│  [ ] Database / Data layer                         │
│  [ ] DevOps / Infrastructure                       │
│  [ ] QA / Testing                                  │
│  [ ] Documentation                                 │
│  [ ] Architecture / Design                         │
│  [ ] Security review                               │
│  [ ] Performance / Optimization                    │
│  [ ] Other: _______________                        │
│                                                     │
│  Complexity signals:                               │
│  [ ] Multi-language project                        │
│  [ ] Real-time / event-driven                      │
│  [ ] Large-scale / distributed                     │
│  [ ] Heavy integration work                        │
│  [ ] Greenfield vs. brownfield                     │
│                                                     │
└─────────────────────────────────────────────────────┘
${'`\`\`\`'}

### Step 4: Recommend the Team

For each recommended agent, provide:
- **Agent name** (from the manifest)
- **Role on the team** - what it will own
- **Rationale** - why this agent is well-suited
- **Estimated contribution** - high / medium / low

Structure your recommendation:

${'`\`\`\`'}
## Agent Team Recommendation

### Team Size: [N agents]

| Agent          | Role                    | Rationale                          | Contribution |
|----------------|-------------------------|------------------------------------|--------------|
| agent-name-1   | [role]                  | [why this agent]                   | High         |
| agent-name-2   | [role]                  | [why this agent]                   | Medium       |
| ...            | ...                     | ...                                | ...          |

### Coordination Notes
- [Any ordering constraints - e.g., agent A must finish before agent B starts]
- [Any shared resources or interfaces]
- [Any agents that should collaborate closely]

### Excluded Agents
| Agent          | Reason                                  |
|----------------|-----------------------------------------|
| agent-name-x   | [why not needed for this project]       |

### Team Lead
Recommend which agent should act as the primary coordinator for this project.
${'`\`\`\`'}

### Step 5: Write the Team Artifact

Write the team recommendation to:
${'`\`\`\`'}
teamspec/knowledge/projects/<project>/team.md
${'`\`\`\`'}

Create the directory if it does not exist. Overwrite only if the user confirms.

### Step 6: Prompt Continuation

> "Team assembled. 'teamspec/knowledge/projects/<project>/team.md' is ready. Proceed to teamspec-plan to break down the work and define execution strategy?"

---

## Guardrails

- **Don't assign agents not in the manifest** - Only recommend agents listed in 'teamspec/agents/manifest.json'. If no suitable agent exists, note this gap and suggest what capability is missing.
- **Don't over-assign** - Resist the urge to bring in every agent. A lean team is easier to coordinate. Default to the minimum viable team.
- **Do consider complexity** - A small, simple project may only need 1–2 agents. Don't add overhead for projects that don't need it.
- **Do note coordination dependencies** - If agent B depends on agent A's output, say so explicitly.
- **Do flag capability gaps** - If the project requires something no agent can handle well, flag it for human review.`,
    license: 'MIT',
    compatibility: 'Requires teamspec workspace structure and agent manifest.',
    metadata: { author: 'teamspec', version: '1.0' },
  };
}
