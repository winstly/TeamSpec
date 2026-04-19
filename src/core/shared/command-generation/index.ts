/**
 * Command Generation Module
 *
 * Generic command generation system with tool-specific adapters.
 *
 * Usage:
 * ```typescript
 * import { generateCommands, CommandAdapterRegistry, type CommandContent } from './command-generation/index.js';
 *
 * const contents: CommandContent[] = [...];
 * const adapter = CommandAdapterRegistry.get('cursor');
 * if (adapter) {
 *   const commands = generateCommands(contents, adapter);
 *   // Write commands to disk
 * }
 * ```
 */

// Types
export type {
  CommandContent,
  SkillContent,
  SkillTemplateEntry,
  CommandTemplateEntry,
  ToolCommandAdapter,
  ToolSkillAdapter,
  GeneratedCommand,
  GeneratedSkill,
} from './types.js';

// Registry
export { CommandAdapterRegistry, SkillAdapterRegistry } from './registry.js';

// Generator functions
export { generateCommand, generateCommands, generateSkill, generateSkills } from './generator.js';

// Adapters (for direct access if needed)
export {
  claudeCommandAdapter,
  claudeSkillAdapter,
  cursorCommandAdapter,
  cursorSkillAdapter,
  windsurfCommandAdapter,
  windsurfSkillAdapter,
  geminiCommandAdapter,
  geminiSkillAdapter,
} from './adapters/index.js';
