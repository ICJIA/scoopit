
# ScoopIt

A Node.js web application that 'scoops' content from a series of routes for a specified website or API. ScoopIt fetches content and saves it in multiple formats (text, JSON, and markdown) with comprehensive testing and logging capabilities. It supports both HTML web pages and JSON API responses.

ScoopIt was designed to simplify and enhance AI development workflows, particularly those involving Large Language Models (LLMs). By providing clean, structured data extraction from websites, ScoopIt enables more efficient context provision for LLMs, improving the accuracy and relevance of AI-generated responses.

## Scoopit Overview

#### 1. Content Quality and Structure

ScoopIt intelligently extracts and formats content from websites and APIs, ensuring that LLMs receive clean, structured data without irrelevant UI elements, navigation menus, footers, or other noise that might confuse the model or waste token context windows.

#### 2. Multiple Format Support

By providing content in multiple formats (text, JSON, markdown), ScoopIt gives you options for how to best present information to an LLM:

- **Plain text** for simple, direct content for embedding or RAG systems
- **JSON** for structured data with metadata that helps LLMs understand relationships
- **Markdown** for preserving content hierarchy and formatting while removing HTML noise

#### 3. Efficient Data Collection

Instead of manually downloading individual pages, ScoopIt can process an entire site or specific sections based on your routes configuration, making it efficient to gather comprehensive information for training or context. This batch processing capability can save days of manual work in large-scale AI projects.

#### 4. Preprocessing for Context Windows

By extracting only relevant content and removing boilerplate HTML, ScoopIt helps you maximize the value of limited context windows in LLMs, focusing on the information that matters rather than wasting tokens on page structure.

### Implementation Workflow

1. Define the routes for the website sections relevant to your AI application
2. Run ScoopIt to extract and format the content
3. Process the generated files as needed (chunking, embedding, etc.)
4. Feed the processed content to your LLM as context for queries

This approach enables more accurate, relevant responses from your AI applications by providing clean, structured data tailored to your specific domain.

## Programmatic Usage

ScoopIt can be used programmatically in your Node.js applications:

```javascript
const scoopit = require("scoopit");

// Process a single web page
async function processSinglePage() {
  try {
    const result = await scoopit.processSinglePage(
      "https://example.com/page",
      "json"
    );
    console.log(`Page processed: ${result.url}`);
    console.log(`Content length: ${result.data.textContent.length} characters`);
  } catch (error) {
    console.error("Error processing page:", error);
  }
}

// Process multiple routes from a website
async function processMultipleRoutes() {
  const baseUrl = "https://example.com";
  const routes = ["/about", "/contact", "/products"];

  try {
    const results = await scoopit.processRoutes(baseUrl, routes, "all");
    console.log(`Processed ${results.length} routes successfully`);
  } catch (error) {
    console.error("Error processing routes:", error);
  }
}

// Extract content without saving files
async function extractContentOnly() {
  try {
    const content = await scoopit.fetchContent("https://example.com");
    if (content) {
      // You can use other utilities from the library to process content
      // without saving files
      const {
        extractContent,
        convertToMarkdown,
      } = require("scoopit/utils/contentProcessor");
      const { textContent } = extractContent(content);
      console.log("Extracted text content:", textContent);
    }
  } catch (error) {
    console.error("Error extracting content:", error);
  }
}
```

## Features

- **Content Extraction**: Fetches and extracts content from any web page or JSON API endpoint
- **Multiple Output Formats**:
  - Plain text - Clean content stripped of HTML or formatted from JSON
  - JSON - Complete metadata including URL, route, title, description, content in both text and markdown formats
  - Markdown - Formatted content preserving structure or JSON data presented in code blocks
- **Flexible Configuration**: Customizable routes via a JSON configuration file
- **HTML and JSON Support**: Process both HTML web pages and JSON API responses
- **Advanced Logging**: Detailed operational logs with structured data
- **Comprehensive Testing**: Unit tests, integration tests, and output validation
- **User-friendly CLI**: Interactive command-line interface with progress tracking

## Installation

### Prerequisites

- Node.js 14.x or higher

### Running Without Installation Using npx

You can run ScoopIt directly without installation using `npx`:

```bash
# Run in interactive mode
npx scoopit

# Process a specific URL
npx scoopit https://example.com

# Process a URL with a specific format
npx scoopit https://example.com json

# Process routes from a routes.json file
npx scoopit routes.json

# Process routes with a custom base URL
npx scoopit routes.json all https://example.com

# Specify a custom routes file path
npx scoopit -routePath ./path/to/custom-routes.json
```

### Package Manager Installation

You can also install ScoopIt using your preferred package manager:

#### npm

```bash
# Local installation
npm install scoopit

# Global installation
npm install -g scoopit
```

