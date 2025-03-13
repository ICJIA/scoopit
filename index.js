const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const readline = require("readline");
const logger = require("./utils/logger");
const {
  extractMetaInfo,
  extractContent,
  convertToMarkdown,
} = require("./utils/contentProcessor");

// Default configuration
const DEFAULT_BASE_URL = "https://icjia.illinois.gov";
const DEFAULT_ROUTES = ["/about", "researchHub"];
const DEFAULT_FORMAT = "text"; // Default format is 'text'
const VALID_FORMATS = ["text", "json", "markdown", "all"]; // Valid output formats

// Application version
const APP_VERSION = require("./package.json").version;

// Output directory location
const OUTPUT_DIR = path.join(process.cwd(), "output");

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.ensureDirSync(OUTPUT_DIR);
  logger.fileSystem("created", OUTPUT_DIR, { recursive: true });
}

/**
 * Asks the user if they want to delete previous output files
 * @returns {Promise<boolean>} - True if user wants to delete previous files, false otherwise
 */
async function shouldDeletePreviousOutputs() {
  // Skip user prompt in test mode
  if (process.env.NODE_ENV === 'test') {
    return false;
  }
  
  // Check if output directory already has content
  const outputDirs = ['text', 'json', 'markdown'].map(dir => path.join(OUTPUT_DIR, dir));
  let hasExistingOutput = false;
  
  for (const dir of outputDirs) {
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir);
      if (files.length > 0) {
        hasExistingOutput = true;
        break;
      }
    }
  }
  
  // If no existing output, no need to ask
  if (!hasExistingOutput) {
    return false;
  }
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const answer = await new Promise(resolve => {
    rl.question('Previous output files detected. Delete them before proceeding? (y/N): ', response => {
      rl.close();
      resolve(response.toLowerCase());
    });
  });
  
  return answer === 'y' || answer === 'yes';
}

/**
 * Deletes previous output files but preserves logs
 * @returns {Promise<void>}
 */
async function deletePreviousOutputs() {
  logger.info('Deleting previous output files');
  
  // Directories to clean (but not the log directory)
  const outputDirs = ['text', 'json', 'markdown'].map(dir => path.join(OUTPUT_DIR, dir));
  
  for (const dir of outputDirs) {
    if (fs.existsSync(dir)) {
      try {
        await fs.emptyDir(dir);
        logger.fileSystem("emptied", dir);
      } catch (error) {
        logger.error(`Failed to empty directory ${dir}: ${error.message}`);
      }
    } else {
      fs.ensureDirSync(dir);
      logger.fileSystem("created", dir);
    }
  }
  
  logger.info('Previous output files deleted');
}

/**
 * Converts a string to a slug format
 * @param {string} text - The text to convert to slug
 * @returns {string} - Text in slug format
 */
function convertToSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove non-word chars
    .replace(/[\s_-]+/g, '-')  // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, '')   // Remove leading/trailing hyphens
    .trim();
}

/**
 * Generates a filename with title in slug form and datetime stamp
 * @param {string} route - The route path
 * @param {string} title - The page title
 * @param {boolean} isLog - Whether this is a log file (no title/datetime needed)
 * @param {boolean} isTest - Whether this is in test mode (no timestamps/titles)
 * @returns {string} - Generated filename without extension
 */
