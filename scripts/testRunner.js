#!/usr/bin/env node

/**
 * Comprehensive Test Runner
 *
 * This script:
 * 1. Runs all unit tests
 * 2. Performs a real-world test by scraping a sample site
 * 3. Validates both text and JSON outputs
 * 4. Generates a test report
 */

const { spawn } = require("child_process");
const fs = require("fs-extra");
const path = require("path");
const { processRoutes } = require("../index");
const assert = require("assert");

// Track start time for test duration reporting
const startTime = new Date();

// Setup colors for terminal output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  underscore: "\x1b[4m",
  blink: "\x1b[5m",
  reverse: "\x1b[7m",
  hidden: "\x1b[8m",

  black: "\x1b[30m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",

  bgBlack: "\x1b[40m",
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
  bgBlue: "\x1b[44m",
  bgMagenta: "\x1b[45m",
  bgCyan: "\x1b[46m",
  bgWhite: "\x1b[47m",
};

// Helper functions to wrap text in color
colors.green = (text) => `${colors.green}${text}${colors.reset}`;
colors.red = (text) => `${colors.red}${text}${colors.reset}`;
colors.white = (text) => `${colors.white}${text}${colors.reset}`;
colors.yellow = (text) => `${colors.yellow}${text}${colors.reset}`;
colors.cyan = (text) => `${colors.cyan}${text}${colors.reset}`;
colors.blue = (text) => `${colors.blue}${text}${colors.reset}`;
colors.magenta = (text) => `${colors.magenta}${text}${colors.reset}`;

// Parse command line arguments
const args = process.argv.slice(2);
const runIntegrationOnly = args.includes('--integration-only');
const runValidationOnly = args.includes('--validation-only');
const runUnitOnly = args.includes('--unit-only');

// Get test site from args or use default
const testSiteArg = args.find(arg => arg.startsWith('--test-site='));
const testSite = testSiteArg ? testSiteArg.split('=')[1] : 'https://icjia.illinois.gov';

// Test configuration
const config = {
  outputDir: path.join(process.cwd(), "output"),
  testSite: testSite,
  samplesDir: path.join(process.cwd(), "test", "samples"),
  testRoutes: ["/", "/about"],  // Simple routes for testing
  formats: ["text", "json", "markdown"],
};

// Test results recording
const testResults = {
  unitTests: {
    passed: 0,
    failed: 0,
    skipped: 0,
  },
  integrationTests: {
    passed: 0,
    failed: 0,
    skipped: 0,
  },
  outputValidation: {
    passed: 0,
    failed: 0,
    details: [],
  },
};

/**
 * Print a formatted header
 */
function printHeader(text) {
  const line = "=".repeat(text.length + 10);
  console.log(`\n${colors.bright}${colors.cyan}${line}${colors.reset}`);
  console.log(
    `${colors.bright}${colors.cyan}===== ${text} =====${colors.reset}`
  );
  console.log(`${colors.bright}${colors.cyan}${line}${colors.reset}\n`);
}

/**
 * Terminal output verbosity levels
 */
const VERBOSITY = {
  QUIET: 0,   // Only show critical errors
  NORMAL: 1,  // Show step headers and summaries
  VERBOSE: 2  // Show all output (default for development)
};

// Set the verbosity level based on environment
const verbosity = process.env.SCOOPIT_VERBOSE ? 
                 VERBOSITY.VERBOSE : 
                 VERBOSITY.NORMAL;

/**
 * Print a step header
 */
function printStep(number, text) {
  if (verbosity >= VERBOSITY.NORMAL) {
    console.log(
      `\n${colors.bright}${colors.blue}[${number}] ${text}${colors.reset}`
    );
    console.log(`${colors.dim}${"-".repeat(60)}${colors.reset}`);
  }
}

/**
 * Print test result
 */
function printResult(success, message, details = null, isImportant = false) {
  // Always show errors and important messages regardless of verbosity
  // Otherwise respect the verbosity level
  if (!success || isImportant || verbosity >= VERBOSITY.VERBOSE) {
    if (success) {
      console.log(`${colors.green}✓ ${message}${colors.reset}`);
    } else {
      console.log(`${colors.red}✖ ${message}${colors.reset}`);
      if (details) {
        console.log(`  ${colors.dim}${details}${colors.reset}`);
      }
    }
  }
}

/**
 * Clean up the output directory
 */
