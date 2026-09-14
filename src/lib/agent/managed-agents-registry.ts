/**
 * Managed Agents Registry Service
 * Provides platform-maintained, versioned agents with changelogs and download capabilities.
 */

import { UniversalAgentDefinition } from './universal-agent-schema';

export const MANAGED_AGENTS_CATALOG: UniversalAgentDefinition[] = [
  {
    id: 'managed_running_shoes',
    name: 'Běžecká & ortopedická obuv',
    category: 'Sport & Zdraví',
    icon: '👟',
    version: '1.1.0',
    description: 'Biomechanický specialista na běžeckou a ortopedickou obuv. Kontroluje šířku chodidla 2E/4E, drop mezipodešve 4–8 mm a ochranu kolenních kloubů.',
    author: 'bAIright Medical & Biomechanics Team',
    createdAt: '2026-09-01T08:00:00Z',
    updatedAt: '2026-09-14T10:00:00Z',
    isManaged: true,
    systemPrompt: 'Jsi specialista na biomechaniku chodidla a výběr sportovní a ortopedické obuvi...',
    questions: [],
    versionsHistory: [
      {
        version: '1.1.0',
        releasedAt: '2026-09-14',
        summary: 'Zpřísnění biomechanických limitů pro artrózu a ochranu kolen',
        changelog: [
          'Zpřísněna kontrola pro zakázané značky v intake profilu',
          'Doporučený drop 4–8 mm pro uživatele s osteoartrózou kolene (stupeň 1–3)',
          'Zavedena validace skutečných 2E/4E šířek pro prevenci Mortonovy neuralgie',
        ],
      },
      {
        version: '1.0.0',
        releasedAt: '2026-09-01',
        summary: 'Prvotní vydání podiatrického nákupního rádce',
        changelog: [
          'Základní intake dotazník biomechaniky nášlapu (supinace / pronace)',
          'Rozpoznávání dropu a tlumení podešve',
        ],
      },
    ],
  },
  {
    id: 'managed_electric_car',
    name: 'Elektromobily (EV Rádce)',
    category: 'Automotive',
    icon: '⚡',
    version: '1.0.0',
    description: 'Nezávislý poradce pro výběr elektroauta. Analyzuje reálný zimní dálniční dojezd, 800V vs. 400V nabíjecí křivku, chemii baterie (LFP vs. NMC) a TCO.',
    author: 'Luke & bAIright Automotive Lab',
    createdAt: '2026-09-14T10:00:00Z',
    updatedAt: '2026-09-14T10:00:00Z',
    isManaged: true,
    systemPrompt: 'Jsi Luke, automotive specialista na elektromobilitu...',
    questions: [],
    versionsHistory: [
      {
        version: '1.0.0',
        releasedAt: '2026-09-14',
        summary: 'Oficiální vydání agenta pro výběr elektromobilů',
        changelog: [
          'Zavedena analýza reálného zimního dojezdu (pokles o 35 % na dálnici)',
          'Pravidla pro efektivitu tepelného čerpadla a rychlost DC nabíjení',
          'Srovnání chemie LFP (denní 100% nabíjení) vs. NMC (hustota a zima)',
        ],
      },
    ],
  },
  {
    id: 'managed_espresso_machine',
    name: 'Domácí pákové kávovary',
    category: 'Kuchyně & Gastro',
    icon: '☕',
    version: '1.0.0',
    description: 'Baristický rádce pro výběr kávovaru a mlýnku. Hlídá PID tepelnou stabilitu, 9 bar OPV tlak, standardní 58mm rozměr hlavy a dostupnost dílů.',
    author: 'Luke & bAIright Specialty Coffee Team',
    createdAt: '2026-09-14T10:00:00Z',
    updatedAt: '2026-09-14T10:00:00Z',
    isManaged: true,
    systemPrompt: 'Jsi Luke, nezávislý kávový expert a barista...',
    questions: [],
    versionsHistory: [
      {
        version: '1.0.0',
        releasedAt: '2026-09-14',
        summary: 'Oficiální vydání baristického nákupního rádce',
        changelog: [
          'Pravidla pro reálný tlak čerpadla s OPV ventilem na 9 bar',
          'Požadavky na PID regulaci bojleru pro výběrovou kávu',
          'Standardizace na 58mm rozměr hlavy pro kompatibilitu misek',
        ],
      },
    ],
  },
  {
    id: 'managed_ergonomic_chair',
    name: 'Ergonomické kancelářské židle',
    category: 'Nábytek & Kancelář',
    icon: '🪑',
    version: '1.0.0',
    description: 'Ergonom a fyzioterapeut pro výběr židle pro 8+ hodin u počítače. Posuzuje synchronní mechaniku s aretací, bederní opěrku a 4D područky.',
    author: 'Luke & bAIright Ergonomics Lab',
    createdAt: '2026-09-14T10:00:00Z',
    updatedAt: '2026-09-14T10:00:00Z',
    isManaged: true,
    systemPrompt: 'Jsi Luke, certifikovaný ergonom a fyzioterapeut...',
    questions: [],
    versionsHistory: [
      {
        version: '1.0.0',
        releasedAt: '2026-09-14',
        summary: 'Oficiální vydání agenta pro ergonomické sezení',
        changelog: [
          'Pravidla pro dynamické sezení se synchronní mechanikou',
          'Nastavení hloubky sedáku pro prevenci cévního tlaku',
          'Požadavky na 3D/4D područky uvolňující krční páteř',
        ],
      },
    ],
  },
];

