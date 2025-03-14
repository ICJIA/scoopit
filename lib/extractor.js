/**
 * Utility functions to extract content from web pages using Puppeteer
 */

/**
 * Extract the title from a Puppeteer page
 * @param {object} page - Puppeteer page object
 * @returns {Promise<string>} The page title
 */
async function getTitle(page) {
  try {
    return await page.evaluate(() => document.title || "Untitled Page");
  } catch (error) {
    console.error("Error extracting title:", error);
    return "Extraction Error";
  }
}

/**
 * Extract the main content from a Puppeteer page
 * @param {object} page - Puppeteer page object
 * @returns {Promise<string>} The extracted content
 */
async function getContent(page) {
  try {
    return await page.evaluate(() => {
      // Try to find main content using common selectors
      const contentSelectors = [
        "main",
        "article",
        "#content",
        ".content",
        ".main-content",
        ".article-content",
        "body",
      ];

      for (const selector of contentSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          return element.innerText;
        }
      }

      // Fallback to body text if no content container found
      return document.body.innerText;
    });
  } catch (error) {
    console.error("Error extracting content:", error);
    return "Content extraction failed";
  }
}

module.exports = {
  getTitle,
  getContent,
};
