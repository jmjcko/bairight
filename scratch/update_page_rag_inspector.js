const fs = require("fs");

let pageCode = fs.readFileSync("src/app/page.tsx", "utf8");

// Import RAGContextInspectorModal
if (!pageCode.includes("RAGContextInspectorModal")) {
  pageCode = pageCode.replace(
    "import { UserRAGMemoryModal } from '@/components/UserRAGMemoryModal';",
    "import { UserRAGMemoryModal } from '@/components/UserRAGMemoryModal';\nimport { RAGContextInspectorModal } from '@/components/RAGContextInspectorModal';"
  );
}

// Add state variables for RAG Inspector and auto-learning toast
const stateSnippet = `  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState<boolean>(false);
  const [inspectedRagMetadata, setInspectedRagMetadata] = useState<any | null>(null);
  const [ragLearnedNotification, setRagLearnedNotification] = useState<string | null>(null);`;

if (!pageCode.includes("inspectedRagMetadata")) {
  pageCode = pageCode.replace("const [isMemoryModalOpen, setIsMemoryModalOpen] = useState<boolean>(false);", stateSnippet);
}

// Update handleSendMessage to handle newExtractedFacts
const oldJsonParse = `      const data = await response.json();
      if (data.message) {
        setMessages((prev) => [...prev, data.message]);
      }`;

const newJsonParse = `      const data = await response.json();
      if (data.message) {
        setMessages((prev) => [...prev, data.message]);
      }

      if (data.newExtractedFacts && Array.isArray(data.newExtractedFacts) && data.newExtractedFacts.length > 0) {
        setUserFacts((prev) => {
          const existingLabels = new Set(prev.map((f) => (f.label || '') + ':' + (f.value || '')));
          const newItems = data.newExtractedFacts
            .filter((f: any) => !existingLabels.has((f.label || '') + ':' + (f.value || '')))
            .map((f: any) => ({
              id: f.id || \`fact-\${Date.now()}\`,
              label: f.label,
              value: f.value,
              category: f.category || 'preference',
              source: 'Automaticky z chatu',
              updatedAt: new Date().toLocaleDateString('cs-CZ'),
              isEnriched: true,
            }));

          if (newItems.length > 0) {
            const updated = [...newItems, ...prev];
            localStorage.setItem('bairight_user_facts', JSON.stringify(updated));
            setRagLearnedNotification(\`✨ Uloženo do RAG paměti: \${newItems[0].value}\`);
            setTimeout(() => setRagLearnedNotification(null), 6000);
            return updated;
          }
          return prev;
        });
      }`;

if (pageCode.includes(oldJsonParse)) {
  pageCode = pageCode.replace(oldJsonParse, newJsonParse);
  console.log("Updated handleSendMessage JSON parsing with auto-learned RAG facts");
}

// Update RAG badge click handler in message stream
const oldRagBadge = `{!isUser && activeFactsCount > 0 && (
                            <div 
                              onClick={() => setIsMemoryModalOpen(true)}
                              className="flex items-center gap-1.5 text-[10px] font-mono text-cyan-300 bg-cyan-950/70 border border-cyan-500/30 px-2.5 py-1 rounded-full w-fit mb-3 shadow-sm hover:border-cyan-400/60 cursor-pointer transition-all"
                              title="Klikněte pro zobrazení a správu RAG faktů z databáze"
                            >
                              <Database className="w-3 h-3 text-cyan-400" />
                              <span>RAG paměť: Obohaceno o {activeFactsCount} preferenčních faktů</span>
                            </div>
                          )}`;

const newRagBadge = `{!isUser && (
                            <div 
                              onClick={() => {
                                if (msg.ragMetadata) {
                                  setInspectedRagMetadata(msg.ragMetadata);
                                } else {
                                  setIsMemoryModalOpen(true);
                                }
                              }}
                              className="flex items-center gap-1.5 text-[10px] font-mono text-cyan-300 bg-cyan-950/70 border border-cyan-500/30 px-2.5 py-1 rounded-full w-fit mb-3 shadow-sm hover:border-cyan-400/60 cursor-pointer transition-all"
                              title="Klikněte pro zobrazení přesného RAG kontextu použitého v této zprávě"
                            >
                              <Database className="w-3 h-3 text-cyan-400" />
                              <span>RAG paměť: Obohaceno o {msg.ragMetadata?.factsCount ?? activeFactsCount} faktů + Profil z průvodce</span>
                            </div>
                          )}`;

if (pageCode.includes(oldRagBadge)) {
  pageCode = pageCode.replace(oldRagBadge, newRagBadge);
  console.log("Updated RAG badge in chat message stream");
}

// Render RAGContextInspectorModal and toast notification at end of page.tsx JSX
const oldEndModal = `<UserRAGMemoryModal
        isOpen={isMemoryModalOpen}
        onClose={() => setIsMemoryModalOpen(false)}
        facts={userFacts}
        assessments={assessments}
        onToggleFact={handleToggleFact}
        onAddFact={handleAddFact}
        onDeleteFact={handleDeleteFact}
        onDeleteAssessment={handleDeleteAssessment}
      />`;

const newEndModal = `<UserRAGMemoryModal
        isOpen={isMemoryModalOpen}
        onClose={() => setIsMemoryModalOpen(false)}
        facts={userFacts}
        assessments={assessments}
        onToggleFact={handleToggleFact}
        onAddFact={handleAddFact}
        onDeleteFact={handleDeleteFact}
        onDeleteAssessment={handleDeleteAssessment}
      />

      <RAGContextInspectorModal
        isOpen={Boolean(inspectedRagMetadata)}
        onClose={() => setInspectedRagMetadata(null)}
        agentName={selectedAgent?.name}
        categoryName={selectedAgent?.category}
        ragMetadata={inspectedRagMetadata}
      />

      {ragLearnedNotification && (
        <div className="fixed bottom-20 right-6 z-50 p-3.5 rounded-2xl bg-teal-950/90 border border-teal-400 text-teal-200 text-xs font-mono font-bold shadow-xl shadow-teal-950/60 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <Sparkles className="w-4 h-4 text-teal-300 animate-spin" />
          <span>{ragLearnedNotification}</span>
        </div>
      )}`;

if (pageCode.includes(oldEndModal)) {
  pageCode = pageCode.replace(oldEndModal, newEndModal);
  console.log("Rendered RAGContextInspectorModal and toast in page.tsx");
}

fs.writeFileSync("src/app/page.tsx", pageCode);
