#!/usr/bin/env node

/**
 * Test Migration Script
 * Moves all test files from scattered locations to scripts/tests/
 */

const fs = require('fs');
const path = require('path');

const COLORS = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

const testFilesToMove = [
  // Server unit tests
  {
    from: 'server/tests/unit/auth.middleware.test.js',
    to: 'scripts/tests/unit/server/auth.middleware.test.js'
  },
  {
    from: 'server/tests/unit/validateObjectId.middleware.test.js',
    to: 'scripts/tests/unit/server/validateObjectId.middleware.test.js'
  },
  // Server integration tests
  {
    from: 'server/tests/integration/gemini-export.test.js',
    to: 'scripts/tests/integration/api/gemini-export.test.js'
  },
  // Client tests
  {
    from: 'client/src/components/FloorPlan/WorkflowChoice.test.tsx',
    to: 'scripts/tests/unit/client/WorkflowChoice.test.tsx'
  },
  {
    from: 'client/src/App.test.tsx',
    to: 'scripts/tests/unit/client/App.test.tsx'
  }
];

function moveTestFile(from, to) {
  const rootDir = path.join(__dirname, '../..');
  const fromPath = path.join(rootDir, from);
  const toPath = path.join(rootDir, to);

  try {
    if (fs.existsSync(fromPath)) {
      // Create directory if it doesn't exist
      const toDir = path.dirname(toPath);
      if (!fs.existsSync(toDir)) {
        fs.mkdirSync(toDir, { recursive: true });
        log(`   📁 Created directory: ${path.relative(rootDir, toDir)}`, 'cyan');
      }

      // Copy file
      fs.copyFileSync(fromPath, toPath);
      log(`   ✅ Copied: ${from}`, 'green');
      log(`      → ${to}`, 'cyan');

      // Delete original
      fs.unlinkSync(fromPath);
      log(`   🗑️  Removed original: ${from}`, 'yellow');
      
      return true;
    } else {
      log(`   ⚠️  File not found: ${from}`, 'yellow');
      return false;
    }
  } catch (error) {
    log(`   ❌ Error moving ${from}: ${error.message}`, 'red');
    return false;
  }
}

function cleanupEmptyDirs(dir) {
  const rootDir = path.join(__dirname, '../..');
  const fullPath = path.join(rootDir, dir);
  
  if (!fs.existsSync(fullPath)) return;

  try {
    const files = fs.readdirSync(fullPath);
    
    if (files.length === 0) {
      fs.rmdirSync(fullPath);
      log(`   🗑️  Removed empty directory: ${dir}`, 'yellow');
    } else {
      // Check subdirectories
      files.forEach(file => {
        const filePath = path.join(fullPath, file);
        if (fs.statSync(filePath).isDirectory()) {
          cleanupEmptyDirs(path.join(dir, file));
        }
      });
      
      // Recheck if directory is now empty
      const remainingFiles = fs.readdirSync(fullPath);
      if (remainingFiles.length === 0) {
        fs.rmdirSync(fullPath);
        log(`   🗑️  Removed empty directory: ${dir}`, 'yellow');
      }
    }
  } catch (error) {
    // Directory might have been removed already
  }
}

function main() {
  log('\n╔════════════════════════════════════════╗', 'cyan');
  log('║   🔄 TEST MIGRATION IN PROGRESS      ║', 'cyan');
  log('╚════════════════════════════════════════╝\n', 'cyan');

  log('📋 Migrating test files to scripts/tests/...\n', 'yellow');

  let moved = 0;
  let failed = 0;

  testFilesToMove.forEach(({ from, to }) => {
    if (moveTestFile(from, to)) {
      moved++;
    } else {
      failed++;
    }
    log(''); // Empty line for readability
  });

  log('\n🧹 Cleaning up empty directories...\n', 'yellow');
  
  cleanupEmptyDirs('server/tests/unit');
  cleanupEmptyDirs('server/tests/integration');
  cleanupEmptyDirs('server/tests');

  log('\n╔════════════════════════════════════════╗', 'green');
  log('║   ✅ MIGRATION COMPLETE              ║', 'green');
  log('╚════════════════════════════════════════╝', 'green');
  log(`\n📊 Results:`, 'cyan');
  log(`   ✅ Files moved: ${moved}`, 'green');
  log(`   ⚠️  Files skipped: ${failed}`, 'yellow');
  log(`\n📁 All tests are now in: scripts/tests/\n`, 'cyan');
}

main();
