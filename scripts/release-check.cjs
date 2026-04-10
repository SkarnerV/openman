#!/usr/bin/env node
/**
 * Check release prerequisites
 */

const { execSync } = require('child_process');

const checks = [
  {
    name: 'On main branch',
    cmd: 'git branch --show-current',
    expected: 'main'
  },
  {
    name: 'No uncommitted changes',
    cmd: 'git diff-index --quiet HEAD -- && echo "clean"',
    expected: 'clean'
  },
  {
    name: 'Tests pass',
    cmd: 'npm run test:run --silent && echo "pass"',
    expected: 'pass'
  },
  {
    name: 'Lint passes',
    cmd: 'npm run lint --silent && echo "pass"',
    expected: 'pass'
  },
  {
    name: 'Rust compiles',
    cmd: 'cd src-tauri && cargo check --quiet 2>/dev/null && echo "pass"',
    expected: 'pass'
  }
];

console.log('Checking release prerequisites...\n');

let allPassed = true;

for (const check of checks) {
  try {
    const result = execSync(check.cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
    const passed = result === check.expected || check.expected === 'pass';
    console.log(`${passed ? '✓' : '✗'} ${check.name}`);
    if (!passed) allPassed = false;
  } catch {
    console.log(`✗ ${check.name}`);
    allPassed = false;
  }
}

// Check GitHub CLI
try {
  execSync('gh auth status');
  console.log('✓ GitHub CLI authenticated');
} catch {
  console.log('✗ GitHub CLI not authenticated (run: gh auth login)');
  allPassed = false;
}

// Check Tauri signing key (can't actually check secrets, just warn)
console.log('ℹ️  Ensure TAURI_PRIVATE_KEY is set in GitHub secrets');

console.log(allPassed ? '\n✅ Ready to release!' : '\n⚠️  Fix issues before releasing');
process.exit(allPassed ? 0 : 1);