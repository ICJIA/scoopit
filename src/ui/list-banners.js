#!/usr/bin/env node

/**
 * Script to list all available banners
 * This helps users see what banners are available and their IDs
 */

// Import the banner module and display utilities
const bannerModule = require('./console-banner');
const { colors } = require('./display');

/**
 * List all available banners with information
 */
function listAvailableBanners() {
  const allBanners = bannerModule.banners;
  
  console.log(`${colors.bright}${colors.cyan}====================================${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}       Available ICJIA Banners      ${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}====================================${colors.reset}`);
  console.log('');
  
  allBanners.forEach((banner, index) => {
    console.log(`${colors.bright}${colors.yellow}Banner #${index + 1}: ${banner.name}${colors.reset}`);
    console.log(`${colors.dim}ID: ${banner.id}${colors.reset}`);
    console.log(`${colors.dim}Tags: ${banner.tags ? banner.tags.join(', ') : 'none'}${colors.reset}`);
    console.log(`${colors.dim}Color: ${banner.color || 'default'}${colors.reset}`);
    console.log('');
    
    // Display the banner
    console.log(bannerModule.formatBanner(banner));
    console.log(`${colors.dim}----------------------------------${colors.reset}`);
    console.log('');
  });
  
  console.log(`${colors.green}Total banners: ${allBanners.length}${colors.reset}`);
  console.log('');
  console.log(`${colors.bright}To use a specific banner:${colors.reset}`);
  console.log(`${colors.cyan}scoopit --banner BANNER_ID${colors.reset}`);
  console.log(`${colors.dim}Example: scoopit --banner block${colors.reset}`);
  console.log('');
  console.log(`${colors.bright}To hide the ICJIA banner:${colors.reset}`);
  console.log(`${colors.cyan}scoopit --no-icjia${colors.reset}`);
  console.log('');
  console.log(`${colors.bright}To add new banners:${colors.reset}`);
  console.log(`${colors.dim}Edit ${__dirname}/console-banner.js and add a new entry to the banners array${colors.reset}`);
}

// If this script is run directly
if (require.main === module) {
  listAvailableBanners();
}

module.exports = {
  listAvailableBanners
};