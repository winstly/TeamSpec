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

  it('ignores directories without metadata files or agent .md files', () => {
    const dir = agentDir('bare-directory');
    mkdirSync(dir);

    const result = scanAgencyAgents(TEST_DIR);
    const agent = result.agents.find((a) => a.name === 'bare-directory');
    expect(agent).toBeUndefined();
  });

  it('handles invalid JSON gracefully and continues scanning', () => {
    const dir1 = agentDir('valid-agent');
    const dir2 = agentDir('bad-json-dir');
    mkdirSync(dir1);
    mkdirSync(dir2);
    writeFileSync(join(dir1, 'agent.json'), JSON.stringify({ name: 'Valid' }), 'utf-8');
    writeFileSync(join(dir2, 'agent.json'), 'not valid json {{{', 'utf-8');

    const result = scanAgencyAgents(TEST_DIR);
    expect(result.agents.find((a) => a.name === 'Valid')).toBeDefined();
    // bad-json-dir has invalid agent.json and no .md files — it is skipped
    expect(result.agents.find((a) => a.name === 'bad-json-dir')).toBeUndefined();
  });

  it('skips files in the root of the scanned directory', () => {
    mkdirSync(TEST_DIR, { recursive: true });
    writeFileSync(join(TEST_DIR, 'root-file.json'), '{"name": "ShouldNotAppear"}', 'utf-8');

    const result = scanAgencyAgents(TEST_DIR);
    expect(result.agents.find((a) => a.name === 'ShouldNotAppear')).toBeUndefined();
  });

  // ── Nested / category directory tests ──

  it('scans category directories containing .md agent files', () => {
    const categoryDir = agentDir('engineering');
    mkdirSync(categoryDir);
    writeFileSync(
      join(categoryDir, 'engineering-frontend-developer.md'),
      [
        '---',
        'name: Frontend Developer',
        'description: React/Vue/Angular specialist',
        'color: cyan',
        '---',
        '',
        '# Frontend Developer',
        '',
        'Builds modern web applications.',
      ].join('\n'),
      'utf-8'
    );
    writeFileSync(
      join(categoryDir, 'engineering-backend-architect.md'),
      [
        '---',
        'name: Backend Architect',
        'description: API design and scalability expert',
        '---',
        '',
        '# Backend Architect',
      ].join('\n'),
      'utf-8'
    );

    const result = scanAgencyAgents(TEST_DIR);
    const frontend = result.agents.find((a) => a.name === 'Frontend Developer');
    const backend = result.agents.find((a) => a.name === 'Backend Architect');
    expect(frontend).toBeDefined();
    expect(frontend!.description).toBe('React/Vue/Angular specialist');
    expect(backend).toBeDefined();
    expect(backend!.description).toBe('API design and scalability expert');
  });

  it('scans multiple category directories in the same repo', () => {
    const designDir = agentDir('design');
    const productDir = agentDir('product');
    mkdirSync(designDir);
    mkdirSync(productDir);
    writeFileSync(
      join(designDir, 'design-ui-designer.md'),
      [
        '---',
        'name: UI Designer',
        'description: Visual design expert',
        '---',
      ].join('\n'),
      'utf-8'
    );
    writeFileSync(
      join(productDir, 'product-manager.md'),
      [
        '---',
        'name: Product Manager',
        'description: Full lifecycle product ownership',
        '---',
      ].join('\n'),
      'utf-8'
    );

    const result = scanAgencyAgents(TEST_DIR);
    const ui = result.agents.find((a) => a.name === 'UI Designer');
    const pm = result.agents.find((a) => a.name === 'Product Manager');
    expect(ui).toBeDefined();
    expect(pm).toBeDefined();
  });

  it('falls back to filename for .md files without frontmatter', () => {
    const categoryDir = agentDir('testing');
    mkdirSync(categoryDir);
    writeFileSync(
      join(categoryDir, 'testing-api-tester.md'),
      '# API Tester\n\nValidates API endpoints.\n',
      'utf-8'
    );

    const result = scanAgencyAgents(TEST_DIR);
    const agent = result.agents.find((a) => a.name === 'API Tester');
    expect(agent).toBeDefined();
    expect(agent!.description).toContain('Validates API endpoints');
  });

  it('skips .git, .github, scripts directories in the root', () => {
    const gitDir = agentDir('.git');
    const githubDir = agentDir('.github');
    const scriptsDir = agentDir('scripts');
    mkdirSync(gitDir);
    mkdirSync(githubDir);
    mkdirSync(scriptsDir);
    writeFileSync(join(gitDir, 'some-git-file'), 'git data', 'utf-8');

    const result = scanAgencyAgents(TEST_DIR);
    expect(result.agents.find((a) => a.name === '.git')).toBeUndefined();
    expect(result.agents.find((a) => a.name === '.github')).toBeUndefined();
    expect(result.agents.find((a) => a.name === 'scripts')).toBeUndefined();
  });

  it('parses agent .md with capabilities from frontmatter', () => {
    const categoryDir = agentDir('specialized');
    mkdirSync(categoryDir);
    writeFileSync(
      join(categoryDir, 'mcp-builder.md'),
      [
        '---',
        'name: MCP Builder',
        'description: Builds MCP servers for AI agent tooling',
        'color: blue',
        'emoji: 🔌',
        'vibe: Systematic server architect',
        '---',
        '',
        '# MCP Builder',
      ].join('\n'),
      'utf-8'
    );

    const result = scanAgencyAgents(TEST_DIR);
    const agent = result.agents.find((a) => a.name === 'MCP Builder');
    expect(agent).toBeDefined();
    expect(agent!.description).toBe('Builds MCP servers for AI agent tooling');
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
