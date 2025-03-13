#!/usr/bin/env node

/**
 * Copy sample files from output directory to test/samples directory
 * This script helps maintain test fixtures
 * 
 * These files are never removed and are used for running and completing tests
 */

const fs = require('fs-extra');
const path = require('path');

// Define the fallback content in case the output files don't exist
const FALLBACK_CONTENT = {
  text: {
    'wiki-Main_Page': 'Sample Wikipedia Main Page content for testing',
    'wiki-Web_scraping': 'Sample Wikipedia Web Scraping content for testing',
    'posts-1': 'userId: 1\nid: 1\ntitle: sunt aut facere repellat provident occaecati excepturi optio reprehenderit\nbody: quia et suscipit suscipit recusandae consequuntur expedita et cum reprehenderit molestiae ut ut quas totam nostrum rerum est autem sunt rem eveniet architecto',
    'users-1': 'id: 1\nname: Leanne Graham\nusername: Bret\nemail: Sincere@april.biz\nphone: 1-770-736-8031 x56442\nwebsite: hildegard.org'
  },
  json: {
    'wiki-Main_Page': {
      url: 'https://en.wikipedia.org/wiki/Main_Page',
      route: '/wiki/Main_Page',
      title: 'Wikipedia, the free encyclopedia',
      description: 'Sample Wikipedia Main Page description',
      textContent: 'Sample Wikipedia Main Page content for testing',
      markdownContent: '# Wikipedia, the free encyclopedia\n\nSample content for testing'
    },
    'wiki-Web_scraping': {
      url: 'https://en.wikipedia.org/wiki/Web_scraping',
      route: '/wiki/Web_scraping',
      title: 'Web scraping - Wikipedia',
      description: 'Sample Wikipedia Web Scraping description',
      textContent: 'Sample Wikipedia Web Scraping content for testing',
      markdownContent: '# Web scraping\n\nSample content for testing'
    },
    'posts-1': {
      url: 'https://jsonplaceholder.typicode.com/posts/1',
      route: '/posts/1',
      title: 'Post 1',
      description: 'This is a sample post from JSONPlaceholder API',
      textContent: 'userId: 1\nid: 1\ntitle: sunt aut facere repellat provident occaecati excepturi optio reprehenderit\nbody: quia et suscipit suscipit recusandae consequuntur expedita et cum reprehenderit molestiae ut ut quas totam nostrum rerum est autem sunt rem eveniet architecto',
      markdownContent: '```json\n{\n  "userId": 1,\n  "id": 1,\n  "title": "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",\n  "body": "quia et suscipit suscipit recusandae consequuntur expedita et cum reprehenderit molestiae ut ut quas totam nostrum rerum est autem sunt rem eveniet architecto"\n}\n```\n',
      timestamp: new Date().toISOString()
    },
    'users-1': {
      url: 'https://jsonplaceholder.typicode.com/users/1',
      route: '/users/1',
      title: 'User 1',
      description: 'This is a sample user from JSONPlaceholder API',
      textContent: 'id: 1\nname: Leanne Graham\nusername: Bret\nemail: Sincere@april.biz\nphone: 1-770-736-8031 x56442\nwebsite: hildegard.org',
      markdownContent: '```json\n{\n  "id": 1,\n  "name": "Leanne Graham",\n  "username": "Bret",\n  "email": "Sincere@april.biz",\n  "address": {\n    "street": "Kulas Light",\n    "suite": "Apt. 556",\n    "city": "Gwenborough",\n    "zipcode": "92998-3874",\n    "geo": {\n      "lat": "-37.3159",\n      "lng": "81.1496"\n    }\n  },\n  "phone": "1-770-736-8031 x56442",\n  "website": "hildegard.org",\n  "company": {\n    "name": "Romaguera-Crona",\n    "catchPhrase": "Multi-layered client-server neural-net",\n    "bs": "harness real-time e-markets"\n  }\n}\n```\n',
      timestamp: new Date().toISOString()
    }
  },
  markdown: {
    'wiki-Main_Page': '# Wikipedia, the free encyclopedia\n\nSample content for testing',
    'wiki-Web_scraping': '# Web scraping\n\nSample content for testing',
    'posts-1': '```json\n{\n  "userId": 1,\n  "id": 1,\n  "title": "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",\n  "body": "quia et suscipit suscipit recusandae consequuntur expedita et cum reprehenderit molestiae ut ut quas totam nostrum rerum est autem sunt rem eveniet architecto"\n}\n```',
    'users-1': '```json\n{\n  "id": 1,\n  "name": "Leanne Graham",\n  "username": "Bret",\n  "email": "Sincere@april.biz",\n  "address": {\n    "street": "Kulas Light",\n    "suite": "Apt. 556",\n    "city": "Gwenborough",\n    "zipcode": "92998-3874",\n    "geo": {\n      "lat": "-37.3159",\n      "lng": "81.1496"\n    }\n  },\n  "phone": "1-770-736-8031 x56442",\n  "website": "hildegard.org",\n  "company": {\n    "name": "Romaguera-Crona",\n    "catchPhrase": "Multi-layered client-server neural-net",\n    "bs": "harness real-time e-markets"\n  }\n}\n```'
  }
};

