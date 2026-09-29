const fs = require("fs");

let pageCode = fs.readFileSync("src/app/page.tsx", "utf8");

if (!pageCode.includes("inspectedRagMetadata")) {
  pageCode = pageCode.replace(
    "const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);",
    "const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);\n  const [inspectedRagMetadata, setInspectedRagMetadata] = useState<any | null>(null);\n  const [ragLearnedNotification, setRagLearnedNotification] = useState<string | null>(null);"
  );
  fs.writeFileSync("src/app/page.tsx", pageCode);
  console.log("Added inspectedRagMetadata and ragLearnedNotification states to page.tsx");
}
