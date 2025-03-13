/**
 * ASCII art banner collection for the application
 * This file contains various ASCII art versions of 'ICJIA'
 * 
 * To add new ASCII art:
 * 1. Create a new entry in the banners array
 * 2. Each entry should have:
 *    - id: A unique identifier for the banner
 *    - name: A descriptive name
 *    - art: The ASCII art content (use backticks for multi-line strings)
 *    - color: (optional) Color name from the colors object
 *    - tags: (optional) Array of tags for categorization
 */

// Import colors from the display module
const { colors } = require('./display');

// Collection of banner designs
const banners = [
  {
    id: 'standard',
    name: 'Standard ICJIA',
    art: `
    ██╗ ██████╗     ██╗██╗ █████╗ 
    ██║██╔════╝     ██║██║██╔══██╗
    ██║██║          ██║██║███████║
    ██║██║     ██   ██║██║██╔══██║
    ██║╚██████╗╚█████╔╝██║██║  ██║
    ╚═╝ ╚═════╝ ╚════╝ ╚═╝╚═╝  ╚═╝
    `,
    color: 'cyan',
    tags: ['default', 'large']
  },
  {
    id: 'simple',
    name: 'Simple ICJIA',
    art: `
    +-+-+-+-+
    |I|C|J|I|A|
    +-+-+-+-+
    `,
    color: 'yellow',
    tags: ['minimal', 'small']
  },
  {
    id: 'block',
    name: 'Block Style ICJIA',
    art: `
     _____ _____ _____ _____ _____ 
    |_   _|     |     |_   _|  _  |
      | | |   --|_|_|_| | | |     |
      |_| |_____|_____| |_| |__|__|
    `,
    color: 'magenta',
    tags: ['medium', 'retro']
  },
  {
    id: 'thin',
    name: 'Thin ICJIA',
    art: `
    ╭───╮╭───╮╭───╮╭───╮╭───╮
    │ ╲ ││╭─╮││ ╲ ││ ╲ │╱ ╲ │
    │ ╱ │││ │││_╱_/│ ╱ │╲_╱ │
    ╰───╯╰───╯╰───╯╰───╯╰───╯
    `,
    color: 'blue',
    tags: ['medium', 'modern']
  },
  {
    id: 'shadow',
    name: 'Shadow ICJIA',
    art: `
     ██▓ ▄████▄      ▄▄▄██▀▀▀██▓ ▄▄▄      
    ▓██▒▒██▀ ▀█        ▒██  ▓██▒▒████▄    
    ▒██▒▒▓█    ▄       ░██  ▒██▒▒██  ▀█▄  
    ░██░▒▓▓▄ ▄██▒   ▓██▄██▓ ░██░░██▄▄▄▄██ 
    ░██░▒ ▓███▀ ░    ▓███▒  ░██░ ▓█   ▓██▒
    ░▓  ░ ░▒ ▒  ░    ▒▓▒▒░  ░▓   ▒▒   ▓▒█░
     ▒ ░  ░  ▒       ▒ ░░    ▒ ░  ▒   ▒▒ ░
     ▒ ░░            ░ ░     ▒ ░  ░   ▒   
     ░  ░ ░          ░       ░        ░  ░
        ░                                 
    `,
    color: 'green',
    tags: ['large', 'fancy']
  }
];

/**
 * Get a random banner
 * @returns {Object} - A random banner object
 */
function getRandomBanner() {
  const randomIndex = Math.floor(Math.random() * banners.length);
  return banners[randomIndex];
}

/**
 * Get a banner by ID
 * @param {string} id - The banner ID to retrieve
 * @returns {Object|null} - The banner object or null if not found
 */
function getBannerById(id) {
  return banners.find(banner => banner.id === id) || null;
}

/**
 * Get banners by tag
 * @param {string} tag - The tag to filter by
 * @returns {Array} - Array of banner objects with the specified tag
 */
function getBannersByTag(tag) {
  return banners.filter(banner => banner.tags && banner.tags.includes(tag));
}

/**
 * Format a banner with color and add a tagline
 * @param {Object} banner - The banner object to format
 * @param {string} tagline - Optional tagline to add below the banner
 * @returns {string} - Formatted banner ready for console output
 */
function formatBanner(banner, tagline = '') {
  const color = banner.color && colors[banner.color] ? colors[banner.color] : '';
  const resetColor = color ? colors.reset : '';
  
  let output = `${color}${banner.art}${resetColor}`;
  
  if (tagline) {
    output += `\n${colors.yellow}${tagline}${colors.reset}\n`;
  }
  
  return output;
}

/**
 * Get all available banner IDs
 * @returns {Array} - Array of banner IDs
 */
function getAllBannerIds() {
  return banners.map(banner => banner.id);
}

/**
 * Add a new banner to the collection (runtime only, not persistent)
 * @param {Object} banner - The banner object to add
 */
function addBanner(banner) {
  if (!banner.id || !banner.name || !banner.art) {
    throw new Error('Banner must have id, name, and art properties');
  }
  
  // Check for duplicate ID
  if (banners.some(b => b.id === banner.id)) {
    throw new Error(`Banner with ID "${banner.id}" already exists`);
  }
  
  banners.push(banner);
}

module.exports = {
  banners,
  getRandomBanner,
  getBannerById,
  getBannersByTag,
  formatBanner,
  getAllBannerIds,
  addBanner
};