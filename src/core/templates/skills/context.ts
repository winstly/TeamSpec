/**
 * Skill Template: teamspec-context
 *
 * Triggered when the user describes a project they want to build.
 * Deeply analyzes the project codebase, gathers context, and produces
 * a comprehensive context artifact.
 */
import type { SkillTemplate } from '../../shared/command-generation/types.js';

export function getContextSkillTemplate(): SkillTemplate {
  return {
    name: 'teamspec-context',
    description:
      'Deeply analyze a project to understand its engineering structure, requirements, and constraints. Use when the user describes a project or points to a project directory.',
    instructions: `Enter context-gathering mode. Your goal is to build a deep, grounded understanding of the project the user wants to work on.

**IMPORTANT: This skill is for understanding, not implementing.** Read files, analyze code, and produce a context artifact. Do not write application code.

**Input**: The user will describe a project or point to a directory. They may provide:
- A vague idea: "I want to build a real-time collaborative code editor"
- A detailed brief: a document describing goals, scope, or requirements
- A project directory path
- Just a project name or theme

If the input is ambiguous, use the **AskUserQuestion tool** to clarify:
- What is the core problem this project solves?
- Who are the primary users?
- Is there an existing codebase, or is this greenfield?

---

## Step-by-Step Process

### Step 1: Acknowledge and Clarify

Briefly acknowledge what you've understood. If anything is ambiguous, ask clarifying questions before proceeding.

### Step 2: Deep Codebase Analysis

If a project directory exists, perform a thorough analysis. Do NOT just scan for README files.

#### 2a. Directory Structure Map

Explore the full directory tree to understand project layout:
\`\`\`bash
# Get top-level structure
ls <project-dir>/

# Get recursive tree (depth 3-4)
# Use glob patterns to map key directories
\`\`\`

Identify:
- Source code directories and their organization (monorepo? feature-based? layer-based?)
- Configuration files at the root
- Test directories and their relationship to source
- Build/output directories
- Documentation locations

#### 2b. Technology Stack Detection

Check for stack indicators:
\`\`\`bash
# Package managers and dependencies
<project-dir>/package.json          # Node.js
<project-dir>/pyproject.toml        # Python
<project-dir>/Cargo.toml            # Rust
<project-dir>/go.mod                # Go
<project-dir>/pom.xml               # Java/Maven
<project-dir>/build.gradle          # Java/Gradle
<project-dir>/Gemfile               # Ruby
<project-dir>/requirements.txt      # Python (legacy)
<project-dir>/composer.json         # PHP
\`\`\`

Read the dependency file(s) and extract:
- Primary language and runtime
- Key frameworks (React, Express, FastAPI, Actix, etc.)
- Key libraries (ORM, testing, auth, etc.)
- Build tools and dev dependencies
- Version constraints

#### 2c. Configuration Analysis

Read key config files:
- TypeScript config: 'tsconfig.json' - target, strictness, path aliases
- Linter/formatter: '.eslintrc', 'prettier', 'ruff.toml' - code style conventions
- CI/CD: '.github/workflows/', 'Jenkinsfile', '.gitlab-ci.yml' - deployment pipeline
- Docker: 'Dockerfile', 'docker-compose.yml' - containerization approach
- Environment: '.env.example', 'config/' - configuration patterns

#### 2d. Source Code Pattern Discovery

Analyze the source code to understand architectural patterns:

1. **Entry points**: Find main files (index.ts, main.py, cmd/, app.ts)
2. **Module organization**: How is code grouped? By feature? By layer?
3. **Key abstractions**: Read 2-3 core files to understand the domain model
4. **Data flow**: How does data move through the system? (API -> Service -> DB?)
5. **External integrations**: What services/APIs does it connect to?
6. **Testing patterns**: Unit tests? Integration tests? E2E? What framework?
7. **Error handling patterns**: How are errors propagated and handled?

Read at least 3-5 key source files to ground your understanding in actual code, not just file names.

#### 2e. Dependency Graph

Understand internal dependencies:
- Which modules import from which?
- Are there circular dependency risks?
- What are the core modules that everything depends on?
- What are the leaf modules (depend on many, depended on by few)?

### Step 3: Scan Knowledge Base for Prior Context

Check for existing project knowledge:

\`\`\`bash
# Prior retros (lessons learned)
ls teamspec/knowledge/projects/<project>/retros/

# Prior decisions (architectural choices)
ls teamspec/knowledge/projects/<project>/decisions/

# Shared knowledge (cross-project patterns)
ls teamspec/knowledge/shared/retros/
\`\`\`

If prior retros or decisions exist:
- Read and summarize them in the context summary
- Flag any lessons that apply to the current request
- Note any prior decisions that constrain current choices

### Step 4: Synthesize a Comprehensive Context Summary

Using everything gathered, produce a structured context summary:

\`\`\`
## Project Context Summary

**Project Name**: [name]
**Type**: [web app / CLI tool / library / service / monorepo / etc.]
**Core Problem**: [what problem this solves for users]
**Target Users**: [who will use this]

---

## Tech Stack

**Language(s)**: [primary language + versions]
**Runtime**: [Node 20 / Python 3.12 / etc.]
**Framework(s)**: [React 18, Express 4, etc.]
**Key Libraries**: [top 5 most important dependencies]
**Database**: [Postgres / SQLite / none / etc.]
**Build Tool**: [Vite / Webpack / esbuild / etc.]
**Test Framework**: [Vitest / Jest / pytest / etc.]

---

## Architecture

**Pattern**: [MVC / Clean Architecture / Hexagonal / Layered / etc.]
**Entry Point(s)**: [main files and their roles]
**Module Structure**:
- [module-1]: [what it does, what it depends on]
- [module-2]: [what it does, what it depends on]
- ...

**Data Flow**:
[Describe how data moves through the system, e.g.:]
Request -> Router -> Controller -> Service -> Repository -> Database

**External Integrations**:
- [service-1]: [what for]
- [service-2]: [what for]

---

## Codebase Health

**Test Coverage**: [high / medium / low / none - evidence]
**Code Style**: [consistent / mixed / no enforcement]
**Documentation**: [comprehensive / sparse / none]
**CI/CD**: [present / absent / partial]
**Known Issues**: [any TODO/FIXME patterns found]

---

## Goals

- [Primary goal]
- [Secondary goals]

---

## Scope

- In scope: [what we are building]
- Out of scope: [what we are NOT building]

---

## Key Constraints

- [Technical constraints - performance, scale, compatibility]
- [Business constraints - budget, timeline, team size]
- [Architectural constraints - must integrate with X, must not break Y]

---

## Open Questions

- [Things to resolve in planning]
- [Assumptions that need validation]

---

## Prior Knowledge

[If retros/decisions exist, summarize relevant lessons here]
[If none, note "No prior project knowledge found"]
\`\`\`

### Step 5: Write the Context Artifact

Write the synthesized context to:
\`\`\`
teamspec/knowledge/projects/<project-name>/context.md
\`\`\`

Create the directory if it does not exist. Use a slug or reasonable identifier for '<project-name>' based on the user's description.

### Step 6: Prompt Continuation

After writing the context, offer to continue the workflow:

> "Context gathered and saved to 'teamspec/knowledge/projects/<project-name>/context.md'. Would you like to proceed with teamspec-team to assemble the agent team?"

Or, if the user prefers to review first:

> "The context summary is at 'teamspec/knowledge/projects/<project-name>/context.md'. Review it, and when you're ready, trigger teamspec-team to select agents for the team."

---

## Guardrails

- **Don't implement** - This is information gathering only. Produce artifacts, not code.
- **Don't overwrite without consent** - If context.md already exists, show the user the diff and ask before replacing.
- **Don't assume** - If the project description is vague, ask questions first rather than filling in gaps with guesses.
- **Don't skim the codebase** - Actually read files. A context based on file names alone is shallow and unreliable. Read package.json contents, read 3-5 source files, read config files.
- **Do be thorough** - Err on the side of capturing too much rather than too little. Context is the foundation for everything that follows.
- **Do use the codebase** - Ground your understanding in actual file contents, directory structure, imports, and code patterns. Not just what the user tells you.
- **Do normalize paths** - Use consistent directory naming. All paths in teamspec use forward slashes.

**Phase Navigation**

You can move between phases fluidly - you are NOT locked to a linear path:
- If context is incomplete during planning -> update 'context.md' and re-run teamspec-team
- If subsequent phases reveal gaps -> return here to update 'context.md', then re-enter the pipeline
- After fixing any phase -> continue from that point forward

DO NOT silently absorb problems into the current phase. If the source of the issue is upstream, flag it and offer to loop back.`,
    license: 'MIT',
    compatibility: 'Requires teamspec workspace structure.',
    metadata: { author: 'teamspec', version: '1.0' },
  };
}
