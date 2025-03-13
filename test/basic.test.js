const { expect } = require('chai');
const { DEFAULT_BASE_URL, DEFAULT_ROUTES } = require('../index');

describe('Basic application configuration', function() {
  describe('DEFAULT_BASE_URL', function() {
    it('should be a valid URL', function() {
      expect(DEFAULT_BASE_URL).to.be.a('string');
      expect(DEFAULT_BASE_URL).to.match(/^https?:\/\//);
    });
  });
  
  describe('DEFAULT_ROUTES', function() {
    it('should be an array of routes', function() {
      expect(DEFAULT_ROUTES).to.be.an('array');
      expect(DEFAULT_ROUTES.length).to.be.greaterThan(0);
    });
    
    it('should have routes that start with /', function() {
      DEFAULT_ROUTES.forEach(route => {
        expect(route).to.be.a('string');
        expect(route).to.match(/^\//);
      });
    });
  });
});