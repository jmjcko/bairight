/**
 * Agent Localization Helper Module
 * Ensures 100% architectural consistency for agent definitions across CS and EN locales.
 */

import { UniversalAgentDefinition } from './universal-agent-schema';
import { SupportedLocale } from '../i18n/translations';
import { ManagedAgentRegistryService } from './managed-agents-registry';

/**
 * Pure architectural helper that accepts any UniversalAgentDefinition (managed, generated, or stored)
 * and returns a localized copy formatted for the target locale ('cs' | 'en').
 */
export function getLocalizedAgent(
  agent: UniversalAgentDefinition | null | undefined,
  locale: SupportedLocale = 'cs'
): UniversalAgentDefinition | null {
  if (!agent) return null;

  // 1. Managed Agent Catalog
  if (agent.isManaged || agent.id.startsWith('managed_')) {
    const managed = ManagedAgentRegistryService.getAgentById(agent.id, locale);
    if (managed) return managed;
  }

  const isEn = locale === 'en';
  let name = agent.name || '';
  let category = agent.category || '';
  let description = agent.description || '';

  if (isEn) {
    // Transform CZ naming patterns to EN
    name = name
      .replace(/^Luke:\s*/i, 'bAIright: Specialist in ')
      .replace(/^bAIright:\s*Specialista na\s*/i, 'bAIright: Specialist in ')
      .replace(/^Specialista na\s*/i, 'Specialist in ');

    category = category
      .replace(/^Nákupní výběr pro\s*/i, 'Shopping selection for ')
      .replace(/^Sport & Zdraví$/i, 'Sports & Health')
      .replace(/^Kuchyně & Gastro$/i, 'Kitchen & Coffee')
      .replace(/^Nábytek & Kancelář$/i, 'Furniture & Office')
      .replace(/^Automotive$/i, 'Automotive');

    description = description
      .replace(/^Nákupní poradce vyladěný na míru s (\d+) klíčovými parametry\./i, 'Custom shopping agent tailored with $1 key parameters.')
      .replace(/^Nákupní poradce pro výběr (.+) zohledňující poznatky z fór a odborných recenzí\./i, 'Shopping advisor for selecting $1 incorporating insights from forums and expert reviews.')
      .replace(/^Nákupní poradce pro výběr (.+) zohledňující klíčové technické specifikace a poznatky z recenzí\./i, 'Shopping advisor for selecting $1 grounded in technical specifications and review consensus.')
      .replace(/^Biomechanický nákupčí obuvi a konzultant$/i, 'Biomechanical footwear buyer & consultant');

  } else {
    // Transform EN naming patterns to CZ
    name = name
      .replace(/^Luke:\s*/i, 'bAIright: Specialista na ')
      .replace(/^bAIright:\s*Specialist in\s*/i, 'bAIright: Specialista na ')
      .replace(/^Specialist in\s*/i, 'Specialista na ');

    category = category
      .replace(/^Shopping selection for\s*/i, 'Nákupní výběr pro ')
      .replace(/^Sports & Health$/i, 'Sport & Zdraví')
      .replace(/^Kitchen & Coffee$/i, 'Kuchyně & Gastro')
      .replace(/^Furniture & Office$/i, 'Nábytek & Kancelář');

    description = description
      .replace(/^Custom shopping agent tailored with (\d+) key parameters\./i, 'Nákupní poradce vyladěný na míru s $1 klíčovými parametry.')
      .replace(/^Shopping advisor for selecting (.+) incorporating insights from forums and expert reviews\./i, 'Nákupní poradce pro výběr $1 zohledňující poznatky z fór a odborných recenzí.')
      .replace(/^Biomechanical footwear buyer & consultant$/i, 'Biomechanický nákupčí obuvi a konzultant');
  }

  return {
    ...agent,
    name,
    category,
    description,
  };
}
