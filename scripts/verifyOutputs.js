#!/usr/bin/env node

/**
 * Output Verification Script
 *
 * This script:
 * 1. Samples a real website
 * 2. Generates both text and JSON outputs
 * 3. Performs detailed validation of both formats
 * 4. Reports results with helpful diagnostics
 */

const fs = require("fs-extra");
const path = require("path");
const { processRoutes } = require("../index");
const logger = require("../utils/logger");

// Setup colors for terminal output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  blue: "\x1b[34m",
};

// Verification configuration
const config = {
  outputDir: path.join(process.cwd(), "output"),
  // Using Wikipedia as a reliable test site with consistent structure
  testSite: "https://en.wikipedia.org",
  testRoutes: ["/wiki/Main_Page", "/wiki/Web_scraping"],
  formats: ["text", "json"],
};

/**
 * Print a section header
 */
function printSection(title) {
  console.log(
    `\n${colors.bright}${colors.blue}=== ${title} ===${colors.reset}`
  );
  console.log(`${colors.dim}${"-".repeat(title.length + 8)}${colors.reset}`);
}

/**
 * Print a status message
 */
function printStatus(success, message, details = null) {
  const icon = success ? "✓" : "✖";
  const color = success ? colors.green : colors.red;

  console.log(`${color}${icon} ${message}${colors.reset}`);

  if (details) {
    console.log(`  ${colors.dim}${details}${colors.reset}`);
  }
}

/**
 * Clean the output directory
 */
function cleanOutputDirectory() {
  printSection("Cleaning Output Directory");

  if (fs.existsSync(config.outputDir)) {
    fs.removeSync(config.outputDir);
    printStatus(true, "Removed existing output directory");
  }

  fs.ensureDirSync(config.outputDir);
  printStatus(true, "Created fresh output directory");
}

/**
 * Generate content for test routes in both formats
 */
async function generateTestContent() {
  printSection("Generating Test Content");

  console.log(`${colors.cyan}Test Site:${colors.reset} ${config.testSite}`);
  console.log(
    `${colors.cyan}Test Routes:${colors.reset} ${config.testRoutes.join(", ")}`
  );
  console.log(
    `${colors.cyan}Formats:${colors.reset} ${config.formats.join(", ")}`
  );

  try {
    // Process routes in both text and JSON formats
    for (const format of config.formats) {
      console.log(
        `\n${colors.yellow}Generating ${format} content:${colors.reset}`
      );

      const startTime = Date.now();
      const results = await processRoutes(
        config.testSite,
        config.testRoutes,
        format
      );
      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);

      printStatus(
        results.length === config.testRoutes.length,
        `Generated ${results.length}/${config.testRoutes.length} results in ${duration}s`
      );
    }

    return true;
  } catch (error) {
    printStatus(false, "Error generating test content", error.message);
    return false;
  }
}

/**
 * Validate the existence and structure of output files
 */
function validateFileExistence() {
  printSection("Validating File Existence");

  let allFilesExist = true;

  for (const format of config.formats) {
    const formatDir = path.join(config.outputDir, format);

    if (!fs.existsSync(formatDir)) {
      printStatus(false, `${format} directory does not exist`);
      allFilesExist = false;
      continue;
    }

    for (const route of config.testRoutes) {
      const safeFilename = route.replace(/^\//, "").replace(/\//g, "-");
      const extension = format === "json" ? "json" : "txt";
      const filePath = path.join(formatDir, `${safeFilename}.${extension}`);

      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        printStatus(
          true,
          `${format}/${safeFilename}.${extension} exists (${formatBytes(
            stats.size
          )})`
        );
      } else {
        printStatus(
          false,
          `${format}/${safeFilename}.${extension} does not exist`
        );
        allFilesExist = false;
      }
    }
  }

  return allFilesExist;
}

/**
 * Validate text content
 */
