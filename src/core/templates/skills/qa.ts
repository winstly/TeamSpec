/**
 * Skill Template: teamspec-qa
 *
 * Triggered when agents complete implementation and the project enters
 * the acceptance phase. Each agent self-tests; QA agent validates.
 */
import type { SkillTemplate } from '../../shared/command-generation/types.js';

export function getQASkillTemplate(): SkillTemplate {
  return {
    name: 'teamspec-qa',
    description:
      'Use when implementation is complete or near-complete and validation is needed before release.',
    instructions: `Enter QA mode. Implementation is complete or near-complete. Time to validate that everything works correctly before shipping.

---

## What You Receive

Input:
- 'teamspec/knowledge/projects/<project>/status.md' - final execution status
- 'teamspec/knowledge/projects/<project>/approvals.md' - original approved task plans
- 'teamspec/knowledge/projects/<project>/context.md' - project goals and requirements

---

## Step-by-Step Process

### Phase 1: Inventory Completed Work

Read 'status.md' and 'approvals.md'. Build a checklist of everything that was done:

${'`\`\`\`'}
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
${'`\`\`\`'}

### Phase 2: Agent Self-Testing

Each agent tests their own work before QA review. Prompt each agent:

> "For each task you completed, run the verification steps defined in your approval document. Report: test results, any failures, and any areas that need manual review."

For each agent, collect:
${'`\`\`\`'}
## Agent Self-Test Report: [agent-name]

### Task: [task name]
**Verification steps run**:
- [step 1]: [result - PASS/FAIL]
- [step 2]: [result - PASS/FAIL]

**Test artifacts**: [links to test outputs, screenshots, etc.]
**Defects found**: [list, if any]
**Self-assessed quality**: [High / Medium / Low]

### ...
${'`\`\`\`'}

### Phase 3: QA Agent Review

The QA agent (or lead agent acting in QA capacity) runs:

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
${'`\`\`\`'}
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
│  [ ] Race conditions tested                          │
│  [ ] Deadlocks considered                           │
│                                                      │
│  Security                                           │
│  [ ] Input sanitized                                │
│  [ ] No hardcoded secrets                           │
│                                                      │
└──────────────────────────────────────────────────────┘
${'`\`\`\`'}

### Phase 4: Defect Triage

All defects found are triaged:

${'`\`\`\`'}
## Defect Register

| #  | Defect                  | Severity | Owner     | Status | Resolution |
|----|-------------------------|----------|-----------|--------|------------|
| 1  | [description]          | Crit/Maj/Mif/Min | [agent] | OPEN | - |
| 2  | [description]          | Crit/Maj/Mif/Min | [agent] | OPEN | - |

Resolution values: `Fixed inline, re-verified` | `KICKED_BACK_TO_MONITOR` | `RESOLVED_AFTER_MONITOR` | `OPEN`
${'`\`\`\`'}

Critical and Major defects must be resolved before sign-off.

### Phase X: Fix Defects

After triaging defects, severity determines the fix path.

**Minor/Minimus — QA fixes inline:**
- Apply the fix directly
- Re-run verification for that defect
- Mark defect `RESOLVED` in the Defect Register with resolution note

**Major/Critical — Kick back to monitor:**
- Mark defect `KICKED_BACK_TO_MONITOR` in Defect Register
- Stop QA report generation
- Prompt user:
  > "Found [N] Major/Critical defect(s). These require agent rework. teamspec-monitor will be triggered to address the defect register. QA will re-run after fixes are complete."

- Exit the QA skill
- teamspec-monitor is triggered with the Defect Register context
- After fixes complete, teamspec-qa re-runs from the top

### Phase Y: Re-verify

(Only runs when Phase X completed with no Major/Critical defects.)

For each Minor/Minimus defect marked RESOLVED:
- Re-run verification to confirm the fix is effective
- Collect evidence (test output, screenshot, etc.)
- Update the Resolution column: `Fixed inline, re-verified`

Proceed to Phase 5.

### Phase 5: Produce QA Report

Write the formal QA report to:
${'`\`\`\`'}
teamspec/knowledge/projects/<project>/qa-report.md
${'`\`\`\`'}

Structure:
${'`\`\`\`'}
## QA Report: [Project Name]

**Date**: [date]
**QA Agent**: [name]
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

| #  | Defect                  | Severity | Owner   | Status       | Resolution |
|----|-------------------------|----------|---------|--------------|------------|
| 1  | ...                     | Major    | Agent A | KICKED_BACK_TO_MONITOR | Fix in progress |
| 2  | ...                     | Minor    | Agent B | RESOLVED | Fixed inline, re-verified |

---

## Release Recommendation

[ ] All Critical and Major defects resolved.
[ ] Integration tests passing.
[ ] Core requirements verified.
[ ] [Any conditions or caveats for conditional pass]

**Recommendation**: [APPROVE FOR RELEASE / REQUEST REVISION / HOLD]]
${'`\`\`\`'}

### Step 6: Prompt User for Sign-Off

> "QA complete. Review 'teamspec/knowledge/projects/<project>/qa-report.md'. Status: **[PASS / CONDITIONAL PASS / FAIL]**. [Summary]. [If CONDITIONAL PASS: Minor/Minimus defects fixed inline. Major/Critical defects kicked back to monitor — QA will re-run after fixes.] Proceed to release?"

---

## Guardrails

- **Don't skip self-testing** - Every agent must verify their own work before QA runs. Self-testing is not optional.
- **Don't paper over critical defects** - A Critical defect means "do not ship." Do not sign off with unresolved Critical defects.
- **Do distinguish severity honestly** - "Minor" doesn't mean "won't matter." Use good judgment.
- **Do verify against the context, not just the plan** - The plan implements the context. If the context had requirements the plan missed, those are gaps, not extras.
- **Do retest after fixes** - A defect marked "resolved" must be re-verified. Do not assume a fix works without evidence.`,
    license: 'MIT',
    compatibility: 'Requires teamspec workspace structure and completed status.md.',
    metadata: { author: 'teamspec', version: '1.0' },
  };
}
