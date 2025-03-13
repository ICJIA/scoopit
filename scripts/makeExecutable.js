#!/usr/bin/env node

/**
 * Make Script Files Executable
 *
 * This utility makes script files executable on Unix-based systems.
 * It's needed to run the scripts directly without using 'node' command.
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Check if we're on a Unix-like system
const isUnix = process.platform !== "win32";

if (!isUnix) {
  console.log(
    "This script is only needed on Unix-like systems (Linux, macOS)."
  );
  console.log("On Windows, executable permissions are not required.");
  process.exit(0);
}

// Files to make executable
const filesToChange = [
  path.join(__dirname, "testRunner.js"),
  path.join(__dirname, "verifyOutputs.js"),
  path.join(__dirname, "runAllTests.js"),
  path.join(process.cwd(), "cli.js"),
  path.join(process.cwd(), "test", "quickTest.js"),
];

console.log("Making script files executable...");

try {
  let madeChanges = false;

  for (const filePath of filesToChange) {
    if (fs.existsSync(filePath)) {
      // Change file permissions to make it executable (chmod +x)
      fs.chmodSync(filePath, "755");
      console.log(
        `✓ Made executable: ${path.relative(process.cwd(), filePath)}`
      );
      madeChanges = true;
    } else {
      console.log(
        `⚠ File not found: ${path.relative(process.cwd(), filePath)}`
      );
    }
  }

  if (madeChanges) {
    console.log(
      "\nAll script files are now executable. You can run them directly:"
    );
    console.log("./cli.js");
    console.log("./scripts/verifyOutputs.js");
  } else {
    console.log("\nNo files were changed.");
  }
} catch (error) {
  console.error("Error making files executable:", error);
  process.exit(1);
}
