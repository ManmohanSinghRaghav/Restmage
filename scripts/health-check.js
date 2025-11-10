#!/usr/bin/env node

/**
 * Health Check Script for Restmage
 * Validates that all components are properly configured and running
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function checkFileExists(filePath, description) {
  const exists = fs.existsSync(filePath);
  if (exists) {
    log(`✓ ${description}`, 'green');
  } else {
    log(`✗ ${description} - NOT FOUND`, 'red');
  }
  return exists;
}

function checkServer(port, name) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: port,
      path: '/api/health',
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      if (res.statusCode === 200) {
        log(`✓ ${name} is running on port ${port}`, 'green');
        resolve(true);
      } else {
        log(`✗ ${name} returned status ${res.statusCode}`, 'red');
        resolve(false);
      }
    });

    req.on('error', () => {
      log(`✗ ${name} is not responding on port ${port}`, 'red');
      resolve(false);
    });

    req.on('timeout', () => {
      log(`✗ ${name} request timed out`, 'red');
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

async function runHealthCheck() {
  log('\n=== Restmage Health Check ===\n', 'blue');

  // Check directory structure
  log('Checking directory structure...', 'yellow');
  const checks = [
    checkFileExists(path.join(__dirname, '../client'), 'Client directory'),
    checkFileExists(path.join(__dirname, '../server'), 'Server directory'),
    checkFileExists(path.join(__dirname, '../client/src/components/MapEditor'), 'MapEditor component'),
    checkFileExists(path.join(__dirname, '../server/routes/gemini.js'), 'Gemini API route'),
    checkFileExists(path.join(__dirname, '../server/routes/export-pdf.js'), 'Export PDF route'),
    checkFileExists(path.join(__dirname, '../client/src/components/FloorPlan/WorkflowChoice.tsx'), 'WorkflowChoice component')
  ];

  log('\nChecking package files...', 'yellow');
  checkFileExists(path.join(__dirname, '../client/package.json'), 'Client package.json');
  checkFileExists(path.join(__dirname, '../server/package.json'), 'Server package.json');
  checkFileExists(path.join(__dirname, '../client/node_modules'), 'Client dependencies');
  checkFileExists(path.join(__dirname, '../server/node_modules'), 'Server dependencies');

  log('\nChecking configuration files...', 'yellow');
  const envExists = checkFileExists(path.join(__dirname, '../server/.env'), 'Server .env file');
  if (!envExists) {
    log('  Note: Create a .env file in the server directory with MONGODB_URI and other settings', 'yellow');
  }

  log('\nChecking servers...', 'yellow');
  log('  Note: Servers must be running for these checks', 'yellow');
  await checkServer(5000, 'Backend API');
  await checkServer(3000, 'Frontend React App');

  log('\nChecking test files...', 'yellow');
  checkFileExists(path.join(__dirname, '../server/tests/integration.test.js'), 'Integration tests');
  checkFileExists(path.join(__dirname, '../client/src/components/FloorPlan/WorkflowChoice.test.tsx'), 'Component tests');

  log('\n=== Health Check Complete ===\n', 'blue');
  log('To start the application:', 'yellow');
  log('  npm run dev', 'green');
  log('\nTo run tests:', 'yellow');
  log('  npm test', 'green');
  log('\nFor more information, see README.md\n', 'yellow');
}

runHealthCheck().catch(error => {
  log(`\nHealth check failed: ${error.message}`, 'red');
  process.exit(1);
});
