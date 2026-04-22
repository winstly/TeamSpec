/**
 * Command Generation Types
 *
 * Tool-agnostic interfaces for command generation.
 * These types separate "what to generate" from "how to format it".
 */

/**
 * Tool-agnostic command data.
 * Represents the content of a command without any tool-specific formatting.
 */
export interface CommandContent {
  /** Command identifier (e.g., 'explore', 'apply', 'new') */
  id: string;
  /** Human-readable name (e.g., 'TeamSpec Explore') */
  name: string;
  /** Brief description of command purpose */
  description: string;
  /** Grouping category (e.g., 'Workflow') */
  category: string;
  /** Array of tag strings */
  tags: string[];
  /** The command instruction content (body text) */
  body: string;
}

/**
 * Skill template as defined by the skill generator.
 * Used internally by skill template functions.
 */
export interface SkillTemplate {
  name: string;
  description: string;
  instructions: string;
  license?: string;
  compatibility?: string;
  metadata?: {
    author?: string;
    version?: string;
    generatedBy?: string;
  };
}

/**
 * Tool-agnostic skill data.
 * Represents the content of a skill without any tool-specific formatting.
 */
export interface SkillContent {
  /** Skill identifier (e.g., 'teamspec-context', 'teamspec-team') */
  id: string;
  /** Skill name */
  name: string;
  /** Brief description of skill purpose */
  description: string;
  /** License (defaults to MIT) */
  license?: string;
  /** Compatibility statement */
  compatibility?: string;
  /** Skill metadata */
  metadata?: {
    author?: string;
    version?: string;
    generatedBy?: string;
  };
  /** The skill instruction content (body text) */
  instructions: string;
}

/**
 * Skill template entry for the knowledge base.
 */
export interface SkillTemplateEntry {
  id: string;
  name: string;
  description: string;
  instructions: string;
}

/**
 * Command template entry for the knowledge base.
 */
export interface CommandTemplateEntry {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  body: string;
}

/**
 * Per-tool formatting strategy for commands.
 * Each AI tool implements this interface to handle its specific file path
 * and frontmatter format requirements.
 */
export interface ToolCommandAdapter {
  /** Tool identifier matching AIToolOption.value (e.g., 'claude', 'cursor') */
  toolId: string;
  /**
   * Returns the file path for a command.
   * @param commandId - The command identifier (e.g., 'explore')
   * @returns Path from project root (e.g., '.claude/commands/teamspec/explore.md')
   */
  getFilePath(commandId: string): string;
  /**
   * Formats the complete file content including frontmatter.
   * @param content - The tool-agnostic command content
   * @returns Complete file content ready to write
   */
  formatFile(content: CommandContent): string;
}

/**
 * Per-tool formatting strategy for skills.
 * Each AI tool implements this interface to handle its specific file path
 * and frontmatter format requirements.
 */
export interface ToolSkillAdapter {
  /** Tool identifier matching AIToolOption.value (e.g., 'claude', 'cursor') */
  toolId: string;
  /**
   * Returns the directory path for a skill.
   * @param skillId - The skill identifier (e.g., 'teamspec-context')
   * @returns Path from project root (e.g., '.claude/skills/teamspec-context/')
   */
  getFilePath(skillId: string): string;
  /**
   * Formats the complete file content including frontmatter.
   * @param content - The tool-agnostic skill content
   * @returns Complete file content ready to write
   */
  formatFile(content: SkillContent): string;
}

/**
 * Result of generating a command file.
 */
export interface GeneratedCommand {
  /** File path from project root */
  path: string;
  /** Complete file content (frontmatter + body) */
  fileContent: string;
}

/**
 * Result of generating a skill file.
 */
export interface GeneratedSkill {
  /** File path from project root */
  path: string;
  /** Complete file content (frontmatter + body) */
  fileContent: string;
}
