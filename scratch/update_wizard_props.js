const fs = require("fs");
const file = "src/components/DynamicAgentWizard.tsx";
let content = fs.readFileSync(file, "utf8");

content = content.replace(
  "onAssessmentCompleted?: (answers: Record<string, any>, result: UniversalEvaluationResult, completedPrompt?: string) => void;\n  initialShowResult?: boolean;\n}",
  "onAssessmentCompleted?: (answers: Record<string, any>, result: UniversalEvaluationResult, completedPrompt?: string) => void;\n  initialShowResult?: boolean;\n  initialSavedAnswers?: Record<string, any>;\n  initialSavedResult?: UniversalEvaluationResult | null;\n}"
);

content = content.replace(
  "initialShowResult = false,\n}) => {",
  "initialShowResult = false,\n  initialSavedAnswers,\n  initialSavedResult,\n}) => {"
);

content = content.replace(
  "const [answers, setAnswers] = useState<Record<string, any>>(initialAnswers);",
  "const [answers, setAnswers] = useState<Record<string, any>>(() => {\n    if (initialSavedAnswers && Object.keys(initialSavedAnswers).length > 0) {\n      return { ...initialAnswers, ...initialSavedAnswers };\n    }\n    return initialAnswers;\n  });"
);

content = content.replace(
  "const [result, setResult] = useState<UniversalEvaluationResult | null>(null);",
  "const [result, setResult] = useState<UniversalEvaluationResult | null>(initialSavedResult || null);"
);

fs.writeFileSync(file, content, "utf8");
console.log("Updated DynamicAgentWizard.tsx with saved state props");
