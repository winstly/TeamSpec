/**
 * Init Command
 *
 * Sets up a TeamSpec workspace with skill files, knowledge base, and manifest.
 * This is the unified setup command that initialises a new or existing project.
 */

import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import * as fs from 'fs';
import { execSync } from 'node:child_process';
import { TEAMSPEC_VERSION } from './shared/version.js';
import { generateSkillContent } from './shared/skill-generation.js';
import { initKnowledgeBase } from './knowledge/base.js';
import { generateManifest } from './agents/manifest.js';
import type { AIToolOption } from './available-tools.js';
import { AI_TOOLS } from './config.js';
import { getGlobalConfig, type Delivery, type Profile } from './global-config.js';
import { getProfileWorkflows } from './profiles.js';
import { WORKFLOW_TO_SKILL_DIR } from './profile-sync-drift.js';
import { isInteractive } from '../utils/interactive.js';
import { scanInstalledWorkflows, migrateIfNeeded } from './migration.js';
import {
  getContextSkillTemplate,
  getRecruitSkillTemplate,
  getPlanSkillTemplate,
  getApproveSkillTemplate,
  getMonitorSkillTemplate,
  getQASkillTemplate,
  getRetroSkillTemplate,
} from './templates/skills/index.js';

const TEAMSPEC_DIR = 'teamspec';

const PROGRESS_SPINNER = {
  interval: 80,
  frames: ['░░░', '▒░░', '▒▒░', '▒▒▒', '▓▒▒', '▓▓▒', '▓▓▓', '▒▓▓', '░▒▓'],
};

type InitCommandOptions = {
  tools?: string;
  projectName?: string;
  skipAgents?: boolean;
};

// Map of workflow ID -> skill template getter function
type SkillTemplateGetter = () => ReturnType<typeof getContextSkillTemplate>;

const SKILL_TEMPLATE_GETTERS: Record<string, SkillTemplateGetter> = {
  context: getContextSkillTemplate,
  recruit: getRecruitSkillTemplate,
  plan: getPlanSkillTemplate,
  approve: getApproveSkillTemplate,
  monitor: getMonitorSkillTemplate,
  qa: getQASkillTemplate,
  retro: getRetroSkillTemplate,
};

export class InitCommand {
  private readonly toolsArg?: string;
  private readonly projectName?: string;
  private readonly skipAgents: boolean;

  constructor(options: InitCommandOptions = {}) {
    this.toolsArg = options.tools;
    this.projectName = options.projectName;
    this.skipAgents = options.skipAgents ?? false;
  }

  async execute(targetPath: string): Promise<void> {
    const projectPath = path.resolve(targetPath);
    const teamspecPath = path.join(projectPath, TEAMSPEC_DIR);

    // Validate project path
    await this.validate(projectPath);

    // Migration check: migrate existing projects to profile system
    migrateIfNeeded(projectPath, AI_TOOLS);

    // Detect available tools in the project
    const detectedTools = AI_TOOLS.filter((tool) => {
      if (!tool.skillsDir) return false;
      return fs.existsSync(path.join(projectPath, tool.skillsDir));
    });

    // Show animated welcome screen in interactive mode
    if (this.canPromptInteractively()) {
      const { showWelcomeScreen } = await import('../ui/welcome-screen.js');
      await showWelcomeScreen();
    }

    // Get tool selection
    const selectedToolIds = await this.getSelectedTools(detectedTools, projectPath);

    if (selectedToolIds.length === 0) {
      console.log(chalk.yellow('No tools selected. Nothing to set up.'));
      return;
    }

    // Create teamspec directory structure
    await this.createDirectoryStructure(teamspecPath);

    // Clone agency-agents unless skipped
    const agencyRepoPath = path.join(teamspecPath, 'agents', 'agency-agents');
    if (!this.skipAgents) {
      await this.cloneAgencyAgents(agencyRepoPath);
    }

    // Derive project name
    const resolvedProjectName = this.projectName ?? path.basename(projectPath);

    // Initialize knowledge base
    const manifestPath = path.join(teamspecPath, 'agents', 'manifest.json');
    this.initKnowledgeBase(projectPath, resolvedProjectName, manifestPath);

    // Generate manifest
    if (fs.existsSync(agencyRepoPath) && !this.skipAgents) {
      await this.generateManifestFile(agencyRepoPath, manifestPath);
    }

    // Generate skill files for each selected tool
    const skillResults = await this.generateSkillFiles(projectPath, selectedToolIds);

    // Create config.yaml
    const configStatus = await this.createConfig(teamspecPath, resolvedProjectName);

    // Display success message
    this.displaySuccessMessage(
      projectPath,
      selectedToolIds,
      skillResults,
      configStatus,
      resolvedProjectName
    );
  }

