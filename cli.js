#!/usr/bin/env node

const readline = require("readline");
const fs = require("fs-extra");
const path = require("path");
const { 
  processRoutes, 
  processSinglePage, 
  loadRoutesFromFile,
  VALID_FORMATS, 
  DEFAULT_FORMAT,
  isValidUrl
} = require("./src/core");
const logger = require("./utils/logger");
const { 
  displayBanner, 
  displayError, 
  displayTips,
  colors 
} = require("./src/ui/display");

/**
 * Validate command line arguments and process accordingly
 * @returns {Promise<boolean>} - True if arguments were processed, false if interactive mode should be used
 */
async function processCommandLineArgs() {
  const args = process.argv.slice(2);
  
  // No arguments - use interactive mode
  if (args.length === 0) {
    return false;
  }
  
  try {
    // Check if the first argument is a URL
    if (isValidUrl(args[0])) {
      const url = args[0];
      const format = args[1] && VALID_FORMATS.includes(args[1]) ? args[1] : DEFAULT_FORMAT;
      
      console.log(`${colors.cyan}${colors.bright}Processing single page: ${url}${colors.reset}`);
      console.log(`${colors.dim}Output format: ${format}${colors.reset}\n`);
      
      await processSinglePage(url, format);
      console.log(`\n${colors.green}${colors.bright}✓ Successfully processed page: ${url}${colors.reset}`);
      console.log(`${colors.dim}Output files are available in the 'output' directory.${colors.reset}`);
      return true;
    }
    
    // Check if first argument is a routes file
    if (args[0].endsWith('.json')) {
      const routesFile = args[0];
      const format = args[1] && VALID_FORMATS.includes(args[1]) ? args[1] : DEFAULT_FORMAT;
      const baseUrl = args[2] || undefined;
      
      console.log(`${colors.cyan}${colors.bright}Processing routes from file: ${routesFile}${colors.reset}`);
      
      if (!fs.existsSync(routesFile)) {
        displayError(`Routes file not found: ${routesFile}`, true);
      }
      
      const routes = await loadRoutesFromFile(routesFile);
      console.log(`${colors.dim}Found ${routes.length} routes in file${colors.reset}`);
      console.log(`${colors.dim}Base URL: ${baseUrl || 'Default'}${colors.reset}`);
      console.log(`${colors.dim}Output format: ${format}${colors.reset}\n`);
      
      await processRoutes(baseUrl, routes, format);
      console.log(`\n${colors.green}${colors.bright}✓ Successfully processed routes from file: ${routesFile}${colors.reset}`);
      console.log(`${colors.dim}Output files are available in the 'output' directory.${colors.reset}`);
      return true;
    }
    
    // Default to interactive mode
    return false;
  } catch (error) {
    displayError(error.message, true);
    return true; // Never reaches here due to process.exit()
  }
}

// Create interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

/**
 * Main CLI function with improved error handling
 */