#### yarn

```bash
# Local installation
yarn add scoopit

# Global installation
yarn global add scoopit
```

#### pnpm

```bash
# Local installation
pnpm add scoopit

# Global installation
pnpm add -g scoopit
```

Global installation makes the `scoopit` command available system-wide.

### Installing from GitHub

To get the latest development version directly from GitHub:

```bash
# Using npm
npm install -g github:yourusername/scoopit

# Using yarn
yarn global add github:yourusername/scoopit

# Using pnpm
pnpm add -g github:yourusername/scoopit
```

### Cloning and Running from Source

If you want to contribute, modify the code, or run from source:

1. Clone the repository:

```bash
git clone https://github.com/yourusername/scoopit.git
cd scoopit
```

2. Install dependencies using your preferred package manager:

```bash
# Using npm
npm install

# Using yarn
yarn install

# Using pnpm
pnpm install
```

3. Prepare testing samples (optional but recommended):

```bash
npm run samples
# or
yarn samples
# or
pnpm run samples
```

4. Run the CLI or use as a library:

```bash
# Run the CLI directly
node cli.js

# Run with default options
npm start
# or
yarn start
# or
pnpm start

# Run in development mode (auto-restart on file changes)
npm run dev
# or
yarn dev
# or
pnpm run dev
```

5. For local development with global command access, install the package locally:

```bash
# Using npm
npm install -g .

# Using yarn
yarn global add file:$PWD

# Using pnpm
pnpm link --global
```

After global installation, you can use the `scoopit` command from anywhere.

## Usage

### Command-Line Options and Switches

ScoopIt provides various command-line options to control its behavior:

| Option        | Description                               | Example                                       |
| :------------ | :---------------------------------------- | :-------------------------------------------- |
| `[url]`       | Process a specific URL                    | `scoopit https://example.com`                 |
| `[format]`    | Output format (text, json, markdown, all) | `scoopit https://example.com json`            |
| `[file.json]` | JSON file containing routes to process    | `scoopit routes.json`                         |
| `-routePath`  | Path to a custom routes file              | `scoopit -routePath ./custom-routes.json`     |
| `[baseUrl]`   | Base URL for routes (with routes.json)    | `scoopit routes.json all https://example.com` |

Additional options for environment variables:

| Environment Variable | Description                     | Values                             |
| :------------------- | :------------------------------ | :--------------------------------- |
| `LOG_LEVEL`          | Controls logging verbosity      | error, warn, info (default), debug |
| `SCOOPIT_VERBOSE`    | Enable verbose output for tests | true, false                        |
| `NODE_ENV`           | Application environment         | test, development, production      |

### Running via npx (No Installation)

Run ScoopIt without installation using `npx`:

```bash
# Interactive mode
npx scoopit

# With URL and format
npx scoopit https://example.com json

# With custom routes file
npx scoopit -routePath ./custom-routes.json

# Run a specific version
npx scoopit@1.0.0

# Run the latest beta version
npx scoopit@beta
```

### Interactive CLI (Recommended)

The interactive CLI provides the easiest way to use the application:

```bash
npm run cli
# or if installed globally
scoopit
# or without installation
npx scoopit
```

### Default Usage

Run the application with default settings:

```bash
npm start
# or
npx scoopit
```

### Custom Usage

You can specify a custom base URL, routes, and format:

```bash
# Using npm script
npm start -- https://example.com json

# Using global installation
scoopit https://example.com json

# Using npx
npx scoopit https://example.com json

# With a routes file
scoopit routes.json all https://example.com

# With a custom routes file path
scoopit -routePath ./custom-routes.json all https://example.com
```

### ASCII Banners

ScoopIt includes several ASCII art banners for ICJIA (Illinois Criminal Justice Information Authority) that are displayed when the application starts:

#### View Available Banners

```bash
# List all available banners with their IDs
npm run banners

# Or with yarn
yarn banners

# Or with pnpm
pnpm run banners
```

#### Specify a Banner

You can specify which banner to display using the `--banner` flag:

```bash
# Use the 'block' style banner
scoopit --banner block

# With npx
npx scoopit --banner shadow

# Combined with other arguments
scoopit --banner thin https://example.com json
```

#### Hide the ICJIA Banner

If you prefer not to see the ICJIA banner, use the `--no-icjia` flag:

```bash
scoopit --no-icjia
```

#### Add Custom Banners

To add your own ASCII art banners, edit the `src/ui/console-banner.js` file and add a new entry to the `banners` array:

```javascript
{
  id: 'my-custom',
  name: 'My Custom Banner',
  art: `
  +-+-+-+-+
  |I|C|J|I|A|
  +-+-+-+-+
  `,
  color: 'green',
  tags: ['custom', 'small']
}
```

