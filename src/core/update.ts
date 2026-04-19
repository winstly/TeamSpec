/**
 * Update Command
 *
 * Refreshes TeamSpec skills and commands for configured tools.
 * Supports profile-aware updates, delivery changes, migration, and smart update detection.
 */

import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import * as fs from 'fs';
import { createRequire } from 'module';
import { FileSystemUtils } from '../utils/file-system.js';
import { AI_TOOLS } from './config.js';
import {
  generateCommands,
  CommandAdapterRegistry,
} from './shared/command-generation/index.js';
import {
  getToolVersionStatus,
  getSkillTemplates,
  getCommandContents,
  generateSkillContent,
  SKILL_TEMPLATES,
  type ToolVersionStatus,
} from './shared/index.js';
import { getGlobalConfig, type Delivery } from './global-config.js';
import { getProfileWorkflows, ALL_WORKFLOWS } from './profiles.js';
import { getAvailableTools } from './available-tools.js';
import {
  WORKFLOW_TO_SKILL_DIR,
  getCommandConfiguredTools,
  getConfiguredToolsForProfileSync,
  getToolsNeedingProfileSync,
} from './profile-sync-drift.js';
import {
  scanInstalledWorkflows,
  migrateIfNeeded,
} from './migration.js';

const require = createRequire(import.meta.url);
const { version: TEAMSPEC_VERSION } = require('../../package.json');

/**
 * Options for the update command.
 */
export interface UpdateCommandOptions {
  /** Restrict update to specific tools */
  tools?: string;
  /** Only update skill files (skip manifest) */
  skillsOnly?: boolean;
  /** Only update agent manifest (skip skills) */
  agentsOnly?: boolean;
  /** Force update even when tools are up to date */
  force?: boolean;
}

/**
 * Scans installed workflow artifacts (skills and managed commands) across all configured tools.
 * Returns the union of detected workflow IDs that match ALL_WORKFLOWS.
 */
export function scanInstalledWorkflowsForUpdate(projectPath: string, toolIds: string[]): string[] {
  const tools = toolIds
    .map((id) => AI_TOOLS.find((t) => t.value === id))
    .filter((t): t is NonNullable<typeof t> => t != null);
  return scanInstalledWorkflows(projectPath, tools);
}

export class UpdateCommand {
  private readonly force: boolean;
  private readonly skillsOnly: boolean;
  private readonly agentsOnly: boolean;
  private readonly toolsArg?: string;

  constructor(options: UpdateCommandOptions = {}) {
    this.force = options.force ?? false;
    this.skillsOnly = options.skillsOnly ?? false;
    this.agentsOnly = options.agentsOnly ?? false;
    this.toolsArg = options.tools;
  }

