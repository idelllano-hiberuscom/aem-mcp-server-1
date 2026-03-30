import { AEMFetch } from './aem.fetch.js';
import { createSuccessResponse, safeExecute } from './aem.errors.js';

export class QueryBuilderManager {
  private readonly fetch: AEMFetch;

  constructor(fetch: AEMFetch) {
    this.fetch = fetch;
  }

  async runQuery(queryParams: Record<string, any>): Promise<object> {
    return safeExecute<object>(async () => {
      // Ensure the parameters are correctly prepared
      const params = { ...queryParams };
      
      // Default limits if not specified to prevent massive unpaginated queries that could hang AEM
      if (!params['p.limit']) {
        params['p.limit'] = '100'; // Set a default reasonable limit
      }
      
      // AEM QueryBuilder endpoint
      const endpoint = '/bin/querybuilder.json';
      
      // Execute the query using GET
      const data = await this.fetch.get(endpoint, params);
      
      return createSuccessResponse({ queryParams, data }, 'runQueryBuilder');
    }, 'runQueryBuilder');
  }
}
