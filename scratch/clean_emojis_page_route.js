const fs = require("fs");

// 1. Clean src/app/page.tsx
let pageCode = fs.readFileSync("src/app/page.tsx", "utf8");

pageCode = pageCode.replace(/🤖\s*/g, '');
pageCode = pageCode.replace(/🚗\s*/g, '');
pageCode = pageCode.replace(/👟\s*/g, '');
pageCode = pageCode.replace(/☕\s*/g, '');
pageCode = pageCode.replace(/🪑\s*/g, '');
pageCode = pageCode.replace(/🎯\s*/g, '');
pageCode = pageCode.replace(/🔑\s*/g, '');
pageCode = pageCode.replace(/💡\s*/g, '');
pageCode = pageCode.replace(/✨\s*/g, '');
pageCode = pageCode.replace(/💬\s*/g, '');
pageCode = pageCode.replace("{ag.icon || ''}", '<Bot className="w-4 h-4 text-cyan-400" />');
pageCode = pageCode.replace("{selectedAgent?.icon || ''}", '<Bot className="w-5 h-5 text-cyan-400" />');
pageCode = pageCode.replace("{targetAgent.icon || ''}", '');

fs.writeFileSync("src/app/page.tsx", pageCode);
console.log("Cleaned emojis in src/app/page.tsx");

// 2. Clean src/app/api/agent/chat/route.ts
let routeCode = fs.readFileSync("src/app/api/agent/chat/route.ts", "utf8");

routeCode = routeCode.replace(/☕\s*/g, '');
routeCode = routeCode.replace(/🚗\s*/g, '');
routeCode = routeCode.replace(/🪑\s*/g, '');
routeCode = routeCode.replace(/👟\s*/g, '');
routeCode = routeCode.replace(/🔑\s*/g, '');
routeCode = routeCode.replace(/💡\s*/g, '');
routeCode = routeCode.replace(/🤖\s*/g, '');
routeCode = routeCode.replace(/📋\s*/g, '');

fs.writeFileSync("src/app/api/agent/chat/route.ts", routeCode);
console.log("Cleaned emojis in src/app/api/agent/chat/route.ts");

// 3. Clean src/app/api/agent/research-parameters/route.ts
let researchCode = fs.readFileSync("src/app/api/agent/research-parameters/route.ts", "utf8");
researchCode = researchCode.replace(/[\uD83C-\uDBFF\uDC00-\uDFFF]/g, '');
fs.writeFileSync("src/app/api/agent/research-parameters/route.ts", researchCode);
console.log("Cleaned emojis in research-parameters route.ts");
