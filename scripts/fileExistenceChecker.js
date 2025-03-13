#!/usr/bin/env node

/**
 * File Existence Checker
 *
 * This script simply checks if output files exist and have content,
 * without performing any validation on the content itself.
 */

const fs = require('fs-extra');
const path = require('path');

// Configuration
const config = {
  outputDir: path.join(process.cwd(), 'output'),
  formats: ['text', 'json', 'markdown']
};

// File statistics
const fileStats = {
  total: 0,
  withContent: 0,
  empty: 0,
  details: []
};

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 bytes';
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Main function to check files
 */
async function checkFiles() {
  console.log('\n📋 FILE EXISTENCE CHECK');
  console.log('====================\n');
  
  try {
    if (!fs.existsSync(config.outputDir)) {
      console.log('⚠️ Output directory does not exist.');
      return;
    }
    
    console.log(`📁 Root output directory: ${path.resolve(config.outputDir)}\n`);
    
    // Check each format subdirectory
    for (const format of config.formats) {
      const formatDir = path.join(config.outputDir, format);
      
      if (!fs.existsSync(formatDir)) {
        console.log(`ℹ️ Format directory not found: ${format}`);
        continue;
      }
      
      console.log(`📄 Files in ${format} format: (${path.resolve(formatDir)})`);
      
      const files = fs.readdirSync(formatDir);
      if (files.length === 0) {
        console.log(`   No files found for ${format} format.`);
        continue;
      }
      
      // Check each file
      for (const file of files) {
        const filePath = path.join(formatDir, file);
        const stats = fs.statSync(filePath);
        const size = stats.size;
        
        fileStats.total++;
        
        if (size > 0) {
          fileStats.withContent++;
          console.log(`   ✅ ${file} (${formatBytes(size)})`);
          console.log(`      📂 Location: ${path.resolve(filePath)}`);
        } else {
          fileStats.empty++;
          console.log(`   ⚠️ ${file} - Empty`);
          console.log(`      📂 Location: ${path.resolve(filePath)}`);
        }
        
        fileStats.details.push({
          name: file,
          format: format,
          path: filePath,
          size: size,
          sizeFormatted: formatBytes(size),
          hasContent: size > 0
        });
      }
    }
    
    // Check for files directly in output directory
    const rootFiles = fs.readdirSync(config.outputDir)
      .filter(file => fs.statSync(path.join(config.outputDir, file)).isFile());
    
    if (rootFiles.length > 0) {
      console.log(`\n📄 Files in root output directory: (${path.resolve(config.outputDir)})`);
      
      for (const file of rootFiles) {
        const filePath = path.join(config.outputDir, file);
        const stats = fs.statSync(filePath);
        const size = stats.size;
        
        fileStats.total++;
        
        if (size > 0) {
          fileStats.withContent++;
          console.log(`   ✅ ${file} (${formatBytes(size)})`);
          console.log(`      📂 Location: ${path.resolve(filePath)}`);
        } else {
          fileStats.empty++;
          console.log(`   ⚠️ ${file} - Empty`);
          console.log(`      📂 Location: ${path.resolve(filePath)}`);
        }
        
        fileStats.details.push({
          name: file,
          format: 'root',
          path: filePath,
          size: size,
          sizeFormatted: formatBytes(size),
          hasContent: size > 0
        });
      }
    }
    
    // Display summary
    console.log('\n📊 Summary:');
    console.log(`   Total files: ${fileStats.total}`);
    console.log(`   Files with content: ${fileStats.withContent}`);
    console.log(`   Empty files: ${fileStats.empty}`);
    
    // Display detailed file list for easy reference
    console.log('\n📋 Complete File List:');
    fileStats.details.forEach((file, index) => {
      console.log(`   ${index + 1}. ${file.name} (${file.format})`);
      console.log(`      📁 Path: ${file.path}`);
      console.log(`      📊 Size: ${file.sizeFormatted}`);
      console.log(`      ${file.hasContent ? '✅ Has content' : '⚠️ Empty'}\n`);
    });
    
    // Overall assessment
    const passThreshold = 0.5; // We consider it a success if at least half the files have content
    const passRatio = fileStats.total > 0 ? fileStats.withContent / fileStats.total : 0;
    
    console.log('\n📝 Assessment:');
    if (fileStats.total === 0) {
      console.log('   ❌ No files were found to check.');
    } else if (passRatio >= passThreshold) {
      console.log(`   ✅ SUCCESS: ${fileStats.withContent}/${fileStats.total} files contain content.`);
    } else {
      console.log(`   ⚠️ WARNING: Only ${fileStats.withContent}/${fileStats.total} files contain content.`);
    }
    
  } catch (error) {
    console.error(`❌ Error checking files: ${error.message}`);
  }
}

// Run the main function
checkFiles().catch(err => {
  console.error(`Error in main execution: ${err.message}`);
  process.exit(1);
});
