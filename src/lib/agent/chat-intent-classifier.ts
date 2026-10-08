/**
 * chat-intent-classifier.ts
 *
 * Robust classification and prompt formulation for interactive shopping consultant chat.
 * Distinguishes between:
 * 1. 'conversational_dialogue': Direct questions, explanations (e.g. "proč mi nabízíš pouze duotone?",
 *    "proč je to tak drahé?", "jaký je rozdíl mezi X a Y"), comparisons, technical inquiries,
 *    feedback, or questions challenging existing recommendations.
 * 2. 'recommendation_request': Explicit requests to generate or re-evaluate 3 product recommendations
 *    (e.g. "doporuč mi 3 modely", "proveď průzkum znovu", "chci 3 nová doporučení", "re-run research").
 */

export type ChatIntent = 'recommendation_request' | 'conversational_dialogue';

/**
 * Strips the rigid initial evaluation report template (# Expert Purchasing Recommendation...)
 * from a compiled wizard prompt, leaving only the persona, user criteria, parameters, and constraints.
 */
export function stripReportTemplateFromPrompt(rawPrompt: string): string {
  if (!rawPrompt) return '';
  const cutMarkers = [
    '### REQUIRED RESPONSE FORMAT',
    '### POŽADOVANÝ FORMÁT ODPOVĚDI',
    '# Expert Purchasing Recommendation',
    '# Expertní nákupní doporučení',
  ];
  let cleaned = rawPrompt;
  for (const marker of cutMarkers) {
    const idx = cleaned.indexOf(marker);
    if (idx !== -1) {
      cleaned = cleaned.substring(0, idx).trim();
    }
  }
  return cleaned;
}

/**
 * Classifies whether a user message in chat is an explicit request for fresh/updated 3-model recommendations,
 * or a conversational inquiry/question.
 */
export function classifyChatIntent(message: string): ChatIntent {
  const text = (message || '').toLowerCase().trim();
  if (!text) return 'conversational_dialogue';

  // Normalize accented characters for resilient regex matching
  const norm = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // 1. Check for questions questioning existing choices or seeking explanation
  // (e.g. "proč mi nabízíš pouze duotone", "proč tam není core", "jaký je rozdíl mezi X a Y",
  // "stojíš si za tímto doporučením?", "proč v doporučení chybí Nike?")
  const isQuestioningOrExplaining =
    /^(proc|duvod|jaktoze|why|how come|co kdyz|what if|kolik|kdy|kde|jak|ktery|jaka|jake|which|how|where|when)\b/i.test(norm) ||
    /proc\s+(?:mi\s+)?(?:nabizis|doporucujes|vybiras|davas|tam\s+je|tam\s+neni|pouze|jen|vyhradne|zrovna)/i.test(norm) ||
    /why\s+(?:are\s+you\s+)?(?:offering|recommending|choosing|suggesting|picking|giving|only|specifically)/i.test(norm) ||
    /(?:vysvetli|objasni|rozeber|explain|clarify|elaborate)/i.test(norm) ||
    /(?:rozdil|srovnej|porovnej|difference|compare|\bversus\b|\bvs\.?\b)/i.test(norm) ||
    /(?:jak\s+funguje|jak\s+casto|jaky\s+ma\s+vliv|how\s+does|how\s+often)/i.test(norm) ||
    /(?:co\s+rikas\s+na|a\s+co\s+znacka|what\s+about|what\s+do\s+you\s+think)/i.test(norm) ||
    (norm.endsWith('?') && (
      norm.includes('proc') || 
      norm.includes('why') || 
      norm.includes('duvod') || 
      norm.includes('rozdil') ||
      norm.includes('stojis') ||
      norm.includes('chybi') ||
      norm.includes('znack') ||
      norm.includes('model') ||
      norm.includes('cena') ||
      norm.includes('vaha') ||
      norm.includes('hmotnost') ||
      norm.includes('velikost')
    ));

  if (isQuestioningOrExplaining) {
    // If the question is questioning existing results, it is ALWAYS conversational
    // UNLESS it explicitly commands a fresh batch of 3 models:
    // e.g. "proč mi místo toho nenavrhneš 3 jiné modely?"
    const explicitlyCommands3New = /(?:doporuc|navrhni|vygeneruj|recommend|give\s+me)\s+(?:mi\s+)?(?:dalsi|jine|nove|3|tri|other|new)\s+(?:modely|produkty|vyber|alternativy|models|products|alternatives)/i.test(norm);
    if (!explicitlyCommands3New) {
      return 'conversational_dialogue';
    }
  }

  // 2. Explicit triggers for generating full 3 product recommendations
  const recommendationTriggers: RegExp[] = [
    // Re-run research / retry commands
    /(?:proved|spust|udelej)\s+(?:prosim\s+)?(?:pruzkum|vyhledavani|vyber|resersi).*(?:znovu|opet)/i,
    /(?:re-?run|run)\s+(?:the\s+)?(?:market\s+)?research/i,
    /(?:zkus|zkuste)\s+to\s+znovu/i,
    /(?:prehodnot|re-?evaluate)\s+(?:doporuceni|vyber|recommendations)/i,
    
    // Explicit commands asking for 3 models / products / alternatives (flexible word ordering)
    /(?:doporuc|navrhni|ukaz|vyber|vygeneruj|recommend|suggest|give\s+me|show\s+me)\b.*?\b(?:3|tri|three)\b.*?\b(?:modely|produkty|kousky|moznosti|alternativy|models|products|options|alternatives)\b/i,
    /\b(?:3|tri|three)\b.*?\b(?:doporuc|navrhni|ukaz|vyber|vygeneruj|recommend|suggest)\b.*?\b(?:modely|produkty|kousky|moznosti|alternativy|models|products|options|alternatives)\b/i,
    
    // Explicit request for 3 recommendations
    /(?:chci|dej\s+mi|give\s+me)\s+(?:3|tri|three)\s+(?:nova\s+|konkretni\s+|jina\s+)?(?:doporuceni|recommendations)/i,

    // Standalone "top 3" request
    /\btop\s*3\b/i,
    /\bnejlepsi\s+3\b/i,
    /\b3\s+nejlepsi\s+(?:modely|produkty)\b/i,
    /\b3\s+best\s+(?:models|products)\b/i,
    
    // Quick prompt triggers from wizard
    /na\s+zaklade.*(?:doporuc|navrhni|vyber|vygeneruj)/i,
    /based\s+on.*(?:recommend|suggest|give|show)/i,
  ];

  for (const trigger of recommendationTriggers) {
    if (trigger.test(norm)) {
      return 'recommendation_request';
    }
  }

  // Default for all other chat inquiries: conversational dialogue!
  return 'conversational_dialogue';
}
