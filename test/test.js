const { expect } = require("chai");
const nock = require("nock");
const fs = require("fs-extra");
const path = require("path");
const sinon = require("sinon");
const { ensureTestSamples } = require("./test.samples");

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

  const testOutputDir = path.join(process.cwd(), "output");

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

  beforeEach(async () => {
    // Clean up output directory before each test
    if (fs.existsSync(testOutputDir)) {
      fs.removeSync(testOutputDir);
    }
    fs.ensureDirSync(testOutputDir);
    fs.ensureDirSync(path.join(testOutputDir, "text"));
    fs.ensureDirSync(path.join(testOutputDir, "json"));
    fs.ensureDirSync(path.join(testOutputDir, "markdown"));

    // Ensure test samples exist
    await ensureTestSamples();

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
    
    // Note: We no longer remove the output directory after tests
    // to allow copying sample files for test fixtures if needed
  });

  describe("fetchContent()", () => {
    it("should fetch content from a URL", async () => {
      // Mock HTTP request
      nock("https://example.com").get("/test").reply(200, sampleHtml);

      const content = await fetchContent("https://example.com/test");
      expect(content).to.be.a("string");
      expect(content).to.include("<title>Test Page</title>");
      expect(content).to.include("This is the main content");
    });

    it("should return null for failed requests", async () => {
      // Mock HTTP request with error
      nock("https://example.com").get("/nonexistent").reply(404);

      // Stub console.error to suppress error output
      sinon.stub(console, "error");

      const content = await fetchContent("https://example.com/nonexistent");
      expect(content).to.be.null;

      console.error.restore();
    });
  });

  describe("generateFilesForRoute()", () => {
    it("should generate files for a route in text format", async () => {
      // Mock HTTP request
      nock("https://example.com").get("/test").reply(200, sampleHtml);

      await generateFilesForRoute("https://example.com", "/test", "text");

      // Check if text file was created
      const textFiles = fs.readdirSync(path.join(testOutputDir, "text"));
      expect(textFiles.length).to.be.greaterThan(0, "No text files were created");
      const textFilePath = path.join(testOutputDir, "text", textFiles[0]);
      expect(fs.existsSync(textFilePath)).to.be.true;

      // Check content of text file
      const textContent = fs.readFileSync(textFilePath, "utf8");
      expect(textContent).to.include("Main Content");
      expect(textContent).to.include("This is the main content");

      // Check if other format files were not created
      expect(fs.existsSync(path.join(testOutputDir, "json"))).to.be.false;
      expect(fs.existsSync(path.join(testOutputDir, "markdown"))).to.be.false;
    });

    it("should generate files for a route in json format", async () => {
      // Mock HTTP request
      nock("https://example.com").get("/test").reply(200, sampleHtml);

      await generateFilesForRoute("https://example.com", "/test", "json");

      // Check if json file was created
      const jsonFiles = fs.readdirSync(path.join(testOutputDir, "json"));
      expect(jsonFiles.length).to.be.greaterThan(0, "No JSON files were created");
      const jsonFilePath = path.join(testOutputDir, "json", jsonFiles[0]);
      expect(fs.existsSync(jsonFilePath)).to.be.true;

      // Check content of json file
      const jsonContent = require(jsonFilePath);
      expect(jsonContent).to.have.property("url", "https://example.com/test");
      expect(jsonContent).to.have.property("route", "/test");
      expect(jsonContent).to.have.property("title", "Test Page");
      expect(jsonContent).to.have.property(
        "description",
        "This is a test page description"
      );
      expect(jsonContent).to.have.property("textContent");
      expect(jsonContent).to.have.property("markdownContent");

      // Check if other format files were not created
      expect(fs.existsSync(path.join(testOutputDir, "text"))).to.be.false;
      expect(fs.existsSync(path.join(testOutputDir, "markdown"))).to.be.false;
    });

    it("should generate files for a route in all formats", async () => {
      // Mock HTTP request
      nock("https://example.com").get("/test").reply(200, sampleHtml);

      await generateFilesForRoute("https://example.com", "/test", "all");

      // Check if all format files were created
      const textFiles = fs.readdirSync(path.join(testOutputDir, "text"));
      expect(textFiles.length).to.be.greaterThan(0, "No text files were created");
      
      const jsonFiles = fs.readdirSync(path.join(testOutputDir, "json"));
      expect(jsonFiles.length).to.be.greaterThan(0, "No JSON files were created");
      
      const markdownFiles = fs.readdirSync(path.join(testOutputDir, "markdown"));
      expect(markdownFiles.length).to.be.greaterThan(0, "No markdown files were created");
    });
  });

  describe("processRoutes()", () => {
    it("should process multiple routes", async () => {
      // Mock HTTP requests
      nock("https://example.com")
        .get("/route1")
        .reply(200, sampleHtml)
        .get("/route2")
        .reply(200, sampleHtml);

      const results = await processRoutes(
        "https://example.com",
        ["/route1", "/route2"],
        "text"
      );

      // Check if results array has correct length
      expect(results).to.be.an("array").with.lengthOf(2);

      // Check if files were created for both routes
      const textFiles = fs.readdirSync(path.join(testOutputDir, "text"));
      expect(textFiles.length).to.be.at.least(2, "Not enough text files were created for multiple routes");
    });

    it("should use default values when not provided", async () => {
      // Mock HTTP requests for default routes
      nock(DEFAULT_BASE_URL)
        .get("/about")
        .reply(200, sampleHtml)
        .get("/researchHub")
        .reply(200, sampleHtml);

      const results = await processRoutes();

      // Check if results array has correct length
      expect(results).to.be.an("array").with.lengthOf(2);

      // Check if files were created for default routes
      const textFiles = fs.readdirSync(path.join(testOutputDir, "text"));
      expect(textFiles.length).to.be.at.least(2, "Not enough text files were created for default routes");
    });

    it("should handle invalid format by using default format", async () => {
      // Mock HTTP request
      nock("https://example.com").get("/test").reply(200, sampleHtml);

      // Stub console.error to suppress error output
      sinon.stub(console, "error");

      const results = await processRoutes(
        "https://example.com",
        ["/test"],
        "invalid-format"
      );

      // Check if results array has correct length
      expect(results).to.be.an("array").with.lengthOf(1);

      // Check if file was created using default format
      const textFiles = fs.readdirSync(path.join(testOutputDir, "text"));
      expect(textFiles.length).to.be.greaterThan(0, "No text files were created despite using default format");

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

      // Check if results array has correct length
      expect(results).to.be.an("array").with.lengthOf(1);

      // Check if files were created in all formats
      const textFiles = fs.readdirSync(path.join(testOutputDir, "text"));
      expect(textFiles.length).to.be.greaterThan(0, "No text files were created for GitHub homepage");
      
      const jsonFiles = fs.readdirSync(path.join(testOutputDir, "json"));
      expect(jsonFiles.length).to.be.greaterThan(0, "No JSON files were created for GitHub homepage");
      
      const markdownFiles = fs.readdirSync(path.join(testOutputDir, "markdown"));
      expect(markdownFiles.length).to.be.greaterThan(0, "No markdown files were created for GitHub homepage");

      // Check if files have content
      const textContent = fs.readFileSync(
        path.join(testOutputDir, "text", textFiles[0]),
        "utf8"
      );
      expect(textContent).to.be.a("string").that.is.not.empty;

      const jsonContent = JSON.parse(
        fs.readFileSync(path.join(testOutputDir, "json", jsonFiles[0]), "utf8")
      );
      expect(jsonContent).to.have.property("url").that.includes("github.com");
      expect(jsonContent).to.have.property("textContent").that.is.not.empty;
    });
  });
});
