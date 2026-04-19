import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import {
  scanAgencyAgents,
  getAgencyAgentsPath,
  type AgentInfo,
  type ScanResult,
} from '../../src/core/agents/scanner.js';

const { tmpdir } = await import('os');
const TEST_DIR = join(tmpdir(), 'scanner-test-' + Date.now());

beforeAll(() => {
  mkdirSync(TEST_DIR, { recursive: true });
});

afterAll(() => {
  try {
    rmSync(TEST_DIR, { recursive: true });
  } catch {
    // ignore cleanup errors
  }
});

function agentDir(name: string): string {
  return join(TEST_DIR, name);
}

function touch(path: string, content: string): void {
  mkdirSync(join(path, '..'), { recursive: true });
  writeFileSync(path, content, 'utf-8');
}

describe('scanAgencyAgents', () => {
  it('returns empty result for non-existent directory', () => {
    const result = scanAgencyAgents(join(TEST_DIR, 'non-existent'));
    expect(result.agents).toEqual([]);
    expect(result.scannedPaths).toContain(join(TEST_DIR, 'non-existent'));
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].error).toBe('Directory does not exist');
  });

  it('returns empty agents list for empty directory', () => {
    const emptyDir = join(TEST_DIR, 'empty');
    mkdirSync(emptyDir);
    const result = scanAgencyAgents(emptyDir);
    expect(result.agents).toEqual([]);
    expect(result.errors).toHaveLength(0);
  });

  it('parses agent.json with name, description, capabilities', () => {
    const dir = agentDir('coder-agent');
    mkdirSync(dir);
    writeFileSync(
      join(dir, 'agent.json'),
      JSON.stringify({
        name: 'Coder',
        description: 'Writes and edits code',
        capabilities: ['file-edit', 'code-search', 'refactor'],
      }),
      'utf-8'
    );

    const result = scanAgencyAgents(TEST_DIR);
    const agent = result.agents.find((a) => a.name === 'Coder');
    expect(agent).toBeDefined();
    expect(agent!.description).toBe('Writes and edits code');
    expect(agent!.capabilities).toEqual(['file-edit', 'code-search', 'refactor']);
    expect(agent!.path).toBe(dir);
  });

  it('parses agent.json with minimal fields', () => {
    const dir = agentDir('minimal-agent');
    mkdirSync(dir);
    writeFileSync(join(dir, 'agent.json'), '{"name": "Minimal"}', 'utf-8');

    const result = scanAgencyAgents(TEST_DIR);
    const agent = result.agents.find((a) => a.name === 'Minimal');
    expect(agent).toBeDefined();
    expect(agent!.description).toBe('');
    expect(agent!.capabilities).toEqual([]);
  });

  it('falls back to README.md when agent.json is absent', () => {
    const dir = agentDir('readme-agent');
    mkdirSync(dir);
    writeFileSync(
      join(dir, 'README.md'),
      '# Review Agent\n\nReviews code for bugs and style issues.\n',
      'utf-8'
    );

    const result = scanAgencyAgents(TEST_DIR);
    const agent = result.agents.find((a) => a.name === 'Review Agent');
    expect(agent).toBeDefined();
    expect(agent!.description).toContain('Reviews code for bugs');
  });

  it('returns minimal entry when no metadata file is present', () => {
    const dir = agentDir('bare-agent');
    mkdirSync(dir);

    const result = scanAgencyAgents(TEST_DIR);
    const agent = result.agents.find((a) => a.name === 'bare-agent');
    expect(agent).toBeDefined();
    expect(agent!.capabilities).toEqual([]);
  });

  it('handles invalid JSON gracefully and continues scanning', () => {
    const dir1 = agentDir('valid-agent');
    const dir2 = agentDir('bad-agent');
    mkdirSync(dir1);
    mkdirSync(dir2);
    writeFileSync(join(dir1, 'agent.json'), JSON.stringify({ name: 'Valid' }), 'utf-8');
    writeFileSync(join(dir2, 'agent.json'), 'not valid json {{{', 'utf-8');

    const result = scanAgencyAgents(TEST_DIR);
    expect(result.agents.find((a) => a.name === 'Valid')).toBeDefined();
    // bad-agent should fall back to dir-name-based entry
    expect(result.agents.find((a) => a.name === 'bad-agent')).toBeDefined();
  });

  it('skips files in the root of the scanned directory', () => {
    mkdirSync(TEST_DIR, { recursive: true });
    writeFileSync(join(TEST_DIR, 'root-file.json'), '{"name": "ShouldNotAppear"}', 'utf-8');

    const result = scanAgencyAgents(TEST_DIR);
    expect(result.agents.find((a) => a.name === 'ShouldNotAppear')).toBeUndefined();
  });
});

describe('getAgencyAgentsPath', () => {
  it('returns the correct path structure', () => {
    const result = getAgencyAgentsPath('/project', 'claude');
    expect(result.replace(/\\/g, '/')).toBe('/project/.claude/agents/agency-agents');
  });

  it('handles paths with separators', () => {
    const result = getAgencyAgentsPath('C:\\Users\\dev', 'claude');
    const normalized = result.replace(/\\/g, '/');
    expect(normalized).toContain('.claude/agents/agency-agents');
  });
});
