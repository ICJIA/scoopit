const { expect } = require("chai");
const {
  cleanHtml,
  extractMetaInfo,
  extractContent,
  convertToMarkdown,
} = require("../utils/contentProcessor");

describe("Content Processor Utilities", () => {
  // Sample HTML for testing
  const sampleHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Test Page</title>
        <meta name="description" content="This is a test page description">
        <meta property="og:description" content="OG description">
        <style>
          body { color: red; }
        </style>
      </head>
      <body>
        <header>
          <h1>Test Page Header</h1>
        </header>
        <main>
          <h2>Main Content</h2>
          <p>This is the <strong>main content</strong> of the test page.</p>
          <ul>
            <li>Item 1</li>
            <li>Item 2</li>
          </ul>
          <a href="https://wikipedia.org">Example Link</a>
          <!-- This is a comment that should be removed -->
        </main>
        <script>
          console.log('This should be removed');
        </script>
      </body>
    </html>
  `;

  describe("cleanHtml()", () => {
    it("should remove script, style, and other non-content elements", () => {
      const $ = cleanHtml(sampleHtml);

      // Check if $ is a function with properties (Cheerio API interface)
      expect(typeof $).to.equal("function");
      expect($).to.have.property("html");
      
      // Check if it has the isCheerio property we added
      expect($).to.have.property("isCheerio", true);

      // Check if script and style tags were removed
      expect($("script").length).to.equal(0);
      expect($("style").length).to.equal(0);

      // Check if content elements are still present
      expect($("main").length).to.equal(1);
      expect($("h2").length).to.equal(1);
    });

    it("should remove HTML comments", () => {
      const $ = cleanHtml(sampleHtml);
      const html = $.html();

      // Comments should be removed
      expect(html).to.not.include(
        "<!-- This is a comment that should be removed -->"
      );
    });

    it("should handle null or empty input", () => {
      expect(cleanHtml(null)).to.be.null;
      
      const emptyResult = cleanHtml("");
      expect(typeof emptyResult).to.equal("function");
      expect(emptyResult).to.have.property("isCheerio", true);
      expect(emptyResult).to.have.property("html");
    });
  });

  describe("extractMetaInfo()", () => {
    it("should extract title and description from HTML", () => {
      const metaInfo = extractMetaInfo(sampleHtml);

      expect(metaInfo).to.be.an("object");
      expect(metaInfo).to.have.property("title", "Test Page");
      expect(metaInfo).to.have.property(
        "description",
        "This is a test page description"
      );
    });

    it("should use og:description if meta description is not available", () => {
      // HTML without meta description but with og:description
      const htmlWithoutMetaDesc = sampleHtml.replace(
        'name="description" content="This is a test page description"',
        ""
      );

      const metaInfo = extractMetaInfo(htmlWithoutMetaDesc);
      expect(metaInfo).to.have.property("description", "OG description");
    });

    it("should handle missing title and description", () => {
      // Create a minimal HTML without title and descriptions
      const htmlWithoutMeta = `<!DOCTYPE html>
<html>
  <head>
  </head>
  <body>
    <header>
      <h1>Test Page Header</h1>
    </header>
    <main>
      <h2>Main Content</h2>
    </main>
  </body>
</html>`;

      const metaInfo = extractMetaInfo(htmlWithoutMeta);
      expect(metaInfo).to.have.property("title", "");
      expect(metaInfo).to.have.property("description", "");
    });

    it("should handle null or empty input", () => {
      const emptyMetaInfo = extractMetaInfo(null);
      expect(emptyMetaInfo).to.deep.equal({ title: "", description: "" });

      const emptyHtmlMetaInfo = extractMetaInfo("");
      expect(emptyHtmlMetaInfo).to.deep.equal({ title: "", description: "" });
    });
  });

  describe("extractContent()", () => {
    it("should extract main content from HTML", () => {
      const { cleanHtml: contentHtml, textContent } =
        extractContent(sampleHtml);

      // Content HTML should include main content elements
      expect(contentHtml).to.include("<h2>Main Content</h2>");
      expect(contentHtml).to.include(
        "<p>This is the <strong>main content</strong> of the test page.</p>"
      );

      // Text content should have text without HTML tags
      expect(textContent).to.include("Main Content");
      expect(textContent).to.include(
        "This is the main content of the test page."
      );
      expect(textContent).to.not.include("<strong>");
    });

    it("should use alternative content selectors if main is not available", () => {
      // HTML without main tag but with content div
      const htmlWithoutMain = sampleHtml
        .replace(/<main>/g, '<div id="content">')
        .replace(/<\/main>/g, "</div>");

      const { cleanHtml: contentHtml, textContent } =
        extractContent(htmlWithoutMain);

      // Content HTML should include content div elements
      expect(contentHtml).to.include("<h2>Main Content</h2>");
      expect(textContent).to.include("Main Content");
    });

    it("should fall back to body if no content container is found", () => {
      // HTML without main tag or content div
      const htmlWithoutContentDiv = sampleHtml
        .replace(/<main>/g, "<div>")
        .replace(/<\/main>/g, "</div>");

      const { textContent } = extractContent(htmlWithoutContentDiv);

      // Text content should include all body content
      expect(textContent).to.include("Test Page Header");
      expect(textContent).to.include("Main Content");
    });

    it("should handle null or empty input", () => {
      const emptyContent = extractContent(null);
      expect(emptyContent).to.deep.equal({ cleanHtml: "", textContent: "" });

      const emptyHtmlContent = extractContent("");
      expect(emptyHtmlContent).to.deep.equal({
        cleanHtml: "",
        textContent: "",
      });
    });
  });

  describe("convertToMarkdown()", () => {
    it("should convert HTML to markdown", () => {
      // Simple HTML to test conversion
      const simpleHtml = `
        <h1>Heading 1</h1>
        <h2>Heading 2</h2>
        <p>This is a <strong>bold</strong> and <em>italic</em> text.</p>
        <ul>
          <li>Item 1</li>
          <li>Item 2</li>
        </ul>
        <a href="https://wikipedia.org">Link</a>
      `;

      const markdown = convertToMarkdown(simpleHtml);

      // Markdown should have correct syntax
      expect(markdown).to.include("# Heading 1");
      expect(markdown).to.include("## Heading 2");
      expect(markdown).to.include("**bold**");
      expect(markdown).to.include("*italic*");
      expect(markdown).to.include("- Item 1");
      expect(markdown).to.include("- Item 2");
      expect(markdown).to.include("[Link](https://wikipedia.org)");
    });

    it("should preserve links in markdown", () => {
      const htmlWithLink = `
        <p>Visit <a href="https://wikipedia.org">Example</a> for more information.</p>
      `;

      const markdown = convertToMarkdown(htmlWithLink);
      expect(markdown).to.include("[Example](https://wikipedia.org)");
    });

    it("should handle null or empty input", () => {
      expect(convertToMarkdown(null)).to.equal("");
      expect(convertToMarkdown("")).to.equal("");
    });
  });
});
