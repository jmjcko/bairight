with open('src/components/AgentCategoryLauncher.tsx', 'r') as f:
    content = f.read()

# Target block to replace
target_block = '''                        {/* Checkbox indicator */}
                        <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                          isSelected
                            ? 'bg-cyan-500 border-cyan-400 text-slate-950 shadow-sm'
                            : 'bg-slate-900 border-slate-700 text-transparent'
                        }`}>
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>

                        <span className="text-base shrink-0 mt-0.5">{param.icon || '📌'}</span>
                        <div className="min-w-0 flex-1 pr-7">
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

replacement_block = '''                        {/* Checkbox indicator */}
                        <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 mt-1 transition-colors ${
                          isSelected
                            ? 'bg-cyan-500 border-cyan-400 text-slate-950 shadow-sm'
                            : 'bg-slate-900 border-slate-700 text-transparent'
                        }`}>
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>

                        <div className="min-w-0 flex-1 pr-7">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-sm sm:text-base font-extrabold tracking-tight leading-snug line-clamp-1 break-words ${isSelected ? 'text-slate-100 group-hover:text-cyan-300' : 'text-slate-400'}`}>
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
                          <p className="text-xs text-slate-400 font-normal leading-relaxed mt-0.5 line-clamp-1">
                            {formatShortDescription(param.rationale)}
                          </p>
                        </div>'''

if target_block in content:
    content = content.replace(target_block, replacement_block)
    with open('src/components/AgentCategoryLauncher.tsx', 'w') as f:
        f.write(content)
    print('Successfully removed icons and enlarged text in AgentCategoryLauncher.tsx')
else:
    print('Target block not found')
