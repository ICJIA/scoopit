#!/usr/bin/env node

/**
 * Live Website Test
 * 
 * This script:
 * 1. Takes a website URL as an argument
 * 2. Scrapes the specified pages
 * 3. Validates the generated output files
 * 4. Reports on success/failure
 */

const fs = require('fs-extra');
const path = require('path');
const { processRoutes } = require('../index');
const assert = require('assert');

// ANSI color codes for terminal output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  dim: "\x1b[2m",
  bright: "\x1b[1m"
};

// Parse command line arguments
const args = process.argv.slice(2);
const testSiteArg = args.find(arg => arg.startsWith('--site='));
const testSite = testSiteArg 
  ? testSiteArg.split('=')[1] 
  : 'https://icjia.illinois.gov';
const verboseMode = args.includes('--verbose');

// Test configuration
const config = {
  outputDir: path.join(process.cwd(), "output"),
  testSite: testSite,
  // Use paths relative to the base URL
  testRoutes: ["/", "/about"],
  formats: ["text", "json", "markdown"],
};

// Track files that were actually generated
const generatedFiles = {
  text: [],
  json: [],
  markdown: []
};

// Keep track of test results
const results = {
  passed: 0,
  failed: 0,
  details: []
};

/**
 * Log a message with color
 */
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * Log a test result
 */
function logResult(success, message, details = null) {
  const symbol = success ? '✓' : '✖';
  const color = success ? colors.green : colors.red;
  
  console.log(`${color}${symbol} ${message}${colors.reset}`);
  
  if (details && !success) {
    console.log(`  ${details}`);
  }
  
  if (success) {
    results.passed++;
  } else {
    results.failed++;
    results.details.push({ message, details });
  }
}

/**
 * Clean output directory
 */
function cleanOutputDirectory() {
  log('Cleaning output directory...', colors.dim);
  try {
    if (fs.existsSync(config.outputDir)) {
      fs.emptydirSync(config.outputDir);
    } else {
      fs.mkdirSync(config.outputDir, { recursive: true });
    }
    return true;
  } catch (error) {
    logResult(false, 'Failed to clean output directory', error.message);
    return false;
  }
}

/**
 * Run scraping test
 */
async function runScrapingTest() {
  log(`\n${colors.bright}Testing website scraping:${colors.reset}`);
  log(`Target website: ${config.testSite}`, colors.dim);
  log(`Test routes: ${config.testRoutes.join(", ")}`, colors.dim);
  
  try {
    // Create a temporary routes.json file for testing
    const tempRoutesPath = path.join(process.cwd(), 'temp-routes.json');
    fs.writeFileSync(tempRoutesPath, JSON.stringify(config.testRoutes, null, 2));
    
    // Set NODE_ENV to 'test' to ensure consistent filename generation
    process.env.NODE_ENV = 'test';
    
    // Record file lists before scraping
    const beforeFiles = {};
    for (const format of config.formats) {
      const formatDir = path.join(config.outputDir, format);
      if (fs.existsSync(formatDir)) {
        beforeFiles[format] = new Set(fs.readdirSync(formatDir));
      } else {
        beforeFiles[format] = new Set();
        fs.ensureDirSync(formatDir);
      }
    }
    
    // Run the scraper for each format
    for (const format of config.formats) {
      log(`\nGenerating ${format} content...`, colors.yellow);
      
      try {
        // Ensure output directory exists
        fs.ensureDirSync(path.join(config.outputDir, format));
        
        // Process routes with the main application
        await processRoutes({
          baseUrl: config.testSite,
          routePath: tempRoutesPath,
          format: format,
          outputDir: config.outputDir,
          quiet: !verboseMode
        });
        
        // Give file system time to finish writing
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Record which files were newly generated
        const formatDir = path.join(config.outputDir, format);
        const afterFiles = new Set(fs.readdirSync(formatDir));
        
        // Find new files by comparing before and after
        for (const file of afterFiles) {
          if (!beforeFiles[format].has(file)) {
            generatedFiles[format].push(file);
            if (verboseMode) {
              log(`  Generated: ${file}`, colors.dim);
            }
          }
        }
        
        logResult(true, `Generated ${generatedFiles[format].length} ${format} files`);  
      } catch (error) {
        logResult(false, `Failed to generate ${format} content`, error.message);
      }
    }
    
    // Clean up temporary routes file
    fs.unlinkSync(tempRoutesPath);
    
    return true;
  } catch (error) {
    logResult(false, 'Scraping test failed', error.message);
    return false;
  }
}

/**
 * Validate the generated output files
 */
