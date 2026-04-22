/**
 * Skill Template: teamspec-verify
 *
 * Triggered when agents complete implementation and the project enters
 * the acceptance phase. Each agent self-tests; verification agent validates.
 */
import type { SkillTemplate } from '../../shared/command-generation/types.js';

export function getVerifySkillTemplate(): SkillTemplate {
  return {
    name: 'teamspec-verify',
    description:
      'Verify implementation is complete, correct, and coherent before release. Use when implementation is done or near-complete.',
    instructions: `Enter verification mode. Implementation is complete or near-complete. Time to validate that everything works correctly before shipping.

**Input**: Optionally specify a project name. If omitted:
- Infer from conversation context if the user mentioned a project
- Auto-select if only one active project exists
- If ambiguous, list available projects and use the **AskUserQuestion tool** to let the user select

Always announce: "Verifying project: <name>"

---

## What You Receive

Input:
- 'teamspec/knowledge/projects/<project>/status.md' - final execution status
- 'teamspec/knowledge/projects/<project>/plan.md' - original plan with tasks
- 'teamspec/knowledge/projects/<project>/context.md' - project goals and requirements

---

## Step-by-Step Process

### Phase 1: Inventory Completed Work

Read 'status.md' and 'plan.md'. Build a checklist of everything that was done:

\`\`\`
COMPLETION INVENTORY
═══════════════════════

| Task                  | Owner      | Status      | Verification Evidence |
|-----------------------|------------|-------------|-----------------------|
| [task 1]              | Agent A    | DONE        | [test output, etc.]   |
| [task 2]              | Agent A    | DONE        | [test output, etc.]   |
| [task 3]              | Agent B    | DONE        | [test output, etc.]   |
| [task 4]              | Agent B    | INCOMPLETE  | [reason]              |

### Tasks Missing Verification
- [task N]: [reason not verified]
\`\`\`

### Phase 2: Agent Self-Testing

Each agent tests their own work before verification review. Prompt each agent:

> "For each task you completed, run the verification steps defined in your plan. Report: test results, any failures, and any areas that need manual review."

For each agent, collect:
\`\`\`
## Agent Self-Test Report: [agent-name]

### Task: [task name]
**Verification steps run**:
- [step 1]: [result - PASS/FAIL]
- [step 2]: [result - PASS/FAIL]

**Test artifacts**: [links to test outputs, screenshots, etc.]
**Defects found**: [list, if any]
**Self-assessed quality**: [High / Medium / Low]

### ...
\`\`\`

### Phase 3: Verification Review

#### 3a. Integration Test
Verify all agents' work integrates correctly:
- Shared interfaces work end-to-end
- Data flows correctly between components
- No missing dependencies

#### 3b. Smoke Test
Run the full system at a basic level:
- Does it start?
- Does the happy path work?
- Are there obvious runtime errors?

#### 3c. Regression Check
Compare against context.md requirements:
- Does the implementation match the stated goals?
- Are all "in scope" items actually delivered?
- Are any "out of scope" items accidentally included?

#### 3d. Edge Case Audit
For each work stream, identify and test critical edge cases:
\`\`\`
┌──────────────────────────────────────────────────────┐
│           EDGE CASE AUDIT CHECKLIST                  │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Input Validation                                   │
│  [ ] Empty input handled gracefully                 │
│  [ ] Invalid input produces clear errors            │
│  [ ] Boundary values handled correctly              │
│                                                      │
│  Error Handling                                     │
│  [ ] Network failures handled                       │
│  [ ] File not found handled                         │
│  [ ] Permissions errors surfaced                    │
│                                                      │
│  Concurrency (if applicable)                        │
│  [ ] Race conditions tested                         │
│  [ ] Deadlocks considered                           │
│                                                      │
│  Security                                           │
│  [ ] Input sanitized                                │
│  [ ] No hardcoded secrets                           │
│                                                      │
└──────────────────────────────────────────────────────┘
\`\`\`

### Phase 4: Defect Triage

All defects found are triaged:

\`\`\`
## Defect Register

| #  | Defect                  | Severity         | Owner   | Status | Resolution |
|----|-------------------------|------------------|---------|--------|------------|
| 1  | [description]           | Crit/Maj/Min     | [agent] | OPEN   | -          |
| 2  | [description]           | Crit/Maj/Min     | [agent] | OPEN   | -          |

Resolution values: Fixed inline | KICKED_BACK_TO_EXECUTE | OPEN
\`\`\`

Critical and Major defects must be resolved before sign-off.

### Phase 5: Fix Defects

After triaging defects, severity determines the fix path.

**Minor - Verify fixes inline:**
- Apply the fix directly
- Re-run verification for that defect
- Mark defect RESOLVED in the Defect Register

**Major/Critical - Kick back to execute:**
- Mark defect KICKED_BACK_TO_EXECUTE in Defect Register
- Stop verification report generation
- Prompt user:
  > "Found [N] Major/Critical defect(s). These require agent rework. teamspec-execute will be triggered to address the defect register. Verification will re-run after fixes are complete."
- Exit the verify skill
- teamspec-execute is triggered with the Defect Register context
- After fixes complete, teamspec-verify re-runs from the top

### Phase 6: Produce Verification Report

Write the formal report to:
\`\`\`
teamspec/knowledge/projects/<project>/verify-report.md
\`\`\`

Structure:
\`\`\`
## Verification Report: [Project Name]

**Date**: [date]
**Status**: [PASS / CONDITIONAL PASS / FAIL]

---

## Summary

[One-paragraph summary of overall quality and readiness]

---

## Self-Test Results

[Per-agent results table]

---

## Integration Test Results

| Test                          | Result |
|-------------------------------|--------|
| [integration test name]       | PASS   |
| [integration test name]       | FAIL   |

---

## Regression Check

| Requirement (from context.md) | Delivered | Notes |
|------------------------------|-----------|-------|
| [requirement 1]              | Yes       | ...   |
| [requirement 2]              | Partial   | ...   |

---

## Defect Register

| #  | Defect                  | Severity | Owner   | Status                | Resolution            |
|----|-------------------------|----------|---------|-----------------------|-----------------------|
| 1  | ...                     | Major    | Agent A | KICKED_BACK_TO_EXECUTE| Fix in progress       |
| 2  | ...                     | Minor    | Agent B | RESOLVED              | Fixed inline          |

---

## Release Recommendation

[ ] All Critical and Major defects resolved.
[ ] Integration tests passing.
[ ] Core requirements verified.

**Recommendation**: [APPROVE FOR RELEASE / REQUEST REVISION / HOLD]
\`\`\`

### Phase 7: Prompt User for Sign-Off

> "Verification complete. Review 'teamspec/knowledge/projects/<project>/verify-report.md'. Status: [PASS / CONDITIONAL PASS / FAIL]. [Summary]. Proceed to release?"

---

## Guardrails

- **Don't skip self-testing** - Every agent must verify their own work before review runs. Self-testing is not optional.
- **Don't paper over critical defects** - A Critical defect means "do not ship." Do not sign off with unresolved Critical defects.
- **Do distinguish severity honestly** - "Minor" doesn't mean "won't matter." Use good judgment.
- **Do verify against the context, not just the plan** - The plan implements the context. If the context had requirements the plan missed, those are gaps, not extras.
- **Do retest after fixes** - A defect marked "resolved" must be re-verified. Do not assume a fix works without evidence.

## Auto-Retro Trigger

After user signs off (PASS or CONDITIONAL PASS), IMMEDIATELY trigger teamspec-retro:
1. Create a project-level retro at 'teamspec/knowledge/projects/<project>/retros/<date>-post-verify.md'
2. Capture: what was built vs. original scope, blockers encountered, recommendations for next iteration
3. Then continue to release/ship the work

**Phase Navigation**

You can move between phases fluidly - you are NOT locked to a linear path:
- If verification reveals implementation issues -> kick back to teamspec-execute for rework
- If verification reveals plan gaps -> update 'plan.md' and re-run teamspec-plan
- If verification reveals context gaps -> update 'context.md' and re-run teamspec-context
- After fixing any phase -> continue from that point forward

DO NOT silently absorb problems into the current phase. If the source of the issue is upstream, flag it and offer to loop back.`,
    license: 'MIT',
    compatibility: 'Requires teamspec workspace structure and completed status.md.',
    metadata: { author: 'teamspec', version: '1.0' },
  };
}
