/**
 * Utility functions to save extracted content to files
 */
const fs = require("fs-extra");
const path = require("path");

/**
 * Save extracted content to a file
 * @param {string} outputPath - Path where the file should be saved
 * @param {object} data - Data object containing content to save
 * @param {string} data.title - Page title
 * @param {string} data.content - Page content
 * @param {string} data.url - Source URL
 * @returns {Promise<string>} The path of the saved file
 */
async function saveToFile(outputPath, data) {
  try {
    // Ensure the directory exists
    await fs.ensureDir(path.dirname(outputPath));

    // Format the content in markdown
    const markdown = `# ${data.title}\n\n${data.content}\n\n---\nSource: [${data.url}](${data.url})`;

    // Write to file
    await fs.writeFile(outputPath, markdown, "utf8");

    return outputPath;
  } catch (error) {
    console.error(`Error saving file to ${outputPath}:`, error);
    throw error;
  }
}

module.exports = {
  saveToFile,
};
