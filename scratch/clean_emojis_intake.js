const fs = require("fs");

let code = fs.readFileSync("src/components/IntakeWizard.tsx", "utf8");

// Replace colored circle emojis in IntakeWizard options
code = code.replace("title: '🟢 Bez potíží (Plná zátěž)'", "title: 'Bez potíží (Plná zátěž)'");
code = code.replace("title: '🟡 Mírná citlivost / Únava'", "title: 'Mírná citlivost / Únava'");
code = code.replace("title: '🟠 Výrazná citlivost / Artróza'", "title: 'Výrazná citlivost / Artróza'");
code = code.replace("title: '🔴 Maximální ochrana'", "title: 'Maximální ochrana'");

code = code.replace("📐 Přesné mm měření (posuvníky)", "Přesné mm měření (posuvníky)");
code = code.replace(/👟\s*/g, '');
code = code.replace(/🪑\s*/g, '');
code = code.replace(/🚗\s*/g, '');
code = code.replace(/☕\s*/g, '');
code = code.replace(/🤖\s*/g, '');

fs.writeFileSync("src/components/IntakeWizard.tsx", code);
console.log("Cleaned emojis in IntakeWizard.tsx");

// Update IntakeWizard test file to match text without circle emojis
let testCode = fs.readFileSync("src/components/__tests__/IntakeWizard.test.tsx", "utf8");
testCode = testCode.replace(/🟢\s*/g, '');
testCode = testCode.replace(/🟡\s*/g, '');
testCode = testCode.replace(/🟠\s*/g, '');
testCode = testCode.replace(/🔴\s*/g, '');

fs.writeFileSync("src/components/__tests__/IntakeWizard.test.tsx", testCode);
console.log("Cleaned emojis in IntakeWizard.test.tsx");
