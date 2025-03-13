/**
 * Simple reporter for Mocha with minimal output
 */

class SimpleReporter {
  constructor(runner) {
    this.passes = 0;
    this.failures = 0;
    this.totalTests = 0;
    this.failedTests = [];
    
    runner.on('pass', (test) => {
      this.passes++;
      this.totalTests++;
    });
    
    runner.on('fail', (test, err) => {
      this.failures++;
      this.totalTests++;
      this.failedTests.push({
        title: test.fullTitle(),
        error: err.message
      });
    });
    
    runner.on('end', () => {
      // Print summary
      console.log(`\n=== Test Summary ===`);
      console.log(`Total: ${this.totalTests}`);
      console.log(`Passed: ${this.passes}`);
      console.log(`Failed: ${this.failures}`);
      
      // Print failures
      if (this.failures > 0) {
        console.log('\n=== Failed Tests ===');
        this.failedTests.forEach((test, i) => {
          console.log(`${i+1}. ${test.title}`);
          console.log(`   Error: ${test.error}`);
        });
        console.log('\n❌ Tests failed');
      } else {
        console.log('\n✅ All tests passed');
      }
    });
  }
}

module.exports = SimpleReporter;