### Routes Configuration

ScoopIt uses a `routes.json` file to determine which routes to process. The application handles routes configuration with the following logic:

1. By default, it looks for `routes.json` in the project root
2. If `routes.json` is present but empty, it defaults to a single route ('/')
3. The `--routePath` flag can specify a custom path for routes.json
4. If a custom path is specified but invalid, the application exits gracefully with an error message
5. If no `routes.json` is found, it falls back to default routes defined in the code

Example `routes.json` file:

```json
["/", "/about", "/products", "/contact"]
```

### Development Mode

For development with auto-restart on file changes:

```bash
npm run dev
```

## Output

All generated files are saved in the `output` directory in the current working directory, organized as follows:

- `output/json/` - JSON files containing the full URL, route, and content in both text and markdown formats
- `output/text/` - Plain text content files
- `output/markdown/` - Markdown content files

## Testing

ScoopIt includes a comprehensive testing suite to ensure reliability and functionality. The tests are organized into different categories to validate various aspects of the application.

### Test Types

- **Unit Tests**: Test individual functions and components in isolation
- **Integration Tests**: Test the interaction between multiple components, including live website scraping
- **Validation Tests**: Verify the quality and structure of the generated output files

### Running Tests

#### Run All Tests

To run the complete test suite:

```bash
npm test
```

This will execute unit tests, integration tests with live scraping, and output validation.

#### Run Specific Test Types

```bash
# Only run unit tests
npm run test:unit

# Only run integration tests (live scraping)
npm run test:integration

# Only run validation tests
npm run test:validation

# Run a simplified test suite (faster)
npm run test:simplified

# Run tests with verbose output
npm run test:verbose

# Run tests with minimal output
npm run test:quiet
```

#### Live Website Testing

Test against a live website to verify scraping functionality:

```bash
# Test against the default site
npm run test:live

# Test against a specific site
npm run test:live-site --site=https://example.com

# Run live tests with verbose output
npm run test:live-verbose
```

### Test Visualization

During test execution, a spinner will display progress for long-running operations. The test runner displays a comprehensive summary report at the end with the following information:

- Total tests passed/failed
- Detailed breakdown by test type
- Duration and performance metrics
- Environment information

### Troubleshooting Tests

#### Missing Dependencies

If you encounter dependency errors, run:

```bash
npm run check-deps
```

This will check for all required dependencies and provide instructions to install any missing ones.

#### Common Issues

1. **Puppeteer Issues**: Puppeteer is an optional dependency. If you need to test functionality that requires browser automation, install it with `npm install puppeteer`.

2. **Test Timeouts**: For slow connections, increase the test timeout by setting the environment variable: `SCOOPIT_TEST_TIMEOUT=30000 npm test`

3. **File Permission Issues**: If you encounter permission issues when generating output files, ensure your user has write permissions to the output directory.

### Sample Data Management

To update the sample test data:

```bash
npm run samples
```

This copies the current output files to the test samples directory for future test reference.

### CI/CD Integration

The test suite is designed to work in CI/CD environments. Set the NODE_ENV environment variable to "test" to ensure consistent file naming patterns and to bypass interactive prompts:

```bash
NODE_ENV=test npm test
```

## Logging

The application includes a sophisticated logging system that provides detailed insights into the process:

- **Console Logs**: Human-readable logs while the app is running
- **File Logs**: Detailed logs saved to the `logs` directory:
  - `combined.log` - All logs
  - `error.log` - Error logs only

Log levels can be configured by setting the `LOG_LEVEL` environment variable to one of:

- `error`
- `warn`
- `info` (default)
- `debug`

Example:

```bash
LOG_LEVEL=debug npm start
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Testing

ScoopIt includes a comprehensive testing system with multiple options for running tests, from full test suites to individual component tests.

### Running the Complete Test Suite

To run the full test suite with all test types:

```bash
# Run all tests with standard output
npm run test:all

# Run all tests with verbose output
npm run test:all-verbose
```

### Running Specific Test Types

You can run specific types of tests:

```bash
# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run only output validation tests
npm run test:validation

# Run live tests against a real website
npm run test:live

# Run live tests with a specific site
npm run test:live-site
```

### Enhanced Test Runner

ScoopIt provides an enhanced test runner with improved output formatting, progress indicators, and comprehensive statistics:

```bash
# Run enhanced test runner with all tests
node scripts/enhancedTestRunner.js

# Run with specific test types
node scripts/enhancedTestRunner.js --unit-only
node scripts/enhancedTestRunner.js --integration-only
node scripts/enhancedTestRunner.js --validation-only

# Run with a specific test site
node scripts/enhancedTestRunner.js --test-site=https://example.com

