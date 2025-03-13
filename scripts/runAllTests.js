#!/usr/bin/env node

/**
 * Complete Test and Verification Runner
 *
 * This script executes all tests and verifications in sequence:
 * 1. Unit tests
 * 2. Comprehensive test suite
 * 3. Output verification (text and JSON)
 */

const { spawn } = require("child_process");
const path = require("path");

// Terminal colors for better readability
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  underscore: "\x1b[4m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
};

// Track overall test results
const results = {
  unitTests: false,
  comprehensiveTests: false,
  outputVerification: false,
  liveTests: false,
};

/**
 * Print a section header
 */
function printHeader(title) {
  const line = "=".repeat(title.length + 10);
  console.log(`\n${colors.bright}${colors.magenta}${line}${colors.reset}`);
  console.log(
    `${colors.bright}${colors.magenta}===== ${title} =====${colors.reset}`
  );
  console.log(`${colors.bright}${colors.magenta}${line}${colors.reset}\n`);
}

/**
 * Run a command as a promise
 */
function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    console.log(
      `${colors.blue}> ${command} ${args.join(" ")}${colors.reset}\n`
    );

    const childProcess = spawn(command, args, {
      stdio: "inherit",
      shell: true, // Use shell for all platforms
      env: { ...process.env } // Ensure environment variables are passed
    });

    childProcess.on("close", (code) => {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      if (code === 0) {
        console.log(
          `\n${colors.green}Command completed successfully in ${duration}s${colors.reset}`
        );
        resolve(true);
      } else {
        console.log(
          `\n${colors.red}Command failed with code ${code} after ${duration}s${colors.reset}`
        );
        resolve(false);
      }
    });

    childProcess.on("error", (error) => {
      reject(error);
    });
  });
}

/**
 * Print test summary
 */
function printSummary() {
  printHeader("TEST SUMMARY");

  const allPassed = Object.values(results).every((result) => result);
  const passCount = Object.values(results).filter((result) => result).length;
  const totalTests = Object.keys(results).length;

  console.log(`${colors.cyan}Tests Run: ${totalTests}${colors.reset}`);
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
      `${colors.bgGreen}${colors.black} ALL TESTS PASSED ${colors.reset}`
    );
  } else {
    console.log(
      `${colors.bgRed}${colors.white} SOME TESTS FAILED ${colors.reset}`
    );
  }

  return allPassed;
}

/**
 * Main function to run all tests
 */
async function runAllTests() {
  const startTime = Date.now();
  const verbose = process.env.SCOOPIT_VERBOSE === 'true';
  const testSite = process.env.TEST_SITE || 'https://wikipedia.org';

  printHeader("SCOOPIT COMPLETE TEST SUITE");
  console.log(
    `${colors.yellow}Running all tests and verifications...${colors.reset}\n`
  );
  console.log(`${colors.dim}Verbose mode: ${verbose ? 'enabled' : 'disabled'}${colors.reset}`);
  console.log(`${colors.dim}Test site: ${testSite}${colors.reset}\n`);

  try {
    // Step 1: Run unit tests
    printHeader("RUNNING UNIT TESTS");
    results.unitTests = await runCommand("npx", ["mocha", "test/**/*.js"]);

    // Step 2: Run comprehensive tests
    printHeader("RUNNING COMPREHENSIVE TESTS");
    results.comprehensiveTests = await runCommand("node", [
      "scripts/testRunner.js",
      verbose ? "--verbose" : "",
    ].filter(Boolean));

    // Step 3: Run output verification
    printHeader("VERIFYING TEXT AND JSON OUTPUTS");
    results.outputVerification = await runCommand("node", [
      "scripts/verifyOutputs.js",
    ]);
    
    // Step 4: Run live tests
    printHeader("RUNNING LIVE TESTS");
    console.log(`${colors.yellow}Testing live scraping against ${testSite}${colors.reset}\n`);
    
    // Set NODE_ENV=test to ensure fallback file generation
    process.env.NODE_ENV = 'test';
    
    results.liveTests = await runCommand("node", [
      "scripts/liveTest.js",
      `--site=${testSite}`,
      verbose ? "--verbose" : "",
    ].filter(Boolean));

    // Step 5: Print summary
    const allPassed = printSummary();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(
      `\n${colors.dim}Total execution time: ${duration}s${colors.reset}`
    );

    return allPassed;
  } catch (error) {
    console.error(`\n${colors.red}Error running tests:${colors.reset}`, error);
    return false;
  }
}

