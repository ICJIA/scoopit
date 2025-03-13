const { expect } = require("chai");
const nock = require("nock");
const sinon = require("sinon");

const {
  processRoutes,
  generateFilesForRoute,
  fetchContent,
  DEFAULT_BASE_URL,
  DEFAULT_ROUTES,
  DEFAULT_FORMAT,
} = require("../index");

describe("ScoopIt Content Generator", function () {
  // Increase timeout for HTTP requests
  this.timeout(10000);

  // Sample HTML response
  const sampleHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Test Page</title>
        <meta name="description" content="This is a test page description">
      </head>
      <body>
        <header>
          <h1>Test Page</h1>
        </header>
        <main>
          <h2>Main Content</h2>
          <p>This is the main content of the test page.</p>
          <ul>
            <li>Item 1</li>
            <li>Item 2</li>
          </ul>
        </main>
        <script>console.log('This should be removed');</script>
      </body>
    </html>
  `;

  beforeEach(() => {
    // Set test environment
    process.env.NODE_ENV = 'test';

    // Mock console.log to reduce test output noise
    sinon.stub(console, "log");
  });

  afterEach(() => {
    // Restore console.log
    console.log.restore();

    // Reset all HTTP mocks
    nock.cleanAll();
    
    // Restore environment variables
    process.env.NODE_ENV = '';
  });

  describe("fetchContent()", () => {
    it("should fetch content from a URL", async () => {
      // Mock HTTP request
      nock("https://wikipedia.org").get("/test").reply(200, sampleHtml);

      const content = await fetchContent("https://wikipedia.org/test");
      expect(content).to.be.a("string");
      expect(content).to.include("<title>Test Page</title>");
      expect(content).to.include("This is the main content");
    });

    it("should return null for failed requests", async () => {
      // Mock HTTP request with error
      nock("https://wikipedia.org").get("/nonexistent").reply(404);

      // Stub console.error to suppress error output
      sinon.stub(console, "error");

      const content = await fetchContent("https://wikipedia.org/nonexistent");
      expect(content).to.be.null;

      console.error.restore();
    });
  });

  describe("generateFilesForRoute()", () => {
    it("should process content for a route in text format", async () => {
      // Mock HTTP request
      nock("https://wikipedia.org").get("/test").reply(200, sampleHtml);

      const result = await generateFilesForRoute("https://wikipedia.org", "/test", "text");
      
      // Verify only the data structure, not file operations
      expect(result).to.be.an("object");
      expect(result).to.have.property("url", "https://wikipedia.org/test");
      expect(result).to.have.property("data");
      expect(result.data).to.have.property("textContent");
    });

    it("should process content for a route in json format", async () => {
      // Mock HTTP request
      nock("https://wikipedia.org").get("/test").reply(200, sampleHtml);

      const result = await generateFilesForRoute("https://wikipedia.org", "/test", "json");
      
      // Verify only the data structure, not file operations
      expect(result).to.be.an("object");
      expect(result).to.have.property("url", "https://wikipedia.org/test");
      expect(result).to.have.property("data");
      expect(result.data).to.have.property("textContent");
    });

    it("should process content for a route in all formats", async () => {
      // Mock HTTP request
      nock("https://wikipedia.org").get("/test").reply(200, sampleHtml);

      const result = await generateFilesForRoute("https://wikipedia.org", "/test", "all");
      
      // Verify only the data structure, not file operations
      expect(result).to.be.an("object");
      expect(result).to.have.property("url", "https://wikipedia.org/test");
      expect(result).to.have.property("data");
      expect(result.data).to.have.property("textContent");
    });
  });

  describe("processRoutes()", () => {
    it("should process multiple routes", async () => {
      // Mock HTTP requests
      nock("https://wikipedia.org")
        .get("/route1")
        .reply(200, sampleHtml)
        .get("/route2")
        .reply(200, sampleHtml);

      const results = await processRoutes(
        "https://wikipedia.org",
        ["/route1", "/route2"],
        "text"
      );

      // Check if results array has correct length and structure
      expect(results).to.be.an("array").with.lengthOf(2);
      expect(results[0]).to.have.property("data");
      expect(results[1]).to.have.property("data");
    });

    it("should use default values when not provided", async () => {
      // Mock HTTP requests for default routes
      nock(DEFAULT_BASE_URL)
        .get("/about")
        .reply(200, sampleHtml)
        .get("/researchHub")
        .reply(200, sampleHtml);

      const results = await processRoutes();

      // Check if results array has correct length and structure
      expect(results).to.be.an("array").with.lengthOf(2);
      expect(results[0]).to.have.property("data");
      expect(results[1]).to.have.property("data");
    });

    it("should handle invalid format by using default format", async () => {
      // Mock HTTP request
      nock("https://wikipedia.org").get("/test").reply(200, sampleHtml);

      // Stub console.error to suppress error output
      sinon.stub(console, "error");

      const results = await processRoutes(
        "https://wikipedia.org",
        ["/test"],
        "invalid-format"
      );

      // Check if results array has correct length and structure
      expect(results).to.be.an("array").with.lengthOf(1);
      expect(results[0]).to.have.property("data");

      console.error.restore();
    });
  });

  describe("Integration Tests", () => {
    it("should work with a real website (GitHub homepage)", async function () {
      // This test will make a real HTTP request, skip if in CI environment
      if (process.env.CI) {
        this.skip();
        return;
      }

      const results = await processRoutes("https://github.com", ["/"], "all");

      // Check if results array has correct length and structure
      expect(results).to.be.an("array").with.lengthOf(1);
      expect(results[0]).to.have.property("data");
      expect(results[0]).to.have.property("url").that.includes("github.com");
    });
  });
});
