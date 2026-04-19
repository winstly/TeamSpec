/**
 * Available AI tool identifiers that TeamSpec supports.
 */
export type AvailableTool = 'claude' | 'cursor' | 'windsurf' | 'gemini';

import path from 'path';
import * as fs from 'fs';
import { AI_TOOLS, type AIToolOption } from './config.js';
export type { AIToolOption } from './config.js';

/**
 * All supported tool IDs.
 */
export const ALL_TOOL_IDS: AvailableTool[] = ['claude', 'cursor', 'windsurf', 'gemini'];

/**
 * Gets the skills directory name for a given tool.
 */
export function getSkillsDir(toolId: AvailableTool): string | undefined {
  const map: Record<AvailableTool, string | undefined> = {
    claude: '.claude',
    cursor: '.cursor',
    windsurf: '.windsurf',
    gemini: '.gemini',
  };
  return map[toolId];
}

/**
 * Checks whether a given tool ID is known to TeamSpec.
 */
export function isKnownTool(toolId: string): toolId is AvailableTool {
  return ALL_TOOL_IDS.includes(toolId as AvailableTool);
}

/**
 * Detects which tools have their skills directory present in the project.
 * Used by update and init commands to auto-detect available tools.
 */
export function getAvailableTools(projectPath: string): AIToolOption[] {
  return AI_TOOLS.filter((tool) => {
    if (!tool.skillsDir) return false;

    if (tool.detectionPaths && tool.detectionPaths.length > 0) {
      return tool.detectionPaths.some((p) => {
        try {
          fs.statSync(path.join(projectPath, p));
          return true;
        } catch {
          return false;
        }
      });
    }

    const dirPath = path.join(projectPath, tool.skillsDir);
    try {
      return fs.statSync(dirPath).isDirectory();
    } catch {
      return false;
    }
  });
}