async function copySamples() {
  try {
    // Ensure directories exist
    await fs.ensureDir(path.join(__dirname, '../test/samples/text'));
    await fs.ensureDir(path.join(__dirname, '../test/samples/json'));
    await fs.ensureDir(path.join(__dirname, '../test/samples/markdown'));
    
    // Define the files to process
    const files = [
      // Text files
      {
        format: 'text',
        filename: 'wiki-Main_Page.txt',
      },
      {
        format: 'text',
        filename: 'wiki-Web_scraping.txt',
      },
      {
        format: 'text',
        filename: 'posts-1.txt',
      },
      {
        format: 'text',
        filename: 'users-1.txt',
      },
      
      // JSON files
      {
        format: 'json',
        filename: 'wiki-Main_Page.json',
      },
      {
        format: 'json',
        filename: 'wiki-Web_scraping.json',
      },
      {
        format: 'json',
        filename: 'posts-1.json',
      },
      {
        format: 'json',
        filename: 'users-1.json',
      },
      
      // Markdown files
      {
        format: 'markdown',
        filename: 'wiki-Main_Page.md',
      },
      {
        format: 'markdown',
        filename: 'wiki-Web_scraping.md',
      },
      {
        format: 'markdown',
        filename: 'posts-1.md',
      },
      {
        format: 'markdown',
        filename: 'users-1.md',
      }
    ];
    
    // Process each file
    for (const file of files) {
      const sourcePath = path.join(__dirname, `../output/${file.format}/${file.filename}`);
      const destPath = path.join(__dirname, `../test/samples/${file.format}/${file.filename}`);
      
      // Only copy if the source exists and destination doesn't
      if (fs.existsSync(sourcePath) && !fs.existsSync(destPath)) {
        await fs.copy(sourcePath, destPath);
        console.log(`Copied ${file.format} file to ${destPath}`);
      } 
      // Create with fallback content if destination doesn't exist
      else if (!fs.existsSync(destPath)) {
        const basename = path.basename(file.filename, path.extname(file.filename));
        let content = FALLBACK_CONTENT[file.format][basename];
        
        // Stringify JSON content
        if (file.format === 'json') {
          content = JSON.stringify(content, null, 2);
        }
        
        await fs.writeFile(destPath, content);
        console.log(`Created ${file.format} file at ${destPath} with fallback content`);
      }
      // Skip if already exists
      else {
        console.log(`Sample file ${destPath} already exists, skipping...`);
      }
    }
    
    console.log('Sample files verified in test/samples directory');
  } catch (error) {
    console.error('Error managing sample files:', error);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  copySamples();
}

module.exports = copySamples;
