#!/usr/bin/env node
/**
 * Verify version consistency across all files
 */

const fs = require('fs');
const path = require('path');

const files = [
  'package.json',
  'src-tauri/Cargo.toml',
  'src-tauri/tauri.conf.json',
  'src/services/fileLogger.ts',
  'src/App.tsx',
  'src/pages/SettingsPage.tsx',
];

const extractVersion = (content, file) => {
  if (file.endsWith('Cargo.toml')) {
    const match = content.match(/version = "(\d+\.\d+\.\d+)"/);
    return match?.[1];
  }
  if (file.endsWith('.json')) {
    const match = content.match(/"version": "(\d+\.\d+\.\d+)"/);
    return match?.[1];
  }
  if (file.endsWith('fileLogger.ts')) {
    const match = content.match(/VERSION = "(\d+\.\d+\.\d+)"/);
    return match?.[1];
  }
  // TypeScript files - find vX.Y.Z pattern
  const match = content.match(/v(\d+\.\d+\.\d+)/);
  return match?.[1];
};

console.log('Checking version consistency...\n');

const versions = new Map();

files.forEach(file => {
  const content = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const version = extractVersion(content, file);
  versions.set(file, version);
  console.log(`${version || 'NOT FOUND'} — ${file}`);
});

const uniqueVersions = [...new Set(versions.values())];
if (uniqueVersions.length === 1 && uniqueVersions[0]) {
  console.log(`\n✓ All files consistent at version ${uniqueVersions[0]}`);
  process.exit(0);
} else {
  console.log(`\n✗ Version mismatch detected!`);
  process.exit(1);
}