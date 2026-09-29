'use client';

import React from 'react';

interface AgentMessageRendererProps {
  content: string;
  isEn?: boolean;
}

/**
 * Pre-processes and normalizes raw agent Markdown text,
 * expanding inline-collapsed model recommendations (e.g. "- **Why this model fits:**")
 * into structured multi-line markdown blocks.
 */
export function normalizeMarkdownContent(text: string): string {
  if (!text) return "";

  let normalized = text;

  // 1. Newlines before headers (# or ## or ###)
  normalized = normalized.replace(/([^\n])\s*(#{1,3}\s+)/g, "$1\n\n$2");

  // 2. Break ALL section label headers onto their own new lines FIRST
  normalized = normalized.replace(
    /\s+-\s+\*\*(Why Recommended|Why this model fits|Proč doporučujeme|Proč právě tento model):\*\*/gi,
    "\n- **$1:**"
  );
  normalized = normalized.replace(
    /\s+-\s+\*\*(Key Pros(?: & Advantages)?|Klíčové výhody):\*\*/gi,
    "\n- **$1:**"
  );
  normalized = normalized.replace(
    /\s+-\s+\*\*(Potential Trade-offs(?: & Cons)?|Trade-offs(?: & Cons)?|Kompromisy a nevýhody|Potenciální kompromisy):\*\*/gi,
    "\n- **$1:**"
  );

  // Separate numbered model card header e.g. "1. Model (Match: 100%) - **Why..."
  normalized = normalized.replace(
    /((?:^|\n)(?:###\s*)?\d+\.\s+[^\n]+?)\s+-\s+\*\*/gi,
    "$1\n- **"
  );

  // 3. Now split remaining inline bullet points
  const lines = normalized.split("\n");
  const processedLines: string[] = [];
  for (let line of lines) {
    if (line.includes(" - ") && !line.startsWith("#")) {
      const parts = line.split(/\s+-\s+/g);
      if (parts.length > 1) {
        processedLines.push(parts[0]);
        for (let i = 1; i < parts.length; i++) {
          if (parts[i].startsWith("**")) {
            processedLines.push(`- ${parts[i]}`);
          } else {
            processedLines.push(`  - ${parts[i]}`);
          }
        }
        continue;
      }
    }
    processedLines.push(line);
  }
  return processedLines.join("\n");
}

function renderFormattedInlineText(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-slate-100">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

interface ParsedModelBlock {
  number?: string;
  title: string;
  badge?: string;
  whyRecommended?: string;
  pros: string[];
  cons: string[];
  rawLines: string[];
}

/**
 * Cyber-glass Agent Message Renderer
 * Renders structured Markdown with clear typographic hierarchy,
 * dedicated model cards, and zero icon clutter.
 */
export function AgentMessageRenderer({ content, isEn = false }: AgentMessageRendererProps) {
  const normalizedText = normalizeMarkdownContent(content);
  const lines = normalizedText.split('\n');

  const elements: React.ReactNode[] = [];
  let currentModelCard: ParsedModelBlock | null = null;
  let currentSectionMode: 'why' | 'pros' | 'cons' | null = null;

  const flushModelCard = (key: string | number) => {
    if (!currentModelCard) return;

    elements.push(
      <div
        key={`model-card-${key}`}
        className="my-4 p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-md hover:border-cyan-500/40 transition-all space-y-3"
      >
        {/* Model Card Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
          <div className="flex items-center gap-2">
            {currentModelCard.number && (
              <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/80 border border-cyan-500/40 px-2 py-0.5 rounded-md">
                #{currentModelCard.number}
              </span>
            )}
            <h4 className="text-sm sm:text-base font-bold text-white tracking-wide">
              {renderFormattedInlineText(currentModelCard.title)}
            </h4>
          </div>
          {currentModelCard.badge && (
            <span className="text-[11px] font-mono text-teal-300 bg-teal-950/80 border border-teal-500/40 px-2.5 py-0.5 rounded-full font-medium">
              {currentModelCard.badge}
            </span>
          )}
        </div>

        {/* Why Recommended Section */}
        {currentModelCard.whyRecommended && (
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/60">
            <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold block mb-1">
              {isEn ? 'Why Recommended' : 'Proč doporučujeme'}
            </span>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {renderFormattedInlineText(currentModelCard.whyRecommended)}
            </p>
          </div>
        )}

        {/* Key Pros Section */}
        {currentModelCard.pros.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold block">
              {isEn ? 'Key Pros & Advantages' : 'Klíčové výhody'}
            </span>
            <ul className="space-y-1 pl-1">
              {currentModelCard.pros.map((pro, pIdx) => (
                <li key={pIdx} className="text-xs sm:text-sm text-slate-300 flex items-start gap-2">
                  <span className="text-emerald-400 font-bold select-none shrink-0 mt-0.5">✓</span>
                  <span>{renderFormattedInlineText(pro)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Trade-offs & Cons Section */}
        {currentModelCard.cons.length > 0 && (
          <div className="space-y-1.5 pt-1 border-t border-slate-800/50">
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400/90 font-bold block">
              {isEn ? 'Trade-offs & Considerations' : 'Kompromisy a nevýhody'}
            </span>
            <ul className="space-y-1 pl-1">
              {currentModelCard.cons.map((con, cIdx) => (
                <li key={cIdx} className="text-xs sm:text-sm text-slate-400 flex items-start gap-2">
                  <span className="text-amber-400/80 font-bold select-none shrink-0 mt-0.5">•</span>
                  <span>{renderFormattedInlineText(con)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );

    currentModelCard = null;
    currentSectionMode = null;
  };

  let idx = 0;
  while (idx < lines.length) {
    const line = lines[idx];
    const trimmed = line.trim();

    if (!trimmed) {
      idx++;
      continue;
    }

    // Check for Heading 1 (# Title)
    if (trimmed.startsWith('# ')) {
      flushModelCard(idx);
      const title = trimmed.slice(2).trim();
      elements.push(
        <h1
          key={`h1-${idx}`}
          className="text-base sm:text-lg font-bold text-white tracking-wide border-b border-cyan-500/40 pb-2.5 mt-2 mb-4"
        >
          {renderFormattedInlineText(title)}
        </h1>
      );
      idx++;
      continue;
    }

    // Check for Heading 2 (## Section Header)
    if (trimmed.startsWith('## ')) {
      flushModelCard(idx);
      const sectionTitle = trimmed.slice(3).trim();
      elements.push(
        <h2
          key={`h2-${idx}`}
          className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-cyan-400 mt-6 mb-3 flex items-center gap-2 border-l-2 border-cyan-500 pl-2.5"
        >
          {renderFormattedInlineText(sectionTitle)}
        </h2>
      );
      idx++;
      continue;
    }

    // Check for Heading 3 (### Subheading) that is NOT a model card numbered item
    if (trimmed.startsWith('### ') && !trimmed.match(/^###\s*\d+\./)) {
      flushModelCard(idx);
      const subTitle = trimmed.slice(4).trim();
      elements.push(
        <h3
          key={`h3-${idx}`}
          className="text-xs sm:text-sm font-bold text-slate-100 tracking-wide mt-4 mb-2 border-l border-cyan-500/60 pl-2"
        >
          {renderFormattedInlineText(subTitle)}
        </h3>
      );
      idx++;
      continue;
    }

    // Check for Model Item Header (e.g., "### 1. Model Name" or "1. Model Name")
    const modelHeaderMatch = trimmed.match(/^(?:###\s*)?(\d+)\.\s+(.*)$/);
    if (modelHeaderMatch) {
      flushModelCard(idx);

      const num = modelHeaderMatch[1];
      let fullTitle = modelHeaderMatch[2];

      // Extract Match/Shoda badge if present e.g. "(Match: 95%)" or "(Shoda: 100%)"
      let badge: string | undefined;
      const badgeMatch = fullTitle.match(/\((Match|Shoda):\s*([^)]+)\)/i);
      if (badgeMatch) {
        badge = `${badgeMatch[1]}: ${badgeMatch[2]}`;
        fullTitle = fullTitle.replace(/\((Match|Shoda):\s*([^)]+)\)/i, '').trim();
      }

      currentModelCard = {
        number: num,
        title: fullTitle,
        badge,
        whyRecommended: '',
        pros: [],
        cons: [],
        rawLines: [],
      };
      idx++;
      continue;
    }

    // Check for numbered plain list items (1. 2. 3.) ONLY when NOT in model card context
    const numberedListMatch = !currentModelCard && trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (numberedListMatch) {
      flushModelCard(idx);
      const num = numberedListMatch[1];
      const itemText = numberedListMatch[2];
      // Check if this looks like a product recommendation (has "Match" or "Shoda")
      if (itemText.includes('Match:') || itemText.includes('Shoda:')) {
        // Let it fall through to modelHeaderMatch handling
      } else {
        elements.push(
          <div key={`ol-${idx}`} className="flex items-start gap-2.5 my-1 pl-1 text-xs sm:text-sm text-slate-300">
            <span className="text-cyan-300 font-bold font-mono select-none shrink-0 min-w-[1.2rem] text-right">{num}.</span>
            <span className="flex-1">{renderFormattedInlineText(itemText)}</span>
          </div>
        );
        idx++;
        continue;
      }
    }

    // If currently inside a Model Card, parse model fields
    if (currentModelCard) {
      if (trimmed.startsWith('- **Why Recommended:**') || trimmed.startsWith('- **Why this model fits:**') || trimmed.startsWith('- **Proč doporučujeme:**') || trimmed.startsWith('- **Proč právě tento model:**')) {
        currentSectionMode = 'why';
        const contentVal = trimmed.replace(/^-\s*\*\*(?:Why Recommended|Why this model fits|Proč doporučujeme|Proč právě tento model):\*\*\s*/i, '');
        currentModelCard.whyRecommended = contentVal;
        idx++;
        continue;
      }

      if (trimmed.startsWith('- **Key Pros') || trimmed.startsWith('- **Klíčové výhody')) {
        currentSectionMode = 'pros';
        idx++;
        continue;
      }

      if (trimmed.startsWith('- **Trade-offs') || trimmed.startsWith('- **Potential Trade-offs') || trimmed.startsWith('- **Kompromisy') || trimmed.startsWith('- **Potenciální kompromisy')) {
        currentSectionMode = 'cons';
        idx++;
        continue;
      }

      // Handle sub-bullet items inside model card
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const itemText = trimmed.replace(/^[-*]\s*/, '').trim();
        if (currentSectionMode === 'pros') {
          currentModelCard.pros.push(itemText);
          idx++;
          continue;
        }
        if (currentSectionMode === 'cons') {
          currentModelCard.cons.push(itemText);
          idx++;
          continue;
        }
      }

      // If text continuation for whyRecommended
      if (currentSectionMode === 'why' && !trimmed.startsWith('#')) {
        currentModelCard.whyRecommended += ' ' + trimmed;
        idx++;
        continue;
      }
    }

    // Check for Blockquote (> text)
    if (trimmed.startsWith('> ')) {
      flushModelCard(idx);
      elements.push(
        <blockquote
          key={`bq-${idx}`}
          className="p-3 my-3 border-l-2 border-cyan-500 bg-cyan-950/30 text-cyan-200 text-xs sm:text-sm rounded-r-xl leading-relaxed"
        >
          {renderFormattedInlineText(trimmed.replace(/^>\s*/, ''))}
        </blockquote>
      );
      idx++;
      continue;
    }

    // Check for standard Bullet List items
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      flushModelCard(idx);
      elements.push(
        <div key={`bullet-${idx}`} className="flex items-start gap-2 my-1 pl-1 text-xs sm:text-sm text-slate-300">
          <span className="text-cyan-400 font-bold select-none shrink-0">•</span>
          <span>{renderFormattedInlineText(trimmed.replace(/^[-*]\s*/, ''))}</span>
        </div>
      );
      idx++;
      continue;
    }

    // Regular Paragraph
    flushModelCard(idx);
    elements.push(
      <p key={`p-${idx}`} className="text-xs sm:text-sm text-slate-300 leading-relaxed my-2">
        {renderFormattedInlineText(trimmed)}
      </p>
    );
    idx++;
  }

  flushModelCard('final');

  return (
    <div className="agent-message-content space-y-2 max-w-none">
      {elements}
    </div>
  );
}
