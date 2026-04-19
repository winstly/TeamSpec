/**
 * Command Adapter Registry
 *
 * Centralized registry for tool command and skill adapters.
 */

import type { ToolCommandAdapter, ToolSkillAdapter } from './types.js';
import { claudeCommandAdapter, claudeSkillAdapter } from './adapters/claude.js';
import { cursorCommandAdapter, cursorSkillAdapter } from './adapters/cursor.js';
import { windsurfCommandAdapter, windsurfSkillAdapter } from './adapters/windsurf.js';
import { geminiCommandAdapter, geminiSkillAdapter } from './adapters/gemini.js';

/**
 * Registry for looking up tool command adapters.
 */
export class CommandAdapterRegistry {
  private static adapters: Map<string, ToolCommandAdapter> = new Map();

  // Static initializer - register built-in adapters
  static {
    CommandAdapterRegistry.register(claudeCommandAdapter);
    CommandAdapterRegistry.register(cursorCommandAdapter);
    CommandAdapterRegistry.register(windsurfCommandAdapter);
    CommandAdapterRegistry.register(geminiCommandAdapter);
  }

  /**
   * Register a tool command adapter.
   * @param adapter - The adapter to register
   */
  static register(adapter: ToolCommandAdapter): void {
    CommandAdapterRegistry.adapters.set(adapter.toolId, adapter);
  }

  /**
   * Get an adapter by tool ID.
   * @param toolId - The tool identifier (e.g., 'claude', 'cursor')
   * @returns The adapter or undefined if not registered
   */
  static get(toolId: string): ToolCommandAdapter | undefined {
    return CommandAdapterRegistry.adapters.get(toolId);
  }

  /**
   * Get all registered adapters.
   * @returns Array of all registered adapters
   */
  static getAll(): ToolCommandAdapter[] {
    return Array.from(CommandAdapterRegistry.adapters.values());
  }

  /**
   * Check if an adapter is registered for a tool.
   * @param toolId - The tool identifier
   * @returns True if an adapter exists
   */
  static has(toolId: string): boolean {
    return CommandAdapterRegistry.adapters.has(toolId);
  }
}

/**
 * Registry for looking up tool skill adapters.
 */
export class SkillAdapterRegistry {
  private static adapters: Map<string, ToolSkillAdapter> = new Map();

  // Static initializer - register built-in adapters
  static {
    SkillAdapterRegistry.register(claudeSkillAdapter);
    SkillAdapterRegistry.register(cursorSkillAdapter);
    SkillAdapterRegistry.register(windsurfSkillAdapter);
    SkillAdapterRegistry.register(geminiSkillAdapter);
  }

  /**
   * Register a tool skill adapter.
   * @param adapter - The adapter to register
   */
  static register(adapter: ToolSkillAdapter): void {
    SkillAdapterRegistry.adapters.set(adapter.toolId, adapter);
  }

  /**
   * Get an adapter by tool ID.
   * @param toolId - The tool identifier (e.g., 'claude', 'cursor')
   * @returns The adapter or undefined if not registered
   */
  static get(toolId: string): ToolSkillAdapter | undefined {
    return SkillAdapterRegistry.adapters.get(toolId);
  }

  /**
   * Get all registered adapters.
   * @returns Array of all registered adapters
   */
  static getAll(): ToolSkillAdapter[] {
    return Array.from(SkillAdapterRegistry.adapters.values());
  }

  /**
   * Check if an adapter is registered for a tool.
   * @param toolId - The tool identifier
   * @returns True if an adapter exists
   */
  static has(toolId: string): boolean {
    return SkillAdapterRegistry.adapters.has(toolId);
  }
}
