#!/usr/bin/env node

/**
 * Interactive Test Selector and Runner
 * 
 * This script allows the user to:
 * 1. Run all tests (default)
 * 2. Select specific tests to run
 * 3. See detailed test results and statistics
 */

const { spawn } = require('child_process');
const readline = require('readline');
const path = require('path');
const fs = require('fs');

// Define available test scripts
const testScripts = [
  { 
    id: 'unit', 
    name: 'Unit Tests',
    command: 'npm',
    args: ['run', 'test:unit'],
    description: 'Basic unit tests for core functionality'
  },
  { 
    id: 'integration', 
    name: 'Integration Tests',
    command: 'node',
    args: ['scripts/testRunner.js', '--integration-only'],
    description: 'Tests that verify content extraction from websites'
  },
  { 
    id: 'validation', 
    name: 'Output Validation Tests',
    command: 'node',
    args: ['scripts/testRunner.js', '--validation-only'],
    description: 'Validates generated output files are correct'
  },
  { 
    id: 'live', 
    name: 'Live Website Tests',
    command: 'node',
    args: ['scripts/liveTest.js'],
    description: 'Tests against a live website'
  }
];

// Colors for formatting output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  underscore: "\x1b[4m",
  blink: "\x1b[5m",
  reverse: "\x1b[7m",
  hidden: "\x1b[8m",

  black: "\x1b[30m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
};

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Test results storage
const testResults = {
  allTests: [],
  passed: 0,
  failed: 0,
  skipped: 0,
  startTime: null,
  endTime: null
};

/**
 * Format duration in milliseconds to a human-readable string
 */
function formatDuration(durationMs) {
  if (durationMs < 1000) {
    return `${durationMs}ms`;
  } else {
    const seconds = (durationMs / 1000).toFixed(2);
    return `${seconds}s`;
  }
}

/**
 * Display a separator line
 */
function printSeparator() {
  console.log(`${colors.cyan}${colors.bright}${'='.repeat(60)}${colors.reset}`);
}

/**
 * Run a test and capture its output
 */
async function runTest(test) {
  return new Promise((resolve) => {
    const testResult = {
      id: test.id,
      name: test.name,
      passed: false,
      output: [],
      startTime: Date.now(),
      endTime: 0,
      duration: 0
    };
    
    console.log(`\n${colors.bright}${colors.blue}Running: ${test.name}${colors.reset}`);
    console.log(`${colors.dim}Command: ${test.command} ${test.args.join(' ')}${colors.reset}`);
    console.log(`${colors.yellow}${'─'.repeat(60)}${colors.reset}`);
    
    const proc = spawn(test.command, test.args, { stdio: ['ignore', 'pipe', 'pipe'] });
    
    proc.stdout.on('data', (data) => {
      const output = data.toString();
      testResult.output.push(output);
      process.stdout.write(output);
    });
    
    proc.stderr.on('data', (data) => {
      const output = data.toString();
      testResult.output.push(`${colors.red}${output}${colors.reset}`);
      process.stdout.write(`${colors.red}${output}${colors.reset}`);
    });
    
    proc.on('close', (code) => {
      testResult.endTime = Date.now();
      testResult.duration = testResult.endTime - testResult.startTime;
      testResult.passed = code === 0;
      testResult.exitCode = code;
      
      if (testResult.passed) {
        testResults.passed++;
        console.log(`\n${colors.green}✓ Test completed successfully${colors.reset}`);
      } else {
        testResults.failed++;
        console.log(`\n${colors.red}✗ Test failed with exit code ${code}${colors.reset}`);
      }
      
      console.log(`${colors.dim}Duration: ${formatDuration(testResult.duration)}${colors.reset}`);
      testResults.allTests.push(testResult);
      resolve(testResult);
    });
  });
}

/**
 * Display test summary
 */
