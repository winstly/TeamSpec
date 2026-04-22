import * as fs from 'node:fs';
import * as path from 'node:path';
import chalk from 'chalk';
import { AI_TOOLS } from './config.js';
import { getToolStates } from './shared/index.js';
import { getGlobalConfig } from './global-config.js';
import { readManifest, type ManifestData } from './agents/manifest.js';
import { getProfileWorkflows } from './profiles.js';

const TEAMSPEC_DIR_NAME = 'teamspec';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WorkflowState {
  currentPhase: string;
  completedPhases: string[];
  phaseHistory?: string[];
  [key: string]: unknown;
}

interface KnowledgeStats {
  agentRetros: number;
  projectRetros: number;
  templates: number;
  readmeExists: boolean;
}

interface AgentStatus {
  name: string;
  description: string;
  role: string;
}

interface StatusResult {
  teamspecDir: string;
  exists: boolean;
  workflowState: WorkflowState | null;
  manifest: ManifestData | null;
  knowledgeStats: KnowledgeStats | null;
  toolStates: Map<string, { configured: boolean; fullyConfigured: boolean; skillCount: number }>;
}

// ---------------------------------------------------------------------------
// StatusCommand
// ---------------------------------------------------------------------------

export interface StatusCommandOptions {
  json?: boolean;
}

export class StatusCommand {
  private readonly json: boolean;

  constructor(options: StatusCommandOptions = {}) {
    this.json = options.json ?? false;
  }

  async execute(projectPath: string): Promise<void> {
    const result = await this.collectStatus(projectPath);

    if (!result.exists) {
      if (this.json) {
        console.log(JSON.stringify({ teamspecDir: result.teamspecDir, exists: false }));
      } else {
        console.error(chalk.red(`Error: No '${TEAMSPEC_DIR_NAME}' directory found at ${projectPath}`));
        console.error(chalk.dim('Run `teamspec init` to initialize a project.'));
      }
      process.exit(1);
    }

    if (this.json) {
      this.displayStatusJson(result);
    } else {
      this.displayStatus(result);
    }
  }

  // ---------------------------------------------------------------------------
  // Data collection
  // ---------------------------------------------------------------------------

  private async collectStatus(projectPath: string): Promise<StatusResult> {
    const teamspecDir = path.join(projectPath, TEAMSPEC_DIR_NAME);
    const exists = fs.existsSync(teamspecDir);

    const toolStates = getToolStates(projectPath);

    if (!exists) {
      return {
        teamspecDir,
        exists: false,
        workflowState: null,
        manifest: null,
        knowledgeStats: null,
        toolStates,
      };
    }

    const [workflowState, manifest, knowledgeStats] = await Promise.all([
      this.readWorkflowState(teamspecDir),
      this.readAgentManifest(teamspecDir),
      this.readKnowledgeStats(teamspecDir),
    ]);

    return { teamspecDir, exists, workflowState, manifest, knowledgeStats, toolStates };
  }

  private readWorkflowState(teamspecDir: string): WorkflowState | null {
    const statePath = path.join(teamspecDir, 'workflow-state.json');
    if (!fs.existsSync(statePath)) {
      return null;
    }
    try {
      const content = fs.readFileSync(statePath, 'utf-8');
      return JSON.parse(content) as WorkflowState;
    } catch {
      return null;
    }
  }

  private readAgentManifest(teamspecDir: string): ManifestData | null {
    const manifestPath = path.join(teamspecDir, 'agents', 'manifest.json');
    return readManifest(manifestPath);
  }

  private async readKnowledgeStats(teamspecDir: string): Promise<KnowledgeStats | null> {
    const knowledgeDir = path.join(teamspecDir, 'knowledge');
    if (!fs.existsSync(knowledgeDir)) {
      return null;
    }

    const [agentRetros, projectRetros, templates] = await Promise.all([
      this.countFiles(path.join(knowledgeDir, 'agents')),
      this.countFiles(path.join(knowledgeDir, 'projects')),
      this.countFiles(path.join(knowledgeDir, 'templates')),
    ]);

    const readmePath = path.join(knowledgeDir, 'README.md');
    const readmeExists = fs.existsSync(readmePath);

    return { agentRetros, projectRetros, templates, readmeExists };
  }

  private async countFiles(dir: string): Promise<number> {
    if (!fs.existsSync(dir)) {
      return 0;
    }
    try {
      const entries = await fs.promises.readdir(dir, { withFileTypes: true });
      return entries.filter((e) => e.isFile()).length;
    } catch {
      return 0;
    }
  }

  // ---------------------------------------------------------------------------
  // Display
  // ---------------------------------------------------------------------------

  private displayStatusJson(result: StatusResult): void {
    const output = {
      teamspecDir: result.teamspecDir,
      exists: result.exists,
      workflowState: result.workflowState,
      agentCount: result.manifest?.agents.length ?? 0,
      knowledgeStats: result.knowledgeStats,
      toolStates: Object.fromEntries(result.toolStates),
      globalConfig: {
        profile: getGlobalConfig().profile ?? 'core',
        delivery: getGlobalConfig().delivery ?? 'both',
      },
    };
    console.log(JSON.stringify(output, null, 2));
  }