async function cleanOutputDirectory() {
  printStep(1, "Cleaning output directory");
  if (fs.existsSync(config.outputDir)) {
    fs.removeSync(config.outputDir);
    printResult(true, "Removed existing output directory");
  }
  fs.ensureDirSync(config.outputDir);
  printResult(true, "Created fresh output directory");
}

/**
 * Run unit tests with Mocha
 */
async function runUnitTests() {
  printStep(2, "Running unit tests");

  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const mochaProcess = spawn(
      "npx",
      ["mocha", "test/**/*.js", "--reporter", "spec"],
      {
        stdio: "inherit",
        shell: true, // Use shell for all platforms
      }
    );

    mochaProcess.on("close", (code) => {
      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);

      if (code === 0) {
        printResult(true, `Unit tests completed in ${duration}s`);
        resolve();
      } else {
        printResult(false, `Unit tests failed (exit code: ${code})`);
        reject(new Error(`Unit tests failed with code ${code}`));
      }
    });
  });
}

/**
 * Run integration tests by scraping a live website
 */
async function runIntegrationTests() {
  printStep(3, "Running integration tests with live website scraping");

  if (verbosity >= VERBOSITY.NORMAL) {
    console.log(`${colors.dim}Target website: ${config.testSite}${colors.reset}`);
    console.log(
      `${colors.dim}Test routes: ${config.testRoutes.join(", ")}${colors.reset}`
    );
  }

  try {
    // Ensure output directories exist
    for (const format of config.formats) {
      fs.ensureDirSync(path.join(config.outputDir, format));
    }

    // Create a temporary routes.json file for testing
    const tempRoutesPath = path.join(process.cwd(), 'temp-routes.json');
    fs.writeFileSync(tempRoutesPath, JSON.stringify(config.testRoutes, null, 2));

    if (verbosity >= VERBOSITY.NORMAL) {
      console.log(`${colors.dim}Created temporary routes file at: ${tempRoutesPath}${colors.reset}`);
    }

    // Process routes directly using the main application's processRoutes function
    const startTime = Date.now();
    const results = [];
    
    if (verbosity >= VERBOSITY.NORMAL) {
      console.log(`\n${colors.yellow}Processing routes from ${config.testSite}...${colors.reset}`);
    }

    // Run the actual scraping for each format
    for (const format of config.formats) {
      if (verbosity >= VERBOSITY.NORMAL) {
        console.log(`\n${colors.bright}Generating ${format} content:${colors.reset}`);
      }

      try {
        // Use processRoutes to actually fetch and process the content
        await processRoutes({
          baseUrl: config.testSite,
          routePath: tempRoutesPath,
          format: format,
          outputDir: config.outputDir,
          quiet: verbosity < VERBOSITY.NORMAL
        });
        
        // Give file system time to finish writing
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Add route results for this format
        results.push(...config.testRoutes.map(route => ({ route, format, success: true })));
      } catch (error) {
        printResult(false, `Error processing ${format} format`, error.message);
        testResults.integrationTests.failed++;
      }
    }

    // Clean up temporary routes file
    fs.unlinkSync(tempRoutesPath);
    
    if (verbosity >= VERBOSITY.NORMAL) {
      console.log(`${colors.dim}Removed temporary routes file${colors.reset}`);
    }
      
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    // Calculate expected total number of files (routes × formats)
    const expectedTotal = config.testRoutes.length * config.formats.length;

    // Validate results
    printResult(
      results.length === expectedTotal,
      `Generated ${results.length}/${expectedTotal} files in ${duration}s`,
      null,
      true // Mark as important so it always shows
    );

    if (results.length === expectedTotal) {
      testResults.integrationTests.passed++;
    } else {
      testResults.integrationTests.failed++;
    }

    return true;
  } catch (error) {
    printResult(false, "Integration tests failed", error.message);
    testResults.integrationTests.failed++;
    return false;
  }
}

/**
 * Validate the generated output files
 */
