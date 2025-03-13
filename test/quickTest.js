#!/usr/bin/env node

/**
 * Quick test utility script for testing the application with specific parameters
 * Usage: node test/quickTest.js [baseUrl] [route] [format]
 *
 * Example:
 * node test/quickTest.js "https://github.com" "/pricing" "json"
 */

const { processRoutes } = require("../index");

// Only run as standalone script, not when being imported by tests
if (require.main === module) {
  const args = process.argv.slice(2);
  const baseUrl = args[0] || "https://wikipedia.org";
  const route = args[1] || "/";
  const format = args[2] || "text";

  console.log(`Quick test with parameters:
  - Base URL: ${baseUrl}
  - Route: ${route}
  - Format: ${format}
  `);

  // Process single route
  processRoutes(baseUrl, [route], format)
    .then((results) => {
      console.log("\nTest completed successfully!");
      console.log(`Generated ${results.length} result(s)`);
    })
    .catch((error) => {
      console.error("\nTest failed:", error);
    });
}

// Export a dummy test for Mocha
if (typeof describe !== 'undefined') {
  describe('Quick Test Utility', function() {
    it('should not run any tests when executed by Mocha', function() {
      // This is a placeholder test so Mocha doesn't complain
      // The actual testing is only performed when run directly
    });
  });
}