function validateTextContent() {
  printSection("Validating Text Content");

  let allTextValid = true;
  const textDir = path.join(config.outputDir, "text");

  if (!fs.existsSync(textDir)) {
    printStatus(false, "Text directory does not exist");
    return false;
  }

  for (const route of config.testRoutes) {
    const safeFilename = route.replace(/^\//, "").replace(/\//g, "-");
    const filePath = path.join(textDir, `${safeFilename}.txt`);

    try {
      if (!fs.existsSync(filePath)) {
        throw new Error("File does not exist");
      }

      const content = fs.readFileSync(filePath, "utf8");

      // Basic validation - check if content exists
      if (!content || content.trim().length === 0) {
        throw new Error("Content is empty");
      }

      // Check for minimum content length
      if (content.length < 100) {
        throw new Error("Content is too short (< 100 chars)");
      }

      // Check for presence of multiple paragraphs - more flexible approach
      const paragraphSeparators = ["\n\n", "\r\n\r\n", "\n\r\n\r", "\n   ", "\n\t"];
      let paragraphs = [];
      
      // Try different paragraph separators
      for (const separator of paragraphSeparators) {
        paragraphs = content
          .split(separator)
          .filter((p) => p.trim().length > 20); // Minimum 20 chars to count as paragraph
        
        if (paragraphs.length >= 2) {
          break; // Found enough paragraphs with this separator
        }
      }
      
      // Fall back to sentences if paragraphs not found
      if (paragraphs.length < 2) {
        paragraphs = content
          .split(/[.!?]+\s+/)
          .filter((p) => p.trim().length > 30); // Longer sentences count as paragraphs
      }
      
      if (paragraphs.length < 2) {
        throw new Error("Content lacks sufficient paragraph or sentence structure");
      }

      printStatus(
        true,
        `${safeFilename}.txt is valid`,
        `${content.length} chars, ${paragraphs.length} paragraphs`
      );
    } catch (error) {
      printStatus(
        false,
        `${safeFilename}.txt validation failed`,
        error.message
      );
      allTextValid = false;
    }
  }

  return allTextValid;
}

/**
 * Validate JSON content
 */
function validateJsonContent() {
  printSection("Validating JSON Content");

  let allJsonValid = true;
  const jsonDir = path.join(config.outputDir, "json");

  if (!fs.existsSync(jsonDir)) {
    printStatus(false, "JSON directory does not exist");
    return false;
  }

  for (const route of config.testRoutes) {
    const safeFilename = route.replace(/^\//, "").replace(/\//g, "-");
    const filePath = path.join(jsonDir, `${safeFilename}.json`);

    try {
      if (!fs.existsSync(filePath)) {
        throw new Error("File does not exist");
      }

      // Read and parse JSON
      const content = fs.readFileSync(filePath, "utf8");
      let jsonData;

      try {
        jsonData = JSON.parse(content);
      } catch (e) {
        throw new Error(`Invalid JSON: ${e.message}`);
      }

      // Validate required properties
      const requiredProps = [
        "url",
        "route",
        "title",
        "textContent",
        "markdownContent",
      ];

      const missingProps = requiredProps.filter(
        (prop) => !Object.prototype.hasOwnProperty.call(jsonData, prop)
      );

      if (missingProps.length > 0) {
        throw new Error(
          `Missing required properties: ${missingProps.join(", ")}`
        );
      }

      // Validate URL format
      if (!jsonData.url.startsWith("http")) {
        throw new Error(`Invalid URL format: ${jsonData.url}`);
      }

      // Validate route matches the test route
      if (jsonData.route !== route) {
        throw new Error(
          `Route mismatch: expected ${route}, got ${jsonData.route}`
        );
      }

      // Validate content exists
      if (!jsonData.textContent || jsonData.textContent.trim().length === 0) {
        throw new Error("textContent is empty");
      }

      if (
        !jsonData.markdownContent ||
        jsonData.markdownContent.trim().length === 0
      ) {
        throw new Error("markdownContent is empty");
      }

      // Check for minimum content length
      if (jsonData.textContent.length < 100) {
        throw new Error("textContent is too short (< 100 chars)");
      }

      printStatus(
        true,
        `${safeFilename}.json is valid`,
        `title: "${truncate(jsonData.title, 30)}", content: ${
          jsonData.textContent.length
        } chars`
      );
    } catch (error) {
      printStatus(
        false,
        `${safeFilename}.json validation failed`,
        error.message
      );
      allJsonValid = false;
    }
  }

  return allJsonValid;
}

/**
 * Check if text content matches JSON content
 */
function validateContentMatching() {
  printSection("Validating Content Matching");

  let allMatching = true;

  for (const route of config.testRoutes) {
    const safeFilename = route.replace(/^\//, "").replace(/\//g, "-");
    const textPath = path.join(config.outputDir, "text", `${safeFilename}.txt`);
    const jsonPath = path.join(
      config.outputDir,
      "json",
      `${safeFilename}.json`
    );

    try {
      if (!fs.existsSync(textPath) || !fs.existsSync(jsonPath)) {
        throw new Error("One or both files do not exist");
      }

      const textContent = fs.readFileSync(textPath, "utf8");
      const jsonData = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

      // Compare text content with JSON's textContent field
      // Normalize whitespace for comparison
      const normalizedTextContent = textContent.replace(/\s+/g, " ").trim();
      const normalizedJsonTextContent = jsonData.textContent
        .replace(/\s+/g, " ")
        .trim();

      if (normalizedTextContent !== normalizedJsonTextContent) {
        // Check if they're at least similar (80% match)
        const similarity = calculateSimilarity(
          normalizedTextContent,
          normalizedJsonTextContent
        );

        if (similarity < 0.8) {
          throw new Error(
            `Content mismatch (similarity: ${(similarity * 100).toFixed(1)}%)`
          );
        } else {
          printStatus(
            true,
            `${safeFilename} contents match partially`,
            `Similarity: ${(similarity * 100).toFixed(1)}%`
          );
        }
      } else {
        printStatus(true, `${safeFilename} contents match exactly`);
      }
    } catch (error) {
      printStatus(
        false,
        `${safeFilename} content matching failed`,
        error.message
      );
      allMatching = false;
    }
  }

  return allMatching;
}

/**
 * Report overall results
 */
function reportResults(results) {
  printSection("Verification Results");

  const allPassed = Object.values(results).every((result) => result);
  const passCount = Object.values(results).filter((result) => result).length;
  const totalTests = Object.keys(results).length;

  console.log(`\n${colors.cyan}Tests Run: ${totalTests}${colors.reset}`);
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
      `${colors.bgGreen}${colors.black} ALL VERIFICATIONS PASSED ${colors.reset}`
    );
    console.log(
      `\n${colors.green}Your application is correctly generating and validating both text and JSON outputs.${colors.reset}`
    );
  } else {
    console.log(
      `${colors.bgRed}${colors.white} VERIFICATION FAILED ${colors.reset}`
    );
    console.log(
      `\n${colors.yellow}Some verifications failed. Check the output above for details.${colors.reset}`
    );
  }

  return allPassed;
}

/**
 * Helper function to format bytes
 */
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

/**
 * Helper function to truncate text
 */
function truncate(text, maxLength) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
}