  private displayStatus(result: StatusResult): void {
    console.log(chalk.bold('\nteamspec status\n'));
    console.log('─'.repeat(60));

    this.displayWorkflow(result.workflowState);
    this.displayAgents(result.manifest);
    this.displayKnowledgeStats(result.knowledgeStats);
    this.displayToolStates(result.toolStates);
    this.displayGlobalConfig();

    console.log('─'.repeat(60));
    console.log(chalk.dim(`\nteamspec dir: ${result.teamspecDir}`));
  }

  private displayWorkflow(state: WorkflowState | null): void {
    console.log(chalk.bold('\nWorkflow'));
    console.log('─'.repeat(40));

    if (!state) {
      console.log(chalk.dim('  No workflow state found. Run `teamspec init` or start a workflow.'));
      return;
    }

    console.log(`  ${chalk.cyan('Current Phase:')} ${chalk.bold(state.currentPhase)}`);

    if (state.completedPhases.length > 0) {
      console.log(`  ${chalk.green('Completed Phases:')}`);
      state.completedPhases.forEach((phase) => {
        console.log(`    ${chalk.green('✓')} ${phase}`);
      });
    } else {
      console.log(chalk.dim('  No phases completed yet.'));
    }
  }

  private displayAgents(manifest: ManifestData | null): void {
    console.log(chalk.bold('\nAgents'));
    console.log('─'.repeat(40));

    if (!manifest || manifest.agents.length === 0) {
      console.log(chalk.dim('  No agents found. Run `teamspec init` to set up agents.'));
      return;
    }

    manifest.agents.forEach((agent) => {
      const role = agent.capabilities?.[0] || 'unknown';
      console.log(`  ${chalk.yellow('▸')} ${chalk.bold(agent.name)} ${chalk.dim(`[${role}]`)}`);
      if (agent.description) {
        console.log(chalk.dim(`    ${agent.description}`));
      }
    });
  }

  private displayKnowledgeStats(stats: KnowledgeStats | null): void {
    console.log(chalk.bold('\nKnowledge Base'));
    console.log('─'.repeat(40));

    if (!stats) {
      console.log(chalk.dim('  No knowledge base found.'));
      return;
    }

    const entries = [
      { label: 'Agent Retrospectives', value: stats.agentRetros },
      { label: 'Project Retrospectives', value: stats.projectRetros },
      { label: 'Templates', value: stats.templates },
    ];

    entries.forEach(({ label, value }) => {
      const icon = value > 0 ? chalk.green('●') : chalk.gray('○');
      console.log(`  ${icon} ${label}: ${chalk.bold(String(value))}`);
    });

    const readmeIcon = stats.readmeExists ? chalk.green('●') : chalk.gray('○');
    console.log(`  ${readmeIcon} README.md: ${stats.readmeExists ? chalk.green('present') : chalk.gray('missing')}`);
  }

  private displayToolStates(
    toolStates: Map<string, { configured: boolean; fullyConfigured: boolean; skillCount: number }>
  ): void {
    console.log(chalk.bold('\nTool Skills'));
    console.log('─'.repeat(40));

    let hasAny = false;

    for (const tool of AI_TOOLS) {
      if (!tool.skillsDir) continue;
      hasAny = true;
      const state = toolStates.get(tool.value);
      if (!state) continue;

      const icon = state.fullyConfigured
        ? chalk.green('●')
        : state.configured
          ? chalk.yellow('◐')
          : chalk.gray('○');
      const label = state.fullyConfigured
        ? chalk.green('fully configured')
        : state.configured
          ? chalk.yellow(`partially (${state.skillCount} skills)`)
          : chalk.dim('not configured');

      console.log(`  ${icon} ${chalk.bold(tool.name)}: ${label}`);
    }

    if (!hasAny) {
      console.log(chalk.dim('  No tools with skills support configured.'));
    }
  }

  private displayGlobalConfig(): void {
    console.log(chalk.bold('\nGlobal Config'));
    console.log('─'.repeat(40));

    try {
      const config = getGlobalConfig();
      const profile = config.profile || 'core';
      const delivery = config.delivery || 'both';
      const kb = config.knowledgeBase || 'local';
      const workflows = getProfileWorkflows(profile, config.workflows);

      console.log(`  Profile:  ${chalk.bold(profile)} (${workflows.length} workflows: ${workflows.join(', ')})`);
      console.log(`  Delivery: ${chalk.bold(delivery)}`);
      console.log(`  Knowledge Base: ${chalk.bold(kb)}`);

      const flags = config.featureFlags || {};
      const flagEntries = Object.entries(flags);
      if (flagEntries.length > 0) {
        console.log(`  Feature Flags:`);
        flagEntries.forEach(([key, value]) => {
          const icon = value ? chalk.green('●') : chalk.gray('○');
          console.log(`    ${icon} ${key}: ${value}`);
        });
      }
    } catch {
      console.log(chalk.dim('  Unable to read global config.'));
    }
  }
}
