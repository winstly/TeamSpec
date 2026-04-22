import { describe, it, expect } from 'vitest';
import {
  SKILL_NAMES,
  COMMAND_IDS,
  extractGeneratedByVersion,
} from '../../src/core/shared/tool-detection.js';

describe('SKILL_NAMES', () => {
  it('should contain all 7 team spec skill names', () => {
    expect(SKILL_NAMES).toHaveLength(7);
    expect(SKILL_NAMES).toContain('teamspec-propose');
    expect(SKILL_NAMES).toContain('teamspec-context');
    expect(SKILL_NAMES).toContain('teamspec-team');
    expect(SKILL_NAMES).toContain('teamspec-plan');
    expect(SKILL_NAMES).toContain('teamspec-execute');
    expect(SKILL_NAMES).toContain('teamspec-verify');
    expect(SKILL_NAMES).toContain('teamspec-retro');
  });
});

describe('COMMAND_IDS', () => {
  it('should contain all 7 command IDs', () => {
    expect(COMMAND_IDS).toHaveLength(7);
    expect(COMMAND_IDS).toContain('propose');
    expect(COMMAND_IDS).toContain('context');
    expect(COMMAND_IDS).toContain('team');
    expect(COMMAND_IDS).toContain('plan');
    expect(COMMAND_IDS).toContain('execute');
    expect(COMMAND_IDS).toContain('verify');
    expect(COMMAND_IDS).toContain('retro');
  });

  it('should have same length as SKILL_NAMES', () => {
    expect(COMMAND_IDS.length).toBe(SKILL_NAMES.length);
  });
});

describe('extractGeneratedByVersion', () => {
  it('should return null for non-existent files', async () => {
    const result = extractGeneratedByVersion('/non/existent/path/SKILL.md');
    expect(result).toBeNull();
  });

  it('should return null when generatedBy is not present', async () => {
    const result = extractGeneratedByVersion(__filename); // Use this test file as a real file
    // This file doesn't have generatedBy in frontmatter, so it should return null
    expect(result).toBeNull();
  });
});
