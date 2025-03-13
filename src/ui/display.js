/**
 * UI display utilities for CLI interface
 */

// Terminal colors for better user experience
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m"
};

/**
 * Display application banner
 * @param {string} [bannerId] - Specific banner ID to display (random if not specified)
 * @param {boolean} [showIcjia=true] - Whether to display ICJIA banner before app banner
 */
function displayBanner(bannerId, showIcjia = true) {
  // Import banners only when needed (avoid circular dependencies)
  const bannerModule = require('./console-banner');
  const { version } = require('../../package.json');
  
  // Display ICJIA banner if requested
  if (showIcjia) {
    // Get specific banner by ID or a random one
    const banner = bannerId 
      ? bannerModule.getBannerById(bannerId) 
      : bannerModule.getRandomBanner();
      
    if (banner) {
      const tagline = "Illinois Criminal Justice Information Authority";
      console.log(bannerModule.formatBanner(banner, tagline));
    }
  }
  
  // Display ScoopIt banner
  console.log(`${colors.cyan}${colors.bright}
   _____ _________  ____  _____   _____ _______ 
  / ____|/ ____/ __ \\|  _ \\|  __ \\ |_   _|__   __|
 | (___ | |   | |  | | |_) | |__) |  | |    | |   
  \\___ \\| |   | |  | |  _ <|  ___/   | |    | |   
  ____) | |___| |__| | |_) | |      _| |_   | |   
 |_____/ \\_____\\____/|____/|_|     |_____|  |_|   
                                                 
${colors.reset}${colors.yellow}Content Generator for Web Routes${colors.reset}
${colors.dim}Version ${version}${colors.reset}

This tool fetches content from specified web routes and generates
output files in various formats (text, JSON, markdown).

${colors.magenta}Usage:${colors.reset}
  ${colors.bright}1. No-install mode:${colors.reset} ${colors.cyan}npx scoopit${colors.reset} ${colors.dim}[options]${colors.reset}
  ${colors.bright}2. Interactive mode:${colors.reset} ${colors.cyan}scoopit${colors.reset}
  ${colors.bright}3. Single page:${colors.reset} ${colors.cyan}scoopit https://example.com/page [format]${colors.reset}
  ${colors.bright}4. Routes file:${colors.reset} ${colors.cyan}scoopit routes.json [format] [baseUrl]${colors.reset}
  ${colors.bright}5. Custom routes path:${colors.reset} ${colors.cyan}scoopit -routePath ./path/to/routes.json${colors.reset}
`);
}

/**
 * Display error message with formatting
 * @param {string} message - The error message
 * @param {boolean} exitProcess - Whether to exit the process
 */
function displayError(message, exitProcess = false) {
  console.error(`\n${colors.red}${colors.bright}╔═════════════════════════════════════════════════════════╗`);
  console.error(`║                         ERROR                             ║`);
  console.error(`╚═════════════════════════════════════════════════════════╝${colors.reset}`);
  console.error(`${colors.red}${message}${colors.reset}\n`);
  
  if (exitProcess) {
    process.exit(1);
  }
}

/**
 * Display helpful tips based on user selections
 * @param {string} baseUrl - The base URL
 * @param {string[]} routes - The routes to process
 * @param {string} format - The output format
 */
function displayTips(baseUrl, routes, format) {
  console.log(`\n${colors.dim}─────────────────────────────────────────────────────${colors.reset}`);
  console.log(`${colors.cyan}Helpful Tips:${colors.reset}`);
  
  // Format-specific tips
  if (format === "text") {
    console.log(`• ${colors.dim}Text files are useful for quick reading or importing to other applications${colors.reset}`);
  } else if (format === "json") {
    console.log(`• ${colors.dim}JSON files contain all content formats and metadata for programmatic use${colors.reset}`);
  } else if (format === "markdown") {
    console.log(`• ${colors.dim}Markdown files preserve basic formatting and are ideal for documentation${colors.reset}`);
  } else if (format === "all") {
    console.log(`• ${colors.dim}You've selected to generate all formats - check the output directory for all files${colors.reset}`);
  }
  
  // General tips
  console.log(`• ${colors.dim}Files will be saved in the 'output/${format === 'all' ? '{text,json,markdown}' : format}' directory${colors.reset}`);
  console.log(`• ${colors.dim}Logs are available in the 'logs' directory for troubleshooting${colors.reset}`);
  console.log(`${colors.dim}─────────────────────────────────────────────────────${colors.reset}\n`);
}

/**
 * Display progress information
 * @param {number} current - Current progress
 * @param {number} total - Total items
 * @param {string} operation - Operation name
 */
function displayProgress(current, total, operation = 'processing') {
  const percent = Math.round((current / total) * 100);
  process.stdout.write(`\r${colors.dim}${operation}: ${current}/${total} (${percent}%)${colors.reset}`);
}

module.exports = {
  colors,
  displayBanner,
  displayError,
  displayTips,
  displayProgress
};