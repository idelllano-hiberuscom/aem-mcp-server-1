import { AEMFetch } from './aem.fetch.js';
import { createSuccessResponse, safeExecute, createAEMError, AEM_ERROR_CODES } from './aem.errors.js';
import { LOGGER } from '../utils/logger.js';

export class WorkflowManager {
  private readonly fetch: AEMFetch;

  constructor(fetch: AEMFetch) {
    this.fetch = fetch;
  }

  /**
   * Get available workflow models
   * GET /libs/cq/workflow/admin/console/content/models.json
   */
  async listWorkflowModels(): Promise<object> {
    return safeExecute<object>(async () => {
      // Use the internal console component to get all workflow models
      const modelsData = await this.fetch.get('/libs/cq/workflow/admin/console/content/models.json');
      
      const models = modelsData?.items || modelsData || [];
      
      // Extract popular workflow models if the returned format doesn't have good descriptions
      const commonWorkflows: Record<string, string> = {
        'request_for_activation': 'Request for Activation (Publish)',
        'request_for_deactivation': 'Request for Deactivation (Unpublish)',
        'request_for_deletion': 'Request for Deletion',
        'dam/update_asset': 'DAM Update Asset (usually runs automatically)',
        'wcm-translation-create': 'Create Translation',
        'msm_rollout': 'MSM Rollout'
      };

      const enrichedModels = models.map((model: any) => {
        // AEM 6.5 / AEMaaCS typically returns id as the path (e.g. /var/workflow/models/request_for_activation)
        // or name. We'll try to extract the base name.
        const modelId = model.id ? model.id.split('/').pop() : model.name;
        const uri = model.id || `/var/workflow/models/${modelId}`;
        const description = commonWorkflows[modelId as keyof typeof commonWorkflows] || 'Custom workflow model';
        
        return {
          uri,
          modelId,
          description,
          ...model
        };
      });

      return createSuccessResponse({
        models: enrichedModels,
        totalCount: enrichedModels.length,
        commonWorkflows: Object.entries(commonWorkflows).map(([id, desc]) => ({
          modelId: id,
          uri: `/var/workflow/models/${id}`,
          description: desc
        }))
      }, 'listWorkflowModels');
    }, 'listWorkflowModels');
  }

