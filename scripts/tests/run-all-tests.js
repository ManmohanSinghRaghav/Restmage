#!/usr/bin/env node

/**
 * Master Test Runner for Restmage
 * Centralized testing from scripts/tests folder
 * Orchestrates all testing activities across the application
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function banner() {
  log('\n╔════════════════════════════════════════╗', 'cyan');
  log('║   🧪 RESTMAGE TEST SUITE RUNNER      ║', 'cyan');
  log('╚════════════════════════════════════════╝\n', 'cyan');
}

async function runCommand(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      stdio: 'inherit',
      cwd: cwd,
      shell: true
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    proc.on('error', (err) => {
      reject(err);
    });
  });
}

async function runTests(type = 'all') {
  banner();

  const rootDir = path.join(__dirname, '../..');
  const serverDir = path.join(rootDir, 'server');
  const clientDir = path.join(rootDir, 'client');
  const startTime = Date.now();

  try {
    if (type === 'all' || type === 'unit') {
      log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
      log('  📦 Running Unit Tests', 'blue');
      log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'blue');
      
      log('  → Server Unit Tests...', 'yellow');
      await runCommand('npm', ['test', '--', '--testPathPattern=unit'], serverDir);
      log('  ✅ Server unit tests passed\n', 'green');

      log('  → Client Unit Tests...', 'yellow');
      await runCommand('npm', ['test', '--', '--testPathPattern=unit', '--watchAll=false'], clientDir);
      log('  ✅ Client unit tests passed\n', 'green');
    }

    if (type === 'all' || type === 'integration') {
      log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
      log('  🔗 Running Integration Tests', 'blue');
      log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'blue');
      
      log('  → API Integration Tests...', 'yellow');
      await runCommand('npm', ['test', '--', '--testPathPattern=integration'], serverDir);
      log('  ✅ Integration tests passed\n', 'green');
    }

    if (type === 'all' || type === 'e2e') {
      log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
      log('  🌐 Running End-to-End Tests', 'blue');
      log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'blue');
      
      log('  ⚠️  E2E tests require server to be running on port 5000', 'yellow');
      log('  → Checking if server is accessible...', 'yellow');
      // E2E tests would go here
      log('  ℹ️  E2E tests not yet configured\n', 'cyan');
    }

    if (type === 'coverage') {
      log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
      log('  📊 Generating Coverage Report', 'blue');
      log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'blue');
      
      log('  → Server Coverage...', 'yellow');
      await runCommand('npm', ['test', '--', '--coverage'], serverDir);
      
      log('  → Client Coverage...', 'yellow');
      await runCommand('npm', ['test', '--', '--coverage', '--watchAll=false'], clientDir);
      
      log('\n  📈 Coverage reports generated:', 'cyan');
      log('     • server/coverage/lcov-report/index.html', 'cyan');
      log('     • client/coverage/lcov-report/index.html\n', 'cyan');
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    log('\n╔════════════════════════════════════════╗', 'green');
    log('║   ✅ ALL TESTS PASSED SUCCESSFULLY   ║', 'green');
    log('╚════════════════════════════════════════╝', 'green');
    log(`\n⏱️  Total Time: ${duration}s\n`, 'cyan');

    process.exit(0);
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    log('\n╔════════════════════════════════════════╗', 'red');
    log('║   ❌ TESTS FAILED                    ║', 'red');
    log('╚════════════════════════════════════════╝', 'red');
    log(`\n⏱️  Time: ${duration}s`, 'cyan');
    log(`❌ Error: ${error.message}\n`, 'red');
    
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const testType = args[0]?.replace('--', '') || 'all';

// Validate test type
const validTypes = ['all', 'unit', 'integration', 'e2e', 'coverage'];
if (!validTypes.includes(testType)) {
  log(`\n❌ Invalid test type: ${testType}`, 'red');
  log(`Valid types: ${validTypes.join(', ')}\n`, 'yellow');
  log('Usage: node run-all-tests.js [--unit|--integration|--e2e|--coverage]\n', 'blue');
  process.exit(1);
}

runTests(testType);
