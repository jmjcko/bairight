/**
 * Agent Storage Service
 * Manages persistence of custom agents in localStorage and handles .agent.md downloads/imports.
 * Implements PRD Section 6.3 (Agent Persistence in Portable Format).
 * Implements Cloud Sync for authenticated users with Supabase (Zero-Knowledge: BYOK keys are NEVER stored in DB).
 */

import { 
  UniversalAgentDefinition, 
  INITIAL_UNIVERSAL_AGENTS, 
  serializeAgentToMarkdown, 
  parseAgentFromMarkdown, 
  resolveAgentIcon 
} from './universal-agent-schema';
import { supabase } from '@/lib/supabase';

const STORAGE_KEY = 'bairight_all_agents_v2';
const LEGACY_STORAGE_KEY = 'bairight_custom_agents_v1';

export class AgentStorageService {
  /**
   * Checks if Supabase client is configured for cloud persistence
   */
  static isCloudSyncEnabled(): boolean {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const key =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      "";
    return Boolean(
      supabase &&
      url &&
      !url.includes("placeholder") &&
      key &&
      !key.includes("placeholder")
    );
  }

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
          return parsed
            .filter(
              (a) => !a.id.startsWith('preset_') && a.id !== 'running_shoes' && a.id !== 'ergo_seating' && a.id !== 'coffee_machines'
            )
            .map((a) => ({
              ...a,
              icon: resolveAgentIcon(a.icon, `${a.name} ${a.category}`),
            }));
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
   * Saves a new or modified custom agent locally and syncs to Supabase if userId is provided
   */
  static saveAgent(agent: UniversalAgentDefinition, userId?: string): void {
    if (typeof window === 'undefined') return;

    try {
      // Defensive credential sanitization (CodeGuard-1 / OWASP Secret Leakage Prevention)
      const cleanAgent = { ...agent } as any;
      delete cleanAgent.apiKey;
      delete cleanAgent.apiKeys;
      delete cleanAgent.serverSecret;
      delete cleanAgent.token;
      delete cleanAgent.secret;
      delete cleanAgent.password;

      const existing = this.getAllAgents();
      const updatedAgent: UniversalAgentDefinition = {
        ...cleanAgent,
        icon: resolveAgentIcon(agent.icon, `${agent.name} ${agent.category}`),
        isCustom: true,
        updatedAt: new Date().toISOString(),
      };

      const updated = [
        ...existing.filter((a) => a.id !== agent.id),
        updatedAgent,
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

      // Asynchronous cloud persistence for logged in users (NEVER includes BYOK keys)
      if (userId && this.isCloudSyncEnabled()) {
        void (async () => {
          try {
            const { error } = await supabase
              .from('agents')
              .upsert(
                {
                  user_id: userId,
                  agent_slug: updatedAgent.id, status: updatedAgent.isPurchased ? 'purchased' : 'active',
                  name: updatedAgent.name,
                  category: updatedAgent.category,
                  icon: updatedAgent.icon || '',
                  definition: updatedAgent,
                  is_purchased: Boolean(updatedAgent.isPurchased),
                  purchased_at: updatedAgent.purchasedAt || null,
                  updated_at: updatedAgent.updatedAt,
                },
                { onConflict: 'user_id, agent_slug' }
              );
            if (error) {
              console.warn('Could not persist agent to cloud DB:', error.message);
            }
          } catch (err) {
            console.warn('Cloud sync error for saveAgent:', err);
          }
        })();
      }
    } catch (e) {
      console.error('Failed to save agent to localStorage:', e);
    }
  }

  /**
   * Synchronizes local agents with cloud database for an authenticated user
   */
  static async syncWithCloud(userId: string): Promise<UniversalAgentDefinition[]> {
    if (!userId || typeof window === 'undefined') {
      return this.getAllAgents();
    }

    const localAgents = this.getAllAgents();

    if (!this.isCloudSyncEnabled()) {
      return localAgents;
    }

    try {
      // 1. Fetch remote agents for this user from Supabase
      const { data: remoteRows, error } = await supabase
        .from('agents')
        .select('*')
        .eq('user_id', userId);

      if (error || !remoteRows) {
        console.warn('Error fetching cloud agents:', error?.message);
        return localAgents;
      }

      const remoteAgents: UniversalAgentDefinition[] = remoteRows.map((r: any) => {
        const def = r.definition || {};
        return {
          ...def,
          id: r.agent_slug || def.id,
          name: r.name || def.name,
          category: r.category || def.category,
          isPurchased: Boolean(r.is_purchased),
          purchasedAt: r.purchased_at || def.purchasedAt,
          updatedAt: r.updated_at || def.updatedAt,
          isCustom: true,
          icon: resolveAgentIcon(r.icon || def.icon, `${r.name} ${r.category}`),
        };
      });

      // 2. Merge local and remote agents
      const agentMap = new Map<string, UniversalAgentDefinition>();

      // Put remote agents first
      remoteAgents.forEach((ra) => agentMap.set(ra.id, ra));

      // Merge local agents: if local is missing from remote, prepare to upload
      const agentsToUpload: UniversalAgentDefinition[] = [];

      localAgents.forEach((la) => {
        const existing = agentMap.get(la.id);
        if (!existing) {
          agentMap.set(la.id, la);
          agentsToUpload.push(la);
        } else {
          // If local has newer timestamp, keep local and update remote
          const localTime = la.updatedAt ? new Date(la.updatedAt).getTime() : 0;
          const remoteTime = existing.updatedAt ? new Date(existing.updatedAt).getTime() : 0;
          if (localTime > remoteTime) {
            agentMap.set(la.id, la);
            agentsToUpload.push(la);
          }
        }
      });

      // 3. Upload missing/updated local agents to cloud
      if (agentsToUpload.length > 0) {
        const rowsToUpsert = agentsToUpload.map((a) => ({
          user_id: userId,
          agent_slug: a.id, status: a.isPurchased ? 'purchased' : 'active',
          name: a.name,
          category: a.category,
          icon: a.icon || '',
          definition: a,
          is_purchased: Boolean(a.isPurchased),
          purchased_at: a.purchasedAt || null,
          updated_at: a.updatedAt || new Date().toISOString(),
        }));

        void (async () => {
          try {
            const { error: upsertErr } = await supabase
              .from('agents')
              .upsert(rowsToUpsert, { onConflict: 'user_id, agent_slug' });
            if (upsertErr) console.warn('Sync upsert error:', upsertErr.message);
          } catch (err) {
            console.warn('Sync upsert exception:', err);
          }
        })();
      }

      // 4. Update local storage with merged collection
      const mergedList = Array.from(agentMap.values());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedList));
      return mergedList;
    } catch (err) {
      console.warn('Exception during cloud sync, falling back to local agents:', err);
      return localAgents;
    }
  }

  /**
   * Marks an agent as purchased (or restores it back to active)
   */
  static markAgentAsPurchased(agentId: string, isPurchased: boolean = true, userId?: string): UniversalAgentDefinition | null {
    if (typeof window === 'undefined') return null;

    try {
      const existing = this.getAllAgents();
      let targetAgent: UniversalAgentDefinition | null = null;
      const now = new Date().toISOString();
      const updated = existing.map((a) => {
        if (a.id === agentId) {
          targetAgent = {
            ...a,
            isPurchased,
            purchasedAt: isPurchased ? now : undefined,
            updatedAt: now,
          };
          return targetAgent;
        }
        return a;
      });

      if (targetAgent) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

        // Cloud sync if logged in
        if (userId && this.isCloudSyncEnabled()) {
          void (async () => {
            try {
              const { error } = await supabase
                .from('agents')
                .update({
                  is_purchased: isPurchased,
                  purchased_at: isPurchased ? now : null,
                  updated_at: now,
                })
                .match({ user_id: userId, agent_slug: agentId });
              if (error) console.warn('Cloud update error on markAgentAsPurchased:', error.message);
            } catch (err) {
              console.warn('Cloud update exception on markAgentAsPurchased:', err);
            }
          })();
        }
      }
      return targetAgent;
    } catch (e) {
      console.error('Failed to mark agent as purchased:', e);
      return null;
    }
  }

  /**
   * Retrieves active (non-purchased) agents
   */
  static getActiveAgents(): UniversalAgentDefinition[] {
    return this.getAllAgents().filter((a) => !a.isPurchased);
  }

  /**
   * Retrieves purchased agents
   */
  static getPurchasedAgents(): UniversalAgentDefinition[] {
    return this.getAllAgents().filter((a) => Boolean(a.isPurchased));
  }

  /**
   * Deletes ANY agent by ID (including default presets)
   */
  static deleteAgent(agentId: string, userId?: string): boolean {
    if (typeof window === 'undefined') return false;

    try {
      const existing = this.getAllAgents();
      const filtered = existing.filter((a) => a.id !== agentId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));

      // Delete from cloud if logged in
      if (userId && this.isCloudSyncEnabled()) {
        void (async () => {
          try {
            const { error } = await supabase
              .from('agents')
              .delete()
              .match({ user_id: userId, agent_slug: agentId });
            if (error) console.warn('Cloud delete error:', error.message);
          } catch (err) {
            console.warn('Cloud delete exception:', err);
          }
        })();
      }

      return true;
    } catch (e) {
      console.error('Failed to delete agent:', e);
      return false;
    }
  }

  /**
   * Deletes ALL agents from the library
   */
  static deleteAllAgents(userId?: string): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));

      if (userId && this.isCloudSyncEnabled()) {
        void (async () => {
          try {
            const { error } = await supabase
              .from('agents')
              .delete()
              .eq('user_id', userId);
            if (error) console.warn('Cloud delete all error:', error.message);
          } catch (err) {
            console.warn('Cloud delete all exception:', err);
          }
        })();
      }
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
  static downloadAgentMarkdown(agent: UniversalAgentDefinition, answers?: Record<string, any>, locale: string = "cs"): void {
    if (typeof window === 'undefined') return;

    const markdown = serializeAgentToMarkdown(agent, answers, locale);
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
  static importAgentFromMarkdown(markdownContent: string, userId?: string): UniversalAgentDefinition {
    const agent = parseAgentFromMarkdown(markdownContent);
    this.saveAgent(agent, userId);
    return agent;
  }
}
