import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

function getAllTsxFiles(dir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      if (!file.startsWith(".") && file !== "node_modules" && file !== "__tests__") {
        results = results.concat(getAllTsxFiles(fullPath));
      }
    } else if (file.endsWith(".tsx")) {
      results.push(fullPath);
    }
  });
  return results;
}

describe("Next.js Directive Governance Tests", () => {
  it("Ensures all Client Components with react hooks have use client directive on Line 1", () => {
    const srcDir = path.resolve(process.cwd(), "src");
    const tsxFiles = getAllTsxFiles(srcDir);
    const violations: string[] = [];

    tsxFiles.forEach((filePath) => {
      const content = fs.readFileSync(filePath, "utf-8");
      const lines = content.split("\n").map((l) => l.trim());

      const usesHooks = content.includes("useState") || content.includes("useEffect") || content.includes("useRef");
      const hasUseClient = content.includes("use client");

      if (hasUseClient) {
        const firstLine = lines[0];
        if (!firstLine.includes("use client")) {
          const lineIdx = lines.findIndex((l) => l.includes("use client"));
          violations.push(`${path.relative(process.cwd(), filePath)} has use client on line ${lineIdx + 1} instead of line 1`);
        }
      }
    });

    expect(violations).toEqual([]);
  });
});
