/**
 * Quiet Test Reporter for Mocha
 * Shows only essential information about test results
 */

class QuietReporter {
  constructor(runner) {
    this.passCount = 0;
    this.failCount = 0;
    this.pendingCount = 0;
    this.suites = new Map();
    this.currentSuite = null;
    
    runner.on('suite', (suite) => {
      if (suite.parent && suite.parent.root) {
        this.currentSuite = suite.title;
        this.suites.set(suite.title, {
          total: 0,
          passes: 0,
          failures: 0,
          failureDetails: []
        });
      }
    });

    runner.on('pass', () => {
      this.passCount++;
      
      if (this.currentSuite && this.suites.has(this.currentSuite)) {
        const suite = this.suites.get(this.currentSuite);
        suite.passes++;
        suite.total++;
      }
    });

    runner.on('fail', (test, err) => {
      this.failCount++;
      
      if (this.currentSuite && this.suites.has(this.currentSuite)) {
        const suite = this.suites.get(this.currentSuite);
        suite.failures++;
        suite.total++;
        suite.failureDetails.push({
          title: test.title,
          error: err.message
        });
      }
    });

    runner.on('pending', () => {
      this.pendingCount++;
    });

    runner.on('end', () => {
      this.printSummary();
    });
  }

  printSummary() {
    console.log('\n=== Test Results ===');
    
    this.suites.forEach((suite, name) => {
      console.log(`\n${name}:`);
      console.log(`  Tests: ${suite.total} | Passed: ${suite.passes} | Failed: ${suite.failures}`);
      
      if (suite.failures > 0) {
        console.log('  Failed Tests:');
        suite.failureDetails.forEach((failure, i) => {
          console.log(`  ${i+1}. "${failure.title}"`);
          console.log(`     Error: ${failure.error}`);
        });
      }
    });
    
    const totalTests = this.passCount + this.failCount + this.pendingCount;
    
    console.log('\n=== Summary ===');
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${this.passCount}`);
    console.log(`Failed: ${this.failCount}`);
    if (this.pendingCount > 0) {
      console.log(`Pending: ${this.pendingCount}`);
    }
    
    if (this.failCount > 0) {
      console.log('\n⚠️  Tests Failed: ' + this.failCount);
    } else {
      console.log('\n✅ All Tests Passed');
    }
  }
}

module.exports = QuietReporter;
