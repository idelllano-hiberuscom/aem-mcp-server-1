import { AEMFetch } from './aem.fetch.js';
import { createSuccessResponse, safeExecute } from './aem.errors.js';

export class AclManager {
  private readonly fetch: AEMFetch;

  constructor(fetch: AEMFetch) {
    this.fetch = fetch;
  }

  /**
   * Modifies/Sets an Access Control Entry (ACE) for a principal on a specific path
   */
  async setAcl(params: { path: string; principalId: string; privileges: Record<string, 'granted' | 'denied'> }): Promise<object> {
    return safeExecute<object>(async () => {
      const endpoint = `${params.path}.modifyAce.html`;
      
      const body = new URLSearchParams();
      body.append('principalId', params.principalId);
      
      // Convert privileges to Sling Jackrabbit AccessManager format
      for (const [privilege, action] of Object.entries(params.privileges)) {
          body.append(`privilege@${privilege}`, action);
      }
      
      // Use true for isHtml because this endpoint returns an HTML status page, not JSON
      await this.fetch.post(endpoint, body, {}, undefined, true);
      
      return createSuccessResponse({
        path: params.path,
        principalId: params.principalId,
        privilegesSet: params.privileges,
        status: 'updated'
      }, 'setAcl');
    }, 'setAcl');
  }

  /**
   * Retrieves the Access Control List for a specific path
   */
  async getAcl(params: { path: string; effective?: boolean }): Promise<object> {
    return safeExecute<object>(async () => {
      // .eacl.json gets the Effective ACLs, .acl.json gets only the locally bound ACLs
      const selector = params.effective ? 'eacl' : 'acl';
      const endpoint = `${params.path}.${selector}.json`;
      
      const data = await this.fetch.get(endpoint);
      
      return createSuccessResponse({
        path: params.path,
        effective: !!params.effective,
        acl: data
      }, 'getAcl');
    }, 'getAcl');
  }

  /**
   * Removes an Access Control Entry (ACE) for a principal from a specific path
   */
  async removeAcl(params: { path: string; principalId: string }): Promise<object> {
    return safeExecute<object>(async () => {
      const endpoint = `${params.path}.deleteAce.html`;
      
      const body = new URLSearchParams();
      body.append(':applyTo', params.principalId);
      
      // Use true for isHtml because this endpoint returns an HTML status page, not JSON
      await this.fetch.post(endpoint, body, {}, undefined, true);
      
      return createSuccessResponse({
        path: params.path,
        principalId: params.principalId,
        status: 'removed'
      }, 'removeAcl');
    }, 'removeAcl');
  }
}
