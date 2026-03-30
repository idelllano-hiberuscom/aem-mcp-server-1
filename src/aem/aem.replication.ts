import { AEMFetch } from './aem.fetch.js';
import { createSuccessResponse, safeExecute } from './aem.errors.js';

export class ReplicationManager {
  private readonly fetch: AEMFetch;

  constructor(fetch: AEMFetch) {
    this.fetch = fetch;
  }

  async manageReplication(params: { path: string; action: 'Activate' | 'Deactivate' | 'TreeActivate' }): Promise<object> {
    return safeExecute<object>(async () => {
      const { path, action } = params;

      // URL parameters required by AEM's replicate.json
      const body = new URLSearchParams();
      body.append('path', path);

      // 'TreeActivate' maps to a different command or standard Activate with extra params
      if (action === 'TreeActivate') {
        body.append('cmd', 'Activate');
        // This parameter triggers replication for all subnodes (used by Tree Activation)
        body.append('force', 'true'); // Not strictly standard for all versions, but some use it
        // AEM often uses a different servlet for full tree, e.g. /etc/replication/treeactivation.html
        // We will stick to standard Activate, but for real Tree Activation you'd use the treeactivation agent.
        // Let's keep it robust for generic standard replication:
      } else {
        body.append('cmd', action);
      }

      let endpoint = '/bin/replicate.json';
      
      if (action === 'TreeActivate') {
         endpoint = '/etc/replication/treeactivation.html';
         // The treeactivation.html servlet uses 'cmd', 'path' and 'ignoredeactivated'
         body.set('cmd', 'activate'); 
      }

      await this.fetch.post(endpoint, body);
      return createSuccessResponse({ path, action }, 'manageReplication');
    }, 'manageReplication');
  }
}
