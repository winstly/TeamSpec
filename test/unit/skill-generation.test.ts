import { describe, it, expect } from 'vitest';
import {
  getSkillTemplates,
  getCommandTemplates,
  getCommandContents,
  generateSkillContent,
} from '../../src/core/shared/skill-generation.js';
import {
  CommandAdapterRegistry,
  SkillAdapterRegistry,
  generateCommand,
  generateCommands,
  generateSkill,
  generateSkills,
  claudeCommandAdapter,
  cursorCommandAdapter,
  windsurfCommandAdapter,
  geminiCommandAdapter,
  claudeSkillAdapter,
  cursorSkillAdapter,
  windsurfSkillAdapter,
  geminiSkillAdapter,
} from '../../src/core/shared/command-generation/index.js';
import type { CommandContent, SkillContent } from '../../src/core/shared/command-generation/types.js';

describe('skill-generation', () => {
  it('getSkillTemplates returns all 7 skill templates by default', () => {
    const result = getSkillTemplates();
    expect(result).toHaveLength(7);
    expect(result.map(r => r.name)).toContain('teamspec-propose');
    expect(result.map(r => r.name)).toContain('teamspec-context');
    expect(result.map(r => r.name)).toContain('teamspec-retro');
  });

  it('getSkillTemplates filters by workflow IDs', () => {
    const result = getSkillTemplates(['context']);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('teamspec-context');
  });

  it('getCommandTemplates returns empty array', () => {
    expect(getCommandTemplates()).toEqual([]);
  });

  it('getCommandContents returns empty array', () => {
    expect(getCommandContents()).toEqual([]);
  });

  describe('generateSkillContent', () => {
    it('produces valid YAML frontmatter with defaults', () => {
      const input: SkillContent = {
        id: 'teamspec-context',
        name: 'TeamSpec Context',
        description: 'Reads team context from SPEC.md and documents',
        instructions: 'You are a helpful assistant.',
      };
      const result = generateSkillContent(input, '0.1.0');

      expect(result).toContain('---');
      expect(result).toContain('name: TeamSpec Context');
      expect(result).toContain('description: Reads team context from SPEC.md and documents');
      expect(result).toContain('license: MIT');
      expect(result).toContain('compatibility: Requires teamspec CLI.');
      expect(result).toContain('version: "1.0"');
      expect(result).toContain('generatedBy: "0.1.0"');
      expect(result).toContain('You are a helpful assistant.');
    });

    it('escapes YAML-special characters in name and description', () => {
      const input: SkillContent = {
        id: 'test-skill',
        name: 'Test: "quoted" and newlines',
        description: 'Description with: colon and special chars',
        instructions: 'Instructions here.',
      };
      const result = generateSkillContent(input, '0.1.0');

      expect(result).toContain('name: "Test: \\"quoted\\" and newlines"');
      expect(result).toContain('description: "Description with: colon and special chars"');
    });

    it('applies transformInstructions when provided', () => {
      const input: SkillContent = {
        id: 'test-skill',
        name: 'Test Skill',
        description: 'A test skill',
        instructions: 'Original instructions',
      };
      const transform = (instructions: string) => `# TRANSFORMED\n${instructions}`;
      const result = generateSkillContent(input, '0.1.0', transform);

      expect(result).toContain('# TRANSFORMED');
      expect(result).toContain('Original instructions');
    });

    it('includes custom metadata', () => {
      const input: SkillContent = {
        id: 'test-skill',
        name: 'Test Skill',
        description: 'A test skill',
        license: 'Apache-2.0',
        compatibility: 'Node 18+ required.',
        metadata: {
          author: 'custom-author',
          version: '2.0.0',
          generatedBy: 'custom-generator',
        },
        instructions: 'Do something.',
      };
      const result = generateSkillContent(input, '0.1.0');

      expect(result).toContain('license: Apache-2.0');
      expect(result).toContain('compatibility: Node 18+ required.');
      expect(result).toContain('author: custom-author');
      expect(result).toContain('version: "2.0.0"');
      expect(result).toContain('generatedBy: "custom-generator"');
    });
  });
});

describe('CommandAdapterRegistry', () => {
  it('has all 4 registered adapters', () => {
    expect(CommandAdapterRegistry.has('claude')).toBe(true);
    expect(CommandAdapterRegistry.has('cursor')).toBe(true);
    expect(CommandAdapterRegistry.has('windsurf')).toBe(true);
    expect(CommandAdapterRegistry.has('gemini')).toBe(true);
  });

  it('get returns correct adapter', () => {
    expect(CommandAdapterRegistry.get('claude')?.toolId).toBe('claude');
    expect(CommandAdapterRegistry.get('cursor')?.toolId).toBe('cursor');
    expect(CommandAdapterRegistry.get('windsurf')?.toolId).toBe('windsurf');
    expect(CommandAdapterRegistry.get('gemini')?.toolId).toBe('gemini');
  });

  it('get returns undefined for unknown tool', () => {
    expect(CommandAdapterRegistry.get('unknown')).toBeUndefined();
  });

  it('getAll returns all registered adapters', () => {
    const all = CommandAdapterRegistry.getAll();
    expect(all.length).toBe(4);
    expect(all.map((a) => a.toolId)).toContain('claude');
    expect(all.map((a) => a.toolId)).toContain('cursor');
    expect(all.map((a) => a.toolId)).toContain('windsurf');
    expect(all.map((a) => a.toolId)).toContain('gemini');
  });
});

