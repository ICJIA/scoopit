#!/usr/bin/env node

/**
 * Test runner script that executes tests and verifies the application is working
 */

const { spawn } = require("child_process");
const fs = require("fs-extra");
const path = require("path");

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

// Output directory
const outputDir = path.join(process.cwd(), "output");

// Clean up output directory
console.log(`${colors.blue}Cleaning output directory...${colors.reset}`);
if (fs.existsSync(outputDir)) {
  fs.removeSync(outputDir);
}

// Run tests
console.log(`\n${colors.blue}Running test suite...${colors.reset}`);

const mochaProcess = spawn("npx", ["mocha", "test/**/*.js"], {
  stdio: "inherit",
  shell: process.platform === "win32",
});

mochaProcess.on("close", (code) => {
  if (code !== 0) {
    console.log(
      `\n${colors.red}✖ Tests failed with code ${code}${colors.reset}`
    );
    process.exit(code);
  }

  console.log(`\n${colors.green}✓ All tests passed!${colors.reset}`);

  // Run a quick real-world test
  console.log(
    `\n${colors.blue}Running quick verification test with GitHub homepage...${colors.reset}`
  );

  const { processRoutes } = require("./index");

  // Test with GitHub homepage in all formats
  processRoutes("https://github.com", ["/"], "all")
    .then((results) => {
      console.log(
        `\n${colors.green}✓ Quick test completed successfully!${colors.reset}`
      );

      // Verify output files exist
      const textFilePath = path.join(outputDir, "text", "index.txt");
      const jsonFilePath = path.join(outputDir, "json", "index.json");
      const markdownFilePath = path.join(outputDir, "markdown", "index.md");

      if (
        fs.existsSync(textFilePath) &&
        fs.existsSync(jsonFilePath) &&
        fs.existsSync(markdownFilePath)
      ) {
        // Check file sizes
        const textSize = fs.statSync(textFilePath).size;
        const jsonSize = fs.statSync(jsonFilePath).size;
        const markdownSize = fs.statSync(markdownFilePath).size;

        console.log(`\n${colors.cyan}Output files:${colors.reset}`);
        console.log(`- ${textFilePath} (${formatBytes(textSize)})`);
        console.log(`- ${jsonFilePath} (${formatBytes(jsonSize)})`);
        console.log(`- ${markdownFilePath} (${formatBytes(markdownSize)})`);

        if (textSize > 0 && jsonSize > 0 && markdownSize > 0) {
          console.log(
            `\n${colors.green}✓ All output files have content${colors.reset}`
          );
          console.log(
            `\n${colors.green}✓ Application is working properly!${colors.reset}`
          );
        } else {
          console.log(
            `\n${colors.red}✖ Some output files are empty${colors.reset}`
          );
          process.exit(1);
        }
      } else {
        console.log(
          `\n${colors.red}✖ Some output files are missing${colors.reset}`
        );
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error(
        `\n${colors.red}✖ Quick test failed:${colors.reset}`,
        error
      );
      process.exit(1);
    });
});

// Helper function to format bytes
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}
