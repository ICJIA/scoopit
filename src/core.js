// Centralized access to core functionality
// This file is imported by CLI for easier access to key functions

const {
  fetchContent,
  generateFilesForRoute,
  processRoutes,
  processSinglePage,
  loadRoutesFromFile,
  isValidUrl,
  shouldDeletePreviousOutputs,
  deletePreviousOutputs,
  DEFAULT_BASE_URL,
  DEFAULT_ROUTES,
  DEFAULT_FORMAT,
  VALID_FORMATS,
} = require('../index.js');

module.exports = {
  fetchContent,
  generateFilesForRoute,
  processRoutes,
  processSinglePage,
  loadRoutesFromFile,
  isValidUrl,
  shouldDeletePreviousOutputs,
  deletePreviousOutputs,
  DEFAULT_BASE_URL,
  DEFAULT_ROUTES,
  DEFAULT_FORMAT,
  VALID_FORMATS,
};