/**
 * Windsurf Command & Skill Adapter
 *
 * Formats commands and skills for Windsurf following its frontmatter specification.
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
 * Formats a tags array as a YAML array with proper escaping.
 */
function formatTagsArray(tags: string[]): string {
  const escapedTags = tags.map((tag) => escapeYamlValue(tag));
  return `[${escapedTags.join(', ')}]`;
}

/**
 * Windsurf command adapter.
 * File path: .windsurf/workflows/teamspec-<id>.md
 * Frontmatter: name, description, category, tags
 */
export const windsurfCommandAdapter: ToolCommandAdapter = {
  toolId: 'windsurf',

  getFilePath(commandId: string): string {
    return path.join('.windsurf', 'workflows', `teamspec-${commandId}.md`);
  },

  formatFile(content: CommandContent): string {
    return `---
name: ${escapeYamlValue(content.name)}
description: ${escapeYamlValue(content.description)}
category: ${escapeYamlValue(content.category)}
tags: ${formatTagsArray(content.tags)}
---

${content.body}
`;
  },
};

/**
 * Windsurf skill adapter.
 * File path: .windsurf/skills/teamspec-<id>/SKILL.md
 * Frontmatter: name, description, license, compatibility, metadata
 */
export const windsurfSkillAdapter: ToolSkillAdapter = {
  toolId: 'windsurf',

  getFilePath(skillId: string): string {
    return path.join('.windsurf', 'skills', `${skillId}`, 'SKILL.md');
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
