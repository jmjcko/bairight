const fs = require("fs");

let code = fs.readFileSync("src/components/DynamicAgentWizard.tsx", "utf8");

// 1. Fix header title font size and line-height
code = code.replace(
  '<h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">',
  '<h1 className="text-base sm:text-lg md:text-xl font-black text-white tracking-tight leading-snug">'
);

// 2. Enhance handleToggleChip
const oldHandleToggleChip = `  const handleToggleChip = (question: WizardQuestion, chipValue: string) => {
    setAnswers((prev) => {
      const current = prev[question.id];
      if (question.isMultiSelect) {
        const arr = Array.isArray(current) ? [...current] : [];
        const exists = arr.includes(chipValue);
        return {
          ...prev,
          [question.id]: exists ? arr.filter((x) => x !== chipValue) : [...arr, chipValue],
        };
      } else {
        // If single-select, de-activate custom input box so selection focus moves to chip
        setActiveCustomInputs((aPrev) => ({ ...aPrev, [question.id]: false }));
        return {
          ...prev,
          [question.id]: chipValue,
        };
      }
    });
  };`;

const newHandleToggleChip = `  const handleToggleChip = (question: WizardQuestion, chipValue: string) => {
    setAnswers((prev) => {
      const current = prev[question.id];
      if (chipValue === 'Není důležité / Nevím') {
        setActiveCustomInputs((aPrev) => ({ ...aPrev, [question.id]: false }));
        return {
          ...prev,
          [question.id]: 'Není důležité',
        };
      }
      if (question.isMultiSelect) {
        const arr = Array.isArray(current)
          ? [...current].filter((x) => x !== 'Není důležité')
          : typeof current === 'string' && current && current !== 'Není důležité'
          ? [current]
          : [];
        const exists = arr.includes(chipValue);
        const nextArr = exists ? arr.filter((x) => x !== chipValue) : [...arr, chipValue];
        return {
          ...prev,
          [question.id]: nextArr.length > 0 ? nextArr : 'Není důležité',
        };
      } else {
        setActiveCustomInputs((aPrev) => ({ ...aPrev, [question.id]: false }));
        return {
          ...prev,
          [question.id]: chipValue,
        };
      }
    });
  };`;

if (code.includes(oldHandleToggleChip)) {
  code = code.replace(oldHandleToggleChip, newHandleToggleChip);
  console.log("Replaced handleToggleChip");
}

// 3. Add MultiSelect badge and Skip button in chips rendering block
const oldChipsHeader = `{question.component === 'chips' && question.options && !question.id.includes('brand') && !question.title.toLowerCase().includes('značk') && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">`;

const newChipsHeader = `{question.component === 'chips' && question.options && !question.id.includes('brand') && !question.title.toLowerCase().includes('značk') && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        {question.isMultiSelect && (
                          <div className="sm:col-span-2 flex items-center gap-2 text-xs font-mono text-cyan-300 font-bold bg-cyan-950/60 px-3.5 py-1.5 rounded-xl border border-cyan-500/30 w-fit">
                            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Můžete vybrat více možností (Multiselect)</span>
                          </div>
                        )}`;

if (code.includes(oldChipsHeader)) {
  code = code.replace(oldChipsHeader, newChipsHeader);
  console.log("Replaced chips header");
}

// 4. Add "Není důležité / Nevím (Přeskočit)" button before custom write-in option
const targetWriteIn = `{/* Interactive Custom / Write-In Option */}`;
const skipButton = `{/* Skip / Neutral option */}
                        <button
                          type="button"
                          onClick={() => handleToggleChip(question, 'Není důležité / Nevím')}
                          className={\`sm:col-span-2 p-3.5 rounded-2xl border text-center transition-all cursor-pointer flex items-center justify-center gap-2 text-xs font-bold \${
                            (Array.isArray(val) ? val.includes('Není důležité / Nevím') : val === 'Není důležité' || val === 'Není důležité / Nevím')
                              ? 'bg-slate-800/90 border-cyan-400 text-cyan-300 shadow-md ring-1 ring-cyan-400'
                              : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                          }\`}
                        >
                          <span>⏭️ Není důležité / Nevím (Přeskočit tento parametr)</span>
                        </button>

                        {/* Interactive Custom / Write-In Option */}`;

if (code.includes(targetWriteIn)) {
  code = code.replace(targetWriteIn, skipButton);
  console.log("Added skip button");
}

fs.writeFileSync("src/components/DynamicAgentWizard.tsx", code);