  async execute(projectPath: string): Promise<void> {
    const resolvedProjectPath = path.resolve(projectPath);

    // 1. Check that at least one tool directory exists
    const availableTools = getAvailableTools(resolvedProjectPath);
    if (availableTools.length === 0) {
      throw new Error(`No TeamSpec tool directories found. Run 'teamspec init' first.`);
    }

    // 2. Perform one-time migration if needed
    migrateIfNeeded(resolvedProjectPath, availableTools);

    // 3. Read global config for profile/delivery
    const globalConfig = getGlobalConfig();
    const profile = globalConfig.profile ?? 'core';
    const delivery: Delivery = globalConfig.delivery ?? 'both';
    const profileWorkflows = getProfileWorkflows(profile, globalConfig.workflows);
    const desiredWorkflows = profileWorkflows.filter((workflow): workflow is (typeof ALL_WORKFLOWS)[number] =>
      (ALL_WORKFLOWS as readonly string[]).includes(workflow)
    );
    const shouldGenerateSkills = this.skillsOnly || (delivery !== 'commands');
    const shouldGenerateCommands = !this.skillsOnly && (delivery !== 'skills');

    // 4. Handle agentsOnly mode (manifest update only)
    if (this.agentsOnly) {
      await this.updateManifestOnly(resolvedProjectPath);
      return;
    }

    // 5. Find configured tools (optionally filtered by --tools)
    let configuredTools = getConfiguredToolsForProfileSync(resolvedProjectPath);

    if (this.toolsArg) {
      const filtered = this.filterToolsByArg(configuredTools, this.toolsArg);
      configuredTools = filtered;
    }

    if (configuredTools.length === 0) {
      console.log(chalk.yellow('No configured tools found.'));
      console.log(chalk.dim('Run "teamspec init" to set up tools.'));
      return;
    }

    // 5. Check version status for all configured tools
    const commandConfiguredTools = getCommandConfiguredTools(resolvedProjectPath);
    const commandConfiguredSet = new Set(commandConfiguredTools);
    const toolStatuses = configuredTools.map((toolId) => {
      const status = getToolVersionStatus(resolvedProjectPath, toolId, TEAMSPEC_VERSION);
      if (!status.configured && commandConfiguredSet.has(toolId)) {
        return { ...status, configured: true };
      }
      return status;
    });
    const statusByTool = new Map(toolStatuses.map((status) => [status.toolId, status] as const));

    // 6. Smart update detection
    const toolsNeedingVersionUpdate = toolStatuses
      .filter((s) => s.needsUpdate)
      .map((s) => s.toolId);
    const toolsNeedingConfigSync = getToolsNeedingProfileSync(
      resolvedProjectPath,
      desiredWorkflows,
      delivery,
      configuredTools
    );
    const toolsToUpdateSet = new Set<string>([
      ...toolsNeedingVersionUpdate,
      ...toolsNeedingConfigSync,
    ]);
    const toolsUpToDate = toolStatuses.filter((s) => !toolsToUpdateSet.has(s.toolId));

    if (!this.force && toolsToUpdateSet.size === 0) {
      // All tools are up to date
      this.displayUpToDateMessage(toolStatuses);

      // Still check for new tool directories and extra workflows
      this.detectNewTools(resolvedProjectPath, configuredTools);
      this.displayExtraWorkflowsNote(resolvedProjectPath, configuredTools, desiredWorkflows);
      return;
    }

    // 7. Display update plan
    if (this.force) {
      console.log(`Force updating ${configuredTools.length} tool(s): ${configuredTools.join(', ')}`);
    } else {
      this.displayUpdatePlan([...toolsToUpdateSet], statusByTool, toolsUpToDate);
    }
    console.log();

    // 8. Determine what to generate based on delivery
    const skillTemplates = shouldGenerateSkills ? getSkillTemplates(desiredWorkflows) : [];
    const commandContents = shouldGenerateCommands ? getCommandContents() : [];

    // 9. Update tools (all if force, otherwise only those needing update)
    const toolsToUpdate = this.force ? configuredTools : [...toolsToUpdateSet];
    const updatedTools: string[] = [];
    const failedTools: Array<{ name: string; error: string }> = [];
    let removedCommandCount = 0;
    let removedSkillCount = 0;
    let removedDeselectedCommandCount = 0;
    let removedDeselectedSkillCount = 0;

    for (const toolId of toolsToUpdate) {
      const tool = AI_TOOLS.find((t) => t.value === toolId);
      if (!tool?.skillsDir) continue;

      const spinner = ora(`Updating ${tool.name}...`).start();

      try {
        const skillsDir = path.join(resolvedProjectPath, tool.skillsDir, 'skills');

        // Generate skill files if delivery includes skills
        if (shouldGenerateSkills) {
          for (const skillContent of skillTemplates) {
            const workflowId = (
              Object.entries(SKILL_TEMPLATES).find(([, fn]) => fn() === skillContent)?.[0] ?? ''
            ) as keyof typeof WORKFLOW_TO_SKILL_DIR;
            const dirName = WORKFLOW_TO_SKILL_DIR[workflowId];
            const skillDir = path.join(skillsDir, dirName);
            const skillFile = path.join(skillDir, 'SKILL.md');

            const fileContent = generateSkillContent(skillContent, TEAMSPEC_VERSION);
            await FileSystemUtils.writeFile(skillFile, fileContent);
          }

          removedDeselectedSkillCount += await this.removeUnselectedSkillDirs(
            skillsDir,
            desiredWorkflows
          );
        }

        // Delete skill directories if delivery is commands-only
        if (!shouldGenerateSkills) {
          removedSkillCount += await this.removeSkillDirs(skillsDir);
        }

        // Generate commands if delivery includes commands
        if (shouldGenerateCommands) {
          const adapter = CommandAdapterRegistry.get(tool.value);
          if (adapter) {
            const generatedCommands = generateCommands(commandContents, adapter);

            for (const cmd of generatedCommands) {
              const commandFile = path.isAbsolute(cmd.path)
                ? cmd.path
                : path.join(resolvedProjectPath, cmd.path);
              await FileSystemUtils.writeFile(commandFile, cmd.fileContent);
            }

            removedDeselectedCommandCount += await this.removeUnselectedCommandFiles(
              resolvedProjectPath,
              toolId,
              desiredWorkflows
            );
          }
        }

        // Delete command files if delivery is skills-only
        if (!shouldGenerateCommands) {
          removedCommandCount += await this.removeCommandFiles(resolvedProjectPath, toolId);
        }

        spinner.succeed(`Updated ${tool.name}`);
        updatedTools.push(tool.name);
      } catch (error) {
        spinner.fail(`Failed to update ${tool.name}`);
        failedTools.push({
          name: tool.name,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // 10. Summary
    console.log();
    if (updatedTools.length > 0) {
      console.log(
        chalk.green(`Updated: ${updatedTools.join(', ')} (v${TEAMSPEC_VERSION})`)
      );
    }
    if (failedTools.length > 0) {
      console.log(
        chalk.red(`Failed: ${failedTools.map((f) => `${f.name} (${f.error})`).join(', ')}`)
      );
    }
    if (removedCommandCount > 0) {
      console.log(chalk.dim(`Removed: ${removedCommandCount} command files (delivery: skills)`));
    }
    if (removedSkillCount > 0) {
      console.log(chalk.dim(`Removed: ${removedSkillCount} skill directories (delivery: commands)`));
    }
    if (removedDeselectedCommandCount > 0) {
      console.log(
        chalk.dim(`Removed: ${removedDeselectedCommandCount} command files (deselected workflows)`)
      );
    }
    if (removedDeselectedSkillCount > 0) {
      console.log(
        chalk.dim(`Removed: ${removedDeselectedSkillCount} skill directories (deselected workflows)`)
      );
    }

    // 11. Detect new tool directories not currently configured
    this.detectNewTools(resolvedProjectPath, configuredTools);

    // 12. Display note about extra workflows not in profile
    this.displayExtraWorkflowsNote(resolvedProjectPath, configuredTools, desiredWorkflows);

    // 13. List affected tools
    if (updatedTools.length > 0) {
      console.log(chalk.dim(`Tools: ${updatedTools.join(', ')}`));
    }

    console.log();
    console.log(chalk.dim('Restart your IDE for changes to take effect.'));
  }

  /**
   * Display message when all tools are up to date.
   */
  private displayUpToDateMessage(toolStatuses: ToolVersionStatus[]): void {
    const toolNames = toolStatuses.map((s) => s.toolId);
    console.log(chalk.green(`All ${toolStatuses.length} tool(s) up to date (v${TEAMSPEC_VERSION})`));
    console.log(chalk.dim(`  Tools: ${toolNames.join(', ')}`));
    console.log();
    console.log(chalk.dim('Use --force to refresh files anyway.'));
  }

  /**
   * Display the update plan showing which tools need updating.
   */
  private displayUpdatePlan(
    toolsToUpdate: string[],
    statusByTool: Map<string, ToolVersionStatus>,
    upToDate: ToolVersionStatus[]
  ): void {
    const updates = toolsToUpdate.map((toolId) => {
      const status = statusByTool.get(toolId);
      if (status?.needsUpdate) {
        const fromVersion = status.generatedByVersion ?? 'unknown';
        return `${status.toolId} (${fromVersion} → ${TEAMSPEC_VERSION})`;
      }
      return `${toolId} (config sync)`;
    });

    console.log(`Updating ${toolsToUpdate.length} tool(s): ${updates.join(', ')}`);

    if (upToDate.length > 0) {
      const upToDateNames = upToDate.map((s) => s.toolId);
      console.log(chalk.dim(`Already up to date: ${upToDateNames.join(', ')}`));
    }
  }

  /**
   * Detects new tool directories that aren't currently configured and displays a hint.
   */
  private detectNewTools(projectPath: string, configuredTools: string[]): void {
    const availableTools = getAvailableTools(projectPath);
    const configuredSet = new Set(configuredTools);

    const newTools = availableTools.filter((t) => !configuredSet.has(t.value));

    if (newTools.length > 0) {
      const newToolNames = newTools.map((tool) => tool.name);
      const isSingleTool = newToolNames.length === 1;
      const toolNoun = isSingleTool ? 'tool' : 'tools';
      const pronoun = isSingleTool ? 'it' : 'them';
      console.log();
      console.log(
        chalk.yellow(
          `Detected new ${toolNoun}: ${newToolNames.join(', ')}. Run 'teamspec init' to add ${pronoun}.`
        )
      );
    }
  }

  /**
   * Displays a note about extra workflows installed that aren't in the current profile.
   */
  private displayExtraWorkflowsNote(
    projectPath: string,
    configuredTools: string[],
    profileWorkflows: readonly string[]
  ): void {
    const installedWorkflows = scanInstalledWorkflowsForUpdate(projectPath, configuredTools);
    const profileSet = new Set(profileWorkflows);
    const extraWorkflows = installedWorkflows.filter((w) => !profileSet.has(w));

    if (extraWorkflows.length > 0) {
      console.log(
        chalk.dim(
          `Note: ${extraWorkflows.length} extra workflows not in profile (use \`teamspec config profile\` to manage)`
        )
      );
    }
  }

  /**
   * Removes skill directories for workflows when delivery changed to commands-only.
   * Returns the number of directories removed.
   */
  private async removeSkillDirs(skillsDir: string): Promise<number> {
    let removed = 0;

    for (const workflow of ALL_WORKFLOWS) {
      const dirName = WORKFLOW_TO_SKILL_DIR[workflow];
      if (!dirName) continue;

      const skillDir = path.join(skillsDir, dirName);
      try {
        if (fs.existsSync(skillDir)) {
          await fs.promises.rm(skillDir, { recursive: true, force: true });
          removed++;
        }
      } catch {
        // Ignore errors
      }
    }

    return removed;
  }

  /**
   * Removes skill directories for workflows that are no longer selected in the active profile.
   * Returns the number of directories removed.
   */
  private async removeUnselectedSkillDirs(
    skillsDir: string,
    desiredWorkflows: readonly (typeof ALL_WORKFLOWS)[number][]
  ): Promise<number> {
    const desiredSet = new Set(desiredWorkflows);
    let removed = 0;

    for (const workflow of ALL_WORKFLOWS) {
      if (desiredSet.has(workflow)) continue;
      const dirName = WORKFLOW_TO_SKILL_DIR[workflow];
      if (!dirName) continue;

      const skillDir = path.join(skillsDir, dirName);
      try {
        if (fs.existsSync(skillDir)) {
          await fs.promises.rm(skillDir, { recursive: true, force: true });
          removed++;
        }
      } catch {
        // Ignore errors
      }
    }

    return removed;
  }

  /**
   * Removes command files for workflows when delivery changed to skills-only.
   * Returns the number of files removed.
   */
  private async removeCommandFiles(projectPath: string, toolId: string): Promise<number> {
    let removed = 0;

    const adapter = CommandAdapterRegistry.get(toolId);
    if (!adapter) return 0;

    for (const workflow of ALL_WORKFLOWS) {
      const cmdPath = adapter.getFilePath(workflow);
      const fullPath = path.isAbsolute(cmdPath) ? cmdPath : path.join(projectPath, cmdPath);

      try {
        if (fs.existsSync(fullPath)) {
          await fs.promises.unlink(fullPath);
          removed++;
        }
      } catch {
        // Ignore errors
      }
    }

    return removed;
  }

  /**
   * Removes command files for workflows that are no longer selected in the active profile.
   * Returns the number of files removed.
   */
  private async removeUnselectedCommandFiles(
    projectPath: string,
    toolId: string,
    desiredWorkflows: readonly (typeof ALL_WORKFLOWS)[number][]
  ): Promise<number> {
    let removed = 0;

    const adapter = CommandAdapterRegistry.get(toolId);
    if (!adapter) return 0;

    const desiredSet = new Set(desiredWorkflows);

    for (const workflow of ALL_WORKFLOWS) {
      if (desiredSet.has(workflow)) continue;
      const cmdPath = adapter.getFilePath(workflow);
      const fullPath = path.isAbsolute(cmdPath) ? cmdPath : path.join(projectPath, cmdPath);

      try {
        if (fs.existsSync(fullPath)) {
          await fs.promises.unlink(fullPath);
          removed++;
        }
      } catch {
        // Ignore errors
      }
    }

    return removed;
  }

  /**
   * Handles the --agents-only mode: update manifest only, skip skill generation.
   */
  private async updateManifestOnly(projectPath: string): Promise<void> {
    const manifestPath = path.join(projectPath, 'teamspec', 'agents', 'manifest.json');
    const agencyRepoPath = path.join(projectPath, 'teamspec', 'agents', 'agency-agents');

    if (!fs.existsSync(agencyRepoPath)) {
      console.log(chalk.yellow('No agency-agents repository found. Run `teamspec init` first.'));
      return;
    }

    const spinner = ora('Updating agent manifest...').start();
    try {
      const { generateManifest } = await import('./agents/manifest.js');
      await generateManifest(agencyRepoPath, manifestPath, TEAMSPEC_VERSION);
      spinner.succeed('Agent manifest updated');
    } catch (error) {
      spinner.fail('Failed to update manifest');
      throw error;
    }
  }

  /**
   * Filters the tool list based on the --tools argument.
   */
  private filterToolsByArg(configuredTools: string[], toolsArg: string): string[] {
    const raw = toolsArg.trim().toLowerCase();
    if (raw === 'all') {
      return configuredTools;
    }

    const tokens = raw
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    if (tokens.some((t) => t === 'all' || t === 'none')) {
      throw new Error('Cannot combine "all" or "none" with specific tool IDs in --tools');
    }

    return configuredTools.filter((toolId) => tokens.includes(toolId));
  }
}