export class ManagedAgentRegistryService {
  /**
   * Returns all officially maintained managed agents
   */
  static getManagedAgents(): UniversalAgentDefinition[] {
    return MANAGED_AGENTS_CATALOG;
  }

  /**
   * Finds a managed agent by ID
   */
  static getAgentById(id: string): UniversalAgentDefinition | undefined {
    return MANAGED_AGENTS_CATALOG.find((a) => a.id === id);
  }

  /**
   * Generates downloadable .agent.md markdown for a specific agent and version
   */
  static generateAgentMarkdown(agent: UniversalAgentDefinition, targetVersion?: string): string {
    const versionToUse = targetVersion || agent.version;
    const historyItem = agent.versionsHistory?.find((v) => v.version === versionToUse);

    const frontmatter = [
      '---',
      `name: "${agent.name}"`,
      `version: "${versionToUse}"`,
      `category: "${agent.category}"`,
      `author: "${agent.author || 'bAIright Managed Team'}"`,
      `updatedAt: "${historyItem?.releasedAt || agent.updatedAt || new Date().toISOString()}"`,
      `description: "${agent.description.replace(/"/g, '\\"')}"`,
      'language: "cs"',
      'isManaged: true',
      '---',
    ].join('\n');

    let content = `${frontmatter}\n\n# ${agent.icon} ${agent.name} (v${versionToUse})\n\n`;
    content += `${agent.description}\n\n`;

    if (historyItem) {
      content += `## 📋 Historie verze ${versionToUse}\n`;
      content += `**Shrnutí:** ${historyItem.summary}\n\n`;
      content += `### Změny v této revizi:\n`;
      historyItem.changelog.forEach((ch) => {
        content += `- ${ch}\n`;
      });
      content += '\n';
    }

    content += `## 🧠 Systémová pravidla agenta\n\n`;
    content += `${agent.systemPrompt || 'Agent se řídí expertními nákupními pravidly bAIright.'}\n`;

    return content;
  }

  /**
   * Triggers client-side browser download of .agent.md file
   */
  static downloadAgentFile(agent: UniversalAgentDefinition, targetVersion?: string): void {
    if (typeof window === 'undefined') return;

    const versionToUse = targetVersion || agent.version;
    const content = this.generateAgentMarkdown(agent, versionToUse);
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${agent.id}_v${versionToUse}.agent.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
