/**
 * Gemini CLI Command & Skill Adapter
 *
 * Formats commands and skills for Gemini CLI following its TOML specification.
 */

import path from 'path';
import type { CommandContent, SkillContent, ToolCommandAdapter, ToolSkillAdapter } from '../types.js';

/**
 * Gemini command adapter.
 * File path: .gemini/commands/teamspec/<id>.toml
 * Format: TOML with description and prompt fields
 */
export const geminiCommandAdapter: ToolCommandAdapter = {
  toolId: 'gemini',

  getFilePath(commandId: string): string {
    return path.join('.gemini', 'commands', 'teamspec', `${commandId}.toml`);
  },

  formatFile(content: CommandContent): string {
    return `description = "${content.description}"

prompt = """
${content.body}
"""
`;
  },
};

/**
 * Gemini skill adapter.
 * File path: .gemini/skills/teamspec/<id>.toml
 * Format: TOML with description and instructions fields
 */
export const geminiSkillAdapter: ToolSkillAdapter = {
  toolId: 'gemini',

  getFilePath(skillId: string): string {
    return path.join('.gemini', 'skills', `${skillId}.toml`);
  },

  formatFile(content: SkillContent): string {
    const license = content.license || 'MIT';
    const compatibility = content.compatibility || 'Requires teamspec CLI.';
    const author = content.metadata?.author || 'teamspec';
    const version = content.metadata?.version || '1.0';
    const generatedBy = content.metadata?.generatedBy || 'teamspec';

    return `name = "${content.name}"
description = "${content.description}"
license = "${license}"
compatibility = "${compatibility}"

[metadata]
author = "${author}"
version = "${version}"
generatedBy = "${generatedBy}"

instructions = """
${content.instructions}
"""
`;
  },
};
