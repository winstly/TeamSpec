/**
 * Profile Sync Drift module
 *
 * Detects when configured tools need regeneration due to profile or delivery changes.
 * Adapted from OpenSpec's profile-sync-drift.ts for TeamSpec's skill-based architecture.
 */

import path from 'path';
import * as fs from 'fs';
import type { Delivery } from './global-config.js';
import type { WorkflowId } from './profiles.js';
import { ALL_WORKFLOWS } from './profiles.js';
import { getConfiguredTools } from './shared/tool-detection.js';

/**
 * Maps each workflow ID to the skill subdirectory name used under <tool>/skills/.
 * TeamSpec stores skills under <tool>/skills/<workflow>/SKILL.md.
 */
export const WORKFLOW_TO_SKILL_DIR: Record<WorkflowId, string> = {
  propose: 'teamspec-propose',
  context: 'teamspec-context',
  team: 'teamspec-team',
  plan: 'teamspec-plan',
  execute: 'teamspec-execute',
  verify: 'teamspec-verify',
  retro: 'teamspec-retro',
};

function toKnownWorkflows(workflows: readonly string[]): WorkflowId[] {
  return workflows.filter(
    (workflow): workflow is WorkflowId =>
      (ALL_WORKFLOWS as readonly string[]).includes(workflow)
  );
}

/**
 * Returns all tool IDs currently configured (have a skills directory present).
 *
 * @param projectPath - The project root path
 * @returns Array of configured tool IDs
 */
export function getConfiguredToolsForProfileSync(projectPath: string): string[] {
  return getConfiguredTools(projectPath);
}

/**
 * Returns tool IDs that have command files configured.
 * In TeamSpec commands are stored under <tool>/commands/teamspec/.
 * Currently, TeamSpec primarily uses skill-based delivery; command support
 * is a future enhancement.
 */
export function getCommandConfiguredTools(projectPath: string): string[] {
  return getConfiguredTools(projectPath);
}

/**
 * Detects if a single tool has profile/delivery drift against the desired state.
 *
 * This function covers:
 * - required skill files missing for selected workflows
 * - skill files that should not exist for the selected delivery mode
 * - skill files for workflows that were deselected from the current profile
 */
export function hasToolProfileOrDeliveryDrift(
  projectPath: string,
  toolId: string,
  desiredWorkflows: readonly string[],
  delivery: Delivery
): boolean {
  const toolSkillsDir = getToolSkillsDir(projectPath, toolId);
  if (!toolSkillsDir) return false;

  const knownDesiredWorkflows = toKnownWorkflows(desiredWorkflows);
  const desiredWorkflowSet = new Set<WorkflowId>(knownDesiredWorkflows);
  const skillsBaseDir = path.join(toolSkillsDir, 'skills');

  const shouldGenerateSkills = delivery !== 'commands';

  if (shouldGenerateSkills) {
    // Check: all desired workflow skill files are present
    for (const workflow of knownDesiredWorkflows) {
      const dirName = WORKFLOW_TO_SKILL_DIR[workflow];
      const skillFile = path.join(skillsBaseDir, dirName, 'SKILL.md');
      if (!fs.existsSync(skillFile)) {
        return true;
      }
    }

    // Check: no extra skill dirs for workflows that were deselected
    for (const workflow of ALL_WORKFLOWS) {
      if (desiredWorkflowSet.has(workflow)) continue;
      const dirName = WORKFLOW_TO_SKILL_DIR[workflow];
      const skillDir = path.join(skillsBaseDir, dirName);
      if (fs.existsSync(skillDir)) {
        return true;
      }
    }
  } else {
    // Delivery is 'commands' only — no skill files should exist
    for (const workflow of ALL_WORKFLOWS) {
      const dirName = WORKFLOW_TO_SKILL_DIR[workflow];
      const skillDir = path.join(skillsBaseDir, dirName);
      if (fs.existsSync(skillDir)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Returns tools with at least one skill directory on disk.
 */
function getToolSkillsDir(projectPath: string, toolId: string): string | undefined {
  const toolMap: Record<string, string | undefined> = {
    claude: '.claude',
    cursor: '.cursor',
    windsurf: '.windsurf',
    gemini: '.gemini',
  };
  const skillsDir = toolMap[toolId];
  if (!skillsDir) return undefined;
  const fullPath = path.join(projectPath, skillsDir);
  return fs.existsSync(fullPath) ? fullPath : undefined;
}

/**
 * Returns configured tools that currently need a profile/delivery sync.
 */
export function getToolsNeedingProfileSync(
  projectPath: string,
  desiredWorkflows: readonly string[],
  delivery: Delivery,
  configuredTools?: readonly string[]
): string[] {
  const tools = configuredTools
    ? [...new Set([...configuredTools])]
    : getConfiguredToolsForProfileSync(projectPath);
  return tools.filter((toolId) =>
    hasToolProfileOrDeliveryDrift(projectPath, toolId, desiredWorkflows, delivery)
  );
}

/**
 * Detects whether the current project has any profile/delivery drift.
 */
export function hasProjectConfigDrift(
  projectPath: string,
  desiredWorkflows: readonly string[],
  delivery: Delivery
): boolean {
  const configuredTools = getConfiguredToolsForProfileSync(projectPath);
  if (
    getToolsNeedingProfileSync(projectPath, desiredWorkflows, delivery, configuredTools)
      .length > 0
  ) {
    return true;
  }

  const desiredSet = new Set(toKnownWorkflows(desiredWorkflows));
  const includeSkills = delivery !== 'commands';

  if (!includeSkills) return false;

  for (const toolId of configuredTools) {
    const skillsDir = getToolSkillsDir(projectPath, toolId);
    if (!skillsDir) continue;

    const skillsBaseDir = path.join(skillsDir, 'skills');
    for (const workflow of ALL_WORKFLOWS) {
      const dirName = WORKFLOW_TO_SKILL_DIR[workflow];
      const skillFile = path.join(skillsBaseDir, dirName, 'SKILL.md');
      if (fs.existsSync(skillFile) && !desiredSet.has(workflow)) {
        return true;
      }
    }
  }

  return false;
}