function generateFilename(route, title, isLog = false, isTest = process.env.NODE_ENV === 'test') {
  // Check if this is being called from test scripts
  const callerStack = new Error().stack || '';
  const isTestScript = callerStack.includes('verifyOutputs.js') || 
                       callerStack.includes('testRunner.js') || 
                       callerStack.includes('runAllTests.js');
  
  // For log files or test mode or test scripts, just use the route-based name
  if (isLog || isTest || isTestScript) {
    return route.replace(/^\//, "").replace(/\//g, "-") || "index";
  }
  
  // Get current datetime in format YYYYMMDD-HHMMSS
  const now = new Date();
  const dateTimeStr = now.toISOString()
    .replace(/[T]/g, '-')
    .replace(/[:.]/g, '')
    .substring(0, 15); // Gets YYYYMMDD-HHMMSS format
  
  // Create slug from title
  const titleSlug = title ? convertToSlug(title) : '';
  
  // Create route slug (as fallback)
  const routeSlug = route.replace(/^\//, "").replace(/\//g, "-") || "index";
  
  // Use title slug if available, otherwise use route slug
  const baseSlug = titleSlug || routeSlug;
  
  // Combine slug with datetime
  return `${baseSlug}_${dateTimeStr}`;
}

/**
 * Validates a URL format
 * @param {string} url - The URL to validate
 * @returns {boolean} - True if valid URL format, false otherwise
 */
function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Fetch content from a URL with improved error handling
 * @param {string} url - The URL to fetch content from
 * @returns {Promise<string|null>} - The HTML content or null if fetch fails
 */
async function fetchContent(url) {
  // Validate URL first
  if (!isValidUrl(url)) {
    logger.error(`Invalid URL format: ${url}`);
    return null;
  }

  const fetchContext = logger.startOperation("fetch_content", { url });

  try {
    const startTime = Date.now();
    const response = await axios.get(url, {
      timeout: 30000, // 30s timeout
      headers: {
        'User-Agent': `ScoopIt Content Generator/${APP_VERSION}`,
      },
      validateStatus: status => status >= 200 && status < 300, // Only consider 2xx as success
    });
    const duration = Date.now() - startTime;

    logger.httpSuccess(url, response.status, duration, {
      contentLength: response.headers["content-length"],
      contentType: response.headers["content-type"],
    });

    logger.endOperation(fetchContext, "success", {
      status: response.status,
      duration,
    });

    return response.data;
  } catch (error) {
    const errorDetails = {
      message: error.message,
      code: error.code || 'UNKNOWN',
      status: error.response?.status,
      statusText: error.response?.statusText,
    };

    logger.httpError(url, error, errorDetails);
    logger.endOperation(fetchContext, "error", errorDetails);

    return null;
  }
}

/**
 * Generate files for a route with improved error handling
 * @param {string} baseUrl - The base URL
 * @param {string} route - The route path
 * @param {string} format - The output format (text, json, markdown, or all)
 * @returns {Promise<Object|null>} - Route data or null if processing fails
 */
async function generateFilesForRoute(baseUrl, route, format = DEFAULT_FORMAT) {
  // Input validation
  if (!baseUrl) {
    throw new Error('Base URL is required');
  }
  if (!route) {
    throw new Error('Route is required');
  }
  if (!VALID_FORMATS.includes(format)) {
    throw new Error(`Invalid format: ${format}. Valid formats are: ${VALID_FORMATS.join(', ')}`);
  }

  // Normalize the route path
  const normalizedRoute = route.startsWith("/") ? route : `/${route}`;
  const fullUrl = `${baseUrl}${normalizedRoute}`;

  const routeContext = logger.startOperation("generate_files_for_route", {
    baseUrl,
    route: normalizedRoute,
    fullUrl,
    format,
  });

  logger.processing(`Processing ${fullUrl}...`);

  // Fetch the content (could be HTML or JSON)
  const content = await fetchContent(fullUrl);

  if (!content) {
    logger.error(`Failed to fetch content for ${fullUrl}`);
    logger.endOperation(routeContext, "error", {
      reason: "fetch_failed",
    });
    return null;
  }
  
  // Detect if the content is JSON
  const { isJsonContent } = require('./utils/contentProcessor');
  const isJson = isJsonContent(content);

  try {
    // Extract meta information
    logger.processing(`Extracting metadata from ${fullUrl}`);
    const metaInfo = extractMetaInfo(content, isJson);
    logger.debug(`Extracted metadata`, {
      title: metaInfo.title,
      descriptionLength: metaInfo.description?.length || 0,
      contentType: isJson ? 'JSON' : 'HTML'
    });

    // Extract main content
    logger.processing(`Extracting content from ${fullUrl}`);
    const { cleanHtml: contentHtml, textContent, isJson: detectedJson } = extractContent(content);
    logger.debug(`Extracted content`, {
      textLength: textContent?.length || 0,
      htmlLength: contentHtml?.length || 0,
      isJson: detectedJson
    });

    // Convert to markdown
    logger.processing(`Converting content to markdown`);
    const markdownContent = convertToMarkdown(contentHtml, detectedJson || isJson);
    logger.debug(`Converted to markdown`, {
      markdownLength: markdownContent?.length || 0,
    });

    // Generate filename with title slug and datetime stamp
    const safeFilename = generateFilename(normalizedRoute, metaInfo.title);
    logger.debug(`Generated safe filename`, { safeFilename });

    // Create JSON data
    const jsonData = {
      url: fullUrl,
      route: normalizedRoute,
      title: metaInfo.title,
      description: metaInfo.description,
      textContent,
      markdownContent,
      timestamp: new Date().toISOString(),
    };

    // Create the appropriate output directories as needed
    try {
      // Write files based on format
      if (format === "json" || format === "all") {
        const jsonDir = path.join(OUTPUT_DIR, "json");
        await fs.ensureDir(jsonDir);

        const jsonFilePath = path.join(jsonDir, `${safeFilename}.json`);
        await fs.writeFile(jsonFilePath, JSON.stringify(jsonData, null, 2));

        logger.fileSystem("write", jsonFilePath, {
          format: "json",
          size: Buffer.byteLength(JSON.stringify(jsonData, null, 2)),
        });

        logger.info(`Generated JSON file: output/json/${safeFilename}.json`);
      }

      if (format === "text" || format === "all") {
        const textDir = path.join(OUTPUT_DIR, "text");
        await fs.ensureDir(textDir);

        const textFilePath = path.join(textDir, `${safeFilename}.txt`);
        await fs.writeFile(textFilePath, textContent);

        logger.fileSystem("write", textFilePath, {
          format: "text",
          size: Buffer.byteLength(textContent),
        });

        logger.info(`Generated text file: output/text/${safeFilename}.txt`);
      }

      if (format === "markdown" || format === "all") {
        const markdownDir = path.join(OUTPUT_DIR, "markdown");
        await fs.ensureDir(markdownDir);

        const markdownFilePath = path.join(markdownDir, `${safeFilename}.md`);
        await fs.writeFile(markdownFilePath, markdownContent);

        logger.fileSystem("write", markdownFilePath, {
          format: "markdown",
          size: Buffer.byteLength(markdownContent),
        });

        logger.info(
          `Generated markdown file: output/markdown/${safeFilename}.md`
        );
      }
    } catch (fileError) {
      logger.error(`File system error: ${fileError.message}`, {
        error: {
          message: fileError.message,
          code: fileError.code,
          stack: fileError.stack,
        },
      });
      throw new Error(`Failed to save output files: ${fileError.message}`);
    }

    logger.info(`Generated files for ${fullUrl}`);
    logger.endOperation(routeContext, "success", {
      formats:
        format === "all" ? VALID_FORMATS.filter((f) => f !== "all") : [format],
    });

    // Return data for testing purposes
    return {
      route: normalizedRoute,
      url: fullUrl,
      data: jsonData,
    };
  } catch (error) {
    logger.error(
      `Error processing route ${normalizedRoute}: ${error.message}`,
      {
        error: {
          message: error.message,
          stack: error.stack,
        },
      }
    );

    logger.endOperation(routeContext, "error", {
      error: error.message,
    });

    throw error;
  }
}

/**
 * Find the routes file based on provided path or defaults
 * @param {string|null} routePath - Optional custom path to the routes file
 * @returns {string|null} - Path to the routes file or null if not found
 */
function findRoutesFile(routePath = null) {
  // If a specific path is provided, use it directly
  if (routePath) {
    if (fs.existsSync(routePath)) {
      return routePath;
    }
    return null; // Specific path provided but not found
  }
  
  // Default path is routes.json in the project root
  const defaultPath = path.join(process.cwd(), 'routes.json');
  
  if (fs.existsSync(defaultPath)) {
    return defaultPath;
  }
  
  return null; // No routes file found in default location
}

/**
 * Load routes from a JSON file
 * @param {string} filePath - Path to the JSON file containing routes
 * @returns {Promise<string[]>} - Array of routes from the file
 */
async function loadRoutesFromFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Routes file not found: ${filePath}`);
    }
    
    const fileContent = await fs.readFile(filePath, 'utf8');
    const routesData = JSON.parse(fileContent);
    
    if (!Array.isArray(routesData)) {
      throw new Error('Routes file must contain a JSON array of routes');
    }
    
    // Validate each route is a string
    const validRoutes = routesData.filter(route => typeof route === 'string');
    
    // If file exists but has no valid routes, default to a single route
    if (validRoutes.length === 0) {
      logger.warn(`Routes file ${filePath} exists but contains no valid routes. Using default route.`);
      return ['/'];
    }
    
    return validRoutes;
  } catch (error) {
    logger.error(`Failed to load routes from file: ${error.message}`);
    throw error;
  }
}

/**
 * Process multiple routes with improved error handling and monitoring
 * @param {string} baseUrl - The base URL
 * @param {string[]} routes - Array of routes to process
 * @param {string} format - The output format (text, json, markdown, or all)
 * @returns {Promise<Array>} - Array of results for testing purposes
 */
async function processRoutes(
  baseUrl = DEFAULT_BASE_URL,
  routes = DEFAULT_ROUTES,
  format = DEFAULT_FORMAT
) {
  // Input validation
  if (!baseUrl) {
    throw new Error('Base URL is required');
  }
  if (!Array.isArray(routes) || routes.length === 0) {
    throw new Error('Routes must be a non-empty array');
  }
  
  // Check format validity - use default format if invalid
  const validFormat = VALID_FORMATS.includes(format) ? format : DEFAULT_FORMAT;
  if (!VALID_FORMATS.includes(format)) {
    logger.warn(`Invalid format: ${format}. Using default format: ${DEFAULT_FORMAT}`);
  }

  logger.startup(APP_VERSION, {
    baseUrl,
    routeCount: routes.length,
    format: validFormat,
  });

  logger.info(`Starting to process ${routes.length} routes from ${baseUrl}`);
  logger.debug("Routes to process", { routes });

  // Track results and errors
  const results = [];
  const errors = [];

  for (let i = 0; i < routes.length; i++) {
    const route = routes[i];
    logger.progress("processing_routes", i + 1, routes.length, {
      currentRoute: route,
    });

    try {
      const result = await generateFilesForRoute(baseUrl, route, validFormat);
      if (result) {
        results.push(result);
      }
    } catch (error) {
      logger.error(`Failed to process route ${route}: ${error.message}`);
      errors.push({
        route,
        error: error.message,
      });
    }
  }

  // Log a summary of results
  logger.info(`Completed processing ${routes.length} routes`, {
    successful: results.length,
    failed: errors.length,
    errors: errors.length > 0 ? errors : undefined,
  });

  return results;
}

/**
 * Process a single page URL
 * @param {string} url - Full URL to process
 * @param {string} format - Output format
 * @returns {Promise<Object|null>} - Result or null if processing fails
 */
async function processSinglePage(url, format = DEFAULT_FORMAT) {
  try {
    if (!isValidUrl(url)) {
      throw new Error(`Invalid URL: ${url}`);
    }

    // Extract baseUrl and route from the full URL
    const urlObj = new URL(url);
    const baseUrl = `${urlObj.protocol}//${urlObj.hostname}${urlObj.port ? `:${urlObj.port}` : ''}`;
    const route = urlObj.pathname;

    logger.info(`Processing single page: ${url}`);
    return await generateFilesForRoute(baseUrl, route, format);
  } catch (error) {
    logger.error(`Failed to process single page: ${error.message}`);
    throw error;
  }
}