/**
 * Collect debug information for easy copying
 */
function generateDebugInfo() {
  const fs = require('fs');
  const path = require('path');
  
  // Create a debug info object with test results
  const debugInfo = {
    testDate: new Date().toISOString(),
    nodeVersion: process.version,
    platform: process.platform,
    packageVersion: require('../package.json').version,
    testStatus: {
      unitTests: results.unitTests,
      comprehensiveTests: results.comprehensiveTests,
      outputVerification: results.outputVerification,
      liveTests: results.liveTests
    },
    errorReports: []
  };
  
  // Try to read error logs and analyze them in detail
  try {
    // Read log file if it exists
    const logDir = path.join(process.cwd(), 'logs');
    const logFile = path.join(logDir, 'scoopit-test.log');
    
    debugInfo.detailedErrors = [];
    
    if (fs.existsSync(logFile)) {
      const logContent = fs.readFileSync(logFile, 'utf8');
      
      // Extract error messages
      const errorLines = logContent.split('\n')
        .filter(line => line.includes('ERROR') || line.includes('Error:'))
        .map(line => line.trim());
      
      // Count of errors by type
      const errorCounts = {};
      const errors = [];
      
      errorLines.forEach((line, index) => {
        // Extract error type
        const errorTypeMatch = line.match(/Error: (.*?)($|:)/);
        const errorType = errorTypeMatch ? errorTypeMatch[1] : 'Unknown';
        
        // Extract more context from surrounding lines
        const lineIndex = logContent.split('\n').findIndex(l => l.trim() === line);
        const contextLines = lineIndex >= 0 
          ? logContent.split('\n').slice(Math.max(0, lineIndex - 3), lineIndex + 4)
          : [];
          
        // Create a detailed error object
        const errorObj = {
          id: `error${index + 1}`,
          message: line,
          type: errorType,
          context: contextLines,
          timestamp: new Date().toISOString()
        };
        
        // Try to extract file path if present
        const filePathMatch = line.match(/(?:file|path)(?:: | )([^:,\s]+)/i);
        if (filePathMatch) {
          errorObj.filePath = filePathMatch[1];
        }
        
        // Try to extract line number if present
        const lineNumMatch = line.match(/line (\d+)/i) || line.match(/:(\d+):/);
        if (lineNumMatch) {
          errorObj.lineNumber = parseInt(lineNumMatch[1], 10);
        }
        
        // Try to extract URL if present
        const urlMatch = line.match(/url: ['"]*([^'"]*)['"]*/) || 
                        line.match(/https?:\/\/[^\s"')]+/);
        if (urlMatch) {
          errorObj.url = urlMatch[1] || urlMatch[0];
        }
        
        // Record test stage if we can determine it
        if (line.includes('test:unit') || contextLines.some(l => l.includes('test:unit'))) {
          errorObj.stage = 'unit-tests';
        } else if (line.includes('validation') || contextLines.some(l => l.includes('validation'))) {
          errorObj.stage = 'validation';
        } else if (line.includes('integration') || contextLines.some(l => l.includes('integration'))) {
          errorObj.stage = 'integration-tests';
        } else if (line.includes('live') || contextLines.some(l => l.includes('live'))) {
          errorObj.stage = 'live-tests';
        }
        
        errors.push(errorObj);
        errorCounts[errorType] = (errorCounts[errorType] || 0) + 1;
      });
      
      // Group related errors
      const groupedErrors = [];
      errors.forEach(error => {
        // Check if we already have a similar error
        const similarError = groupedErrors.find(ge => 
          ge.type === error.type && 
          (ge.filePath === error.filePath || ge.message.includes(error.message.substring(0, 30)))
        );
        
        if (similarError) {
          // Add this as an occurrence of the same error
          if (!similarError.occurrences) {
            similarError.occurrences = [];
          }
          similarError.occurrences.push({
            message: error.message,
            timestamp: error.timestamp
          });
          similarError.count = (similarError.count || 1) + 1;
        } else {
          groupedErrors.push(error);
        }
      });
      
      // Add detailed errors to debug info
      debugInfo.errorCounts = errorCounts;
      debugInfo.detailedErrors = groupedErrors.slice(0, 10); // Limit to 10 distinct errors
      debugInfo.errorSummary = `Found ${errors.length} errors of ${groupedErrors.length} distinct types`;
    }
  } catch (err) {
    debugInfo.logReadError = err.message;
  }
  
  // File list summary
  try {
    const outputDir = path.join(process.cwd(), 'output');
    if (fs.existsSync(outputDir)) {
      debugInfo.files = {
        output: fs.readdirSync(outputDir)
      };
      
      const fileDetails = {};
      
      ['text', 'json', 'markdown'].forEach(format => {
        const formatDir = path.join(outputDir, format);
        if (fs.existsSync(formatDir)) {
          const fileList = fs.readdirSync(formatDir);
          debugInfo.files[format] = fileList;
          
          // Get detailed info for each file
          fileList.forEach(filename => {
            try {
              const filePath = path.join(formatDir, filename);
              const stats = fs.statSync(filePath);
              
              // For JSON files, try to parse to get URL and route info
              if (format === 'json') {
                try {
                  const content = fs.readFileSync(filePath, 'utf8');
                  const jsonData = JSON.parse(content);
                  fileDetails[filename] = {
                    format,
                    size: stats.size,
                    lastModified: stats.mtime,
                    url: jsonData.url || null,
                    route: jsonData.route || null,
                    title: jsonData.title || null
                  };
                } catch (parseErr) {
                  fileDetails[filename] = {
                    format,
                    size: stats.size,
                    lastModified: stats.mtime,
                    parseError: parseErr.message
                  };
                }
              } else {
                fileDetails[filename] = {
                  format,
                  size: stats.size,
                  lastModified: stats.mtime
                };
              }
            } catch (fileErr) {
              fileDetails[filename] = {
                format,
                error: fileErr.message
              };
            }
          });
        }
      });
      
      // Add all file details
      debugInfo.fileDetails = fileDetails;
      
      // Also check samples directory
      const samplesDir = path.join(process.cwd(), 'test', 'samples');
      if (fs.existsSync(samplesDir)) {
        debugInfo.files.samples = fs.readdirSync(samplesDir);
      }
    }
  } catch (err) {
    debugInfo.fileListError = err.message;
  }
  
  // Add validation error details by scanning the test output files
  try {
    // Look for validation errors in the output files
    const validationErrors = [];
    
    // Check if we need to analyze validation errors further
    if (debugInfo.files && debugInfo.files.json) {
      // Get the test site from environment
      const testSite = process.env.TEST_SITE || 'https://wikipedia.org';
      
      // Analyze JSON files to find potential validation issues
      const jsonFiles = debugInfo.fileDetails || {};
      Object.entries(jsonFiles).forEach(([filename, details]) => {
        if (details.format === 'json' && details.url) {
          // Check for URL concatenation issues (common error in tests)
          if (details.url.includes(testSite) && details.url.includes('http')) {
            const urlParts = details.url.split('http');
            if (urlParts.length > 2) {
              validationErrors.push({
                id: `validation_error_${validationErrors.length + 1}`,
                type: 'URL_CONCATENATION',
                file: filename,
                fileFormat: 'json',
                actualUrl: details.url,
                expectedUrl: urlParts[urlParts.length - 1].startsWith('s:') 
                  ? `https${urlParts[urlParts.length - 1]}` 
                  : `http${urlParts[urlParts.length - 1]}`,
                testSite,
                message: 'URL contains concatenation error (double http)',
                suggestedFix: 'Fix URL construction in tests to avoid concatenating base URL twice'
              });
            }
          }
        }
      });
    }
    
    // Add validation errors to debug info if any were found
    if (validationErrors.length > 0) {
      debugInfo.validationErrors = validationErrors;
    }
  } catch (validationErr) {
    debugInfo.validationErrorAnalysis = validationErr.message;
  }
  
  // Add identification and version info
  debugInfo.debugInfoVersion = '1.1.0';
  debugInfo.generated = new Date().toISOString();
  
  // Output as formatted JSON in a way that's easy to copy
  console.log('\n\n======= SCOOPIT DEBUG INFORMATION (COPY BELOW) =======');
  console.log('```json');
  console.log(JSON.stringify(debugInfo, null, 2));
  console.log('```');
  console.log('======= END DEBUG INFORMATION =======\n');
}

// Run all tests if script is executed directly
if (require.main === module) {
  runAllTests()
    .then((success) => {
      // Generate debug info after tests finish, regardless of result
      generateDebugInfo();
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error(
        `\n${colors.red}Test runner failed with an error:${colors.reset}`,
        error
      );
      // Still generate debug info on error
      generateDebugInfo();
      process.exit(1);
    });
}

module.exports = { runAllTests, generateDebugInfo };
