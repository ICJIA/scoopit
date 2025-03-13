/**
 * Test samples management module
 * 
 * This module manages the test sample files that should exist permanently in the test/samples directory.
 * These files are used for running and completing the tests, and should never be removed.
 */

const fs = require('fs-extra');
const path = require('path');

// Define the test samples directory
const TEST_SAMPLES_DIR = path.join(__dirname, 'samples');

// Ensure sample directories exist
const ensureSampleDirectories = async () => {
  await fs.ensureDir(path.join(TEST_SAMPLES_DIR, 'text'));
  await fs.ensureDir(path.join(TEST_SAMPLES_DIR, 'json'));
  await fs.ensureDir(path.join(TEST_SAMPLES_DIR, 'markdown'));
};

// Check if sample files exist and create them if needed
const ensureSampleFiles = async () => {
  // Define the sample files we need
  const sampleFiles = [
    // Text samples
    {
      source: path.join(__dirname, '../output/text/wiki-Main_Page.txt'),
      destination: path.join(TEST_SAMPLES_DIR, 'text/wiki-Main_Page.txt'),
      fallbackContent: 'Sample Wikipedia Main Page content for testing'
    },
    {
      source: path.join(__dirname, '../output/text/wiki-Web_scraping.txt'),
      destination: path.join(TEST_SAMPLES_DIR, 'text/wiki-Web_scraping.txt'),
      fallbackContent: 'Sample Wikipedia Web Scraping content for testing'
    },
    
    // JSON samples
    {
      source: path.join(__dirname, '../output/json/wiki-Main_Page.json'),
      destination: path.join(TEST_SAMPLES_DIR, 'json/wiki-Main_Page.json'),
      fallbackContent: JSON.stringify({
        url: 'https://en.wikipedia.org/wiki/Main_Page',
        route: '/wiki/Main_Page',
        title: 'Wikipedia, the free encyclopedia',
        description: 'Sample Wikipedia Main Page description',
        textContent: 'Sample Wikipedia Main Page content for testing',
        markdownContent: '# Wikipedia, the free encyclopedia\n\nSample content for testing'
      }, null, 2)
    },
    {
      source: path.join(__dirname, '../output/json/wiki-Web_scraping.json'),
      destination: path.join(TEST_SAMPLES_DIR, 'json/wiki-Web_scraping.json'),
      fallbackContent: JSON.stringify({
        url: 'https://en.wikipedia.org/wiki/Web_scraping',
        route: '/wiki/Web_scraping',
        title: 'Web scraping - Wikipedia',
        description: 'Sample Wikipedia Web Scraping description',
        textContent: 'Sample Wikipedia Web Scraping content for testing',
        markdownContent: '# Web scraping\n\nSample content for testing'
      }, null, 2)
    },
    
    // Markdown samples
    {
      source: path.join(__dirname, '../output/markdown/wiki-Main_Page.md'),
      destination: path.join(TEST_SAMPLES_DIR, 'markdown/wiki-Main_Page.md'),
      fallbackContent: '# Wikipedia, the free encyclopedia\n\nSample content for testing'
    },
    {
      source: path.join(__dirname, '../output/markdown/wiki-Web_scraping.md'),
      destination: path.join(TEST_SAMPLES_DIR, 'markdown/wiki-Web_scraping.md'),
      fallbackContent: '# Web scraping\n\nSample content for testing'
    }
  ];

  // Process each sample file
  for (const file of sampleFiles) {
    if (!fs.existsSync(file.destination)) {
      // Try to copy from output directory if it exists
      if (fs.existsSync(file.source)) {
        await fs.copy(file.source, file.destination);
        console.log(`Copied sample file to ${file.destination}`);
      } else {
        // Create with fallback content if source doesn't exist
        await fs.writeFile(file.destination, file.fallbackContent);
        console.log(`Created sample file at ${file.destination} with fallback content`);
      }
    }
  }
};

// Main function to ensure test samples exist
const ensureTestSamples = async () => {
  try {
    await ensureSampleDirectories();
    await ensureSampleFiles();
    console.log('Test samples verified - all required sample files exist');
    return true;
  } catch (error) {
    console.error('Error ensuring test samples:', error);
    return false;
  }
};

// Export the main function and constants
module.exports = {
  TEST_SAMPLES_DIR,
  ensureTestSamples
};

// Execute if run directly
if (require.main === module) {
  ensureTestSamples();
}
