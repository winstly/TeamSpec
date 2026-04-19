import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { writeFileSync, mkdirSync, rmSync, readFileSync } from 'fs';
import { join } from 'path';
import { readManifest, generateManifest } from '../../src/core/agents/manifest.js';
import { scanAgencyAgents } from '../../src/core/agents/scanner.js';

const { tmpdir } = await import('os');
const TEST_DIR = join(tmpdir(), 'manifest-test-' + Date.now());
const MANIFEST_PATH = join(TEST_DIR, 'manifest.json');

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

function writeAgent(name: string, description = 'A test agent', capabilities: string[] = []): void {
  const dir = join(TEST_DIR, 'agents', name);
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, 'agent.json'),
    JSON.stringify({ name, description, capabilities }),
    'utf-8'
  );
}

describe('generateManifest', () => {
  it('writes a valid manifest.json with correct structure', async () => {
    writeAgent('coder', 'Writes code', ['file-edit', 'refactor']);
    writeAgent('reviewer', 'Reviews code', ['lint', 'suggest']);

    const agentsDir = join(TEST_DIR, 'agents');
    await generateManifest(agentsDir, MANIFEST_PATH, '0.2.0');

    const content = readFileSync(MANIFEST_PATH, 'utf-8');
    const data = JSON.parse(content);

    expect(data.version).toBe('0.2.0');
    expect(typeof data.updatedAt).toBe('string');
    expect(data.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(data.agents).toHaveLength(2);

    const coder = data.agents.find((a: { name: string }) => a.name === 'coder');
    expect(coder).toBeDefined();
    expect(coder.description).toBe('Writes code');
    expect(coder.capabilities).toEqual(['file-edit', 'refactor']);
  });

  it('writes empty agents array when no agents found', async () => {
    const emptyDir = join(TEST_DIR, 'empty-agents');
    mkdirSync(emptyDir);
    const manifestPath = join(TEST_DIR, 'empty-manifest.json');

    await generateManifest(emptyDir, manifestPath, '1.0.0');

    const content = readFileSync(manifestPath, 'utf-8');
    const data = JSON.parse(content);
    expect(data.agents).toEqual([]);
    expect(data.version).toBe('1.0.0');
  });

  it('appends a trailing newline', async () => {
    writeAgent('newline-test');
    const agentsDir = join(TEST_DIR, 'agents');
    await generateManifest(agentsDir, MANIFEST_PATH, '1.0.0');

    const content = readFileSync(MANIFEST_PATH, 'utf-8');
    expect(content.endsWith('\n')).toBe(true);
  });
});

describe('readManifest', () => {
  it('returns parsed manifest data for a valid file', () => {
    const manifestContent = {
      version: '1.5.0',
      updatedAt: '2025-01-15T10:00:00.000Z',
      agents: [
        { name: 'planner', description: 'Plans tasks', capabilities: ['plan'], path: '/a/b/planner' },
      ],
    };
    writeFileSync(MANIFEST_PATH, JSON.stringify(manifestContent), 'utf-8');

    const result = readManifest(MANIFEST_PATH);
    expect(result).not.toBeNull();
    expect(result!.version).toBe('1.5.0');
    expect(result!.updatedAt).toBe('2025-01-15T10:00:00.000Z');
    expect(result!.agents).toHaveLength(1);
    expect(result!.agents[0].name).toBe('planner');
  });

  it('returns null for non-existent file', () => {
    const result = readManifest(join(TEST_DIR, 'does-not-exist.json'));
    expect(result).toBeNull();
  });

  it('returns null for invalid JSON', () => {
    writeFileSync(MANIFEST_PATH, 'not json {{{', 'utf-8');
    const result = readManifest(MANIFEST_PATH);
    expect(result).toBeNull();
  });

  it('returns null for manifest missing required fields', () => {
    writeFileSync(MANIFEST_PATH, JSON.stringify({ version: '1.0.0' }), 'utf-8');
    const result = readManifest(MANIFEST_PATH);
    expect(result).toBeNull();
  });

  it('returns null for manifest with wrong field types', () => {
    writeFileSync(
      MANIFEST_PATH,
      JSON.stringify({ version: 1, updatedAt: 123, agents: 'not array' }),
      'utf-8'
    );
    const result = readManifest(MANIFEST_PATH);
    expect(result).toBeNull();
  });

  it('round-trips: generateManifest then readManifest', async () => {
    const roundTripDir = join(TEST_DIR, 'roundtrip');
    mkdirSync(roundTripDir, { recursive: true });
    const agentDir = join(roundTripDir, 'agents');
    mkdirSync(join(agentDir, 'roundtrip'), { recursive: true });
    writeFileSync(
      join(agentDir, 'roundtrip', 'agent.json'),
      JSON.stringify({ name: 'roundtrip', description: 'Testing round-trip', capabilities: ['cap-a', 'cap-b'] }),
      'utf-8'
    );
    const path = join(roundTripDir, 'roundtrip-manifest.json');

    await generateManifest(agentDir, path, '0.9.0');
    const result = readManifest(path);

    expect(result).not.toBeNull();
    expect(result!.version).toBe('0.9.0');
    expect(result!.agents).toHaveLength(1);
    expect(result!.agents[0].name).toBe('roundtrip');
    expect(result!.agents[0].capabilities).toEqual(['cap-a', 'cap-b']);
  });
});
