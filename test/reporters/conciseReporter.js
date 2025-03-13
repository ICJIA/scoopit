/**
 * Concise Test Reporter for Mocha
 * Shows only test counts, test types, and failures with explanations
 */

class ConciseReporter {
  constructor(runner) {
    // Track test statistics
    this.tests = [];
    this.passes = 0;
    this.failures = 0;
    this.pending = 0;
    this.suites = new Map();
    
    runner.on('suite', (suite) => {
      // Only record top-level suites
      if (suite.parent && suite.parent.root) {
        this.currentSuite = suite.title;
        this.suites.set(suite.title, { total: 0, passes: 0, failures: 0, failureDetails: [] });
      }
    });

    runner.on('pass', (test) => {
      this.passes++;
      if (this.currentSuite && this.suites.has(this.currentSuite)) {
        const suite = this.suites.get(this.currentSuite);
        suite.passes++;
        suite.total++;
      }
    });

    runner.on('fail', (test, err) => {
      this.failures++;
      
      if (this.currentSuite && this.suites.has(this.currentSuite)) {
        const suite = this.suites.get(this.currentSuite);
        suite.failures++;
        suite.total++;
        
        // Store failure details
        suite.failureDetails.push({
          title: test.title,
          error: err.message
        });
      }
    });

    runner.on('pending', () => {
      this.pending++;
    });

    runner.on('end', () => {
      this.displayResults();
    });
  }

  displayResults() {
    console.log('\n=== TEST RESULTS ===\n');
    
    // Show summary for each test suite
    this.suites.forEach((suite, suiteName) => {
      console.log(`\n${suiteName}:`);
      console.log(`  Total: ${suite.total}, Passed: ${suite.passes}, Failed: ${suite.failures}`);
      
      // Show details for failures
      if (suite.failures > 0) {
        console.log('\n  Failed tests:');
        suite.failureDetails.forEach((failure, index) => {
          console.log(`  ${index + 1}. "${failure.title}"`);
          console.log(`     Error: ${failure.error}`);
        });
      }
    });
    
    // Overall summary
    const total = this.passes + this.failures + this.pending;
    console.log('\n=== SUMMARY ===');
    console.log(`Total tests: ${total}`);
    console.log(`Passes: ${this.passes}`);
    console.log(`Failures: ${this.failures}`);
    if (this.pending > 0) {
      console.log(`Pending: ${this.pending}`);
    }
    
    // Exit with appropriate code
    process.stdout.write(this.failures ? '\n⚠️  Tests failed\n' : '\n✅ All tests passed\n');
  }
}

module.exports = ConciseReporter;