function displayTestSummary() {
  testResults.endTime = Date.now();
  const totalDuration = testResults.endTime - testResults.startTime;
  
  printSeparator();
  console.log(`${colors.bright}${colors.cyan}📊 TEST SUMMARY REPORT 📊${colors.reset}`);
  printSeparator();
  
  // Display individual test results
  console.log(`\n${colors.bright}Individual Test Results:${colors.reset}`);
  testResults.allTests.forEach((test, index) => {
    const statusColor = test.passed ? colors.green : colors.red;
    const statusSymbol = test.passed ? '✓' : '✗';
    console.log(`${statusColor}${statusSymbol} [${index + 1}] ${test.name}${colors.reset} - ${formatDuration(test.duration)}`);
  });
  
  // Display overall summary
  console.log(`\n${colors.bright}Overall Results:${colors.reset}`);
  console.log(`${colors.green}Passed: ${testResults.passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${testResults.failed}${colors.reset}`);
  
  if (testResults.skipped > 0) {
    console.log(`${colors.yellow}Skipped: ${testResults.skipped}${colors.reset}`);
  }
  
  console.log(`${colors.bright}Total tests: ${testResults.allTests.length}${colors.reset}`);
  console.log(`${colors.dim}Total duration: ${formatDuration(totalDuration)}${colors.reset}`);
  
  // Final status
  if (testResults.failed === 0) {
    console.log(`\n${colors.green}${colors.bright}✅ ALL TESTS PASSED ✅${colors.reset}`);
  } else {
    console.log(`\n${colors.red}${colors.bright}❌ SOME TESTS FAILED ❌${colors.reset}`);
  }
}

/**
 * Display the test selection menu and get user choices
 */
async function displayTestMenu() {
  return new Promise((resolve) => {
    console.log(`\n${colors.bright}${colors.cyan}ScoopIt Test Runner${colors.reset}`);
    console.log(`${colors.dim}Select which tests to run:${colors.reset}\n`);
    
    testScripts.forEach((test, index) => {
      console.log(`${colors.bright}${index + 1}.${colors.reset} ${colors.yellow}${test.name}${colors.reset}`);
      console.log(`   ${colors.dim}${test.description}${colors.reset}`);
    });
    
    console.log(`\n${colors.bright}A.${colors.reset} ${colors.green}Run All Tests${colors.reset} (default)`);
    console.log(`${colors.bright}Q.${colors.reset} ${colors.red}Quit${colors.reset}`);
    
    rl.question(`\n${colors.bright}Enter your choice (1-${testScripts.length}, A, Q):${colors.reset} `, (answer) => {
      if (!answer || answer.toLowerCase() === 'a') {
        resolve(testScripts.map(test => test.id));
      } else if (answer.toLowerCase() === 'q') {
        console.log('Exiting test runner');
        process.exit(0);
      } else {
        // Check if it's a valid number
        const num = parseInt(answer, 10);
        if (!isNaN(num) && num >= 1 && num <= testScripts.length) {
          resolve([testScripts[num - 1].id]);
        } else {
          console.log(`${colors.red}Invalid choice. Running all tests by default.${colors.reset}`);
          resolve(testScripts.map(test => test.id));
        }
      }
    });
  });
}

/**
 * Main function to run the program
 */
async function main() {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    let testIds;
    
    if (args.length > 0) {
      // If specific test ids were provided via command line
      testIds = args;
    } else {
      // Display menu and get user selection
      testIds = await displayTestMenu();
    }
    
    // Filter tests to only the selected ones
    const testsToRun = testScripts.filter(test => testIds.includes(test.id));
    
    if (testsToRun.length === 0) {
      console.log(`${colors.red}No valid tests selected. Exiting.${colors.reset}`);
      process.exit(1);
    }
    
    console.log(`\n${colors.bright}${colors.green}Running ${testsToRun.length} test${testsToRun.length > 1 ? 's' : ''}...${colors.reset}`);
    printSeparator();
    
    // Mark the start time
    testResults.startTime = Date.now();
    
    // Run all selected tests in sequence
    for (const test of testsToRun) {
      await runTest(test);
    }
    
    // Display summary
    displayTestSummary();
    
    // Exit with appropriate code
    process.exit(testResults.failed > 0 ? 1 : 0);
    
  } catch (error) {
    console.error(`${colors.red}Error running tests:${colors.reset}`, error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run the program
main();