async function validateOutputFiles() {
  printStep(4, "Validating generated output files");

  // Reset validation results
  testResults.outputValidation = {
    passed: 0,
    failed: 0,
    skipped: 0,
    details: [],
  };

  try {
    // Check existence of output directory
    if (!fs.existsSync(config.outputDir)) {
      throw new Error("Output directory does not exist");
    }

    // List all files in the output directory
    if (verbosity >= VERBOSITY.VERBOSE) {
      console.log(`\n${colors.yellow}Listing output directory contents:${colors.reset}`);
      listOutputDirectoryContents();
    }

    // Validate each format
    for (const format of config.formats) {
      const formatDir = path.join(config.outputDir, format);

      if (!fs.existsSync(formatDir)) {
        throw new Error(`Format directory does not exist: ${format}`);
      }

      if (verbosity >= VERBOSITY.NORMAL) {
        console.log(`\n${colors.yellow}Validating ${format} files:${colors.reset}`);
      }

      // For each route, validate its output file
      for (const route of config.testRoutes) {
        // Format safe filenames
        const safeRoute = route === "/" ? "index" : route.replace(/^\//, '').replace(/\//g, '-');
        const extension = format === "json" ? "json" : (format === "markdown" ? "md" : "txt");
        
        try {
          // Check file exists
          const filePath = path.join(formatDir, `${safeRoute}.${extension}`);
          
          if (verbosity >= VERBOSITY.VERBOSE) {
            console.log(`${colors.dim}Looking for file: ${filePath}${colors.reset}`);
          }
          
          if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            const fileSize = stats.size;

            if (fileSize > 0) {
              // Read file content
              const content = fs.readFileSync(filePath, "utf8");
            
              // If JSON, validate structure and content
              if (format === "json") {
              try {
                const jsonContent = JSON.parse(content);

                // Validate required properties for JSON files
                const requiredProps = [
                  "url",
                  "route",
                  "title",
                  "textContent",
                ];
                
                const missingProps = [];
                for (const prop of requiredProps) {
                  if (!Object.prototype.hasOwnProperty.call(jsonContent, prop)) {
                    missingProps.push(prop);
                  }
                }
                
                if (missingProps.length > 0) {
                  throw new Error(`JSON missing properties: ${missingProps.join(', ')}`);
                }
                
                // Check URL is valid
                if (!jsonContent.url.startsWith(config.testSite)) {
                  throw new Error(`Invalid URL: ${jsonContent.url} doesn't match test site: ${config.testSite}`);
                }
                
                // Check route matches
                if (jsonContent.route !== route) {
                  throw new Error(`Route mismatch: ${jsonContent.route} vs expected ${route}`);
                }
                
                // Check content is not empty
                if (!jsonContent.textContent || !jsonContent.textContent.trim()) {
                  throw new Error("JSON has empty textContent");
                }
                
                // Successfully validated
                printResult(
                  true,
                  `Validated ${format} file: ${safeRoute}.${extension} (${formatBytes(fileSize)})`
                );
                testResults.outputValidation.passed++;
              } catch (jsonError) {
                throw new Error(`JSON validation error: ${jsonError.message}`);
              }
            }
            // For Markdown, check for headers and content
            else if (format === "markdown") {
              if (!content.trim()) {
                throw new Error("Markdown file is empty");
              }
              
              // Check for markdown headers (# heading)
              if (!content.includes('#')) {
                throw new Error("Markdown file doesn't contain any headers");
              }
              
              printResult(
                true,
                `Validated ${format} file: ${safeRoute}.${extension} (${formatBytes(fileSize)})`
              );
              testResults.outputValidation.passed++;
            }
            // For text, check it's not empty and has reasonable length
            else {
              if (!content.trim()) {
                throw new Error("Text file is empty");
              }
              
              // Check if content is too short (less than 10 characters)
              if (content.trim().length < 10) {
                throw new Error("Text content suspiciously short (< 10 chars)");
              }
              
              printResult(
                true,
                `Validated ${format} file: ${safeRoute}.${extension} (${formatBytes(fileSize)})`
              );
              testResults.outputValidation.passed++;
                          }
            } else {
              throw new Error("File exists but is empty");
            }
          } else {
            throw new Error("File does not exist");
          }
      } catch (error) {
        printResult(
          false,
          `Failed to validate ${format} file: ${route}.${extension}`,
          error.message
        );

        testResults.outputValidation.failed++;
        testResults.outputValidation.details.push({
          format,
          route,
          error: error.message,
        });
      }
    }
  }
  } catch (error) {
    printResult(false, "Output validation failed", error.message);
    testResults.outputValidation.failed++;
    return false;
  }

  // Overall validation result
  const totalValidations =
    testResults.outputValidation.passed + testResults.outputValidation.failed;
  const allPassed = testResults.outputValidation.failed === 0;

  console.log("\n");
  printResult(
    allPassed,
    `Output validation: ${testResults.outputValidation.passed}/${totalValidations} files validated successfully`
  );

  return allPassed;
}