# Skip content validation (only check file existence)
node scripts/enhancedTestRunner.js --skip-validation
```

### File Existence Checker

For quick verification of output files without running full tests, use the file existence checker:

```bash
# Check if output files exist and have content
node scripts/fileExistenceChecker.js
```

This tool will check the output directory for files in all formats (text, JSON, markdown) and verify that files exist and have content, without validating the specific content.

### Running the Interactive Test Runner

ScoopIt also includes an interactive test runner that allows you to choose which tests to run:

```bash
# Run the interactive test selector
npm run test:select

# Run specific tests directly
npm run test:select -- unit
npm run test:select -- integration
npm run test:select -- live

# Run multiple test types
npm run test:select -- unit integration
```

The test runner will display a menu of available tests, execute your selection, and provide detailed results with statistics for each test.

## Docker Deployment

You can also run ScoopIt using Docker.

### Why Use Docker for ScoopIt?

Docker offers several advantages for running ScoopIt:

1. **Environment Isolation**: Docker containers include all necessary dependencies without affecting your system. This eliminates "works on my machine" problems and potential conflicts with other Node.js versions or packages.

2. **Consistent Execution**: The containerized environment ensures ScoopIt runs the same way regardless of the host operating system (Windows, macOS, Linux).

3. **No Node.js Requirement**: You don't need to install Node.js on your host system, making deployment easier on servers or machines where you don't want to manage Node.js installations.

4. **Simplified CI/CD Integration**: Docker containers are easy to integrate into continuous integration and deployment pipelines, allowing automated content extraction as part of your workflows.

5. **Resource Control**: Docker allows you to limit CPU and memory usage, which is useful when running ScoopIt on shared servers or in production environments.

6. **Easy Distribution**: You can share your configured ScoopIt container with team members who can run it without worrying about installation or configuration steps.

7. **Multiple Version Support**: You can run different versions of ScoopIt in different containers without conflicts.

8. **Scheduled Tasks**: When combined with container orchestration tools, you can easily schedule ScoopIt to run content extraction jobs at regular intervals.

### Using the Included Dockerfile

The repository includes a Dockerfile ready for use:

1. Build the Docker image:

```bash
docker build -t scoopit .
```

2. Run the container:

```bash
# Run in interactive mode
docker run -it --rm -v "$(pwd)/output:/app/output" scoopit

# Run with specific arguments
docker run --rm -v "$(pwd)/output:/app/output" scoopit https://example.com json

# Use a custom routes file
docker run --rm \
  -v "$(pwd)/output:/app/output" \
  -v "$(pwd)/my-routes.json:/app/routes.json" \
  scoopit
```

The output will be available in the `output` directory on your host machine.

### Using Docker Compose

The repository also includes a `docker-compose.yml` file for easier deployment:

1. Start the service in interactive mode:

```bash
docker-compose up
```

2. Run with specific arguments by modifying the `docker-compose.yml` file:

```yaml
# Uncomment and modify this line in docker-compose.yml
command: ["https://example.com", "json"]
```

3. Run with a different routes file by changing the volume mapping:

```yaml
volumes:
  - ./output:/app/output
  - ./my-custom-routes.json:/app/routes.json
```

### Building Your Own Docker Setup

If you want to create your own Docker setup, use this Dockerfile as a template:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy project files
COPY . .

# Make CLI executable
RUN chmod +x ./cli.js

# Create output directory
RUN mkdir -p /app/output

# Set entrypoint to the CLI
ENTRYPOINT ["./cli.js"]
```

### Example: Automated Content Extraction

Here's a practical example of how to use Docker for automated content extraction:

1. Create a `routes.json` file with the routes you want to scrape:

```json
["/", "/about", "/products", "/blog"]
```

2. Create a shell script for scheduled execution (`run-extraction.sh`):

```bash
#!/bin/bash
# Set timestamp for this run
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OUTPUT_DIR="./content_archives/$TIMESTAMP"

# Create the output directory
mkdir -p $OUTPUT_DIR

# Run the container with the current timestamp in the output path
docker run --rm \
  -v "$(pwd)/routes.json:/app/routes.json" \
  -v "$OUTPUT_DIR:/app/output" \
  scoopit https://example.com all

echo "Content extraction completed at $TIMESTAMP"
echo "Files saved to $OUTPUT_DIR"
```

3. Make the script executable:

```bash
chmod +x run-extraction.sh
```

4. Set up a cron job to run it weekly (edit with `crontab -e`):

```
# Run content extraction every Sunday at 2am
0 2 * * 0 /path/to/run-extraction.sh >> /path/to/extraction.log 2>&1
```

This setup automatically extracts content from your specified routes every week, organizing the output in timestamped directories for easy archiving and version comparison.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
