/**
 * Skill Template: teamspec-retro
 *
 * Triggered at any stage by any agent (or the user) after completing work.
 * Records thinking, lessons learned, and experience for future reference.
 */
import type { SkillTemplate } from '../../shared/command-generation/types.js';

export function getRetroSkillTemplate(): SkillTemplate {
  return {
    name: 'teamspec-retro',
    description:
      'Use after completing a task, hitting a blocker, making a significant decision, or being asked to record thinking.',
    instructions: `Enter retro mode. You have just completed some work - a task, a phase, or a decision. Take a moment to reflect and capture what you learned.

**This skill can be triggered at any time, by any agent, or by the user.** It is informal and lightweight. Not every retro needs to produce a formal document.

---

## When to Trigger Retro

Trigger teamspec-retro when:

- You finish a task and want to capture what you learned
- You hit a blocker and want to record how you solved it (or didn't)
- You make an architectural decision and want to document the reasoning
- You discover something surprising about the project or codebase
- The user asks you to "record your thinking" after a session
- You want to reflect on a pattern that might apply to future tasks

You do NOT need to trigger retro for trivially routine tasks ("created a file", "fixed a typo"). Use judgment.

---

## What You Receive

Retro is usually triggered with minimal input:
- The current project context
- A brief description of what was just done
- Optionally: the user's specific question or prompt

If relevant, read:
- 'teamspec/knowledge/projects/<project>/status.md' - to understand where you are in the execution
- Recent artifacts from the current work session

---

## Step-by-Step Process

### Step 1: Reflect

Before writing, briefly think about:

**What happened?**
- What task or work did you complete?
- What was the approach you took?

**What went well?**
- Any technique, strategy, or tool choice that worked better than expected?
- Any assumption that proved correct?

**What was hard?**
- What took longer than expected?
- What was the biggest challenge?
- What would you do differently?

**What did you learn?**
- A pattern to reuse?
- A tool or technique to remember?
- A mistake to avoid?

**What questions remain?**
- Anything still unclear?
- Anything that needs further investigation?

### Step 2: Choose the Right Location

Decide where to write the retro based on its scope:

**Per-agent learning** (pattern, technique, lesson about doing work):
${'`\`\`\`'}
teamspec/knowledge/agents/<agent-name>/retros/[date]-[brief-title].md
${'`\`\`\`'}

**Per-project learning** (project-specific decision, blocker, insight):
${'`\`\`\`'}
teamspec/knowledge/projects/<project>/retros/[date]-[brief-title].md
${'`\`\`\`'}

**Shared knowledge** (pattern that applies to many projects):
${'`\`\`\`'}
teamspec/knowledge/shared/retros/[date]-[brief-title].md
${'`\`\`\`'}

**Architectural decision** (cross-project referenceable record):
${'`\`\`\`'}
teamspec/knowledge/projects/<project>/decisions/[date]-[brief-title].md
${'`\`\`\`'}

Default to the most specific appropriate location. A retro about a specific project's architecture belongs in the project folder. A retro about a debugging technique belongs in the agent folder.

### Step 3: Write the Retro

${'`\`\`\`'}
## Retro: [Brief Descriptive Title]

**Date**: [date]
**Agent**: [name]
**Project**: [project-name or "general"]
**Trigger**: [what prompted this retro - task completion / blocker / decision / user request]

---

## What I Did

[Brief description of the work completed]

---

## What Went Well

- [Something that worked well and why]
- [Any technique worth reusing]

---

## What Was Challenging

- [What was harder than expected and why]
- [What caused delays or friction]

---

## Key Learnings

- **[Pattern/Tech/Approach]**: [description of the lesson]
- **[Mistake to avoid]**: [what NOT to do next time]
- **[Tool to remember]**: [useful tool discovered]

---

## Open Questions

- [Anything still unclear or worth investigating]
- [Anything to follow up on]

---

## Related Artifacts

- [Links to any files, logs, or decisions related to this retro]
${'`\`\`\`'}

### Step 4: Be Concise - Less Is More

A good retro is:
- **Specific** - "I spent 2 hours debugging a race condition in the event queue" is better than "debugging is hard"
- **Actionable** - "Next time: add integration tests for event ordering" is better than "tests are important"
- **Short** - If it fits in 10 lines, write 10 lines. A 2-page retro means it wasn't focused enough.

### Step 5: Offer to Continue

After writing the retro:

> "Retro captured at 'teamspec/knowledge/agents/<agent-name>/retros/...' (or the appropriate path). [One sentence summary of key learning]. Ready to continue with [next task]?"

Or if triggered at phase end:

> "Phase complete. Retro recorded. Shall I proceed to the next phase?"

---

## Guardrails

- **Don't force formal artifacts for trivial lessons** - A 1-line note in the agent's retros folder is fine. "Used ripgrep -C 5 instead of grep -r - much faster for large codebases" is a valid retro.
- **Don't wait for perfection** - Retro is most valuable when written soon after the work is done. Write it now, even if it's rough.
- **Do be honest about failures** - A retro that only lists successes is self-congratulatory, not useful. Include what didn't work.
- **Do look for patterns** - If you find yourself writing the same retro twice, that's a sign you need a shared pattern doc, not more retros.
- **Do tag related retros** - If a new retro relates to an older one, link to it. Patterns emerge from connected retros over time.`,
    license: 'MIT',
    compatibility: 'Requires teamspec workspace structure.',
    metadata: { author: 'teamspec', version: '1.0' },
  };
}
