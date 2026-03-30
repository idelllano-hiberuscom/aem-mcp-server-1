import { AEMFetch } from './aem.fetch.js';
import { createSuccessResponse, safeExecute } from './aem.errors.js';

export class OSGiManager {
  private readonly fetch: AEMFetch;

  constructor(fetch: AEMFetch) {
    this.fetch = fetch;
  }

  async listBundles(): Promise<object> {
    return safeExecute<object>(async () => {
      const endpoint = '/system/console/bundles/.json';
      const data = await this.fetch.get(endpoint);
      return createSuccessResponse({ endpoint, data }, 'listBundles');
    }, 'listBundles');
  }

  async manageBundle(params: { bundleId: string; action: 'start' | 'stop' | 'update' | 'refresh' }): Promise<object> {
    return safeExecute<object>(async () => {
      const { bundleId, action } = params;
      // Felix Console endpoints use the exact bundle symbolic name or ID
      const endpoint = `/system/console/bundles/${bundleId}`;
      const body = new URLSearchParams();
      body.append('action', action);
      
      // POST to /system/console/bundles/&lt;id&gt; with action=start|stop
      await this.fetch.post(endpoint, body);
      
      return createSuccessResponse({ bundleId, action }, 'manageBundle');
    }, 'manageBundle');
  }
}