async function validateOutputFiles() {
  log(`\n${colors.bright}Validating output files:${colors.reset}`);
  
  // Check if any files were generated
  const totalGenerated = Object.values(generatedFiles).reduce((sum, files) => sum + files.length, 0);
  if (totalGenerated === 0) {
    logResult(false, "No files were generated during testing");
    return false;
  }
  
  // Check each format  
  for (const format of config.formats) {
    log(`\nValidating ${format} files:`, colors.yellow);
    
    const formatDir = path.join(config.outputDir, format);
    if (!fs.existsSync(formatDir)) {
      logResult(false, `Format directory does not exist: ${format}`);
      continue;
    }
    
    // No files generated for this format
    if (generatedFiles[format].length === 0) {
      logResult(false, `No ${format} files were generated`);
      continue;
    }
    
    // Validate each generated file for this format
    for (const filename of generatedFiles[format]) {
      try {
        const filePath = path.join(formatDir, filename);
        if (!fs.existsSync(filePath)) {
          throw new Error("File disappeared after generation");  
        }
        
        const stats = fs.statSync(filePath);
        const fileSize = stats.size;
          
          if (fileSize > 0) {
            // Read file content
            const content = fs.readFileSync(filePath, "utf8");
            
            // Validate by format type
            if (format === "json") {
              try {
                const jsonContent = JSON.parse(content);
                
                // Check required properties for JSON
                const requiredProps = ["url", "route", "title", "textContent"];
                const missingProps = [];
                
                for (const prop of requiredProps) {
                  if (!Object.prototype.hasOwnProperty.call(jsonContent, prop)) {
                    missingProps.push(prop);
                  }
                }
                
                if (missingProps.length > 0) {
                  throw new Error(`Missing properties: ${missingProps.join(', ')}`);
                }
                
                // Check text content isn't empty
                if (!jsonContent.textContent || !jsonContent.textContent.trim()) {
                  throw new Error("Empty textContent");
                }
                
                logResult(true, `Validated ${format}: ${safeRoute}.${extension} (${formatBytes(fileSize)})`);
              } catch (jsonError) {
                throw new Error(`JSON validation error: ${jsonError.message}`);
              }
            } 
            // For Markdown, check for headers and content
            else if (format === "markdown") {
              if (!content.trim()) {
                throw new Error("Empty file");
              }
              
              // Simple validation - check for markdown headers
              if (!content.includes('#')) {
                throw new Error("No markdown headers found");
              }
              
              logResult(true, `Validated ${format}: ${safeRoute}.${extension} (${formatBytes(fileSize)})`);
            } 
            // For Text, just check it's not empty and has a reasonable length
            else {
              if (!content.trim()) {
                throw new Error("Empty file");
              }
              
              // Check minimum content length
              if (content.trim().length < 10) {
                throw new Error("Content suspiciously short (< 10 chars)");
              }
              
              logResult(true, `Validated ${format}: ${safeRoute}.${extension} (${formatBytes(fileSize)})`);
            }
          } else {
            throw new Error("File exists but is empty");
          }
        } else {
          throw new Error("File does not exist");
        }
      } catch (error) {
        logResult(false, `Failed to validate ${format}: ${safeRoute}.${extension}`, error.message);
      }
    }
  }
  
  // Return overall validation result
  return results.failed === 0;
}

/**
 * Format bytes to human-readable format
 */
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Display test summary
 */
function displaySummary() {
  const total = results.passed + results.failed;
  const allPassed = results.failed === 0;
  
  log('\n' + '='.repeat(50), colors.cyan);
  log(`TEST SUMMARY: ${allPassed ? 'PASSED' : 'FAILED'}`, allPassed ? colors.green : colors.red);
  log('='.repeat(50), colors.cyan);
  
  log(`Passed: ${results.passed}/${total}`, colors.green);
  log(`Failed: ${results.failed}/${total}`, colors.red);
  
  if (results.failed > 0) {
    log('\nFAILURE DETAILS:', colors.red);
    results.details.forEach((detail, index) => {
      log(`${index + 1}. ${detail.message}`, colors.red);
      if (detail.details) {
        log(`   ${detail.details}`, colors.dim);
      }
    });
  }
  
  log('='.repeat(50), colors.cyan);
  
  return allPassed;
}

/**
 * Run the complete test
 */
async function runTest() {
  try {
    log(`\n${'='.repeat(60)}`, colors.cyan);
    log(`SCOOPIT LIVE WEBSITE TEST`, colors.bright);
    log(`${'='.repeat(60)}\n`, colors.cyan);
    
    // Step 1: Clean output directory
    cleanOutputDirectory();
    
    // Step 2: Run scraping test
    await runScrapingTest();
    
    // Step 3: Validate files
    await validateOutputFiles();
    
    // Step 4: Display summary
    const passed = displaySummary();
    
    // Exit with appropriate code
    process.exit(passed ? 0 : 1);
  } catch (error) {
    log(`\nTest runner failed: ${error.message}`, colors.red);
    console.error(error);
    process.exit(1);
  }
}

// Run the test
runTest();
