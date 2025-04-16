import axios from 'axios';

/**
 * Google API Service
 * 
 * Provides integration with Google's free APIs to enhance the AI assistant's capabilities
 * Currently supports:
 * - Custom Search API for retrieving TSK-specific information
 * - Knowledge Graph API for entity information
 */
export class GoogleAPIService {
  private apiKey: string | undefined;
  private searchEngineId: string | undefined;

  constructor() {
    this.reloadConfiguration();
  }

  /**
   * Reload configuration from environment variables
   * Used after updating API keys
   */
  reloadConfiguration(): void {
    this.apiKey = process.env.GOOGLE_API_KEY;
    this.searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;
  }

  /**
   * Check if the service is configured with required API keys
   */
  isConfigured(): boolean {
    return Boolean(this.apiKey && this.searchEngineId);
  }

  /**
   * Search for TSK-specific information using Google Custom Search
   * 
   * @param query The search query
   * @param numResults The number of results to return (max 10)
   * @returns Search results or null if API is not configured or fails
   */
  async searchTSKInformation(query: string, numResults: number = 3): Promise<any[] | null> {
    if (!this.isConfigured()) {
      console.warn('Google Custom Search API is not configured');
      return null;
    }

    try {
      const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
        params: {
          key: this.apiKey,
          cx: this.searchEngineId,
          q: query,
          num: Math.min(numResults, 10) // API maximum is 10
        }
      });

      if (response.data && response.data.items) {
        return response.data.items.map((item: any) => ({
          title: item.title,
          link: item.link,
          snippet: item.snippet,
          pagemap: item.pagemap
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error searching with Google Custom Search API:', error);
      return null;
    }
  }

  /**
   * Search for entity information using Google Knowledge Graph API
   * 
   * @param query The entity to search for
   * @returns Entity information or null if API is not configured or fails
   */
  async getEntityInformation(query: string): Promise<any | null> {
    if (!this.apiKey) {
      console.warn('Google Knowledge Graph API is not configured');
      return null;
    }

    try {
      const response = await axios.get('https://kgsearch.googleapis.com/v1/entities:search', {
        params: {
          key: this.apiKey,
          query: query,
          limit: 1,
          indent: true
        }
      });

      if (response.data && response.data.itemListElement && response.data.itemListElement.length > 0) {
        return response.data.itemListElement[0];
      }
      
      return null;
    } catch (error) {
      console.error('Error searching with Google Knowledge Graph API:', error);
      return null;
    }
  }

  /**
   * Comprehensive search that attempts multiple API calls to gather information
   * 
   * @param query The search query
   * @returns Combined results from multiple APIs
   */
  async comprehensiveSearch(query: string): Promise<any> {
    const results: any = {
      entityInformation: null,
      searchResults: null
    };

    // Run searches in parallel
    const [entityResult, searchResults] = await Promise.all([
      this.getEntityInformation(query),
      this.searchTSKInformation(query, 3)
    ]);

    results.entityInformation = entityResult;
    results.searchResults = searchResults;

    return results;
  }
}

export const googleAPIService = new GoogleAPIService();