/**
 * Calculate similarity between two strings (simple implementation)
 */
function calculateSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) {
    return 1.0;
  }

  // Count how many characters in shorter string exist in longer string
  let matches = 0;
  const shorterChars = shorter.split("");
  const longerChars = longer.split("");

  for (const char of shorterChars) {
    if (longerChars.includes(char)) {
      matches++;
      // Remove the character to avoid double counting
      const index = longerChars.indexOf(char);
      longerChars.splice(index, 1);
    }
  }

  return matches / longer.length;
}

/**
 * Main verification function
 */
async function verifyOutputs() {
  console.log(
    `\n${colors.bright}${colors.cyan}SCOOPIT OUTPUT VERIFICATION${colors.reset}`
  );
  console.log(
    `${colors.dim}Verifying text and JSON outputs...${colors.reset}\n`
  );

  const startTime = Date.now();

  // Step 1: Clean output directory
  cleanOutputDirectory();

  // Step 2: Generate test content
  const contentGenerated = await generateTestContent();

  if (!contentGenerated) {
    console.error(
      `\n${colors.red}Verification aborted: Failed to generate test content${colors.reset}`
    );
    return false;
  }

  // Step 3: Validate file existence
  const filesExist = validateFileExistence();

  // Step 4: Validate text content
  const textValid = validateTextContent();

  // Step 5: Validate JSON content
  const jsonValid = validateJsonContent();

  // Step 6: Validate content matching
  const contentMatches = validateContentMatching();

  // Step 7: Report results
  const results = {
    "Content Generation": contentGenerated,
    "File Existence": filesExist,
    "Text Content Validation": textValid,
    "JSON Content Validation": jsonValid,
    "Content Matching": contentMatches,
  };

  const allPassed = reportResults(results);

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  console.log(
    `\n${colors.dim}Verification completed in ${duration}s${colors.reset}`
  );

  return allPassed;
}

// Run the verification if this script is executed directly
if (require.main === module) {
  verifyOutputs()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error(
        `\n${colors.red}Verification failed with an error:${colors.reset}`,
        error
      );
      process.exit(1);
    });
}

module.exports = { verifyOutputs };
