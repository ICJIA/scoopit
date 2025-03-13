declare module 'scoopit' {
  /**
   * Fetch content from a URL
   * @param url - The URL to fetch content from
   * @returns The content string or null if fetch fails
   */
  export function fetchContent(url: string): Promise<string | null>;

  /**
   * Generate files for a specific route
   * @param baseUrl - The base URL
   * @param route - The route path
   * @param format - The output format (text, json, markdown, or all)
   * @returns Route data or null if processing fails
   */
  export function generateFilesForRoute(
    baseUrl: string,
    route: string,
    format?: string
  ): Promise<{
    route: string;
    url: string;
    data: {
      url: string;
      route: string;
      title: string;
      description: string;
      textContent: string;
      markdownContent: string;
      timestamp: string;
    };
  } | null>;

  /**
   * Process multiple routes
   * @param baseUrl - The base URL
   * @param routes - Array of routes to process
   * @param format - The output format (text, json, markdown, or all)
   * @returns Array of results
   */
  export function processRoutes(
    baseUrl?: string,
    routes?: string[],
    format?: string
  ): Promise<Array<{
    route: string;
    url: string;
    data: {
      url: string;
      route: string;
      title: string;
      description: string;
      textContent: string;
      markdownContent: string;
      timestamp: string;
    };
  }>>;

  /**
   * Process a single page URL
   * @param url - Full URL to process
   * @param format - Output format
   * @returns Result or null if processing fails
   */
  export function processSinglePage(
    url: string,
    format?: string
  ): Promise<{
    route: string;
    url: string;
    data: {
      url: string;
      route: string;
      title: string;
      description: string;
      textContent: string;
      markdownContent: string;
      timestamp: string;
    };
  } | null>;

  /**
   * Load routes from a JSON file
   * @param filePath - Path to the JSON file containing routes
   * @returns Array of routes from the file
   */
  export function loadRoutesFromFile(filePath: string): Promise<string[]>;

  /**
   * Validates a URL format
   * @param url - The URL to validate
   * @returns True if valid URL format, false otherwise
   */
  export function isValidUrl(url: string): boolean;

  /**
   * Asks the user if they want to delete previous output files
   * @returns True if user wants to delete previous files, false otherwise
   */
  export function shouldDeletePreviousOutputs(): Promise<boolean>;

  /**
   * Deletes previous output files but preserves logs
   */
  export function deletePreviousOutputs(): Promise<void>;

  /**
   * Default base URL used when none is provided
   */
  export const DEFAULT_BASE_URL: string;

  /**
   * Default routes used when none are provided
   */
  export const DEFAULT_ROUTES: string[];

  /**
   * Default output format
   */
  export const DEFAULT_FORMAT: string;

  /**
   * Valid output formats
   */
  export const VALID_FORMATS: string[];
}