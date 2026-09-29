const fs = require("fs");

let code = fs.readFileSync("src/components/AgentCategoryLauncher.tsx", "utf8");

// Replace emoji strings with clean text / icons
code = code.replace(/icon:\s*['"][^'"]+['"]/g, "icon: ''");

// Clean inline emojis
code = code.replace(/🤖\s*/g, '');
code = code.replace(/👟\s*/g, '');
code = code.replace(/🚗\s*/g, '');
code = code.replace(/☕\s*/g, '');
code = code.replace(/🪑\s*/g, '');
code = code.replace(/🎯\s*/g, '');
code = code.replace(/👥\s*/g, '');
code = code.replace(/⚡\s*/g, '');
code = code.replace(/✨\s*/g, '');

fs.writeFileSync("src/components/AgentCategoryLauncher.tsx", code);
console.log("Cleaned emojis in AgentCategoryLauncher.tsx");
