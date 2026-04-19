#!/usr/bin/env node
/**
 * TeamSpec CLI
 *
 * Main entry point for the teamspec command-line interface.
 * Supports: init, update, status, config get/set/list commands.
 */

import { Command } from 'commander';
import { createRequire } from 'module';
import ora from 'ora';
import path from 'path';
import { promises as fs, existsSync, readFileSync } from 'fs';
import chalk from 'chalk';
import Confirm from '@inquirer/confirm';
import Select from '@inquirer/select';
import Checkbox from '@inquirer/checkbox';
import {
  getGlobalConfig,
  getGlobalConfigPath,
  saveGlobalConfig,
  type GlobalConfig,
  type Profile,
  type Delivery,
} from '../core/global-config.js';
import {
  getNestedValue,
  setNestedValue,
  deleteNestedValue,
  coerceValue,
  formatValueYaml,
  validateConfigKeyPath,
  validateConfig,
  DEFAULT_CONFIG,
} from '../core/config-schema.js';
import { CORE_WORKFLOWS, ALL_WORKFLOWS, getProfileWorkflows } from '../core/profiles.js';
import { hasProjectConfigDrift } from '../core/profile-sync-drift.js';
import { AI_TOOLS } from '../core/config.js';

const require = createRequire(import.meta.url);
const { version } = require('../../package.json');

const program = new Command();

program
  .name('teamspec')
  .description('AI agent team collaboration framework')
  .version(version);

program.option('--no-color', 'Disable color output');

program.hook('preAction', (thisCommand) => {
  const opts = thisCommand.opts();
  if (opts.color === false) {
    process.env.NO_COLOR = '1';
  }
});

// ═══════════════════════════════════════════════════════════
// INIT COMMAND
// ═══════════════════════════════════════════════════════════

program
  .command('init [path]')
  .description('Initialize a TeamSpec workspace in your project')
  .option(
    '--tools <tools>',
    'Configure AI tools non-interactively. Use "all", "none", or a comma-separated list of: ' +
      AI_TOOLS.filter((t) => t.skillsDir).map((t) => t.value).join(', ')
  )
  .option('--project-name <name>', 'Set the project name in config.yaml')
  .option('--skip-agents', 'Skip cloning the agency-agents repository')
  .action(
    async (
      targetPath: string | undefined,
      options: { tools?: string; projectName?: string; skipAgents?: boolean }
    ) => {
      try {
        const resolvedPath = path.resolve(targetPath ?? '.');

        try {
          const stats = await fs.stat(resolvedPath);
          if (!stats.isDirectory()) {
            throw new Error(`Path "${targetPath}" is not a directory`);
          }
        } catch (error: any) {
          if (error.code === 'ENOENT') {
            console.log(`Directory "${targetPath}" doesn't exist, it will be created.`);
          } else if (error.message && error.message.includes('not a directory')) {
            throw error;
          } else {
            throw new Error(`Cannot access path "${targetPath}": ${error.message}`);
          }
        }

        const { InitCommand } = await import('../core/init.js');
        const initCommand = new InitCommand({
          tools: options.tools,
          projectName: options.projectName,
          skipAgents: options.skipAgents ?? false,
        });
        await initCommand.execute(resolvedPath);
      } catch (error) {
        console.log();
        ora().fail(`Error: ${(error as Error).message}`);
        process.exit(1);
      }
    }
  );

// ═══════════════════════════════════════════════════════════
// UPDATE COMMAND
// ═══════════════════════════════════════════════════════════