describe('SkillAdapterRegistry', () => {
  it('has all 4 registered skill adapters', () => {
    expect(SkillAdapterRegistry.has('claude')).toBe(true);
    expect(SkillAdapterRegistry.has('cursor')).toBe(true);
    expect(SkillAdapterRegistry.has('windsurf')).toBe(true);
    expect(SkillAdapterRegistry.has('gemini')).toBe(true);
  });

  it('get returns correct skill adapter', () => {
    expect(SkillAdapterRegistry.get('claude')?.toolId).toBe('claude');
    expect(SkillAdapterRegistry.get('gemini')?.toolId).toBe('gemini');
  });
});

describe('generateCommand', () => {
  const cmd: CommandContent = {
    id: 'context',
    name: 'TeamSpec Context',
    description: 'Reads team context from SPEC.md',
    category: 'Workflow',
    tags: ['spec', 'context'],
    body: 'Read the SPEC.md file and understand the project.',
  };

  it('generates correct path for claude adapter', () => {
    const result = generateCommand(cmd, claudeCommandAdapter);
    expect(result.path.replace(/\\/g, '/')).toBe('.claude/commands/teamspec/context.md');
  });

  it('generates correct path for cursor adapter', () => {
    const result = generateCommand(cmd, cursorCommandAdapter);
    expect(result.path.replace(/\\/g, '/')).toBe('.cursor/commands/teamspec-context.md');
  });

  it('generates correct path for windsurf adapter', () => {
    const result = generateCommand(cmd, windsurfCommandAdapter);
    expect(result.path.replace(/\\/g, '/')).toBe('.windsurf/workflows/teamspec-context.md');
  });

  it('generates correct path for gemini adapter', () => {
    const result = generateCommand(cmd, geminiCommandAdapter);
    expect(result.path.replace(/\\/g, '/')).toBe('.gemini/commands/teamspec/context.toml');
  });

  it('generates valid frontmatter for claude adapter', () => {
    const result = generateCommand(cmd, claudeCommandAdapter);
    expect(result.fileContent).toContain('---');
    expect(result.fileContent).toContain('name: TeamSpec Context');
    expect(result.fileContent).toContain('description: Reads team context from SPEC.md');
    expect(result.fileContent).toContain('category: Workflow');
    expect(result.fileContent).toContain('tags: [spec, context]');
    expect(result.fileContent).toContain('Read the SPEC.md file and understand the project.');
  });

  it('generates TOML format for gemini adapter', () => {
    const result = generateCommand(cmd, geminiCommandAdapter);
    expect(result.fileContent).toContain('description = "');
    expect(result.fileContent).toContain('prompt = """');
    expect(result.fileContent).toContain('Read the SPEC.md file and understand the project.');
  });
});

describe('generateCommands', () => {
  it('generates multiple commands', () => {
    const contents: CommandContent[] = [
      {
        id: 'context',
        name: 'Context',
        description: 'Get context',
        category: 'Workflow',
        tags: ['spec'],
        body: 'Read SPEC.md.',
      },
      {
        id: 'team',
        name: 'Team',
        description: 'Assemble agents',
        category: 'Team',
        tags: ['agents'],
        body: 'Assemble agent team.',
      },
    ];
    const results = generateCommands(contents, claudeCommandAdapter);
    expect(results).toHaveLength(2);
    expect(results[0].path).toContain('context.md');
    expect(results[1].path).toContain('team.md');
  });
});

describe('generateSkill', () => {
  const skill: SkillContent = {
    id: 'teamspec-context',
    name: 'TeamSpec Context Skill',
    description: 'Reads team context from SPEC.md',
    instructions: 'You are a context reader.',
  };

  it('generates correct path for claude skill adapter', () => {
    const result = generateSkill(skill, claudeSkillAdapter);
    expect(result.path.replace(/\\/g, '/')).toBe('.claude/skills/teamspec-context/SKILL.md');
  });

  it('generates correct path for cursor skill adapter', () => {
    const result = generateSkill(skill, cursorSkillAdapter);
    expect(result.path.replace(/\\/g, '/')).toBe('.cursor/skills/teamspec-context/SKILL.md');
  });

  it('generates correct path for windsurf skill adapter', () => {
    const result = generateSkill(skill, windsurfSkillAdapter);
    expect(result.path.replace(/\\/g, '/')).toBe('.windsurf/skills/teamspec-context/SKILL.md');
  });

  it('generates correct path for gemini skill adapter', () => {
    const result = generateSkill(skill, geminiSkillAdapter);
    expect(result.path.replace(/\\/g, '/')).toBe('.gemini/skills/teamspec-context.toml');
  });

  it('generates valid frontmatter for claude skill adapter', () => {
    const result = generateSkill(skill, claudeSkillAdapter);
    expect(result.fileContent).toContain('---');
    expect(result.fileContent).toContain('name: TeamSpec Context Skill');
    expect(result.fileContent).toContain('description: Reads team context from SPEC.md');
    expect(result.fileContent).toContain('You are a context reader.');
  });

  it('generates TOML format for gemini skill adapter', () => {
    const result = generateSkill(skill, geminiSkillAdapter);
    expect(result.fileContent).toContain('name = "');
    expect(result.fileContent).toContain('[metadata]');
    expect(result.fileContent).toContain('instructions = """');
    expect(result.fileContent).toContain('You are a context reader.');
  });
});

describe('generateSkills', () => {
  it('generates multiple skills', () => {
    const contents: SkillContent[] = [
      { id: 'teamspec-a', name: 'Skill A', description: 'A', instructions: 'Do A.' },
      { id: 'teamspec-b', name: 'Skill B', description: 'B', instructions: 'Do B.' },
    ];
    const results = generateSkills(contents, claudeSkillAdapter);
    expect(results).toHaveLength(2);
    expect(results[0].path.replace(/\\/g, '/')).toContain('teamspec-a/SKILL.md');
    expect(results[1].path.replace(/\\/g, '/')).toContain('teamspec-b/SKILL.md');
  });
});