  // ═══════════════════════════════════════════════════════════
  // VALIDATION
  // ═══════════════════════════════════════════════════════════

  private async validate(projectPath: string): Promise<void> {
    try {
      const stats = await fs.promises.stat(projectPath);
      if (!stats.isDirectory()) {
        throw new Error(`Path "${projectPath}" is not a directory`);
      }
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        await fs.promises.mkdir(projectPath, { recursive: true });
        return;
      }
      if (error.message && error.message.includes('not a directory')) {
        throw error;
      }
      throw new Error(`Cannot access path "${projectPath}": ${error.message}`);
    }

    // Check write permissions by attempting to write a temp file
    const testFile = path.join(projectPath, `.teamspec-init-test-${Date.now()}`);
    try {
      await fs.promises.writeFile(testFile, '', 'utf-8');
      await fs.promises.unlink(testFile);
    } catch {
      throw new Error(`Insufficient permissions to write to ${projectPath}`);
    }
  }

  private canPromptInteractively(): boolean {
    if (this.toolsArg !== undefined) return false;
    return isInteractive({});
  }

  // ═══════════════════════════════════════════════════════════
  // TOOL SELECTION
  // ═══════════════════════════════════════════════════════════

  private async getSelectedTools(
    detectedTools: AIToolOption[],
    projectPath: string
  ): Promise<string[]> {
    const nonInteractiveSelection = this.resolveToolsArg();
    if (nonInteractiveSelection !== null) {
      return nonInteractiveSelection;
    }

    const availableTools = AI_TOOLS.filter((t) => t.skillsDir).map((t) => t.value);
    const detectedToolIds = new Set(detectedTools.map((t) => t.value));
    const canPrompt = this.canPromptInteractively();

    if (!canPrompt) {
      // Non-interactive: use detected tools as fallback
      if (detectedToolIds.size > 0) {
        return [...detectedToolIds];
      }
      throw new Error(
        `No tools detected and no --tools flag provided.\n` +
        `Valid tools:\n  ${availableTools.join('\n  ')}\n\n` +
        `Use --tools all, --tools none, or --tools claude,cursor,...`
      );
    }

    // Interactive: show searchable multi-select
    const { searchableMultiSelect } = await import('../prompts/searchable-multi-select.js');

    const choices = AI_TOOLS.filter((t) => t.skillsDir).map((tool) => {
      const detected = detectedToolIds.has(tool.value);
      return {
        name: tool.name,
        value: tool.value,
        preSelected: detected,
      };
    });

    const selectedTools = await searchableMultiSelect({
      message: `Select tools to set up (${choices.length} available)`,
      pageSize: 15,
      choices,
      validate: (selected: string[]) => selected.length > 0 || 'Select at least one tool',
    });

    if (selectedTools.length === 0) {
      throw new Error('At least one tool must be selected');
    }

    return selectedTools;
  }

  private resolveToolsArg(): string[] | null {
    if (typeof this.toolsArg === 'undefined') {
      return null;
    }

    const raw = this.toolsArg.trim();
    if (raw.length === 0) {
      throw new Error(
        'The --tools option requires a value. Use "all", "none", or a comma-separated list of tool IDs.'
      );
    }

    const availableTools = AI_TOOLS.filter((t) => t.skillsDir).map((t) => t.value);
    const availableSet = new Set(availableTools);
    const availableList = ['all', 'none', ...availableTools].join(', ');

    const lowerRaw = raw.toLowerCase();
    if (lowerRaw === 'all') {
      return availableTools;
    }

    if (lowerRaw === 'none') {
      return [];
    }

    const tokens = raw
      .split(',')
      .map((token) => token.trim())
      .filter((token) => token.length > 0);

    if (tokens.length === 0) {
      throw new Error(
        'The --tools option requires at least one tool ID when not using "all" or "none".'
      );
    }

    const normalizedTokens = tokens.map((token) => token.toLowerCase());

    if (normalizedTokens.some((token) => token === 'all' || token === 'none')) {
      throw new Error('Cannot combine reserved values "all" or "none" with specific tool IDs.');
    }

    const invalidTokens = tokens.filter(
      (_token, index) => !availableSet.has(normalizedTokens[index])
    );

    if (invalidTokens.length > 0) {
      throw new Error(
        `Invalid tool(s): ${invalidTokens.join(', ')}. Available values: ${availableList}`
      );
    }

    // Deduplicate while preserving order
    const deduped: string[] = [];
    for (const token of normalizedTokens) {
      if (!deduped.includes(token)) {
        deduped.push(token);
      }
    }

    return deduped;
  }

  // ═══════════════════════════════════════════════════════════
  // DIRECTORY STRUCTURE
  // ═══════════════════════════════════════════════════════════

  private async createDirectoryStructure(teamspecPath: string): Promise<void> {
    const spinner = ora('Creating TeamSpec structure...').start();

    const directories = [
      teamspecPath,
      path.join(teamspecPath, 'knowledge'),
      path.join(teamspecPath, 'knowledge', 'agents'),
      path.join(teamspecPath, 'knowledge', 'projects'),
      path.join(teamspecPath, 'knowledge', 'templates'),
      path.join(teamspecPath, 'agents'),
    ];

    for (const dir of directories) {
      await fs.promises.mkdir(dir, { recursive: true });
    }

    spinner.stopAndPersist({
      symbol: chalk.white('▌'),
      text: chalk.white('TeamSpec structure created'),
    });
  }

  // ═══════════════════════════════════════════════════════════
  // AGENCY AGENTS CLONE
  // ═══════════════════════════════════════════════════════════

  private async cloneAgencyAgents(agencyRepoPath: string): Promise<void> {
    if (fs.existsSync(agencyRepoPath)) {
      const spinner = ora('Updating agency-agents...').start();
      try {
        execSync('git fetch origin', { cwd: agencyRepoPath, stdio: 'pipe' });
        const config = getGlobalConfig();
        const branch = config.agencyBranch ?? 'main';
        execSync(`git checkout ${branch} && git pull`, { cwd: agencyRepoPath, stdio: 'pipe' });
        spinner.succeed('agency-agents updated');
      } catch {
        spinner.warn('Could not update agency-agents, using existing copy');
      }
      return;
    }

    const config = getGlobalConfig();
    const repoUrl = config.agencyRepoUrl ?? 'https://github.com/msitarzewski/agency-agents.git';
    const branch = config.agencyBranch ?? 'main';

    const spinner = ora(`Cloning ${repoUrl} (${branch})...`).start();

    try {
      execSync(
        `git clone --depth 1 --branch ${branch} ${repoUrl} "${agencyRepoPath}"`,
        { stdio: 'pipe' }
      );
      spinner.succeed('agency-agents cloned');
    } catch (error) {
      spinner.fail('Failed to clone agency-agents');
      throw new Error(
        `Failed to clone agency-agents repository.\n` +
        `Repository URL: ${repoUrl}\n` +
        `Branch: ${branch}\n` +
        `Hint: Check your network connection and verify the repository URL with:\n` +
        `  teamspec config set agencyRepoUrl <url>`
      );
    }
  }

  // ═══════════════════════════════════════════════════════════
  // KNOWLEDGE BASE
  // ═══════════════════════════════════════════════════════════

  private initKnowledgeBase(
    projectPath: string,
    projectName: string,
    manifestPath: string
  ): void {
    initKnowledgeBase({ projectPath, projectName, manifestPath });
  }

  // ═══════════════════════════════════════════════════════════
  // MANIFEST
  // ═══════════════════════════════════════════════════════════

  private async generateManifestFile(
    agencyRepoPath: string,
    manifestPath: string
  ): Promise<void> {
    const spinner = ora('Generating agent manifest...').start();
    try {
      await generateManifest(agencyRepoPath, manifestPath, TEAMSPEC_VERSION);
      spinner.succeed('Agent manifest generated');
    } catch (error) {
      spinner.warn('Could not generate manifest (no agents found)');
    }
  }

  // ═══════════════════════════════════════════════════════════
  // SKILL FILE GENERATION
  // ═══════════════════════════════════════════════════════════

  private async generateSkillFiles(
    projectPath: string,
    toolIds: string[]
  ): Promise<{
    createdSkills: number;
    skippedTools: string[];
  }> {
    const globalConfig = getGlobalConfig();
    const profile: Profile = globalConfig.profile ?? 'core';
    const delivery: Delivery = globalConfig.delivery ?? 'both';
    const workflows = getProfileWorkflows(profile, globalConfig.workflows);
    const shouldGenerateSkills = delivery !== 'commands';

    if (!shouldGenerateSkills) {
      return { createdSkills: 0, skippedTools: toolIds };
    }

    let totalCreated = 0;
    const skippedTools: string[] = [];

    for (const toolId of toolIds) {
      const tool = AI_TOOLS.find((t) => t.value === toolId);
      if (!tool?.skillsDir) {
        skippedTools.push(toolId);
        continue;
      }

      const spinner = ora(`Setting up ${tool.name}...`).start();
      const skillsBaseDir = path.join(projectPath, tool.skillsDir, 'skills');

      try {
        let created = 0;
        for (const workflowId of workflows) {
          const getter = SKILL_TEMPLATE_GETTERS[workflowId];
          if (!getter) continue;

          const skillTemplate = getter();
          const dirName = WORKFLOW_TO_SKILL_DIR[workflowId as keyof typeof WORKFLOW_TO_SKILL_DIR];
          if (!dirName) continue;

          const skillDir = path.join(skillsBaseDir, dirName);
          await fs.promises.mkdir(skillDir, { recursive: true });

          const skillContent = generateSkillContent(
            {
              id: dirName,
              name: skillTemplate.name,
              description: skillTemplate.description,
              instructions: skillTemplate.instructions,
              license: skillTemplate.license,
              compatibility: skillTemplate.compatibility,
              metadata: skillTemplate.metadata,
            },
            TEAMSPEC_VERSION
          );

          const skillFile = path.join(skillDir, 'SKILL.md');
          await fs.promises.writeFile(skillFile, skillContent, 'utf-8');
          created++;
        }

        totalCreated += created;
        spinner.succeed(`Setup complete for ${tool.name} (${created} skills)`);
      } catch (error) {
        spinner.fail(`Failed for ${tool.name}: ${(error as Error).message}`);
        skippedTools.push(toolId);
      }
    }

    return { createdSkills: totalCreated, skippedTools };
  }

  // ═══════════════════════════════════════════════════════════
  // CONFIG FILE
  // ═══════════════════════════════════════════════════════════

  private async createConfig(
    teamspecPath: string,
    projectName: string
  ): Promise<'created' | 'exists' | 'skipped'> {
    const configPath = path.join(teamspecPath, 'config.yaml');
    const configYmlPath = path.join(teamspecPath, 'config.yml');

    if (fs.existsSync(configPath) || fs.existsSync(configYmlPath)) {
      return 'exists';
    }

    const yamlContent = [
      `schema: teamspec`,
      `version: "1.0"`,
      `project:`,
      `  name: ${projectName}`,
      `  createdAt: ${new Date().toISOString()}`,
      ``,
    ].join('\n');

    try {
      await fs.promises.writeFile(configPath, yamlContent, 'utf-8');
      return 'created';
    } catch {
      return 'skipped';
    }
  }

  // ═══════════════════════════════════════════════════════════
  // UI & OUTPUT
  // ═══════════════════════════════════════════════════════════

  private displaySuccessMessage(
    projectPath: string,
    toolIds: string[],
    skillResults: { createdSkills: number; skippedTools: string[] },
    configStatus: 'created' | 'exists' | 'skipped',
    projectName: string
  ): void {
    console.log();
    console.log(chalk.bold('TeamSpec Setup Complete'));
    console.log();

    const toolNames = toolIds
      .filter((id) => !skillResults.skippedTools.includes(id))
      .map((id) => AI_TOOLS.find((t) => t.value === id)?.name ?? id);

    if (toolNames.length > 0) {
      console.log(`Tools: ${toolNames.join(', ')}`);
    }

    if (skillResults.createdSkills > 0) {
      console.log(`Skills: ${skillResults.createdSkills} skill files generated`);
    }

    if (skillResults.skippedTools.length > 0) {
      const skippedNames = skillResults.skippedTools
        .map((id) => AI_TOOLS.find((t) => t.value === id)?.name ?? id)
        .join(', ');
      console.log(chalk.yellow(`Skipped: ${skippedNames}`));
    }

    // Config status
    if (configStatus === 'created') {
      console.log(`Config: teamspec/config.yaml (schema: teamspec, project: ${projectName})`);
    } else if (configStatus === 'exists') {
      console.log('Config: teamspec/config.yaml (exists)');
    } else {
      console.log(chalk.dim('Config: skipped'));
    }

    console.log();
    console.log(chalk.bold('Getting started:'));
    console.log("  Run 'teamspec status' to check workspace health");
    console.log("  Run 'teamspec update' to refresh skills");
    console.log();
    console.log(`Learn more: ${chalk.cyan('https://github.com/msitarzewski/teamspec')}`);
    console.log(`Feedback:   ${chalk.cyan('https://github.com/msitarzewski/teamspec/issues')}`);
    console.log();
  }

  private startSpinner(text: string) {
    return ora({
      text,
      stream: process.stdout,
      color: 'gray',
      spinner: PROGRESS_SPINNER,
    }).start();
  }
}
