const fs = require("fs");

// 1. Update src/lib/agent/luke-agent-prompt.ts
let codePrompt = fs.readFileSync("src/lib/agent/luke-agent-prompt.ts", "utf8");

const isolationRule = `5. ATOMICKÁ IZOLACE PARAMETRŮ (ZÁKAZ SLUČOVÁNÍ 2 PARAMETRŮ DO 1):
   - STRIKTNÍ ZÁKAZ slučovat 2 různé technické či rozměrové vlastnosti do jednoho parametru (např. NIKDY nekombinuj rozměr kol 29" se šířkou pláště 40-45mm do "Rozměr kol a plášťů").
   - Každý fyzikální či technický rozměr MUSÍ BÝT samostatným krokem (např. 1. "Rozměr ráfků/kol", 2. "Typ a šířka plášťů").

6. PODPORA MULTI-SELECTU ("isMultiSelect": true):
   - U parametrů, kde dává smysl vybrat více možností (např. způsoby využití, výbava, konektivita, doplňkové funkce, preferované značky), nastav v JSONu "isMultiSelect": true.`;

if (!codePrompt.includes("ATOMICKÁ IZOLACE PARAMETRŮ")) {
  codePrompt = codePrompt.replace("5. POVINNÝ ZÁKAZ ABSTRAKTNÍHO A KORPORÁTNÍHO JARGONU:", isolationRule + "\n\n7. POVINNÝ ZÁKAZ ABSTRAKTNÍHO A KORPORÁTNÍHO JARGONU:");
  codePrompt = codePrompt.replace('"suggestedValues": ["Volba A", "Volba B", "Volba C"]', '"suggestedValues": ["Volba A", "Volba B", "Volba C"],\n      "isMultiSelect": true');
  fs.writeFileSync("src/lib/agent/luke-agent-prompt.ts", codePrompt);
  console.log("Updated src/lib/agent/luke-agent-prompt.ts");
}

// 2. Update src/app/api/agent/research-parameters/route.ts
let routeFile = fs.readFileSync("src/app/api/agent/research-parameters/route.ts", "utf8");
if (!routeFile.includes("ATOMICKÁ IZOLACE PARAMETRŮ")) {
  routeFile = routeFile.replace(
    '1. 📛 KRÁTKÉ NÁZVY PARAMETRŮ:',
    '0. ⚛️ ATOMICKÁ IZOLACE PARAMETRŮ: STRIKTNÍ ZÁKAZ slučovat 2 různé technické či rozměrové vlastnosti do jednoho parametru (např. rozměr ráfku a šířka plášťů). Každou vlastnost vygeneruj jako samostatný krok. U parametrů s více možnostmi nastav "isMultiSelect": true.\n1. 📛 KRÁTKÉ NÁZVY PARAMETRŮ:'
  );
  fs.writeFileSync("src/app/api/agent/research-parameters/route.ts", routeFile);
  console.log("Updated src/app/api/agent/research-parameters/route.ts");
}