async function startCLI() {
  try {
    // Check if a specific banner was requested
    const args = process.argv.slice(2);
    const bannerArgIndex = args.findIndex(arg => arg === '--banner');
    let bannerId = null;
    
    if (bannerArgIndex !== -1 && bannerArgIndex + 1 < args.length) {
      bannerId = args[bannerArgIndex + 1];
      // Remove the banner arguments so they don't interfere with other processing
      args.splice(bannerArgIndex, 2);
    }
    
    // Check if we should hide the ICJIA banner
    const hideIcjia = args.includes('--no-icjia');
    if (hideIcjia) {
      // Remove the argument so it doesn't interfere with other processing
      const hideIndex = args.indexOf('--no-icjia');
      args.splice(hideIndex, 1);
    }
    
    // Display application banner
    displayBanner(bannerId, !hideIcjia);
    
    // Check for command line arguments first
    const argProcessed = await processCommandLineArgs();
    if (argProcessed) {
      process.exit(0);
    }
    
    // Log CLI startup
    logger.info("CLI interface started");

    // Ask for base URL
    rl.question(`${colors.blue}Base URL ${colors.dim}[https://icjia.illinois.gov]:${colors.reset} `, (baseUrl) => {
      // Use default if empty
      baseUrl = baseUrl || "https://icjia.illinois.gov";
      
      // Validate URL
      if (!isValidUrl(baseUrl)) {
        displayError(`Invalid URL format: ${baseUrl}`);
        rl.close();
        process.exit(1);
      }
      
      logger.debug("User entered base URL", { baseUrl });

      // Ask for routes
      rl.question(
        `${colors.blue}Routes (comma-separated) ${colors.dim}[/about,researchHub]:${colors.reset} `,
        (routesInput) => {
          // Use default if empty
          const routes = routesInput
            ? routesInput.split(",").map((route) => route.trim())
            : ["/about", "researchHub"];
          
          // Basic validation for routes
          if (routes.some(route => route.trim() === '')) {
            displayError('Invalid route: empty routes are not allowed');
            rl.close();
            process.exit(1);
          }
          
          logger.debug("User entered routes", { routes });

          // Ask for format
          rl.question(
            `${colors.blue}Output format (${VALID_FORMATS.join(", ")}) ${colors.dim}[${DEFAULT_FORMAT}]:${colors.reset} `,
            (format) => {
              // Use default if empty or invalid
              format =
                format && VALID_FORMATS.includes(format) ? format : DEFAULT_FORMAT;
              
              logger.debug("User selected format", { format });

              console.log(`\n${colors.bright}Configuration:${colors.reset}`);
              console.log(`${colors.cyan}• Base URL:${colors.reset} ${baseUrl}`);
              console.log(`${colors.cyan}• Routes:${colors.reset} ${JSON.stringify(routes)}`);
              console.log(`${colors.cyan}• Format:${colors.reset} ${format}`);
              
              // Display helpful tips
              displayTips(baseUrl, routes, format);

              // Confirm and process
              rl.question(`${colors.green}Proceed with content generation? (y/n):${colors.reset} `, async (answer) => {
                if (
                  answer.toLowerCase() === "y" ||
                  answer.toLowerCase() === "yes"
                ) {
                  rl.close();
                  console.log(`\n${colors.bright}${colors.yellow}Starting content generation...${colors.reset}\n`);
                  
                  logger.info("User confirmed, starting content generation", {
                    baseUrl,
                    routes,
                    format
                  });

                  // Process the routes with progress display
                  const totalRoutes = routes.length;
                  let processedRoutes = 0;
                  
                  // Setup progress tracking
                  const updateInterval = setInterval(() => {
                    const percent = Math.round((processedRoutes / totalRoutes) * 100);
                    process.stdout.write(`\r${colors.dim}Progress: ${processedRoutes}/${totalRoutes} routes (${percent}%)${colors.reset}`);
                  }, 500);
                  
                  // Monitor route processing events
                  const originalConsoleInfo = console.info;
                  console.info = function() {
                    if (arguments[0] && typeof arguments[0] === 'string' && 
                        arguments[0].includes('Generated files for')) {
                      processedRoutes++;
                    }
                    originalConsoleInfo.apply(console, arguments);
                  };
                  
                  try {
                    await processRoutes(baseUrl, routes, format);
                    
                    // Clear progress interval
                    clearInterval(updateInterval);
                    // Reset console.info
                    console.info = originalConsoleInfo;
                    
                    console.log(`\n\n${colors.bright}${colors.green}✓ Content generation completed successfully!${colors.reset}`);
                    console.log(`${colors.dim}Output files are available in the 'output' directory.${colors.reset}`);
                    
                    logger.info("Content generation completed successfully");
                  } catch (error) {
                    // Clear progress interval
                    clearInterval(updateInterval);
                    // Reset console.info
                    console.info = originalConsoleInfo;
                    
                    displayError(`Error during content generation: ${error.message}`);
                    
                    logger.error("Error during content generation", {
                      error: error.message,
                      stack: error.stack
                    });
                    
                    process.exit(1);
                  }
                } else {
                  console.log(`${colors.yellow}Content generation cancelled.${colors.reset}`);
                  logger.info("User cancelled content generation");
                  rl.close();
                }
              });
            }
          );
        }
      );
    });
  } catch (error) {
    displayError(`Unexpected error: ${error.message}`, true);
  }
}

// Start the CLI
startCLI();