program
  .command('update [path]')
  .description('Update TeamSpec skill files and agent manifests')
  .option('--tools <tools>', 'Restrict update to specific tools')
  .option('--skills-only', 'Only update skill files (skip manifest)')
  .option('--agents-only', 'Only update agent manifest (skip skills)')
  .option('--force', 'Force regeneration even when up to date')
  .action(
    async (
      targetPath: string | undefined,
      options: { tools?: string; skillsOnly?: boolean; agentsOnly?: boolean; force?: boolean }
    ) => {
      try {
        const resolvedPath = path.resolve(targetPath ?? '.');
        const { UpdateCommand } = await import('../core/update.js');
        const updateCommand = new UpdateCommand({
          tools: options.tools,
          skillsOnly: options.skillsOnly ?? false,
          agentsOnly: options.agentsOnly ?? false,
          force: options.force ?? false,
        });
        await updateCommand.execute(resolvedPath);
      } catch (error) {
        console.log();
        ora().fail(`Error: ${(error as Error).message}`);
        process.exit(1);
      }
    }
  );

// ═══════════════════════════════════════════════════════════
// STATUS COMMAND
// ═══════════════════════════════════════════════════════════

program
  .command('status [path]')
  .description('Show TeamSpec workspace health and configured tools')
  .option('--json', 'Output status as JSON')
  .option('-p, --path <path>', 'Project path (default: current working directory)', process.cwd())
  .action(
    async (
      _targetPath: string | undefined,
      options: { path?: string; json?: boolean }
    ) => {
      try {
        const projectPath = path.resolve(_targetPath ?? options.path ?? process.cwd());
        const { StatusCommand } = await import('../core/status.js');
        const statusCommand = new StatusCommand({ json: options.json ?? false });
        await statusCommand.execute(projectPath);
      } catch (error) {
        console.log();
        ora().fail(`Error: ${(error as Error).message}`);
        process.exit(1);
      }
    }
  );

// ═══════════════════════════════════════════════════════════
// CONFIG COMMAND
// ═══════════════════════════════════════════════════════════

