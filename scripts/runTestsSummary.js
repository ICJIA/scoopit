#!/usr/bin/env node

/**
 * Test runner with concise output format
 * Shows only test counts and failures
 */

const Mocha = require('mocha');
const path = require('path');
const fs = require('fs');
const { ensureTestSamples } = require('../test/test.samples');

// Set test environment
process.env.NODE_ENV = 'test';

// Create a new Mocha instance
const mocha = new Mocha({
  reporter: function(runner) {
    // Track test statistics by suite
    let suites = new Map();
    let currentSuite = null;
    let passes = 0;
    let failures = 0;
    let pending = 0;
    
    runner.on('suite', function(suite) {
      // Only track top-level suites
      if (suite.parent && suite.parent.root) {
        currentSuite = suite.title;
        suites.set(currentSuite, { total: 0, passes: 0, failures: 0, failureDetails: [] });
      }
    });
    
    runner.on('pass', function() {
      passes++;
      if (currentSuite && suites.has(currentSuite)) {
        const suite = suites.get(currentSuite);
        suite.passes++;
        suite.total++;
      }
    });
    
    runner.on('fail', function(test, err) {
      failures++;
      if (currentSuite && suites.has(currentSuite)) {
        const suite = suites.get(currentSuite);
        suite.failures++;
        suite.total++;
        suite.failureDetails.push({
          title: test.title,
          error: err.message
        });
      }
    });
    
    runner.on('pending', function() {
      pending++;
    });
    
    runner.on('end', function() {
      // Display results by test suite
      console.log('\n=== TEST RESULTS ===');
      
      suites.forEach((suite, name) => {
        console.log(`\n${name}:`);
        console.log(`  Total: ${suite.total}, Passed: ${suite.passes}, Failed: ${suite.failures}`);
        
        // Show failure details if any
        if (suite.failures > 0) {
          console.log('  Failed tests:');
          suite.failureDetails.forEach((failure, i) => {
            console.log(`  ${i+1}. "${failure.title}"`);
            console.log(`     Error: ${failure.error}`);
          });
        }
      });
      
      // Display overall summary
      const total = passes + failures + pending;
      console.log('\n=== SUMMARY ===');
      console.log(`Total tests: ${total}`);
      console.log(`Passes: ${passes}`);
      console.log(`Failures: ${failures}`);
      if (pending > 0) {
        console.log(`Pending: ${pending}`);
      }
      
      console.log(failures > 0 ? '\n⚠️ Tests failed' : '\n✅ All tests passed');
      
      // Exit with appropriate code
      process.exitCode = failures > 0 ? 1 : 0;
    });
  }
});

// Ensure test samples exist before running tests
(async function() {
  await ensureTestSamples();
  
  // Find all test files
  const testDir = path.join(__dirname, '../test');
  const files = fs.readdirSync(testDir);
  
  // Add test files to mocha
  files.forEach(file => {
    if (file.endsWith('.test.js') || file === 'test.js') {
      mocha.addFile(path.join(testDir, file));
    }
  });
  
  // Run the tests
  mocha.run();
})();
