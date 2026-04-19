/**
 * Migration Utilities
 *
 * One-time migration logic for existing projects when the profile system is introduced.
 * Called by both init and update commands before profile resolution.
 */

import * as fs from 'fs';
import * as path from 'path';
import type { AIToolOption } from './available-tools.js';
import { WORKFLOW_TO_SKILL_DIR } from './profile-sync-drift.js';
import type { WorkflowId } from './profiles.js';
import { ALL_WORKFLOWS } from './profiles.js';
import { getGlobalConfig, getGlobalConfigPath, saveGlobalConfig, type Delivery } from './global-config.js';

interface InstalledWorkflowArtifacts {
  workflows: string[];
  hasSkills: boolean;
  hasCommands: boolean;
}

function scanInstalledWorkflowArtifacts(
  projectPath: string,
  tools: AIToolOption[]
): InstalledWorkflowArtifacts {
  const installed = new Set<string>();
  let hasSkills = false;
  let hasCommands = false;

  for (const tool of tools) {
    if (!tool.skillsDir) continue;
    const skillsBaseDir = path.join(projectPath, tool.skillsDir, 'skills');

    let entries: string[];
    try {
      entries = fs.readdirSync(skillsBaseDir);
    } catch {
      continue;
    }

    for (const entry of entries) {
      const entryPath = path.join(skillsBaseDir, entry);
      let stat: fs.Stats;
      try {
        stat = fs.statSync(entryPath);
      } catch {
        continue;
      }

      if (!stat.isDirectory()) continue;

      // Match entry against WORKFLOW_TO_SKILL_DIR values
      for (const [workflow, dirName] of Object.entries(WORKFLOW_TO_SKILL_DIR)) {
        if (dirName === entry) {
          installed.add(workflow);
          hasSkills = true;
          break;
        }
      }
    }

    // Command detection: <tool>/commands/teamspec/<workflow>.md
    if (tool.skillsDir) {
      const commandsDir = path.join(projectPath, tool.skillsDir, 'commands', 'teamspec');
      if (fs.existsSync(commandsDir)) {
        for (const workflowId of ALL_WORKFLOWS) {
          const commandFile = path.join(commandsDir, `${workflowId}.md`);
          if (fs.existsSync(commandFile)) {
            installed.add(workflowId);
            hasCommands = true;
          }
        }
      }
    }
  }

  return {
    workflows: ALL_WORKFLOWS.filter((workflowId) => installed.has(workflowId)),
    hasSkills,
    hasCommands,
  };
}

/**
 * Scans installed workflow artifacts across all configured tools.
 * Returns workflow IDs that are currently installed.
 *
 * @param projectPath - The project root path
 * @param tools - Array of configured tool options
 * @returns Array of workflow IDs found in installed skill/command directories
 */
export function scanInstalledWorkflows(
  projectPath: string,
  tools: AIToolOption[]
): string[] {
  return scanInstalledWorkflowArtifacts(projectPath, tools).workflows;
}

function inferDelivery(artifacts: InstalledWorkflowArtifacts): Delivery {
  if (artifacts.hasSkills && artifacts.hasCommands) {
    return 'both';
  }
  if (artifacts.hasCommands) {
    return 'commands';
  }
  return 'skills';
}

/**
 * Performs one-time migration if the global config does not yet have a profile field.
 * Called by both init and update before profile resolution.
 *
 * - If no profile field exists and workflows are installed: sets profile to 'custom'
 *   with the detected workflows, preserving the user's existing setup.
 * - If no profile field exists and no workflows are installed: no-op (defaults apply).
 * - If profile field already exists: no-op.
 */
export function migrateIfNeeded(projectPath: string, tools: AIToolOption[]): void {
  const config = getGlobalConfig();

  // Check raw config file for profile field presence
  const configPath = getGlobalConfigPath();

  let rawConfig: Record<string, unknown> = {};
  try {
    if (fs.existsSync(configPath)) {
      rawConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }
  } catch {
    return; // Can't read config, skip migration
  }

  // If profile is already explicitly set, no migration needed
  if (rawConfig.profile !== undefined) {
    return;
  }

  // Scan for installed workflows
  const artifacts = scanInstalledWorkflowArtifacts(projectPath, tools);
  const installedWorkflows = artifacts.workflows;

  if (installedWorkflows.length === 0) {
    // No workflows installed, new user — defaults will apply
    return;
  }

  // Migrate: set profile to custom with detected workflows
  config.profile = 'custom';
  config.workflows = installedWorkflows;
  if (rawConfig.delivery === undefined) {
    config.delivery = inferDelivery(artifacts);
  }
  saveGlobalConfig(config);

  console.log(`Migrated: custom profile with ${installedWorkflows.length} workflows`);
  console.log("Run 'teamspec update' in your projects to apply the new configuration.");
}
