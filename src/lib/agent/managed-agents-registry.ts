/**
 * Managed Agents Registry Service
 * Provides platform-maintained, versioned agents with changelogs and download capabilities.
 * Supports full bilingual localization (CS / EN).
 */

import { UniversalAgentDefinition } from './universal-agent-schema';
import { SupportedLocale } from '../i18n/translations';

export interface LocalizedManagedAgentDefinition extends UniversalAgentDefinition {
  name_en?: string;
  category_en?: string;
  description_en?: string;
  author_en?: string;
  systemPrompt_en?: string;
}

export const MANAGED_AGENTS_CATALOG: LocalizedManagedAgentDefinition[] = [
  {
    id: 'managed_running_shoes',
    name: 'Běžecká & ortopedická obuv',
    name_en: 'Running & Orthopedic Footwear',
    category: 'Sport & Zdraví',
    category_en: 'Sports & Health',
    icon: '',
    version: '1.1.0',
    description: 'Biomechanický specialista na běžeckou a ortopedickou obuv. Kontroluje šířku chodidla 2E/4E, drop mezipodešve 4–8 mm a ochranu kolenních kloubů.',
    description_en: 'Biomechanical specialist in running and orthopedic shoes. Validates foot width (2E/4E), midsole drop (4–8mm), and knee joint protection.',
    author: 'bAIright Medical & Biomechanics Team',
    author_en: 'bAIright Medical & Biomechanics Team',
    createdAt: '2026-09-01T08:00:00Z',
    updatedAt: '2026-09-14T10:00:00Z',
    isManaged: true,
    systemPrompt: 'Jsi specialista na biomechaniku chodidla a výběr sportovní a ortopedické obuvi. Tvým úkolem je striktně vyžadovat certifikovaná kopyta 2E/4E při šířce nad 100 mm a kolébkovou podešev (rocker) pro ochranu kolen.',
    systemPrompt_en: 'You are a foot biomechanics specialist and expert in running and orthopedic footwear selection. Your job is to strictly enforce certified 2E/4E wide lasts for feet over 100mm and rocker soles for knee joint protection.',
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
    name_en: 'Electric Vehicles (EV Advisor)',
    category: 'Automotive',
    category_en: 'Automotive',
    icon: '',
    version: '1.0.0',
    description: 'Nezávislý poradce pro výběr elektroauta. Analyzuje reálný zimní dálniční dojezd, 800V vs. 400V nabíjecí křivku, chemii baterie (LFP vs. NMC) a TCO.',
    description_en: 'Independent advisor for EV selection. Analyzes real-world winter highway range, 800V vs. 400V charging curve, battery chemistry (LFP vs. NMC), and TCO.',
    author: 'bAIright Automotive Lab',
    author_en: 'bAIright Automotive Lab',
    createdAt: '2026-09-14T10:00:00Z',
    updatedAt: '2026-09-14T10:00:00Z',
    isManaged: true,
    systemPrompt: 'Jsi automotive specialista na elektromobilitu. Analyzuješ zimní dálniční dojezd, rychlost nabíjení 800V vs 400V a chemii baterie.',
    systemPrompt_en: 'You are an automotive specialist in electric mobility. You analyze real-world winter highway range, 800V vs 400V charging speed, and battery chemistry.',
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
    name_en: 'Home Espresso Machines',
    category: 'Kuchyně & Gastro',
    category_en: 'Kitchen & Coffee',
    icon: '',
    version: '1.0.0',
    description: 'Baristický rádce pro výběr kávovaru a mlýnku. Hlídá PID tepelnou stabilitu, 9 bar OPV tlak, standardní 58mm rozměr hlavy a dostupnost dílů.',
    description_en: 'Barista guide for choosing espresso machines and grinders. Checks PID thermal stability, 9 bar OPV pressure, standard 58mm group head, and parts availability.',
    author: 'bAIright Specialty Coffee Team',
    author_en: 'bAIright Specialty Coffee Team',
    createdAt: '2026-09-14T10:00:00Z',
    updatedAt: '2026-09-14T10:00:00Z',
    isManaged: true,
    systemPrompt: 'Jsi nezávislý kávový expert a barista. Doporučuješ kávovary s PID regulací teploty, 9 bar OPV tlakem a standardní 58mm hlavou.',
    systemPrompt_en: 'You are an independent coffee expert and barista. You recommend espresso machines with PID temperature stability, 9 bar OPV pressure, and standard 58mm group heads.',
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
    name_en: 'Ergonomic Office Chairs',
    category: 'Nábytek & Kancelář',
    category_en: 'Furniture & Office',
    icon: '',
    version: '1.0.0',
    description: 'Ergonom a fyzioterapeut pro výběr židle pro 8+ hodin u počítače. Posuzuje synchronní mechaniku s aretací, bederní opěrku a 4D područky.',
    description_en: 'Ergonomist and physical therapist for chair selection for 8+ hours at a desk. Evaluates synchronous mechanism with locking, lumbar support, and 4D armrests.',
    author: 'bAIright Ergonomics Lab',
    author_en: 'bAIright Ergonomics Lab',
    createdAt: '2026-09-14T10:00:00Z',
    updatedAt: '2026-09-14T10:00:00Z',
    isManaged: true,
    systemPrompt: 'Jsi certifikovaný ergonom a fyzioterapeut. Posuzuješ synchronní mechaniku, stavitelnou bederní opěrku a hloubku sedáku.',
    systemPrompt_en: 'You are a certified ergonomist and physical therapist. You evaluate synchronous mechanisms, adjustable lumbar support, and seat depth.',
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
   * Returns all officially maintained managed agents, optionally localized
   */
  static getManagedAgents(locale: SupportedLocale = 'cs'): UniversalAgentDefinition[] {
    if (locale === 'en') {
      return MANAGED_AGENTS_CATALOG.map((a) => ({
        ...a,
        name: a.name_en || a.name,
        category: a.category_en || a.category,
        description: a.description_en || a.description,
        author: a.author_en || a.author,
        systemPrompt: a.systemPrompt_en || a.systemPrompt,
      }));
    }
    return MANAGED_AGENTS_CATALOG;
  }

  /**
   * Finds a managed agent by ID, optionally localized
   */
  static getAgentById(id: string, locale: SupportedLocale = 'cs'): UniversalAgentDefinition | undefined {
    const agents = this.getManagedAgents(locale);
    return agents.find((a) => a.id === id);
  }

  /**
   * Generates downloadable .agent.md markdown for a specific agent and version
   */
  static generateAgentMarkdown(agent: UniversalAgentDefinition, targetVersion?: string, locale: SupportedLocale = 'cs'): string {
    const localizedAgent = this.getAgentById(agent.id, locale) || agent;
    const versionToUse = targetVersion || localizedAgent.version;
    const historyItem = localizedAgent.versionsHistory?.find((v) => v.version === versionToUse);
    const isEn = locale === 'en';

    const frontmatter = [
      '---',
      `name: "${localizedAgent.name}"`,
      `version: "${versionToUse}"`,
      `category: "${localizedAgent.category}"`,
      `author: "${localizedAgent.author || 'bAIright Managed Team'}"`,
      `updatedAt: "${historyItem?.releasedAt || localizedAgent.updatedAt || new Date().toISOString()}"`,
      `description: "${localizedAgent.description.replace(/"/g, '\\"')}"`,
      `language: "${locale}"`,
      'isManaged: true',
      '---',
    ].join('\n');

    let content = `${frontmatter}\n\n# ${localizedAgent.icon} ${localizedAgent.name} (v${versionToUse})\n\n`;
    content += `${localizedAgent.description}\n\n`;

    if (historyItem) {
      content += isEn ? `## Version History ${versionToUse}\n` : `## Historie verze ${versionToUse}\n`;
      content += isEn ? `**Summary:** ${historyItem.summary}\n\n` : `**Shrnutí:** ${historyItem.summary}\n\n`;
      content += isEn ? `### Changes in this revision:\n` : `### Změny v této revizi:\n`;
      historyItem.changelog.forEach((ch) => {
        content += `- ${ch}\n`;
      });
      content += '\n';
    }

    content += isEn ? `## Agent System Instructions\n\n` : `## Systémová pravidla agenta\n\n`;
    content += `${localizedAgent.systemPrompt || (isEn ? 'Agent follows bAIright expert shopping rules.' : 'Agent se řídí expertními nákupními pravidly bAIright.')}\n`;

    return content;
  }

  /**
   * Triggers client-side browser download of .agent.md file
   */
  static downloadAgentFile(agent: UniversalAgentDefinition, targetVersion?: string, locale: SupportedLocale = 'cs'): void {
    if (typeof window === 'undefined') return;

    const versionToUse = targetVersion || agent.version;
    const content = this.generateAgentMarkdown(agent, versionToUse, locale);
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${agent.id}_v${versionToUse}_${locale}.agent.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
