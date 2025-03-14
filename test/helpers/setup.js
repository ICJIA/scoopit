/**
 * Test setup helper to handle dependencies and mocking
 */
const fs = require("fs-extra");
const path = require("path");
const sinon = require("sinon");

/**
 * Setup environment for tests, handling optional dependencies
 */
function setupTestEnvironment() {
  // Mock puppeteer if not available
  try {
    require("puppeteer");
  } catch (error) {
    console.warn("Puppeteer not available, using mock for tests");

    // Replace jest.mock with a more Mocha/Sinon compatible approach
    // Create a global mock that can be used in tests
    global.puppeteer = {
      launch: async () => ({
        newPage: async () => ({
          goto: async () => {},
          evaluate: async () => "Mock content",
          $: async () => ({ evaluate: async () => "Mock element content" }),
          $$: async () => [],
          close: async () => {},
        }),
        close: async () => {},
      }),
    };

    // If we need to mock require calls, we would need to use proxyquire in the tests
  }
}

module.exports = {
  setupTestEnvironment,
};
