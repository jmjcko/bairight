const fs = require("fs");

let typesCode = fs.readFileSync("src/lib/agent/types.ts", "utf8");

if (!typesCode.includes("ragMetadata?:")) {
  typesCode = typesCode.replace(
    "recommendations?: ShoeRecommendation[];",
    `recommendations?: ShoeRecommendation[];
  ragMetadata?: {
    factsCount: number;
    injectedFacts: Array<{ id?: string; label?: string; value?: string; fact?: string; category?: string }>;
    assessmentName?: string;
    assessmentSummary?: string;
    keyParameters?: Record<string, any>;
  };`
  );
  fs.writeFileSync("src/lib/agent/types.ts", typesCode);
  console.log("Updated src/lib/agent/types.ts");
}
