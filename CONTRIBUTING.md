# Contributing to TeamSpec

## Prerequisites

- Node.js >= 18
- npm

## Setup

```bash
git clone <repository-url>
npm install
npm run build
```

## Project Structure

```
src/
  cli/           CLI entry point and command definitions
  core/          Core logic: init, update, status, config, profiles
  prompts/       Interactive prompt utilities
  utils/         File system and interactive helpers
test/
  unit/          Unit tests (Vitest)
```

Key files:
- `src/core/init.ts` — workspace initialization
- `src/core/update.ts` — skill and command refresh
- `src/core/global-config.ts` — global configuration management
- `src/core/templates/skills/` — seven skill template definitions
- `src/core/shared/command-generation/` — multi-tool output adapters

## Commands

| Command | Description |
|---|---|
| `npm run build` | Compile TypeScript to `dist/` |
| `npm test` | Run all unit tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Run ESLint on `src/` |

## Code Style

No strict style guide. Run `npm run lint` and follow existing patterns.

## Submitting Changes

1. Fork the repository
2. Create a feature branch
3. Make changes; ensure `npm run build` and `npm test` pass
4. Open a pull request with a brief description
5. Ensure CI passes and no new lint errors are introduced
