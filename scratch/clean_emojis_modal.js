const fs = require("fs");

let code = fs.readFileSync("src/components/UserRAGMemoryModal.tsx", "utf8");

// Remove emojis from select options
code = code.replace('<option value="medical">🦵 Pohybová citlivost & komfort</option>', '<option value="medical">Pohybová citlivost & komfort</option>');
code = code.replace('<option value="biometrics">👤 Biometrie & Rozměry</option>', '<option value="biometrics">Biometrie & Rozměry</option>');
code = code.replace('<option value="preference">🏷️ Značková preference</option>', '<option value="preference">Značková preference</option>');
code = code.replace('<option value="history">📦 Nákupní historie</option>', '<option value="history">Nákupní historie</option>');

// Remove inline emojis
code = code.replace(/✏️\s*/g, '');
code = code.replace(/🗑️\s*/g, '');
code = code.replace(/👤\s*/g, '');
code = code.replace(/📐\s*/g, '');
code = code.replace(/⚖️\s*/g, '');
code = code.replace(/👫\s*/g, '');
code = code.replace(/📍\s*/g, '');

fs.writeFileSync("src/components/UserRAGMemoryModal.tsx", code);
console.log("Cleaned emojis in UserRAGMemoryModal.tsx");
