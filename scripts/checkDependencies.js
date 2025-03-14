#!/usr/bin/env node

/**
 * Check if all required dependencies are installed
 * Helps identify missing dependencies before running tests or the application
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m"
};

// List of dependencies to check
const dependencies = [
  'puppeteer',
  'axios',
  'fs-extra',
  'commander'
];

console.log(`${colors.bright}Checking dependencies...${colors.reset}\n`);

const missingDependencies = [];

for (const dependency of dependencies) {
  try {
    require.resolve(dependency);
    console.log(`${colors.green}✓${colors.reset} ${dependency} is installed.`);
  } catch (error) {
    missingDependencies.push(dependency);
    console.log(`${colors.red}✗${colors.reset} ${dependency} is missing.`);
  }
}

if (missingDependencies.length > 0) {
  console.log(`\n${colors.yellow}Missing dependencies:${colors.reset} ${missingDependencies.join(', ')}`);
  console.log(`\nInstall missing dependencies with:\n${colors.bright}npm install ${missingDependencies.join(' ')}${colors.reset}\n`);
  process.exit(1);
} else {
  console.log(`\n${colors.green}All dependencies are installed.${colors.reset}\n`);
}
