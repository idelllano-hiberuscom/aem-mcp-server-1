import { AEMConnector } from '../aem/aem.connector.js';
import { CliParams } from '../types.js';
import { handleAEMHttpError } from '../aem/aem.errors.js';
import { toolSchemas, ToolName } from './mcp.tools.js';
import { LOGGER } from '../utils/logger.js';

export class MCPRequestHandler {
  aemConnector: AEMConnector;
  config: CliParams;

  constructor(config: CliParams) {
    this.config = config;
    this.aemConnector = new AEMConnector(config);
  }

  async init() {
    if (!this.aemConnector.isInitialized) {
      await this.aemConnector.init();
      LOGGER.log('AEM Connector initialized.');
    } else {
      LOGGER.log('AEM Connector already initialized.');
    }
  }

  async handleRequest(method: string, params: any) {
    // Validate input against Zod schema (also handles unknown tool names gracefully)
    const schema = toolSchemas[method as ToolName];
    if (schema) {
      const result = schema.safeParse(params);
      if (!result.success) {
        throw new Error(`Invalid input for ${method}: ${result.error.issues.map((i: any) => `${i.path.join('.')}: ${i.message}`).join(', ')}`);
      }
      params = result.data;
    }

    try {
      await this.init();
    } catch (error: any) {
      LOGGER.error('ERROR initializing MCP Server', error.message);
      throw handleAEMHttpError(error, 'MCP Server Initialization');
    }
    try {
      switch (method) {
        case 'updateComponent':
          return await this.aemConnector.updateComponent(params);
        case 'scanPageComponents':
          return await this.aemConnector.scanPageComponents(params.pagePath, params.verbosity);
        case 'fetchSites':
          return await this.aemConnector.fetchSites();
        case 'fetchLanguageMasters':
          return await this.aemConnector.fetchLanguageMasters(params.site);
        case 'fetchAvailableLocales':
          return await this.aemConnector.fetchAvailableLocales(params.site);
        case 'getAllTextContent':
          return await this.aemConnector.getAllTextContent(params.pagePath);
        case 'getPageTextContent':
          return await this.aemConnector.getPageTextContent(params.pagePath);
        case 'getPageImages':
          return await this.aemConnector.getPageImages(params.pagePath);
        case 'updateImagePath':
          return await this.aemConnector.updateImagePath(params.componentPath, params.newImagePath);
        case 'getPageContent':
          return await this.aemConnector.getPageContent(params.pagePath, params.verbosity);
        case 'listPages':
          return await this.aemConnector.listPages(params.siteRoot || params.path || '/content', params.depth || 1, params.limit || 20);
        case 'getNodeContent':
          return await this.aemConnector.getNodeContent(params.path, params.depth || 1, params.verbosity);
        case 'listChildren':
          return await this.aemConnector.listChildren(params.path);
        case 'getPageProperties':
          return await this.aemConnector.getPageProperties(params.pagePath);
        case 'searchContent':
          return await this.aemConnector.searchContent(params);
        case 'executeJCRQuery':
          return await this.aemConnector.executeJCRQuery(params.query, params.limit);
        case 'getAssetMetadata':
          return await this.aemConnector.getAssetMetadata(params.assetPath);
        case 'enhancedPageSearch':
          return await this.aemConnector.searchContent({
            fulltext: params.searchTerm,
            path: params.basePath,
            type: 'cq:Page',
            limit: 20
          });
        case 'createPage':
          return await this.aemConnector.createPage(params);
        case 'deletePage':
          return await this.aemConnector.deletePage(params);
        case 'createComponent':
          return await this.aemConnector.createComponent(params);
        case 'addComponent':
          return await this.aemConnector.addComponent(params);
        case 'deleteComponent':
          return await this.aemConnector.deleteComponent(params);
        case 'unpublishContent':
          return await this.aemConnector.unpublishContent(params);
        case 'activatePage':
          return await this.aemConnector.activatePage(params);
        case 'deactivatePage':
          return await this.aemConnector.deactivatePage(params);
        case 'updateAsset':
          return await this.aemConnector.updateAsset(params);
        case 'deleteAsset':
          return await this.aemConnector.deleteAsset(params);
        case 'getTemplates':
          return await this.aemConnector.getTemplates(params.sitePath);
        case 'getTemplateStructure':
          return await this.aemConnector.getTemplateStructure(params.templatePath);
        case 'getComponents':
          return await this.aemConnector.getComponents(params.path);
        case 'bulkUpdateComponents':
          return await this.aemConnector.bulkUpdateComponents(params);
        case 'convertComponents':
          return await this.aemConnector.convertComponents(params);
        case 'bulkConvertComponents':
          return await this.aemConnector.bulkConvertComponents(params);
        case 'listWorkflowModels':
          return await this.aemConnector.workflows.listWorkflowModels();
        case 'startWorkflow':
          return await this.aemConnector.workflows.startWorkflow(params.modelId, params.payload, params.payloadType);
        case 'listWorkflowInstances':
          return await this.aemConnector.workflows.listWorkflowInstances(params.state);
        case 'getWorkflowInstance':
          return await this.aemConnector.workflows.getWorkflowInstance(params.instanceId);
        case 'updateWorkflowInstanceState':
          return await this.aemConnector.workflows.updateWorkflowInstanceState(params.instanceId, params.state);
        case 'getInboxItems':
          return await this.aemConnector.workflows.getInboxItems();
        case 'completeWorkItem':
          return await this.aemConnector.workflows.completeWorkItem(params.workItemPath, params.routeId, params.comment);
        case 'delegateWorkItem':
          return await this.aemConnector.workflows.delegateWorkItem(params.workItemPath, params.delegatee);
        case 'getWorkItemRoutes':
          return await this.aemConnector.workflows.getWorkItemRoutes(params.workItemPath);
        case 'getContentFragment':
          return await this.aemConnector.getContentFragment(params.path);
        case 'listContentFragments':
          return await this.aemConnector.listContentFragments(params);
        case 'manageContentFragment':
          return await this.aemConnector.manageContentFragment(params);
        case 'manageContentFragmentVariation':
          return await this.aemConnector.manageContentFragmentVariation(params);
        case 'getExperienceFragment':
          return await this.aemConnector.getExperienceFragment(params.path);
        case 'listExperienceFragments':
          return await this.aemConnector.listExperienceFragments(params);
        case 'manageExperienceFragment':
          return await this.aemConnector.manageExperienceFragment(params);
        case 'manageExperienceFragmentVariation':
          return await this.aemConnector.manageExperienceFragmentVariation(params);
        case 'listPackages':
          return await this.aemConnector.crxPackages.listPackages();
        case 'createAndDownloadPackage':
          return await this.aemConnector.crxPackages.createAndDownloadPackage(params);
        case 'uploadAndInstallPackage':
          return await this.aemConnector.crxPackages.uploadAndInstallPackage(params);
        case 'runGraphQLQuery':
          return await this.aemConnector.graphql.runGraphQLQuery(params);
        case 'rolloutPage':
          return await this.aemConnector.msm.rolloutPage(params);
        case 'getLiveCopyStatus':
          return await this.aemConnector.msm.getLiveCopyStatus(params.path);
        case 'listTags':
          return await this.aemConnector.tags.listTags(params.namespace, params.depth);
        case 'createTag':
          return await this.aemConnector.tags.createTag(params);
        case 'updateTag':
          return await this.aemConnector.tags.updateTag(params);
        case 'deleteTag':
          return await this.aemConnector.tags.deleteTag(params.tagPath);
        case 'setTags':
          return await this.aemConnector.tags.setTags(params);
        case 'manageReplication':
          return await this.aemConnector.replication.manageReplication(params);
        case 'flushCache':
          return await this.aemConnector.dispatcher.flushCache(params);
        case 'runQueryBuilder':
          return await this.aemConnector.queryBuilder.runQuery(params.queryParams);
        case 'listBundles':
          return await this.aemConnector.osgi.listBundles();
        case 'manageBundle':
          return await this.aemConnector.osgi.manageBundle(params);
        case 'listAuthorizables':
          return await this.aemConnector.users.listAuthorizables(params.type, params.limit);
        case 'createUser':
          return await this.aemConnector.users.createUser(params);
        case 'createGroup':
          return await this.aemConnector.users.createGroup(params);
        case 'addMemberToGroup':
          return await this.aemConnector.users.addMemberToGroup(params);
        case 'removeMemberFromGroup':
          return await this.aemConnector.users.removeMemberFromGroup(params);
        case 'changePassword':
          return await this.aemConnector.users.changePassword(params);
        case 'deleteAuthorizable':
          return await this.aemConnector.users.deleteAuthorizable(params);
        case 'tailLogs':
          return await this.aemConnector.logs.tailLogs(params);
        case 'setAcl':
          return await this.aemConnector.acls.setAcl(params);
        case 'getAcl':
          return await this.aemConnector.acls.getAcl(params);
        case 'removeAcl':
          return await this.aemConnector.acls.removeAcl(params);
        case 'readAemFile':
          return await this.aemConnector.files.readAemFile(params.path);
        case 'writeAemFile':
          return await this.aemConnector.files.writeAemFile(params);
        default:
          throw new Error(`Unknown method: ${method}`);
      }
    } catch (error: any) {
      LOGGER.error(`Error in tool ${method}:`, error.message);
      throw error;
    }
  }
}
