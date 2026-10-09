#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');

const pkgPath = resolve(rootDir, 'package.json');
const versionFilePath = resolve(rootDir, 'src/lib/version.ts');

try {
  const pkgRaw = readFileSync(pkgPath, 'utf8');
  const pkg = JSON.parse(pkgRaw);

  const currentVersion = pkg.version || '1.0.0';
  const parts = currentVersion.split('.').map((p) => parseInt(p, 10));

  if (parts.length !== 3 || parts.some(isNaN)) {
    console.error(`[bAIright] Invalid semantic version in package.json: "${currentVersion}"`);
    process.exit(1);
  }

  // Increment patch version
  parts[2] += 1;
  const newVersion = parts.join('.');

  pkg.version = newVersion;
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');

  const versionTsContent = `/**
 * Central Application Version Configuration
 * bAIright Universal AI Shopping Advisor
 */
export const APP_VERSION = 'v${newVersion}';
`;
  writeFileSync(versionFilePath, versionTsContent, 'utf8');

  // Stage bumped files into the current commit automatically
  execSync(`git add "${pkgPath}" "${versionFilePath}"`, { stdio: 'inherit', cwd: rootDir });

  console.log(`[bAIright] Automatically bumped patch version: ${currentVersion} -> v${newVersion}`);
} catch (error) {
  console.error('[bAIright] Failed to bump version:', error);
  process.exit(1);
}
