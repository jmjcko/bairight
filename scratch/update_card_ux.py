with open('src/components/AgentCategoryLauncher.tsx', 'r') as f:
    content = f.read()

# Add formatShortDescription helper function if not present
helper_code = '''
function formatShortDescription(rationale: string): string {
  if (!rationale) return '';
  const clean = rationale.split(/Otázka pro vás:/i)[0].trim();
  const firstSentence = clean.split(/[.!?]/)[0].trim();
  if (firstSentence.length > 65) {
    return firstSentence.slice(0, 62) + '...';
  }
  return firstSentence ? firstSentence + '.' : clean.slice(0, 65);
}
'''

if 'function formatShortDescription' not in content:
    content = content.replace('function formatConciseParameterName', helper_code + '\nfunction formatConciseParameterName')

# Update parameter card title and rationale rendering
target_block = '''                        <div className="min-w-0 flex-1 pr-7">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-xs font-semibold leading-snug line-clamp-2 break-words ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                              {formatConciseParameterName(param.name)}
                            </span>
                            {param.id.startsWith('learned-') && (
                              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-500/40 font-bold flex items-center gap-1">
                                👥 Naučeno komunitou
                              </span>
                            )}
                            {(param.id.startsWith('custom_') || param.category === 'Komunitní doporučení') && (
                              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-teal-950 text-teal-300 border border-teal-500/40 font-bold">
                                Vlastní
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 leading-tight mt-1 line-clamp-2">{param.rationale}</p>
                        </div>'''

replacement_block = '''                        <div className="min-w-0 flex-1 pr-7">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-xs sm:text-sm font-bold tracking-tight leading-snug line-clamp-1 break-words ${isSelected ? 'text-slate-100 group-hover:text-cyan-300' : 'text-slate-400'}`}>
                              {formatConciseParameterName(param.name)}
                            </span>
                            {param.id.startsWith('learned-') && (
                              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-500/40 font-bold flex items-center gap-1">
                                👥 Naučeno komunitou
                              </span>
                            )}
                            {(param.id.startsWith('custom_') || param.category === 'Komunitní doporučení') && (
                              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-teal-950 text-teal-300 border border-teal-500/40 font-bold">
                                Vlastní
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 font-normal leading-tight mt-0.5 line-clamp-1">
                            {formatShortDescription(param.rationale)}
                          </p>
                        </div>'''

if target_block in content:
    content = content.replace(target_block, replacement_block)
    with open('src/components/AgentCategoryLauncher.tsx', 'w') as f:
        f.write(content)
    print('Successfully updated card UX in AgentCategoryLauncher.tsx')
else:
    print('Target block not found in AgentCategoryLauncher.tsx')
