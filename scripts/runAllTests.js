#!/usr/bin/env node

/**
 * Complete Test and Verification Runner
 *
 * This script executes all tests and verifications in sequence:
 * 1. Unit tests
 * 2. Comprehensive test suite
 * 3. Output verification (text and JSON)
 */

const { spawn } = require("child_process");
const path = require("path");

// Terminal colors for better readability
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  underscore: "\x1b[4m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
};

// Track overall test results
const results = {
  unitTests: false,
  comprehensiveTests: false,
  outputVerification: false,
  liveTests: false,
};

/**
 * Print a section header
 */
function printHeader(title) {
  const line = "=".repeat(title.length + 10);
  console.log(`\n${colors.bright}${colors.magenta}${line}${colors.reset}`);
  console.log(
    `${colors.bright}${colors.magenta}===== ${title} =====${colors.reset}`
  );
  console.log(`${colors.bright}${colors.magenta}${line}${colors.reset}\n`);
}

/**
 * Run a command as a promise
 */
function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    console.log(
      `${colors.blue}> ${command} ${args.join(" ")}${colors.reset}\n`
    );

    const childProcess = spawn(command, args, {
      stdio: "inherit",
      shell: true, // Use shell for all platforms
      env: { ...process.env } // Ensure environment variables are passed
    });

    childProcess.on("close", (code) => {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      if (code === 0) {
        console.log(
          `\n${colors.green}Command completed successfully in ${duration}s${colors.reset}`
        );
        resolve(true);
      } else {
        console.log(
          `\n${colors.red}Command failed with code ${code} after ${duration}s${colors.reset}`
        );
        resolve(false);
      }
    });

    childProcess.on("error", (error) => {
      reject(error);
    });
  });
}

/**
 * Print test summary
 */
function printSummary() {
  printHeader("TEST SUMMARY");

  const allPassed = Object.values(results).every((result) => result);
  const passCount = Object.values(results).filter((result) => result).length;
  const totalTests = Object.keys(results).length;

  console.log(`${colors.cyan}Tests Run: ${totalTests}${colors.reset}`);
  console.log(`${colors.green}Tests Passed: ${passCount}${colors.reset}`);
  console.log(
    `${colors.red}Tests Failed: ${totalTests - passCount}${colors.reset}`
  );

  console.log("\n");
  for (const [test, result] of Object.entries(results)) {
    const icon = result ? "✓" : "✖";
    const color = result ? colors.green : colors.red;
    console.log(`${color}${icon} ${test}${colors.reset}`);
  }

  console.log("\n");
  if (allPassed) {
    console.log(
      `${colors.bgGreen}${colors.black} ALL TESTS PASSED ${colors.reset}`
    );
  } else {
    console.log(
      `${colors.bgRed}${colors.white} SOME TESTS FAILED ${colors.reset}`
    );
  }

  return allPassed;
}

/**
 * Main function to run all tests
 */
async function runAllTests() {
  const startTime = Date.now();
  const verbose = process.env.SCOOPIT_VERBOSE === 'true';
  const testSite = process.env.TEST_SITE || 'https://example.com';

  printHeader("SCOOPIT COMPLETE TEST SUITE");
  console.log(
    `${colors.yellow}Running all tests and verifications...${colors.reset}\n`
  );
  console.log(`${colors.dim}Verbose mode: ${verbose ? 'enabled' : 'disabled'}${colors.reset}`);
  console.log(`${colors.dim}Test site: ${testSite}${colors.reset}\n`);

  try {
    // Step 1: Run unit tests
    printHeader("RUNNING UNIT TESTS");
    results.unitTests = await runCommand("npx", ["mocha", "test/**/*.js"]);

    // Step 2: Run comprehensive tests
    printHeader("RUNNING COMPREHENSIVE TESTS");
    results.comprehensiveTests = await runCommand("node", [
      "scripts/testRunner.js",
      verbose ? "--verbose" : "",
    ].filter(Boolean));

    // Step 3: Run output verification
    printHeader("VERIFYING TEXT AND JSON OUTPUTS");
    results.outputVerification = await runCommand("node", [
      "scripts/verifyOutputs.js",
    ]);
    
    // Step 4: Run live tests
    printHeader("RUNNING LIVE TESTS");
    console.log(`${colors.yellow}Testing live scraping against ${testSite}${colors.reset}\n`);
    
    // Set NODE_ENV=test to ensure fallback file generation
    process.env.NODE_ENV = 'test';
    
    results.liveTests = await runCommand("node", [
      "scripts/liveTest.js",
      `--site=${testSite}`,
      verbose ? "--verbose" : "",
    ].filter(Boolean));

    // Step 5: Print summary
    const allPassed = printSummary();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(
      `\n${colors.dim}Total execution time: ${duration}s${colors.reset}`
    );

    return allPassed;
  } catch (error) {
    console.error(`\n${colors.red}Error running tests:${colors.reset}`, error);
    return false;
  }
}

// Run all tests if script is executed directly
if (require.main === module) {
  runAllTests()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error(
        `\n${colors.red}Test runner failed with an error:${colors.reset}`,
        error
      );
      process.exit(1);
    });
}

module.exports = { runAllTests };
