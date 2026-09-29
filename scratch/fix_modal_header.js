const fs = require("fs");

let code = fs.readFileSync("src/components/UserRAGMemoryModal.tsx", "utf8");

// Remove the cropped sub-header lines 147-185
const croppedSubHeader = `        {/* Tab Switcher */}
        <div className="px-6 border-b border-cyan-500/15 bg-[#070e1a] flex items-center justify-between overflow-x-auto">
          <div className="flex items-center gap-4 text-xs font-semibold shrink-0">
            <button
              onClick={() => setActiveTab('history')}
              className={\`py-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer \${
                activeTab === 'history'
                  ? 'border-cyan-400 text-cyan-300 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }\`}
            >
              <Calendar className="w-4 h-4" />
              <span>Nákupní protokoly ({(assessments || []).length})</span>
            </button>

            <button
              onClick={() => setActiveTab('prompts')}
              className={\`py-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer \${
                activeTab === 'prompts'
                  ? 'border-cyan-400 text-cyan-300 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }\`}
            >
              <Terminal className="w-4 h-4" />
              <span>Vygenerované prompty ({(completedPrompts || []).length})</span>
            </button>

            <button
              onClick={() => setActiveTab('facts')}
              className={\`py-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer \${
                activeTab === 'facts'
                  ? 'border-cyan-400 text-cyan-300 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }\`}
            >
              <FileText className="w-4 h-4" />
              <span>Osobní fakta & Biometrie ({activeFactsCount}/{(facts || []).length})</span>
            </button>
          </div>

          <span className="hidden md:inline text-[10px] font-mono text-slate-400 shrink-0">
            Ukládání: <strong className="text-cyan-300">Pouze hotové prompty</strong>
          </span>
        </div>`;

// Replace cropped sub-header with nothing (clean top area)
if (code.includes(croppedSubHeader)) {
  code = code.replace(croppedSubHeader, "");
  console.log("Removed cropped sub-header!");
}

// Add pill tabs inside the main header next to close button
const oldHeaderRight = `          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>`;

const newHeaderRight = `          {/* Integrated Clean Cyberglass Pill Tabs */}
          <div className="hidden sm:flex items-center gap-1.5 bg-[#050c18] p-1 rounded-2xl border border-cyan-500/20">
            <button
              onClick={() => setActiveTab('history')}
              className={\`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 \${
                activeTab === 'history'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-400/50 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }\`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Protokoly ({(assessments || []).length})</span>
            </button>

            <button
              onClick={() => setActiveTab('prompts')}
              className={\`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 \${
                activeTab === 'prompts'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-400/50 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }\`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Prompty ({(completedPrompts || []).length})</span>
            </button>

            <button
              onClick={() => setActiveTab('facts')}
              className={\`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 \${
                activeTab === 'facts'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-400/50 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }\`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Fakta ({(facts || []).length})</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>`;

if (code.includes(oldHeaderRight)) {
  code = code.replace(oldHeaderRight, newHeaderRight);
  console.log("Injected pill tabs into modal header!");
}

// Replace confusing "+ Spravovat fakta" button with "+ Přidat profilový fakt"
const oldSpravovatFaktaBtn = `<button
                onClick={() => setActiveTab('facts')}
                className="text-xs font-mono font-semibold text-cyan-300 hover:text-white flex items-center gap-1.5 px-3 py-1 rounded-xl bg-cyan-950/80 border border-cyan-500/30 transition-all cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5 text-cyan-400" />
                <span>Spravovat fakta</span>
              </button>`;

const newSpravovatFaktaBtn = `<button
                onClick={() => {
                  setActiveTab('facts');
                  setIsAdding(true);
                }}
                className="text-xs font-mono font-semibold text-cyan-300 hover:text-white flex items-center gap-1.5 px-3 py-1 rounded-xl bg-cyan-950/80 border border-cyan-500/30 transition-all cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5 text-cyan-400" />
                <span>Přidat profilový fakt</span>
              </button>`;

if (code.includes(oldSpravovatFaktaBtn)) {
  code = code.replace(oldSpravovatFaktaBtn, newSpravovatFaktaBtn);
  console.log("Updated Spravovat fakta button to Přidat profilový fakt");
}

fs.writeFileSync("src/components/UserRAGMemoryModal.tsx", code);
