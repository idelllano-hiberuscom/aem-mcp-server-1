import { AEMFetch } from './aem.fetch.js';
import { createSuccessResponse, safeExecute, createAEMError, AEM_ERROR_CODES } from './aem.errors.js';

export class GraphQLManager {
  private readonly fetch: AEMFetch;

  constructor(fetch: AEMFetch) {
    this.fetch = fetch;
  }

  async runGraphQLQuery(request: any): Promise<object> {
    return safeExecute<object>(async () => {
      const { query, variables, endpoint = '/graphql/execute.json' } = request;

      // AEM Headless GraphQL standard payload
      const payload = {
        query,
        ...(variables ? { variables } : {})
      };

      const data = await this.fetch.post(endpoint, payload);
      
      // AEM returns GraphQL errors in an "errors" array within a 200 OK response sometimes
      if (data && data.errors) {
        throw createAEMError(AEM_ERROR_CODES.SYSTEM_ERROR, `GraphQL Error: ${JSON.stringify(data.errors)}`, { errors: data.errors });
      }

      return createSuccessResponse({
        data: data?.data || data,
        endpoint
      }, 'runGraphQLQuery');
    }, 'runGraphQLQuery');
  }
}