  /**
   * Start a workflow instance
   * POST /etc/workflow/instances
   */
  async startWorkflow(modelId: string, payload: string, payloadType: string = 'JCR_PATH'): Promise<object> {
    return safeExecute<object>(async () => {
      const modelUri = modelId.startsWith('/var/workflow/models/') 
        ? modelId 
        : `/var/workflow/models/${modelId}`;

      const formData = new URLSearchParams();
      formData.append('model', modelUri);
      formData.append('payloadType', payloadType);
      formData.append('payload', payload);

      const response = await this.fetch.postWithHeaders('/etc/workflow/instances', formData, {
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok && response.status !== 201) {
        const errorText = await response.text();
        throw createAEMError(AEM_ERROR_CODES.INVALID_PARAMETERS, 
          `Failed to start workflow: ${response.status} - ${errorText}`);
      }

      let instancePath = null;
      let instanceId = null;
      const location = response.headers.get('Location');
      if (location) {
        instancePath = location;
        instanceId = location.split('/').pop();
      }

      return createSuccessResponse({
        success: true,
        modelId,
        payload,
        instancePath,
        instanceId,
        message: 'Workflow started successfully'
      }, 'startWorkflow');
    }, 'startWorkflow');
  }

  /**
   * List active workflow instances
   * GET /libs/cq/workflow/admin/console/content/instances.json
   */
  async listWorkflowInstances(state?: string): Promise<object> {
    return safeExecute<object>(async () => {
      let endpoint = '/libs/cq/workflow/admin/console/content/instances.json';
      
      if (state) {
        endpoint += `?state=${encodeURIComponent(state)}`;
      }

      const data = await this.fetch.get(endpoint);
      const instances = data?.items || data || [];

      return createSuccessResponse({
        instances,
        totalCount: Array.isArray(instances) ? instances.length : 0,
        filterState: state || 'All'
      }, 'listWorkflowInstances');
    }, 'listWorkflowInstances');
  }

  /**
   * Get a specific workflow instance
   * GET /etc/workflow/instances/{instanceId}.json
   */
  async getWorkflowInstance(instanceId: string): Promise<object> {
    return safeExecute<object>(async () => {
      const instancePath = instanceId.startsWith('/') ? instanceId : `/etc/workflow/instances/${instanceId}`;
      const data = await this.fetch.get(`${instancePath}.json`);
      
      return createSuccessResponse({
        instanceId,
        instancePath,
        details: data
      }, 'getWorkflowInstance');
    }, 'getWorkflowInstance');
  }

  /**
   * Update workflow instance state
   * POST /etc/workflow/instances/{instanceId} (state=RUNNING|SUSPENDED|ABORTED)
   */
  async updateWorkflowInstanceState(instanceId: string, state: 'RUNNING' | 'SUSPENDED' | 'ABORTED'): Promise<object> {
    return safeExecute<object>(async () => {
      const instancePath = instanceId.startsWith('/') ? instanceId : `/etc/workflow/instances/${instanceId}`;
      
      const formData = new URLSearchParams();
      formData.append('state', state);

      const response = await this.fetch.post(`${instancePath}`, formData, {
        headers: {
          'Accept': 'application/json'
        }
      });
      
      return createSuccessResponse({
        instanceId,
        instancePath,
        newState: state,
        success: true,
        message: `Workflow state changed to ${state}`
      }, 'updateWorkflowInstanceState');
    }, 'updateWorkflowInstanceState');
  }

  /**
   * Get workflow inbox items
   * GET /bin/workflow/inbox.json
   */
  async getInboxItems(): Promise<object> {
    return safeExecute<object>(async () => {
      const data = await this.fetch.get('/bin/workflow/inbox.json');
      const items = data?.items || data || [];
      
      return createSuccessResponse({
        items,
        totalCount: Array.isArray(items) ? items.length : 0,
        timestamp: new Date().toISOString()
      }, 'getInboxItems');
    }, 'getInboxItems');
  }

  /**
   * Complete or advance a work item
   * POST /bin/workflow/inbox
   */
  async completeWorkItem(workItemPath: string, routeId?: string, comment?: string): Promise<object> {
    return safeExecute<object>(async () => {
      let selectedRouteId: string = routeId || '';
      
      if (!selectedRouteId) {
        const routesData = await this.fetch.get(`${workItemPath}.routes.json`);
        const routes = routesData?.routes || [];
        
        if (routes.length === 0) {
          throw createAEMError(AEM_ERROR_CODES.INVALID_PARAMETERS, 'No routes available for this work item');
        }
        
        const firstRoute = routes[0];
        if (!firstRoute?.rid) {
          throw createAEMError(AEM_ERROR_CODES.INVALID_PARAMETERS, 'No valid route ID found');
        }
        selectedRouteId = firstRoute.rid;
      }

      const formData = new URLSearchParams();
      formData.append('item', workItemPath);
      formData.append('route', selectedRouteId);
      
      if (comment) {
        formData.append('comment', comment);
      }

      await this.fetch.post('/bin/workflow/inbox', formData, {
        headers: { 'Accept': 'application/json' }
      });

      return createSuccessResponse({
        workItemPath,
        routeId: selectedRouteId,
        comment,
        message: 'Work item completed successfully'
      }, 'completeWorkItem');
    }, 'completeWorkItem');
  }

  /**
   * Delegate a work item
   * POST /bin/workflow/inbox
   */
  async delegateWorkItem(workItemPath: string, delegatee: string): Promise<object> {
    return safeExecute<object>(async () => {
      const formData = new URLSearchParams();
      formData.append('item', workItemPath);
      formData.append('delegatee', delegatee);

      await this.fetch.post('/bin/workflow/inbox', formData, {
        headers: { 'Accept': 'application/json' }
      });

      return createSuccessResponse({
        workItemPath,
        delegatee,
        message: `Work item delegated to ${delegatee}`
      }, 'delegateWorkItem');
    }, 'delegateWorkItem');
  }

  /**
   * Get available routes for a work item
   * GET {workItemPath}.routes.json
   */
  async getWorkItemRoutes(workItemPath: string): Promise<object> {
    return safeExecute<object>(async () => {
      const data = await this.fetch.get(`${workItemPath}.routes.json`);
      const routes = data?.routes || [];
      
      return createSuccessResponse({
        workItemPath,
        routes,
        totalCount: routes.length,
        timestamp: new Date().toISOString()
      }, 'getWorkItemRoutes');
    }, 'getWorkItemRoutes');
  }
}
