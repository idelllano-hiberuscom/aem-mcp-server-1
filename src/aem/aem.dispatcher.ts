import { AEMFetch } from './aem.fetch.js';
import { createSuccessResponse, safeExecute } from './aem.errors.js';

export class DispatcherManager {
  private readonly fetch: AEMFetch;

  constructor(fetch: AEMFetch) {
    this.fetch = fetch;
  }

  async flushCache(params: { path: string; action?: 'Activate' | 'Delete' }): Promise<object> {
    return safeExecute<object>(async () => {
      const { path, action = 'Activate' } = params;

      // When triggering via AEM Dispatcher, we typically send an empty body
      // but specific headers. The 'dispatcher' needs to receive this. 
      // Usually, in AEM as a Cloud Service or standard environments, 
      // the Flush is handled via AEM standard replication agents (flush agent).
      // If we want to simulate a flush agent hitting the dispatcher directly:
      // We would hit the publish instance or the dispatcher instance directly.
      // However, AEM also allows invalidating cache through the standard replication endpoint
      // if the dispatcher is hooked as a replication agent.
      // 
      // To manually trigger the dispatcher invalidation directly to AEM we can use the Dispatcher Flush agent.
      // A common way to force a flush from inside AEM is by replicating to the "dispatcher-flush" agent.
      
      const body = new URLSearchParams();
      body.append('path', path);
      body.append('cmd', action); 
      // Force it to use the dispatcher flush agent if possible, or standard Activate which triggers the flush cache.
      
      // We can also send direct HTTP headers to the standard AEM endpoint.
      // AEM's dispatcher catches requests with CQ-Action header.
      // Since this is fetching to the host specified in config, we can send the CQ-Action headers.
      // The dispatcher intercepts requests to /dispatcher/invalidate.cache
      
      const headers = {
        'CQ-Action': action,
        'CQ-Handle': path,
        // Sometimes it requires CQ-Path
        'CQ-Path': path,
      };

      // Usually the dispatcher invalidation endpoint is /dispatcher/invalidate.cache
      let endpoint = '/dispatcher/invalidate.cache';
      
      try {
         await this.fetch.post(endpoint, {}, { headers });
      } catch (error: any) {
         // If direct dispatcher invalidation fails (e.g. not hitting dispatcher directly),
         // we might fallback to using standard replication.
         throw new Error(`Failed to flush cache directly on Dispatcher: ${error.message}. Ensure the request is hitting the Dispatcher URL or you have a valid flush agent.`);
      }

      return createSuccessResponse({ path, action, endpoint }, 'flushCache');
    }, 'flushCache');
  }
}