/**
 * Display test summary report
 */
function displayTestReport() {
  printStep(5, "Test Summary Report");

  const totalPassed =
    testResults.unitTests.passed +
    testResults.integrationTests.passed +
    testResults.outputValidation.passed;

  const totalFailed =
    testResults.unitTests.failed +
    testResults.integrationTests.failed +
    testResults.outputValidation.failed;

  // Create a fancy boxed summary
  const boxWidth = 60;
  const horizontalLine = '━'.repeat(boxWidth);
  const verticalLine = '┃';
  
  console.log(`${colors.bright}${colors.cyan}┏${horizontalLine}┓${colors.reset}`);
  
  // Title
  const titleText = '🧪 TEST RESULTS 🧪';
  const titlePadding = Math.floor((boxWidth - titleText.length) / 2);
  console.log(`${colors.bright}${colors.cyan}${verticalLine}${' '.repeat(titlePadding)}${colors.white}${titleText}${' '.repeat(boxWidth - titleText.length - titlePadding)}${colors.cyan}${verticalLine}${colors.reset}`);
  
  console.log(`${colors.bright}${colors.cyan}┣${horizontalLine}┫${colors.reset}`);
  
  // Format the counts with appropriate colors and padding
  const formatCount = (label, count, colorFn) => {
    const text = `${label}: ${count}`;
    return `${colors.bright}${colors.cyan}${verticalLine} ${colorFn(text.padEnd(boxWidth - 3))}${colors.cyan}${verticalLine}${colors.reset}`;
  };
  
  console.log(formatCount('Passed', totalPassed, (t) => `${colors.green}${t}${colors.reset}`));
  console.log(formatCount('Failed', totalFailed, (t) => `${colors.red}${t}${colors.reset}`));
  console.log(formatCount('Total', totalPassed + totalFailed, (t) => `${colors.white}${t}${colors.reset}`));
  
  console.log(`${colors.bright}${colors.cyan}┣${horizontalLine}┫${colors.reset}`);
  
  // Details section
  const formatDetailRow = (label, passed, failed) => {
    const resultText = failed > 0 ? 
      `${colors.green(passed)} passed, ${colors.red(failed)} failed` :
      `${colors.green('All passed')}`;
      
    const text = `${label}: ${resultText}`;
    return `${colors.bright}${colors.cyan}${verticalLine} ${text.padEnd(boxWidth - 3)}${colors.cyan}${verticalLine}${colors.reset}`;
  };
  
  console.log(formatDetailRow('Unit Tests', testResults.unitTests.passed, testResults.unitTests.failed));
  console.log(formatDetailRow('Integration Tests', testResults.integrationTests.passed, testResults.integrationTests.failed));
  console.log(formatDetailRow('Output Validation', testResults.outputValidation.passed, testResults.outputValidation.failed));
  
  // List validation failures if any
  if (testResults.outputValidation.details.length > 0) {
    console.log(`${colors.bright}${colors.cyan}┣${horizontalLine}┫${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}${verticalLine} ${colors.red('Validation Errors:').padEnd(boxWidth - 3)}${colors.cyan}${verticalLine}${colors.reset}`);
    
    testResults.outputValidation.details.forEach((detail, i) => {
      // Format the error message to fit in the box
      const errorMsg = `${i + 1}. ${detail.format}/${detail.route}: ${detail.error}`;
      
      // Split long error messages to fit in box
      const chunks = [];
      let remaining = errorMsg;
      while (remaining.length > 0) {
        chunks.push(remaining.substring(0, boxWidth - 3));
        remaining = remaining.substring(boxWidth - 3);
      }
      
      for (const chunk of chunks) {
        console.log(`${colors.bright}${colors.cyan}${verticalLine} ${colors.red(chunk.padEnd(boxWidth - 3))}${colors.cyan}${verticalLine}${colors.reset}`);
      }
    });
  }
  
  // Bottom box
  console.log(`${colors.bright}${colors.cyan}┗${horizontalLine}┛${colors.reset}`);
  console.log("\n");
  
  // Final status banner
  if (totalFailed === 0) {
    const passText = ' ✅ ALL TESTS PASSED ✅ ';
    const passBanner = '═'.repeat(passText.length);
    console.log(`${colors.bright}${colors.green}╔${passBanner}╗${colors.reset}`);
    console.log(`${colors.bright}${colors.green}║${passText}║${colors.reset}`);
    console.log(`${colors.bright}${colors.green}╚${passBanner}╝${colors.reset}`);
  } else {
    const failText = ` ❌ ${totalFailed} TEST(S) FAILED ❌ `;
    const failBanner = '═'.repeat(failText.length);
    console.log(`${colors.bright}${colors.red}╔${failBanner}╗${colors.reset}`);
    console.log(`${colors.bright}${colors.red}║${failText}║${colors.reset}`);
    console.log(`${colors.bright}${colors.red}╚${failBanner}╝${colors.reset}`);
  }
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
 * Main test execution function
 */
async function runTests() {
  const startTime = Date.now();

  printHeader("ScoopIt Automated Tests");

  try {
    // Determine which tests to run based on command line args
    const shouldRunUnitTests = !runIntegrationOnly && !runValidationOnly;
    const shouldRunIntegration = !runUnitOnly && !runValidationOnly;
    const shouldRunValidation = !runUnitOnly && !runIntegrationOnly;
    
    // Always clean output directory unless only running unit tests
    if (!runUnitOnly) {
      await cleanOutputDirectory();
    }

    // Run unit tests if not skipped
    if (shouldRunUnitTests) {
      await runUnitTests();
    } else {
      if (verbosity >= VERBOSITY.NORMAL) {
        console.log(`${colors.yellow}Skipping unit tests${colors.reset}`);
      }
      // Mark as skipped in results
      testResults.unitTests.skipped++;
    }

    // Run integration tests if not skipped
    if (shouldRunIntegration) {
      await runIntegrationTests();
    } else {
      if (verbosity >= VERBOSITY.NORMAL) {
        console.log(`${colors.yellow}Skipping integration tests${colors.reset}`);
      }
      // Mark as skipped in results
      testResults.integrationTests.skipped++;
    }

    // Validate output files if not skipped
    if (shouldRunValidation) {
      await validateOutputFiles();
      
      // Copy generated files to samples directory
      if (verbosity >= VERBOSITY.NORMAL) {
        console.log(`${colors.cyan}Copying generated files to samples directory...${colors.reset}`);
      }
      
      // Copy all output files to samples directory
      try {
        // Ensure output directory exists
        if (fs.existsSync(config.outputDir)) {
          // Get all files directly from output directory (not in subdirectories)
          const files = fs.readdirSync(config.outputDir);
          let copiedCount = 0;
          
          for (const file of files) {
            if (!file || typeof file !== 'string') {
              console.log(`${colors.yellow}Warning: Invalid file name, skipping: ${file}${colors.reset}`);
              continue;
            }
            
            const sourcePath = path.join(config.outputDir, file);
            
            // Make sure config.samplesDir is defined
            if (!config.samplesDir) {
              console.error(`${colors.red}Error: Samples directory path is undefined${colors.reset}`);
              break;
            }
            
            const destPath = path.join(config.samplesDir, file);
            
            // Skip directories, only copy files
            try {
              if (fs.existsSync(sourcePath) && fs.statSync(sourcePath).isFile()) {
                await fs.copyFile(sourcePath, destPath);
                copiedCount++;
              }
            } catch (copyError) {
              console.log(`${colors.yellow}Warning: Failed to copy ${file}: ${copyError.message}${colors.reset}`);
            }
          }
          
          if (verbosity >= VERBOSITY.NORMAL) {
            console.log(`${colors.green}Copied ${copiedCount} files to samples directory${colors.reset}`);
          }
        }
      } catch (error) {
        console.error(`${colors.red}Error copying files to samples:${colors.reset}`, error);
      }
    } else {
      if (verbosity >= VERBOSITY.NORMAL) {
        console.log(`${colors.yellow}Skipping output validation${colors.reset}`);
      }
      // Mark as skipped in results
      testResults.outputValidation.skipped++;
    }

    // Display test report
    displayTestReport();

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    if (verbosity >= VERBOSITY.NORMAL) {
      console.log(`\n${colors.dim}Total test time: ${duration}s${colors.reset}`);
    }

    // Exit with appropriate code
    if (
      testResults.outputValidation.failed > 0 ||
      testResults.integrationTests.failed > 0 ||
      testResults.unitTests.failed > 0
    ) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (error) {
    console.error(`\n${colors.red}Test runner failed:${colors.reset}`, error);
    process.exit(1);
  }
}

// Run the tests
runTests();
