/**
 * Profile System
 *
 * Defines workflow profiles that control which workflows are installed.
 * Profiles determine WHICH workflows are active for TeamSpec agents.
 */

import type { Profile } from './global-config.js';

/**
 * Core workflows included in the 'core' profile.
 * These provide the full agent collaboration cycle for new users.
 */
export const CORE_WORKFLOWS = ['context', 'recruit', 'plan', 'approve', 'monitor', 'qa', 'retro'] as const;

/**
 * All available workflows in the TeamSpec system.
 */
export const ALL_WORKFLOWS = [
  'context',
  'recruit',
  'plan',
  'approve',
  'monitor',
  'qa',
  'retro',
] as const;

export type WorkflowId = (typeof ALL_WORKFLOWS)[number];
export type CoreWorkflowId = (typeof CORE_WORKFLOWS)[number];

/**
 * Resolves which workflows should be active for a given profile configuration.
 *
 * - 'core' profile always returns CORE_WORKFLOWS
 * - 'custom' profile returns the provided customWorkflows, or empty array if not provided
 */
export function getProfileWorkflows(
  profile: Profile,
  customWorkflows?: string[]
): readonly string[] {
  if (profile === 'custom') {
    return customWorkflows ?? [];
  }
  return CORE_WORKFLOWS;
}
