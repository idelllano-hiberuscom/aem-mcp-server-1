import { AEMFetch } from './aem.fetch.js';
import { createSuccessResponse, safeExecute, createAEMError, AEM_ERROR_CODES } from './aem.errors.js';

export class MSMManager {
  private readonly fetch: AEMFetch;

  constructor(fetch: AEMFetch) {
    this.fetch = fetch;
  }

  async rolloutPage(request: any): Promise<object> {
    return safeExecute<object>(async () => {
      const { blueprintPath, targetPaths, deep = false } = request;

      const formData = new URLSearchParams();
      formData.append('cmd', 'rollout');
      formData.append('path', blueprintPath);
      
      if (targetPaths && targetPaths.length > 0) {
        targetPaths.forEach((tp: string) => formData.append('msm:targetPath', tp));
      }
      
      if (deep) {
        formData.append('msm:isDeep', 'true');
      }
      
      formData.append('_charset_', 'utf-8');

      const response = await this.fetch.post('/bin/wcmcommand', formData);
      
      return createSuccessResponse({
        success: true,
        blueprintPath,
        targetPaths,
        deep,
        message: 'Rollout triggered successfully'
      }, 'rolloutPage');
    }, 'rolloutPage');
  }

  async getLiveCopyStatus(path: string): Promise<object> {
    return safeExecute<object>(async () => {
      // Fetch jcr:content with depth 2 to ensure we get cq:LiveSyncConfig which is a child node
      const nodeData = await this.fetch.get(`${path}/jcr:content.2.json`);
      
      if (!nodeData) {
        throw createAEMError(AEM_ERROR_CODES.SYSTEM_ERROR, `Node not found at ${path}/jcr:content`);
      }

      // Live sync configuration is typically stored in the cq:LiveSyncConfig node
      const syncConfig = nodeData['cq:LiveSyncConfig'];
      
      // Some properties are directly on jcr:content
      const isLiveCopy = syncConfig !== undefined || nodeData['cq:LiveRelationship'] !== undefined;
      const blueprint = syncConfig?.['cq:master'] || 'Inherited from parent boundary or not a LiveCopy';
      const isCancelled = nodeData['cq:isCancelledForChildren'] === true || syncConfig?.['cq:isCancelledForChildren'] === true;
      const lastRolledOut = nodeData['cq:lastRolledout'];
      const lastRolledOutBy = nodeData['cq:lastRolledoutBy'];

      return createSuccessResponse({
        path,
        isLiveCopy,
        blueprint,
        status: {
          isCancelled,
          lastRolledOut,
          lastRolledOutBy
        },
        rawSyncConfig: syncConfig || null
      }, 'getLiveCopyStatus');
    }, 'getLiveCopyStatus');
  }
}
