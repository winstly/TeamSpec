import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, readFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { initKnowledgeBase } from '../../src/core/knowledge/base.js';

describe('KnowledgeBase', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(__dirname, 'kb-test-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('should create knowledge base directory structure', () => {
    initKnowledgeBase({
      projectPath: tempDir,
      projectName: 'test-project',
      manifestPath: join(tempDir, 'teamspec', 'agents', 'manifest.json'),
    });

    expect(existsSync(join(tempDir, 'teamspec'))).toBe(true);
    expect(existsSync(join(tempDir, 'teamspec', 'knowledge'))).toBe(true);
    expect(existsSync(join(tempDir, 'teamspec', 'knowledge', 'README.md'))).toBe(true);
    expect(existsSync(join(tempDir, 'teamspec', 'knowledge', 'templates'))).toBe(true);
    expect(existsSync(join(tempDir, 'teamspec', 'knowledge', 'agents'))).toBe(true);
    expect(existsSync(join(tempDir, 'teamspec', 'knowledge', 'projects'))).toBe(true);
    expect(existsSync(join(tempDir, 'teamspec', 'knowledge', 'projects', 'test-project'))).toBe(true);
    expect(existsSync(join(tempDir, 'teamspec', 'knowledge', 'projects', 'test-project', 'retro'))).toBe(true);
    expect(existsSync(join(tempDir, 'teamspec', 'agents'))).toBe(true);
  });

  it('should write project config', () => {
    initKnowledgeBase({
      projectPath: tempDir,
      projectName: 'my-project',
      manifestPath: join(tempDir, 'manifest.json'),
    });

    const config = readFileSync(join(tempDir, 'teamspec', 'config.yaml'), 'utf-8');
    expect(config).toContain('schema: teamspec');
    expect(config).toContain('my-project');
  });

  it('should write knowledge base README', () => {
    initKnowledgeBase({
      projectPath: tempDir,
      projectName: 'test-project',
      manifestPath: join(tempDir, 'manifest.json'),
    });

    const readme = readFileSync(join(tempDir, 'teamspec', 'knowledge', 'README.md'), 'utf-8');
    expect(readme).toContain('TeamSpec Knowledge Base');
    expect(readme).toContain('[agents/](agents/)');
    expect(readme).toContain('[projects/](projects/)');
    expect(readme).toContain('[templates/](templates/)');
  });

  it('should write agent and project retro templates', () => {
    initKnowledgeBase({
      projectPath: tempDir,
      projectName: 'test-project',
      manifestPath: join(tempDir, 'manifest.json'),
    });

    const agentRetro = readFileSync(join(tempDir, 'teamspec', 'knowledge', 'templates', 'agent-retro.md'), 'utf-8');
    expect(agentRetro).toContain('type: agent-retro');
    expect(agentRetro).toContain('## 角色反思');

    const projectRetro = readFileSync(join(tempDir, 'teamspec', 'knowledge', 'templates', 'project-retro.md'), 'utf-8');
    expect(projectRetro).toContain('type: project-retro');
    expect(projectRetro).toContain('## 项目总结');
  });

  it('should write agent manifest', () => {
    const manifestPath = join(tempDir, 'teamspec', 'agents', 'manifest.json');
    initKnowledgeBase({
      projectPath: tempDir,
      projectName: 'test-project',
      manifestPath,
    });

    const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
    expect(manifest).toHaveProperty('agents');
    expect(manifest).toHaveProperty('projectName', 'test-project');
    expect(Array.isArray(manifest.agents)).toBe(true);
  });
});