function registerConfigCommand(cmd: Command): void {
  const configCmd = cmd
    .command('config')
    .description('View and modify global TeamSpec configuration');

  // config path
  configCmd
    .command('path')
    .description('Show config file location')
    .action(() => {
      console.log(getGlobalConfigPath());
    });

  // config list
  configCmd
    .command('list')
    .description('Show all current settings')
    .option('--json', 'Output as JSON')
    .action((options: { json?: boolean }) => {
      const config = getGlobalConfig();

      if (options.json) {
        console.log(JSON.stringify(config, null, 2));
        return;
      }

      console.log(formatValueYaml(config));

      // Read raw config to determine which values are explicit vs defaults
      const configPath = getGlobalConfigPath();
      let rawConfig: Record<string, unknown> = {};
      try {
        if (existsSync(configPath)) {
          rawConfig = JSON.parse(readFileSync(configPath, 'utf-8'));
        }
      } catch {
        // If reading fails, treat all as defaults
      }

      const profileSource = rawConfig.profile !== undefined ? '(explicit)' : '(default)';
      const deliverySource = rawConfig.delivery !== undefined ? '(explicit)' : '(default)';
      console.log(`\nProfile settings:`);
      console.log(`  profile: ${config.profile ?? 'core'} ${profileSource}`);
      console.log(`  delivery: ${config.delivery ?? 'both'} ${deliverySource}`);
      if ((config.profile as Profile) === 'core') {
        console.log(`  workflows: ${CORE_WORKFLOWS.join(', ')} (from core profile)`);
      } else if (config.workflows && config.workflows.length > 0) {
        console.log(`  workflows: ${config.workflows.join(', ')} (explicit)`);
      } else {
        console.log(`  workflows: (none)`);
      }
    });

  // config get
  configCmd
    .command('get <key>')
    .description('Get a specific configuration value (raw, scriptable)')
    .action((key: string) => {
      const config = getGlobalConfig();
      const value = getNestedValue(config as Record<string, unknown>, key);

      if (value === undefined) {
        process.exitCode = 1;
        return;
      }

      if (typeof value === 'object' && value !== null) {
        console.log(JSON.stringify(value));
      } else {
        console.log(String(value));
      }
    });

  // config set
  configCmd
    .command('set <key> <value>')
    .description('Set a configuration value (auto-coerce types: true/false, numbers, strings)')
    .option('--string', 'Force the value to be stored as a string')
    .option('--allow-unknown', 'Allow setting unknown configuration keys')
    .action(
      (
        key: string,
        value: string,
        options: { string?: boolean; allowUnknown?: boolean }
      ) => {
        const allowUnknown = Boolean(options.allowUnknown);
        const keyValidation = validateConfigKeyPath(key);
        if (!keyValidation.valid && !allowUnknown) {
          const reason = keyValidation.reason ? ` ${keyValidation.reason}.` : '';
          console.error(`Error: Invalid configuration key "${key}".${reason}`);
          console.error('Use "teamspec config list" to see available keys.');
          console.error('Pass --allow-unknown to bypass this check.');
          process.exitCode = 1;
          return;
        }

        const config = getGlobalConfig() as Record<string, unknown>;
        const coercedValue = coerceValue(value, options.string || false);

        // Validate before saving
        const newConfig = JSON.parse(JSON.stringify(config));
        setNestedValue(newConfig, key, coercedValue);

        const validation = validateConfig(newConfig);
        if (!validation.success) {
          console.error(`Error: Invalid configuration — ${validation.error}`);
          process.exitCode = 1;
          return;
        }

        setNestedValue(config, key, coercedValue);
        saveGlobalConfig(config as GlobalConfig);

        const displayValue =
          typeof coercedValue === 'string' ? `"${coercedValue}"` : String(coercedValue);
        console.log(`Set ${key} = ${displayValue}`);
      }
    );

  // config unset
  configCmd
    .command('unset <key>')
    .description('Remove a configuration key (revert to default)')
    .action((key: string) => {
      const config = getGlobalConfig() as Record<string, unknown>;
      const existed = deleteNestedValue(config, key);

      if (existed) {
        saveGlobalConfig(config as GlobalConfig);
        console.log(`Unset ${key} (reverted to default)`);
      } else {
        console.log(`Key "${key}" was not set`);
      }
    });

  // config reset
  configCmd
    .command('reset')
    .description('Reset all configuration to defaults')
    .option('--all', 'Required flag to confirm reset')
    .option('-y, --yes', 'Skip confirmation prompts')
    .action(async (options: { all?: boolean; yes?: boolean }) => {
      if (!options.all) {
        console.error('Error: --all flag is required for reset');
        console.error('Usage: teamspec config reset --all [-y]');
        process.exitCode = 1;
        return;
      }

      if (!options.yes) {
        let confirmed: boolean;
        try {
          confirmed = await Confirm({
            message: 'Reset all configuration to defaults?',
            default: false,
          });
        } catch (error) {
          if (isPromptCancellationError(error)) {
            console.log('Reset cancelled.');
            process.exitCode = 130;
            return;
          }
          throw error;
        }

        if (!confirmed) {
          console.log('Reset cancelled.');
          return;
        }
      }

      saveGlobalConfig({ ...DEFAULT_CONFIG });
      console.log('Configuration reset to defaults');
    });

  // config profile
  configCmd
    .command('profile [preset]')
    .description(
      'Configure workflow profile (interactive picker, or use preset shortcut: teamspec config profile core)'
    )
    .action(async (preset?: string) => {
      if (preset === 'core') {
        const config = getGlobalConfig();
        config.profile = 'core';
        config.workflows = [...CORE_WORKFLOWS];
        saveGlobalConfig(config);
        console.log('Config updated. Run `teamspec update` in your projects to apply.');
        return;
      }

      if (preset) {
        console.error(`Error: Unknown profile preset "${preset}". Available presets: core`);
        process.exitCode = 1;
        return;
      }

      if (!process.stdout.isTTY) {
        console.error(
          'Interactive mode required. Use `teamspec config profile core` or set config via environment/flags.'
        );
        process.exitCode = 1;
        return;
      }

      try {
        const config = getGlobalConfig();
        const currentProfile: Profile = config.profile ?? 'core';
        const currentDelivery: Delivery = config.delivery ?? 'both';
        const currentWorkflows = [...getProfileWorkflows(currentProfile, config.workflows)];

        console.log(chalk.bold('\nCurrent profile settings'));
        console.log(`  Delivery: ${currentDelivery}`);
        console.log(`  Workflows: ${currentWorkflows.length} selected (${currentProfile})`);
        console.log(chalk.dim('  Delivery = where workflows are installed (skills, commands, or both)'));
        console.log(chalk.dim('  Workflows = which agent workflows are available'));
        console.log();

        type ConfigAction = 'both' | 'delivery' | 'workflows' | 'keep';
        const action = await Select<ConfigAction>({
          message: 'What do you want to configure?',
          choices: [
            { value: 'both' as ConfigAction, name: 'Delivery and workflows' },
            { value: 'delivery' as ConfigAction, name: 'Delivery only' },
            { value: 'workflows' as ConfigAction, name: 'Workflows only' },
            { value: 'keep' as ConfigAction, name: 'Keep current settings (exit)' },
          ],
        });

        if (action === 'keep') {
          maybeWarnConfigDrift(process.cwd(), currentDelivery, currentWorkflows, chalk.yellow);
          return;
        }

        let nextDelivery = currentDelivery;
        let nextWorkflows = [...currentWorkflows];
        let nextProfile: Profile = currentProfile;

        if (action === 'both' || action === 'delivery') {
          const deliveryChoices: { value: Delivery; name: string }[] = [
            { value: 'both', name: 'Both (skills + commands)' },
            { value: 'skills', name: 'Skills only' },
            { value: 'commands', name: 'Commands only' },
          ];

          nextDelivery = await Select<Delivery>({
            message: 'Delivery mode:',
            choices: deliveryChoices,
            default: currentDelivery,
          });
        }

        if (action === 'both' || action === 'workflows') {
          const workflowChoices = ALL_WORKFLOWS.map((workflow) => ({
            value: workflow,
            name: workflow,
            checked: currentWorkflows.includes(workflow),
          }));

          nextWorkflows = await Checkbox<string>({
            message: 'Select workflows to make available:',
            instructions: 'Space to toggle, Enter to confirm',
            pageSize: ALL_WORKFLOWS.length,
            theme: { icon: { checked: '[x]', unchecked: '[ ]' } },
            choices: workflowChoices,
          });

          const isCoreMatch =
            nextWorkflows.length === CORE_WORKFLOWS.length &&
            CORE_WORKFLOWS.every((w) => nextWorkflows.includes(w));
          nextProfile = isCoreMatch ? 'core' : 'custom';
        }

        config.profile = nextProfile;
        config.delivery = nextDelivery;
        config.workflows = nextWorkflows;
        saveGlobalConfig(config);

        console.log('Config updated. Run `teamspec update` in your projects to apply.');
      } catch (error) {
        if (isPromptCancellationError(error)) {
          console.log('Config profile cancelled.');
          process.exitCode = 130;
          return;
        }
        throw error;
      }
    });
}

function isPromptCancellationError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === 'ExitPromptError' ||
      error.message.includes('force closed the prompt with SIGINT'))
  );
}

function maybeWarnConfigDrift(
  projectDir: string,
  delivery: Delivery,
  workflows: string[],
  colorize: (message: string) => string
): void {
  const teamspecDir = path.join(projectDir, 'teamspec');
  if (!existsSync(teamspecDir)) {
    return;
  }
  if (!hasProjectConfigDrift(projectDir, workflows, delivery)) {
    return;
  }
  console.log(
    colorize(
      'Warning: Global config is not applied to this project. Run `teamspec update` to sync.'
    )
  );
}

registerConfigCommand(program);

program.parse();
