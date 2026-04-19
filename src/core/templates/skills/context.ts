/**
 * Skill Template: teamspec-context
 *
 * Triggered when the user describes a project they want to build.
 * Gathers context by reading user-provided descriptions and project docs.
 */
import type { SkillTemplate } from '../../shared/command-generation/types.js';

export function getContextSkillTemplate(): SkillTemplate {
  return {
    name: 'teamspec-context',
    description:
      'Use when the user describes a project they want to build or points to a project directory.',
    instructions: `Enter context-gathering mode. Your goal is to build a thorough understanding of the project the user wants to work on.

**IMPORTANT: This skill is for understanding, not implementing.** Read files, synthesize information, and produce a context artifact. Do not write application code.

---

## What You Receive

The user will provide a natural-language description of the project they want to build. It may be:
- A vague idea: "I want to build a real-time collaborative code editor"
- A detailed brief: a paragraph or document describing goals, scope, or requirements
- Just a project name or theme

You may also receive the path to a project directory.

---

## Step-by-Step Process

### Step 1: Acknowledge and Clarify

Briefly acknowledge what you've understood. If anything is ambiguous, ask one or two clarifying questions before proceeding. Key things to clarify if missing:
- What is the core problem this project solves?
- Who are the primary users?
- Is there an existing codebase, or is this greenfield?

### Step 2: Scan for Existing Documentation

If the user pointed to a project directory, or if a working directory is available, scan for existing documentation:

${'"\`\`\`"'}bash
# Look for common documentation files
ls <project-dir>/README.md
ls <project-dir>/docs/
ls <project-dir>/ARCHITECTURE.md
ls <project-dir>/SPEC.md
ls <project-dir>/package.json
ls <project-dir>/pyproject.toml
ls <project-dir>/Cargo.toml
${'"\`\`\`"'}

Read any relevant files you find:
- README.md - project overview, getting started
- ARCHITECTURE.md or docs/ - architecture and design decisions
- SPEC.md - specification documents
- package.json / pyproject.toml / Cargo.toml - technology stack clues

### Step 3: Synthesize a Project Context Summary

Using everything gathered, produce a structured context summary covering:

${'"\`\`\`"'}
## Project Background Summary

**Project Name**: [name if known]
**Type**: [web app / CLI tool / library / service / etc.]
**Core Problem**: [what problem does this solve for users]
**Target Users**: [who will use this]
**Tech Stack** (if known): [languages, frameworks, key libraries]
**Existing Codebase**: [yes/no - path if yes]

### Goals
- [Primary goal]
- [Secondary goals]

### Scope (Initial)
- [What's in scope]
- [What's explicitly out of scope]

### Key Constraints
- [Technical constraints - performance, scale, compat]
- [Business constraints - budget, timeline, team size]

### Open Questions
- [Things to resolve in planning]
- [Assumptions that need validation]
${'"\`\`\`"'}

### Step 4: Write the Context Artifact

Write the synthesized context to:
${'"\`\`\`"'}
teamspec/knowledge/projects/<project-name>/context.md
${'"\`\`\`"'}

Create the directory if it does not exist. Use a slug or reasonable identifier for '<project-name>' based on the user's description.

### Step 5: Prompt Continuation

After writing the context, offer to continue the workflow:

> "Context gathered and saved. Would you like to proceed with teamspec-recruit to assemble the agent team?"

Or, if the user prefers to review first:

> "The context summary is at 'teamspec/knowledge/projects/<project-name>/context.md'. Review it, and when you're ready, trigger teamspec-recruit to select agents for the team."

---

## Guardrails

- **Don't implement** - This is information gathering only. Produce artifacts, not code.
- **Don't overwrite without consent** - If context.md already exists, show the user the diff and ask before replacing.
- **Don't assume** - If the project description is vague, ask questions first rather than filling in gaps with guesses.
- **Do be thorough** - Err on the side of capturing too much rather than too little. Context is the foundation for everything that follows.
- **Do use the codebase** - When relevant, ground your understanding in actual file contents, not just the user's description.
- **Do normalize paths** - Use consistent directory naming. All paths in teamspec use forward slashes.`,
    license: 'MIT',
    compatibility: 'Requires teamspec workspace structure.',
    metadata: { author: 'teamspec', version: '1.0' },
  };
}
