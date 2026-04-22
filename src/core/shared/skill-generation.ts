/**
 * Skill Generation
 *
 * Provides skill template entries and content generation for all TeamSpec agent skills.
 */
import type { SkillContent, SkillTemplate, SkillTemplateEntry, CommandTemplateEntry } from './command-generation/types.js';
import type { WorkflowId } from '../profiles.js';
import { getContextSkillTemplate } from '../templates/skills/context.js';
import { getTeamSkillTemplate } from '../templates/skills/team.js';
import { getPlanSkillTemplate } from '../templates/skills/plan.js';
import { getExecuteSkillTemplate } from '../templates/skills/execute.js';
import { getVerifySkillTemplate } from '../templates/skills/verify.js';
import { getRetroSkillTemplate } from '../templates/skills/retro.js';
import { getProposeSkillTemplate } from '../templates/skills/propose.js';

export type { SkillContent, SkillTemplateEntry, CommandTemplateEntry, SkillTemplate };

/**
 * All available skill templates keyed by workflow ID.
 */
export const SKILL_TEMPLATES: Record<WorkflowId, () => SkillContent> = {
  propose: () => ({ id: 'teamspec-propose', ...getProposeSkillTemplate() }),
  context: () => ({ id: 'teamspec-context', ...getContextSkillTemplate() }),
  team: () => ({ id: 'teamspec-team', ...getTeamSkillTemplate() }),
  plan: () => ({ id: 'teamspec-plan', ...getPlanSkillTemplate() }),
  execute: () => ({ id: 'teamspec-execute', ...getExecuteSkillTemplate() }),
  verify: () => ({ id: 'teamspec-verify', ...getVerifySkillTemplate() }),
  retro: () => ({ id: 'teamspec-retro', ...getRetroSkillTemplate() }),
};

/**
 * Returns skill content for the given workflow IDs.
 *
 * @param workflowIds - Array of workflow IDs (e.g. ['context', 'team'])
 * @returns Array of SkillContent ready for generateSkillContent()
 */
export function getSkillTemplates(workflowIds?: readonly string[]): SkillContent[] {
  const keys = workflowIds ?? Object.keys(SKILL_TEMPLATES);
  return keys.filter((k) => k in SKILL_TEMPLATES).map((k) => SKILL_TEMPLATES[k as WorkflowId]());
}

/**
 * Returns empty command templates.
 * TeamSpec uses skills rather than slash commands.
 */
export function getCommandTemplates(): CommandTemplateEntry[] {
  return [];
}

/**
 * Returns empty command contents.
 * TeamSpec uses skills rather than slash commands.
 */
export function getCommandContents() {
  return [];
}

/**
 * Generates skill file content from a SkillContent template.
 *
 * @param template - The skill template
 * @param generatedByVersion - The teamspec version to record in metadata
 * @param transformInstructions - Optional transformer for the instructions
 * @returns Complete file content with YAML frontmatter
 */
export function generateSkillContent(
  template: SkillContent,
  generatedByVersion: string,
  transformInstructions?: (instructions: string) => string
): string {
  const instructions = transformInstructions
    ? transformInstructions(template.instructions)
    : template.instructions;
  return `---
name: ${escapeYamlValue(template.name)}
description: ${escapeYamlValue(template.description)}
license: ${escapeYamlValue(template.license || 'MIT')}
compatibility: ${escapeYamlValue(template.compatibility || 'Requires teamspec CLI.')}
metadata:
  author: ${escapeYamlValue(template.metadata?.author || 'teamspec')}
  version: "${template.metadata?.version || '1.0'}"
  generatedBy: "${template.metadata?.generatedBy || generatedByVersion}"
---

${instructions}
`;
}

function escapeYamlValue(value: string): string {
  const needsQuoting = /[:\n\r#{}[\],&*!|>'"%@`]|^\s|\s$/.test(value);
  if (needsQuoting) {
    const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
    return `"${escaped}"`;
  }
  return value;
}
