const { expect } = require('chai');
const nock = require('nock');
const sinon = require('sinon');

const {
  processRoutes,
  generateFilesForRoute,
  fetchContent,
  DEFAULT_BASE_URL,
  DEFAULT_ROUTES,
  DEFAULT_FORMAT
} = require('../index');

describe('ScoopIt Simplified Tests', function() {
  // Increase timeout for HTTP requests
  this.timeout(10000);

  // Sample HTML response for testing
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
      </body>
    </html>
  `;

  beforeEach(function() {
    // Set test environment to prevent file validation
    process.env.NODE_ENV = 'test';
    
    // Mock console.log to reduce test output noise
    sinon.stub(console, 'log');
  });

  afterEach(function() {
    // Restore console.log
    console.log.restore();
    
    // Reset all HTTP mocks
    nock.cleanAll();
  });

  describe('Basic Configuration', function() {
    it('should have valid default configuration', function() {
      expect(DEFAULT_BASE_URL).to.be.a('string');
      expect(DEFAULT_BASE_URL).to.match(/^https?:\/\//);
      expect(DEFAULT_ROUTES).to.be.an('array');
      expect(DEFAULT_ROUTES.length).to.be.greaterThan(0);
      expect(DEFAULT_FORMAT).to.be.a('string');
    });
  });

  describe('fetchContent()', function() {
    it('should fetch content from a URL', async function() {
      // Mock HTTP request
      nock('https://example.org').get('/test').reply(200, sampleHtml);

      const content = await fetchContent('https://example.org/test');
      expect(content).to.be.a('string');
      expect(content).to.include('<title>Test Page</title>');
    });

    it('should return null for failed requests', async function() {
      // Mock HTTP request with error
      nock('https://example.org').get('/nonexistent').reply(404);
      
      // Stub console.error to suppress error output
      sinon.stub(console, 'error');
      
      const content = await fetchContent('https://example.org/nonexistent');
      expect(content).to.be.null;
      
      console.error.restore();
    });
  });

  describe('generateFilesForRoute()', function() {
    it('should process content for a route without validation', async function() {
      // Mock HTTP request
      nock('https://example.org').get('/test').reply(200, sampleHtml);
      
      const result = await generateFilesForRoute('https://example.org', '/test', 'text');
      
      // Only verify the data structure, not file operations
      expect(result).to.be.an('object');
      expect(result).to.have.property('url', 'https://example.org/test');
      expect(result).to.have.property('data');
      expect(result.data).to.have.property('textContent');
      
      // Do not verify file output
    });
  });

  describe('processRoutes()', function() {
    it('should process multiple routes without validation', async function() {
      // Mock HTTP requests
      nock('https://example.org')
        .get('/route1').reply(200, sampleHtml)
        .get('/route2').reply(200, sampleHtml);
      
      const results = await processRoutes(
        'https://example.org',
        ['/route1', '/route2'],
        'text'
      );
      
      // Only verify the data structure, not file operations
      expect(results).to.be.an('array').with.lengthOf(2);
      expect(results[0]).to.have.property('data');
      expect(results[1]).to.have.property('data');
      
      // Do not verify file output
    });
  });
});
