#!/usr/bin/env node
/**
 * Bump version across all files
 * Usage: node scripts/version-bump.js 0.2.0
 */

const fs = require('fs');
const path = require('path');

const NEW_VERSION = process.argv[2];
if (!NEW_VERSION) {
  console.error('Usage: npm run version:bump <semver>');
  process.exit(1);
}

const files = [
  { path: 'package.json', pattern: /"version": "\d+\.\d+\.\d+"/, replacement: `"version": "${NEW_VERSION}"` },
  { path: 'src-tauri/Cargo.toml', pattern: /^version = "\d+\.\d+\.\d+"/m, replacement: `version = "${NEW_VERSION}"` },
  { path: 'src-tauri/tauri.conf.json', pattern: /"version": "\d+\.\d+\.\d+"/, replacement: `"version": "${NEW_VERSION}"` },
  { path: 'src/services/fileLogger.ts', pattern: /const VERSION = "\d+\.\d+\.\d+"/, replacement: `const VERSION = "${NEW_VERSION}"` },
  { path: 'src/App.tsx', pattern: /v\d+\.\d+\.\d+/g, replacement: `v${NEW_VERSION}` },
  { path: 'src/pages/SettingsPage.tsx', pattern: /v\d+\.\d+\.\d+/g, replacement: `v${NEW_VERSION}` },
];

// E2E files
const e2eFiles = [
  'e2e/fixtures/tauri-mock.ts',
  'e2e/logging.spec.ts',
  'e2e/settings.spec.ts'
];

console.log(`Bumping version to ${NEW_VERSION}...\n`);

// Update main files
files.forEach(({ path: filePath, pattern, replacement }) => {
  const fullPath = path.join(__dirname, '..', filePath);
  const content = fs.readFileSync(fullPath, 'utf8');
  const newContent = content.replace(pattern, replacement);
  fs.writeFileSync(fullPath, newContent);
  console.log(`✓ ${filePath}`);
});

// Update E2E files (all occurrences)
e2eFiles.forEach(filePath => {
  const fullPath = path.join(__dirname, '..', filePath);
  const content = fs.readFileSync(fullPath, 'utf8');
  const newContent = content.replace(/v\d+\.\d+\.\d+/g, `v${NEW_VERSION}`);
  fs.writeFileSync(fullPath, newContent);
  console.log(`✓ ${filePath}`);
});

console.log(`\nVersion bumped to ${NEW_VERSION}`);
console.log('Run `npm run version:verify` to confirm.');