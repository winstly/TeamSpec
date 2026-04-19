# TeamSpec

AI agent team collaboration framework for multi-agent software projects.

## What is TeamSpec?

TeamSpec is a CLI tool that scaffolds and orchestrates AI agent teams using a structured workflow: gather context, assemble agents, plan work, get approval, execute, validate, and reflect. It works with Claude Code, Cursor, Windsurf, and Gemini.

## Quick Start

```bash
npm install -g @winstly-ai/teamspec
teamspec init
```

After init, a guided workflow begins. Respond to prompts to gather project context, select an agent team, and produce an execution plan.

## Core Commands

| Command | Description |
|---|---|
| `teamspec init` | Initialize teamspec workspace in the current project |
| `teamspec update` | Refresh installed skills and commands |
| `teamspec status` | Show workspace status and installed tools |
| `teamspec config` | Manage global configuration (get, set, reset) |

## Workflows

TeamSpec provides seven structured workflows:

| Workflow | Description |
|---|---|
| context | Gather project context from user description and existing docs |
| recruit | Read the agent manifest and recommend a team |
| plan | Decompose work into tasks and choose an execution strategy |
| approve | Produce detailed task plans for review before execution |
| monitor | Coordinate agents during execution and track progress |
| qa | Validate completed work and produce a QA report |
| retro | Record lessons learned after completing a task or phase |

## Configuration

Global configuration is stored at `~/.config/teamspec/config.json` (Unix) or `%APPDATA%/teamspec/config.json` (Windows).

```bash
teamspec config get
teamspec config set delivery skills
teamspec config reset --all
```

## License

MIT
