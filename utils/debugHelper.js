/**
 * Enhanced Debug Helper
 * 
 * Generates structured, compact debug information that's useful for:
 * 1. Quickly identifying issues in the codebase
 * 2. Providing well-formatted information for AI assistance
 */

const fs = require('fs-extra');
const path = require('path');
const os = require('os');

/**
 * Generate structured debug information for testing errors
 * @param {Error} error - The error object or error message
 * @param {Object} options - Additional options for debug output
 * @returns {String} Formatted debug information
 */
function generateDebugInfo(error, options = {}) {
  const {
    testName = 'unknown',
    testFile = null,
    codeContext = null,
    additionalInfo = {}
  } = options;
  
  // Get error details
  const errorObj = error instanceof Error ? error : new Error(error);
  const errorStack = errorObj.stack || '';
  
  // Extract location information from stack trace if available
  const stackLines = errorStack.split('\n').filter(line => line.includes('at '));
  const errorLocations = stackLines.map(line => {
    const match = line.match(/at\s+(?:(.+?)\s+\()?(?:(.+?):(\d+):(\d+))?/);
    if (match) {
      const [_, fnName, filePath, lineNum, colNum] = match;
      // Only include if we have a file path
      if (filePath && !filePath.includes('node_modules')) {
        return {
          function: fnName || 'anonymous',
          file: filePath,
          line: parseInt(lineNum || '0', 10),
          column: parseInt(colNum || '0', 10)
        };
      }
    }
    return null;
  }).filter(Boolean);
  
  // Get system information
  const systemInfo = {
    date: new Date().toISOString(),
    node: process.version,
    platform: process.platform,
    packageJson: getPackageInfo()
  };
  
  // Create the debug object
  const debugInfo = {
    error: {
      name: errorObj.name,
      message: errorObj.message,
      stack: errorStack.split('\n').slice(0, 4).join('\n'),  // Limit stack trace for clarity
      locations: errorLocations
    },
    test: {
      name: testName,
      file: testFile
    },
    system: systemInfo,
    ...additionalInfo
  };
  
  // Format as a well-structured, AI-friendly output
  return formatDebugForAI(debugInfo);
}

/**
 * Get relevant package information
 */
function getPackageInfo() {
  try {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const pkg = require(packageJsonPath);
      return {
        name: pkg.name,
        version: pkg.version,
        dependencies: Object.keys(pkg.dependencies || {})
      };
    }
    return null;
  } catch (e) {
    return { error: e.message };
  }
}

/**
 * Format debug information in an AI-friendly format
 */
function formatDebugForAI(debugInfo) {
  let output = [];
  
  // Title section
  output.push(`# Debug Information: ${debugInfo.error.name}`);
  output.push(`**Error Message**: ${debugInfo.error.message}`);
  output.push(`**Test**: ${debugInfo.test.name}`);
  output.push(`**Date**: ${debugInfo.system.date}`);
  output.push('');
  
  // Error Location section
  output.push('## Error Locations');
  if (debugInfo.error.locations && debugInfo.error.locations.length > 0) {
    debugInfo.error.locations.forEach((loc, i) => {
      if (i < 3) { // Limit to most relevant locations
        output.push(`${i+1}. \`${loc.file}:${loc.line}\` - Function: \`${loc.function}\``);
      }
    });
  } else {
    output.push('*No specific location information available*');
  }
  output.push('');
  
  // Stack Trace section - kept concise
  output.push('## Stack Trace');
  output.push('```');
  output.push(debugInfo.error.stack);
  output.push('```');
  output.push('');
  
  // Environment section
  output.push('## Environment');
  output.push(`- Node.js: ${debugInfo.system.node}`);
  output.push(`- Platform: ${debugInfo.system.platform}`);
  if (debugInfo.system.packageJson) {
    output.push(`- Package: ${debugInfo.system.packageJson.name} v${debugInfo.system.packageJson.version}`);
  }
  output.push('');
  
  // Code Context section if provided
  if (debugInfo.codeContext) {
    output.push('## Code Context');
    output.push('```javascript');
    output.push(debugInfo.codeContext);
    output.push('```');
    output.push('');
  }
  
  // Additional Information section
  if (Object.keys(debugInfo).filter(k => !['error', 'test', 'system', 'codeContext'].includes(k)).length > 0) {
    output.push('## Additional Information');
    for (const [key, value] of Object.entries(debugInfo)) {
      if (!['error', 'test', 'system', 'codeContext'].includes(key)) {
        output.push(`### ${key.charAt(0).toUpperCase() + key.slice(1)}`);
        output.push('```json');
        output.push(JSON.stringify(value, null, 2));
        output.push('```');
      }
    }
  }
  
  // AI Guide section
  output.push('## AI Assistance Guide');
  output.push('This error is about "Assignment to constant variable". The most common causes are:');
  output.push('1. Reassigning a variable declared with `const`');
  output.push('2. Modifying a loop iterator declared with `const`');
  output.push('3. Redeclaring a variable with the same name in the same scope');
  output.push('');
  output.push('Look for patterns like:');
  output.push('- `for (const x of y) { x = something }`');
  output.push('- `const variable = ...; variable = ...`');
  output.push('- `if (...) { const x = ... } else { const x = ... }`');
  
  return output.join('\n');
}

/**
 * Log error information to console and optionally to a file
 */
function logErrorInfo(error, options = {}) {
  const debugInfo = generateDebugInfo(error, options);
  
  // Output to console
  console.log('\n' + debugInfo);
  
  // Optionally write to a file
  if (options.logToFile) {
    const logDir = path.join(process.cwd(), 'logs');
    fs.ensureDirSync(logDir);
    
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const logFile = path.join(logDir, `debug-${timestamp}.md`);
    fs.writeFileSync(logFile, debugInfo);
    
    console.log(`\nDebug information saved to: ${logFile}`);
  }
  
  return debugInfo;
}

/**
 * Error handler that can be used as an uncaught exception handler
 */
function setupGlobalErrorHandler() {
  process.on('uncaughtException', (error) => {
    logErrorInfo(error, { 
      testName: 'Uncaught Exception',
      logToFile: true
    });
    
    process.exit(1);
  });
  
  process.on('unhandledRejection', (reason) => {
    logErrorInfo(reason, {
      testName: 'Unhandled Promise Rejection',
      logToFile: true
    });
  });
  
  console.log('Global error handlers installed for enhanced debugging');
}

module.exports = {
  generateDebugInfo,
  logErrorInfo,
  setupGlobalErrorHandler
};
