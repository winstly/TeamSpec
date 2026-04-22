/**
 * Profile System
 *
 * Defines workflow profiles that control which workflows are installed.
 * Profiles determine WHICH workflows; delivery (in global config) determines HOW.
 *
 * Three profiles:
 * - 'quick':  2 workflows — propose + retro (small projects, one-step)
 * - 'core':   6 workflows — context → team → plan → execute → verify → retro (full pipeline)
 * - 'custom': user selects from ALL_WORKFLOWS
 */

import type { Profile } from './global-config.js';

/**
 * Quick workflows for small, well-defined tasks.
 * The propose workflow creates context + team + plan in one step.
 */
export const QUICK_WORKFLOWS = ['propose', 'retro'] as const;

/**
 * Core workflows included in the 'core' profile.
 * These provide the full agent collaboration cycle for new users.
 */
export const CORE_WORKFLOWS = ['context', 'team', 'plan', 'execute', 'verify', 'retro'] as const;

/**
 * All available workflows in the TeamSpec system.
 */
export const ALL_WORKFLOWS = [
  'propose',
  'context',
  'team',
  'plan',
  'execute',
  'verify',
  'retro',
] as const;

export type WorkflowId = (typeof ALL_WORKFLOWS)[number];
export type CoreWorkflowId = (typeof CORE_WORKFLOWS)[number];

/**
 * Resolves which workflows should be active for a given profile configuration.
 *
 * - 'quick' profile returns QUICK_WORKFLOWS (propose + retro)
 * - 'core' profile always returns CORE_WORKFLOWS (full pipeline)
 * - 'custom' profile returns the provided customWorkflows, or empty array if not provided
 */
export function getProfileWorkflows(
  profile: Profile,
  customWorkflows?: string[]
): readonly string[] {
  switch (profile) {
    case 'quick':
      return QUICK_WORKFLOWS;
    case 'core':
      return CORE_WORKFLOWS;
    case 'custom':
      return customWorkflows ?? [];
  }
}
