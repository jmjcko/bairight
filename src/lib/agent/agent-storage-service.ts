/**
 * Agent Storage Service
 * Manages persistence of custom agents in localStorage and handles .agent.md downloads/imports.
 * Implements PRD Section 6.3 (Agent Persistence in Portable Format).
 */

import { 
  UniversalAgentDefinition, 
  INITIAL_UNIVERSAL_AGENTS, 
  serializeAgentToMarkdown, 
  parseAgentFromMarkdown 
} from './universal-agent-schema';

const STORAGE_KEY = 'bairight_all_agents_v2';
const LEGACY_STORAGE_KEY = 'bairight_custom_agents_v1';

export class AgentStorageService {
  /**
   * Retrieves all agents (presets + custom agents, or empty if user deleted them all)
   */
  static getAllAgents(): UniversalAgentDefinition[] {
    if (typeof window === 'undefined') {
      return [];
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Filter out legacy default presets so they don't linger in localStorage
          return parsed.filter(
            (a) => !a.id.startsWith('preset_') && a.id !== 'running_shoes' && a.id !== 'ergo_seating' && a.id !== 'coffee_machines'
          );
        }
        return [];
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      return [];
    } catch (e) {
      console.error('Failed to load agents from localStorage:', e);
      return [];
    }
  }

  /**
   * Saves a new or modified custom agent
   */
  static saveAgent(agent: UniversalAgentDefinition): void {
    if (typeof window === 'undefined') return;

    try {
      const existing = this.getAllAgents();
      const updated = [
        ...existing.filter((a) => a.id !== agent.id),
        { ...agent, isCustom: true, updatedAt: new Date().toISOString() },
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save agent to localStorage:', e);
    }
  }

  /**
   * Deletes ANY agent by ID (including default presets)
   */
  static deleteAgent(agentId: string): boolean {
    if (typeof window === 'undefined') return false;

    try {
      const existing = this.getAllAgents();
      const filtered = existing.filter((a) => a.id !== agentId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      return true;
    } catch (e) {
      console.error('Failed to delete agent:', e);
      return false;
    }
  }

  /**
   * Deletes ALL agents from the library
   */
  static deleteAllAgents(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    } catch (e) {
      console.error('Failed to delete all agents:', e);
    }
  }

  /**
   * Resets the agent library back to initial default presets
   */
  static resetToDefaults(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...INITIAL_UNIVERSAL_AGENTS]));
    } catch (e) {
      console.error('Failed to reset agents to defaults:', e);
    }
  }

  /**
   * Gets only user-created custom agents
   */
  static getCustomAgents(): UniversalAgentDefinition[] {
    const all = this.getAllAgents();
    return all.filter((a) => a.isCustom);
  }

  /**
   * Downloads an agent as a portable `.agent.md` file
   */
  static downloadAgentMarkdown(agent: UniversalAgentDefinition): void {
    if (typeof window === 'undefined') return;

    const markdown = serializeAgentToMarkdown(agent);
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${agent.id || 'shopping'}.agent.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Imports an agent from a `.agent.md` text content
   */
  static importAgentFromMarkdown(markdownContent: string): UniversalAgentDefinition {
    const agent = parseAgentFromMarkdown(markdownContent);
    this.saveAgent(agent);
    return agent;
  }
}
