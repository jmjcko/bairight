import { AgentChatMessage } from './types';

export interface RecommendedProductRankingItem {
  id: string;
  rank: number;
  fullName: string;
  matchScore?: string;
}

/**
 * Extracts the top 3 recommended product choices from the most recent assistant message in chat.
 * Scans backwards through the message list so that the ranking dynamically reflects the latest chat turn.
 */
export function extractRecommendedProductsFromMessages(messages: AgentChatMessage[]): RecommendedProductRankingItem[] {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.role !== 'assistant' || !msg.content) continue;

    const lines = msg.content.split('\n');
    const items: RecommendedProductRankingItem[] = [];

    for (let rawLine of lines) {
      let line = rawLine.trim();
      if (!line) continue;

      // Handle cases where bullet points are inline
      if (line.includes(' - **')) {
        line = line.split(' - **')[0].trim();
      }

      // Match patterns like "### 1. Specialized S-Works Torch (Match: 95%)" or "1. **Specialized Torch** (Shoda: 90%)"
      const match = line.match(/^(?:###\s*)?(\d+)\.\s+(?:\*\*)?([^\n\r]+?)(?:\*\*)?(?:\s*\((?:Match|Shoda):\s*([^)]+)\))?$/i);
      if (match) {
        const rank = parseInt(match[1], 10);
        let rawName = match[2].trim();
        let matchScore = match[3]?.trim();

        // Extract inline badge if present
        const inlineBadge = rawName.match(/\((?:Match|Shoda):\s*([^)]+)\)/i);
        if (inlineBadge) {
          matchScore = inlineBadge[1].trim();
          rawName = rawName.replace(/\((?:Match|Shoda):\s*([^)]+)\)/i, '').trim();
        }

        rawName = rawName.replace(/\*\*/g, '').replace(/[\s\-:]+$/, '').trim();

        // Filter out section headers and irrelevant text
        if (
          rawName &&
          rawName.length > 2 &&
          !rawName.toLowerCase().startsWith('executive') &&
          !rawName.toLowerCase().startsWith('top 3') &&
          !rawName.toLowerCase().startsWith('doporučené') &&
          !rawName.toLowerCase().startsWith('doporučení') &&
          !rawName.toLowerCase().startsWith('important') &&
          !rawName.toLowerCase().startsWith('klíčové')
        ) {
          items.push({
            id: `msg-rec-${i}-${rank}`,
            rank,
            fullName: rawName,
            matchScore: matchScore ? (matchScore.includes('%') ? matchScore : `${matchScore}%`) : undefined,
          });
        }
      }
    }

    if (items.length > 0) {
      return items.sort((a, b) => a.rank - b.rank).slice(0, 3);
    }
  }
  return [];
}