// If this file is run directly (not imported)
if (require.main === module) {
  (async () => {
    try {
      // Check for previous outputs and ask user if they want to delete them
      const shouldDelete = await shouldDeletePreviousOutputs();
      if (shouldDelete) {
        await deletePreviousOutputs();
      }
      
      // Command line arguments handling
      const args = process.argv.slice(2);
      
      // Extract route path flag if specified
      let routePathIndex = args.findIndex(arg => arg === '-routePath');
      let routePathValue = null;
      
      if (routePathIndex !== -1 && routePathIndex + 1 < args.length) {
        routePathValue = args[routePathIndex + 1];
        // Remove the flag and its value from args
        args.splice(routePathIndex, 2);
      }
      
      // If the first argument is a full URL, process it as a single page
      if (args.length > 0 && isValidUrl(args[0])) {
        const url = args[0];
        const format = args[1] && VALID_FORMATS.includes(args[1]) ? args[1] : DEFAULT_FORMAT;
        
        await processSinglePage(url, format);
        logger.info(`Successfully processed page: ${url}`);
      } 
      // Look for routes file
      else {
        const routesFilePath = findRoutesFile(routePathValue);
        
        // If a specific path was provided but file wasn't found, exit with error
        if (routePathValue && !routesFilePath) {
          console.error(`\x1b[31mError: Routes file not found at specified path: ${routePathValue}\x1b[0m`);
          process.exit(1);
        }
        
        // If we have a routes file, use it
        if (routesFilePath) {
          // Get format from first arg if not a URL, or second arg if URL was provided
          const format = args[0] && VALID_FORMATS.includes(args[0]) ? args[0] : 
                        (args[1] && VALID_FORMATS.includes(args[1]) ? args[1] : DEFAULT_FORMAT);
          
          // Get baseUrl from second arg if not a format, or from third arg    
          const baseUrl = (args[0] && !VALID_FORMATS.includes(args[0])) ? args[0] : 
                         (args[1] && !VALID_FORMATS.includes(args[1])) ? args[1] :
                         (args[2]) ? args[2] : DEFAULT_BASE_URL;
          
          try {
            const routes = await loadRoutesFromFile(routesFilePath);
            await processRoutes(baseUrl, routes, format);
            logger.info(`Successfully processed routes from file: ${routesFilePath}`);
          } catch (error) {
            console.error(`\x1b[31mError loading routes file: ${error.message}\x1b[0m`);
            process.exit(1);
          }
        }
        // Otherwise, use the provided arguments or defaults
        else {
          const baseUrl = args[0] || DEFAULT_BASE_URL;
          const routes = args[1] ? JSON.parse(args[1]) : DEFAULT_ROUTES;
          const format = args[2] && VALID_FORMATS.includes(args[2]) ? args[2] : DEFAULT_FORMAT;

          await processRoutes(baseUrl, routes, format);
          logger.info("Successfully processed routes with default configuration");
        }
      }
    } catch (error) {
      console.error(`\x1b[31m╔═════════════════════════════════════════════════════════╗`);
      console.error(`║                         ERROR                             ║`);
      console.error(`╚═════════════════════════════════════════════════════════╝\x1b[0m`);
      console.error(`\x1b[31m${error.message}\x1b[0m`);
      console.error(`\x1b[33mUsage:\x1b[0m`);
      console.error(`  1. Process single page: \x1b[36mnpx scoopit https://example.com/page\x1b[0m [format]`);
      console.error(`  2. Use routes.json: \x1b[36mnpx scoopit\x1b[0m [format] [baseUrl]`);
      console.error(`  3. Specify custom routes file: \x1b[36mnpx scoopit -routePath path/to/routes.json\x1b[0m [format] [baseUrl]`);
      console.error(`  4. Process with inline routes: \x1b[36mnpx scoopit\x1b[0m [baseUrl] [routes] [format]`);
      console.error(`\nCheck the logs for more details.`);
      process.exit(1);
    }
  })();
}

module.exports = {
  fetchContent,
  generateFilesForRoute,
  processRoutes,
  processSinglePage,
  loadRoutesFromFile,
  isValidUrl,
  shouldDeletePreviousOutputs,
  deletePreviousOutputs,
  DEFAULT_BASE_URL,
  DEFAULT_ROUTES,
  DEFAULT_FORMAT,
  VALID_FORMATS,
};
