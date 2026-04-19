/**
 * Cursor Command & Skill Adapter
 *
 * Formats commands and skills for Cursor following its frontmatter specification.
 */

import path from 'path';
import type { CommandContent, SkillContent, ToolCommandAdapter, ToolSkillAdapter } from '../types.js';

/**
 * Escapes a string value for safe YAML output.
 * Quotes the string if it contains special YAML characters.
 */
function escapeYamlValue(value: string): string {
  const needsQuoting = /[:\n\r#{}[\],&*!|>'"%@`]|^\s|\s$/.test(value);
  if (needsQuoting) {
    const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
    return `"${escaped}"`;
  }
  return value;
}

/**
 * Cursor command adapter.
 * File path: .cursor/commands/teamspec-<id>.md
 * Frontmatter: name (as /teamspec-<id>), id, category, description
 */
export const cursorCommandAdapter: ToolCommandAdapter = {
  toolId: 'cursor',

  getFilePath(commandId: string): string {
    return path.join('.cursor', 'commands', `teamspec-${commandId}.md`);
  },

  formatFile(content: CommandContent): string {
    return `---
name: /teamspec-${content.id}
id: teamspec-${content.id}
category: ${escapeYamlValue(content.category)}
description: ${escapeYamlValue(content.description)}
---

${content.body}
`;
  },
};

/**
 * Cursor skill adapter.
 * File path: .cursor/skills/teamspec-<id>/SKILL.md
 * Frontmatter: name, description, license, compatibility, metadata
 */
export const cursorSkillAdapter: ToolSkillAdapter = {
  toolId: 'cursor',

  getFilePath(skillId: string): string {
    return path.join('.cursor', 'skills', `${skillId}`, 'SKILL.md');
  },

  formatFile(content: SkillContent): string {
    return `---
name: ${escapeYamlValue(content.name)}
description: ${escapeYamlValue(content.description)}
license: ${escapeYamlValue(content.license || 'MIT')}
compatibility: ${escapeYamlValue(content.compatibility || 'Requires teamspec CLI.')}
metadata:
  author: ${escapeYamlValue(content.metadata?.author || 'teamspec')}
  version: "${content.metadata?.version || '1.0'}"
  generatedBy: "${content.metadata?.generatedBy || 'teamspec'}"
---

${content.instructions}
`;
  },
};
