import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

type ToolDefinition = {
  name: string;
  description: string;
  inputSchema: object;
};

// ─── Shared Fields ────────────────────────────────────
const verbosityField = z.enum(['summary', 'standard', 'full']).default('standard').optional()
  .describe('Response detail level: summary (paths/names only), standard (default, minus JCR internals), full (everything)');

// ─── Content & Text ───────────────────────────────────
const contentSchemas = {
  getAllTextContent: z.object({
    pagePath: z.string().describe('Path to the page'),
  }).passthrough(),
  getPageTextContent: z.object({
    pagePath: z.string().describe('Path to the page'),
  }).passthrough(),
  getPageImages: z.object({
    pagePath: z.string().describe('Path to the page'),
  }).passthrough(),
  updateImagePath: z.object({
    componentPath: z.string().describe('Path to the image component'),
    newImagePath: z.string().describe('New image path'),
  }).passthrough(),
  getPageContent: z.object({
    pagePath: z.string().describe('Path to the page'),
    verbosity: verbosityField,
  }).passthrough(),
  getNodeContent: z.object({
    path: z.string().describe('JCR node path'),
    depth: z.number().optional().describe('Depth to traverse'),
    verbosity: verbosityField,
  }).passthrough(),
  listChildren: z.object({
    path: z.string().describe('Parent node path'),
    verbosity: verbosityField,
  }).passthrough(),
  getPageProperties: z.object({
    pagePath: z.string().describe('Path to the page'),
  }).passthrough(),
};

// ─── Sites & Locales ──────────────────────────────────
const siteSchemas = {
  fetchSites: z.object({}).passthrough(),
  fetchLanguageMasters: z.object({
    site: z.string().describe('Site name'),
  }).passthrough(),
  fetchAvailableLocales: z.object({
    site: z.string().describe('Site name'),
  }).passthrough(),
};

// ─── Pages ────────────────────────────────────────────
const pageSchemas = {
  listPages: z.object({
    siteRoot: z.string().optional().describe('Site root path'),
    depth: z.number().optional().describe('Depth to traverse'),
    limit: z.number().optional().describe('Maximum number of results'),
    verbosity: verbosityField,
  }).passthrough(),
  createPage: z.object({
    parentPath: z.string().describe('Parent path'),
    title: z.string().describe('Page title'),
    template: z.string().describe('Template path'),
    resourceType: z.string().optional().describe('Optional: Will be extracted from template if not provided'),
    name: z.string().optional().describe('Page name'),
    properties: z.record(z.unknown()).optional().describe('Additional properties'),
  }).passthrough(),
  deletePage: z.object({
    pagePath: z.string().describe('Path to the page to delete'),
    force: z.boolean().optional().describe('Force deletion'),
  }).passthrough(),
  activatePage: z.object({
    pagePath: z.string().describe('Path to the page'),
    activateTree: z.boolean().optional().describe('Activate entire tree'),
  }).passthrough(),
  deactivatePage: z.object({
    pagePath: z.string().describe('Path to the page'),
    deactivateTree: z.boolean().optional().describe('Deactivate entire tree'),
  }).passthrough(),
  unpublishContent: z.object({
    contentPaths: z.array(z.string()).describe('Paths to unpublish'),
    unpublishTree: z.boolean().optional().describe('Unpublish tree'),
  }).passthrough(),
};

// ─── Components ───────────────────────────────────────
const componentSchemas = {
  updateComponent: z.object({
    componentPath: z.string().describe('Path to the component'),
    properties: z.record(z.unknown()).describe('Properties to update'),
  }).passthrough(),
  scanPageComponents: z.object({
    pagePath: z.string().describe('Path to the page to scan'),
    verbosity: verbosityField,
  }).passthrough(),
  createComponent: z.object({
    pagePath: z.string().describe('Path to the page'),
    componentType: z.string().describe('Component type'),
    resourceType: z.string().describe('Resource type'),
    properties: z.record(z.unknown()).optional().describe('Component properties'),
    name: z.string().optional().describe('Component name'),
  }).passthrough(),
  addComponent: z.object({
    pagePath: z.string().describe('Path to the existing page (e.g., /content/site/en/page)'),
    resourceType: z.string().describe('Sling resource type of the component (required)'),
    containerPath: z.string().optional().describe('Optional: specific container path (defaults to root/container)'),
    name: z.string().optional().describe('Optional: component node name (auto-generated if not provided)'),
    properties: z.record(z.unknown()).optional().describe('Optional: component properties to set'),
  }).passthrough(),
  deleteComponent: z.object({
    componentPath: z.string().describe('Path to the component to delete'),
    force: z.boolean().optional().describe('Force deletion'),
  }).passthrough(),
  getComponents: z.object({
    path: z.string().optional().describe('Optional: Component root path to fetch components from. If not provided, uses the configured default path.'),
    verbosity: verbosityField,
  }).passthrough(),
  bulkUpdateComponents: z.object({
    updates: z.array(z.object({
      componentPath: z.string(),
      properties: z.record(z.unknown()),
    })).describe('Array of component updates'),
    validateFirst: z.boolean().optional().describe('Validate before updating'),
    continueOnError: z.boolean().optional().describe('Continue on individual failures'),
  }).passthrough(),
  convertComponents: z.object({
    pagePath: z.string().describe('Path to the page containing components to convert'),
    sourceResourceType: z.string().describe('The resource type to search for and convert'),
    targetResourceType: z.string().describe('The resource type to convert to'),
    requiredProperties: z.record(z.unknown()).optional().describe('Optional: Required property values for the target component'),
    continueOnError: z.boolean().optional().describe('Optional: Continue converting even if some fail (default: true)'),
  }).passthrough(),
  bulkConvertComponents: z.object({
    pagePaths: z.array(z.string()).optional().describe('Array of page paths to process'),
    searchPath: z.string().optional().describe('Optional: Base path to search for pages'),
    depth: z.number().optional().describe('Optional: Depth to search when using searchPath (default: 2)'),
    limit: z.number().optional().describe('Optional: Maximum number of pages to process (default: 50)'),
    sourceResourceType: z.string().describe('The resource type to search for and convert'),
    targetResourceType: z.string().describe('The resource type to convert to'),
    requiredProperties: z.record(z.unknown()).optional().describe('Optional: Required property values for the target component'),
    continueOnError: z.boolean().optional().describe('Optional: Continue processing pages even if some fail (default: true)'),
  }).passthrough(),
};

// ─── Assets ───────────────────────────────────────────
const assetSchemas = {
  getAssetMetadata: z.object({
    assetPath: z.string().describe('Path to the asset'),
  }).passthrough(),
  updateAsset: z.object({
    assetPath: z.string().describe('Path to the asset'),
    metadata: z.record(z.unknown()).optional().describe('Metadata to update'),
    fileContent: z.string().optional().describe('File content'),
    mimeType: z.string().optional().describe('MIME type'),
  }).passthrough(),
  deleteAsset: z.object({
    assetPath: z.string().describe('Path to the asset to delete'),
    force: z.boolean().optional().describe('Force deletion'),
  }).passthrough(),
};

// ─── Search ───────────────────────────────────────────
const searchSchemas = {
  searchContent: z.object({
    type: z.string().optional().describe('Content type'),
    fulltext: z.string().optional().describe('Fulltext search term'),
    path: z.string().optional().describe('Search path'),
    limit: z.number().optional().describe('Maximum number of results'),
  }).passthrough(),
  executeJCRQuery: z.object({
    query: z.string().describe('JCR query'),
    limit: z.number().optional().describe('Maximum number of results'),
  }).passthrough(),
  enhancedPageSearch: z.object({
    searchTerm: z.string().describe('Search term'),
    basePath: z.string().describe('Base path for search'),
    includeAlternateLocales: z.boolean().optional().describe('Include alternate locales'),
  }).passthrough(),
};

// ─── Templates ────────────────────────────────────────
const templateSchemas = {
  getTemplates: z.object({
    sitePath: z.string().optional().describe('Site path'),
  }).passthrough(),
  getTemplateStructure: z.object({
    templatePath: z.string().describe('Template path'),
  }).passthrough(),
};

// ─── Workflows ────────────────────────────────────────
const workflowSchemas = {
  listWorkflowModels: z.object({}).passthrough(),
  startWorkflow: z.object({
    modelId: z.string().describe('Workflow model ID (e.g., "request_for_activation")'),
    payload: z.string().describe('JCR path or URL to process'),
    payloadType: z.string().optional().describe('Type of payload (default: "JCR_PATH")'),
  }).passthrough(),
  listWorkflowInstances: z.object({
    state: z.string().optional().describe('Optional: Filter by state (RUNNING, SUSPENDED, ABORTED, COMPLETED)'),
  }).passthrough(),
  getWorkflowInstance: z.object({
    instanceId: z.string().describe('Workflow instance ID or full path'),
  }).passthrough(),
  updateWorkflowInstanceState: z.object({
    instanceId: z.string().describe('Workflow instance ID or full path'),
    state: z.enum(['RUNNING', 'SUSPENDED', 'ABORTED']).describe('New state for the workflow instance'),
  }).passthrough(),
  getInboxItems: z.object({}).passthrough(),
  completeWorkItem: z.object({
    workItemPath: z.string().describe('Path to the work item'),
    routeId: z.string().optional().describe('Optional: Route ID to advance to'),
    comment: z.string().optional().describe('Optional: Comment for the completion'),
  }).passthrough(),
  delegateWorkItem: z.object({
    workItemPath: z.string().describe('Path to the work item'),
    delegatee: z.string().describe('User or group to delegate to'),
  }).passthrough(),
  getWorkItemRoutes: z.object({
    workItemPath: z.string().describe('Path to the work item'),
  }).passthrough(),
};

// ─── Content Fragments ────────────────────────────────
const contentFragmentSchemas = {
  getContentFragment: z.object({
    path: z.string().describe('Path to the content fragment in DAM (e.g., /content/dam/site/cf/my-article)'),
  }).passthrough(),
  listContentFragments: z.object({
    path: z.string().describe('Parent path to search under (e.g., /content/dam/site/cf)'),
    model: z.string().optional().describe('Filter by CF model path'),
    limit: z.number().optional().describe('Max results (default: 20)'),
    offset: z.number().optional().describe('Pagination offset (default: 0)'),
  }).passthrough(),
  manageContentFragment: z.object({
    action: z.enum(['create', 'update', 'delete']).describe('Action to perform'),
    fragmentPath: z.string().optional().describe('Path to existing CF (required for update/delete)'),
    parentPath: z.string().optional().describe('Parent folder in DAM (required for create)'),
    title: z.string().optional().describe('Fragment title (required for create)'),
    name: z.string().optional().describe('Node name (auto-generated from title if omitted)'),
    model: z.string().optional().describe('CF model path (required for create)'),
    fields: z.record(z.unknown()).optional().describe('Field values as { fieldName: value }'),
    description: z.string().optional().describe('Fragment description'),
    force: z.boolean().optional().describe('Force delete even if referenced'),
  }).passthrough(),
  manageContentFragmentVariation: z.object({
    action: z.enum(['create', 'update', 'delete']).describe('Action to perform'),
    fragmentPath: z.string().describe('Path to the parent content fragment'),
    variationName: z.string().describe('Variation identifier'),
    title: z.string().optional().describe('Variation title (required for create)'),
    fields: z.record(z.unknown()).optional().describe('Field overrides as { fieldName: value }'),
  }).passthrough(),
};

// ─── Experience Fragments ─────────────────────────────
const experienceFragmentSchemas = {
  getExperienceFragment: z.object({
    path: z.string().describe('Path to the experience fragment page'),
  }).passthrough(),
  listExperienceFragments: z.object({
    path: z.string().optional().describe('Root path (default: /content/experience-fragments)'),
    template: z.string().optional().describe('Filter by template path'),
    limit: z.number().optional().describe('Max results (default: 20)'),
    offset: z.number().optional().describe('Pagination offset (default: 0)'),
  }).passthrough(),
  manageExperienceFragment: z.object({
    action: z.enum(['create', 'update', 'delete']).describe('Action to perform'),
    xfPath: z.string().optional().describe('Existing XF path (required for update/delete)'),
    parentPath: z.string().optional().describe('Parent path for new XF (required for create)'),
    name: z.string().optional().describe('Node name (auto-generated from title if omitted)'),
    title: z.string().optional().describe('XF title (required for create)'),
    template: z.string().optional().describe('XF template path (required for create)'),
    description: z.string().optional().describe('XF description'),
    tags: z.array(z.string()).optional().describe('Tags to apply'),
    force: z.boolean().optional().describe('Force delete even if referenced'),
  }).passthrough(),
  manageExperienceFragmentVariation: z.object({
    action: z.enum(['create', 'update', 'delete']).describe('Action to perform'),
    xfPath: z.string().describe('Parent experience fragment path'),
    variationName: z.string().describe('Variation identifier'),
    variationType: z.enum(['web', 'email', 'social', 'custom']).optional().describe('Variation type (default: web)'),
    title: z.string().optional().describe('Variation title (required for create)'),
    template: z.string().optional().describe('Template for the variation'),
    force: z.boolean().optional().describe('Force deletion'),
  }).passthrough(),
};

// ─── CRX Package Schemas ──────────────────────────────
const crxPackageSchemas = {
  listPackages: z.object({}).passthrough(),
  createAndDownloadPackage: z.object({
    groupName: z.string().describe('Package group (e.g. "my_packages")'),
    packageName: z.string().describe('Package name'),
    version: z.string().describe('Package version (e.g. "1.0.0")'),
    filters: z.array(z.object({
      root: z.string().describe('Root path for the filter (e.g., /content/mysite)'),
      rules: z.array(z.object({
        modifier: z.enum(['include', 'exclude']),
        pattern: z.string().describe('Regex pattern for the rule (e.g., /content/mysite/us/.*)')
      })).optional().describe('Optional list of rules for inclusion or exclusion')
    })).describe('List of JCR filters configuring what goes into the package.'),
    localSaveDirectory: z.string().optional().describe('Local absolute directory path to save the .zip file. Defaults to current working directory.')
  }).passthrough(),
  uploadAndInstallPackage: z.object({
    localFilePath: z.string().describe('Absolute local path to the .zip file to upload and install'),
    force: z.boolean().optional().describe('Force installation even if package exists')
  }).passthrough(),
};

// ─── GraphQL Schemas ──────────────────────────────────
const graphqlSchemas = {
  runGraphQLQuery: z.object({
    query: z.string().describe('The GraphQL query string to execute'),
    variables: z.record(z.any()).optional().describe('Optional variables object for the GraphQL query'),
    endpoint: z.string().optional().describe('The GraphQL endpoint to use. Defaults to /graphql/execute.json')
  }).passthrough()
};

// ─── MSM (LiveCopy) Schemas ───────────────────────────
const msmSchemas = {
  rolloutPage: z.object({
    blueprintPath: z.string().describe('Path of the blueprint page to rollout'),
    targetPaths: z.array(z.string()).optional().describe('Specific live copy paths to update. If empty, rolls out to all.'),
    deep: z.boolean().optional().describe('Deep rollout (include children)')
  }).passthrough(),
  getLiveCopyStatus: z.object({
    path: z.string().describe('Path of the live copy page to check')
  }).passthrough()
};

// ─── Tags (Taxonomy) Schemas ─────────────────────────
const tagsSchemas = {
  listTags: z.object({
    namespace: z.string().optional().describe('Specific tag namespace (e.g. "default", "my-site"). If omitted, lists all namespaces.'),
    depth: z.number().optional().describe('Depth of tags to retrieve. Default is -1 (infinite) if a namespace is provided, or 1 if omitted.')
  }).passthrough(),
  createTag: z.object({
    tagPath: z.string().describe('Path of the tag to create (e.g. "my-project/colors/blue")'),
    title: z.string().describe('Human-readable title of the Tag'),
    description: z.string().optional().describe('Optional description for the Tag')
  }).passthrough(),
  updateTag: z.object({
    tagPath: z.string().describe('Path of the existing tag to update (e.g. "my-project/colors/blue")'),
    title: z.string().optional().describe('New human-readable title of the Tag'),
    description: z.string().optional().describe('New description for the Tag')
  }).passthrough(),
  deleteTag: z.object({
    tagPath: z.string().describe('Path of the tag to delete (e.g. "my-project/colors/blue")')
  }).passthrough(),
  setTags: z.object({
    contentPath: z.string().describe('Path to the content node to apply tags to (e.g. /content/site/en or /content/dam/image.jpg)'),
    tags: z.array(z.string()).describe('Array of Tag IDs to apply. Empty array will remove all tags.')
  }).passthrough(),
};

// ─── Replication Schemas ──────────────────────────────
const replicationSchemas = {
  manageReplication: z.object({
    path: z.string().describe('Path of the resource to replicate (e.g., /content/mysite/en)'),
    action: z.enum(['Activate', 'Deactivate', 'TreeActivate']).describe('Replication action: Activate (Publish), Deactivate (Unpublish), or TreeActivate (Publish full tree)')
  }).passthrough()
};

// ─── Dispatcher Schemas ───────────────────────────────
const dispatcherSchemas = {
  flushCache: z.object({
    path: z.string().describe('Path of the resource to flush from the Dispatcher cache (e.g., /content/mysite/en)'),
    action: z.enum(['Activate', 'Delete']).optional().describe('Cache invalidation action: Activate or Delete. Defaults to Activate.')
  }).passthrough()
};

// ─── QueryBuilder Schemas ─────────────────────────────
const queryBuilderSchemas = {
  runQueryBuilder: z.object({
    queryParams: z.record(z.string()).describe('Key-value pairs representing the QueryBuilder predicates (e.g. {"path": "/content", "type": "cq:Page", "p.limit": "10"})')
  }).passthrough()
};

// ─── OSGi Schemas ──────────────────────────────────────
const osgiSchemas = {
  listBundles: z.object({}).passthrough(),
  manageBundle: z.object({
    bundleId: z.string().describe('The symbolic name or ID of the OSGi bundle (e.g., com.adobe.cq.wcm.core)'),
    action: z.enum(['start', 'stop', 'update', 'refresh']).describe('Action to perform on the OSGi bundle.')
  }).passthrough()
};

// ─── Users & Groups Schemas ────────────────────────────
const userSchemas = {
  listAuthorizables: z.object({
    type: z.enum(['rep:User', 'rep:Group']).describe('The type of authorizable to list (users or groups)'),
    limit: z.number().optional().describe('Maximum number of items to return.')
  }).passthrough(),
  createUser: z.object({
    userId: z.string().describe('The username (authorizableId) to create.'),
    password: z.string().optional().describe('Password for the new user. If not provided, defaults to the userId.'),
    path: z.string().optional().describe('Intermediate path for the user under /home/users (e.g., "my-company").'),
    properties: z.record(z.string()).optional().describe('Additional properties to set on the user (e.g., {"profile/givenName": "John"}).')
  }).passthrough(),
  createGroup: z.object({
    groupId: z.string().describe('The group name (authorizableId) to create.'),
    path: z.string().optional().describe('Intermediate path for the group under /home/groups (e.g., "my-company").'),
    properties: z.record(z.string()).optional().describe('Additional properties to set on the group.')
  }).passthrough(),
  addMemberToGroup: z.object({
    memberId: z.string().describe('The userId or groupId to add to the group.'),
    groupId: z.string().describe('The ID of the group.')
  }).passthrough(),
  removeMemberFromGroup: z.object({
    memberId: z.string().describe('The userId or groupId to remove from the group.'),
    groupId: z.string().describe('The ID of the group.')
  }).passthrough(),
  changePassword: z.object({
    userId: z.string().describe('The user whose password will be changed.'),
    oldPassword: z.string().optional().describe('The current password (may not be required for admin).'),
    newPassword: z.string().describe('The new password.')
  }).passthrough(),
  deleteAuthorizable: z.object({
    id: z.string().describe('The ID of the user or group to delete.'),
    type: z.enum(['user', 'group']).describe('Whether we are deleting a user or a group.')
  }).passthrough()
};

// ─── Logs & ACLs Schemas ───────────────────────────────
const logSchemas = {
  tailLogs: z.object({
    lines: z.number().optional().describe('Number of lines to tail from the log file (default: 100)'),
    filter: z.string().optional().describe('Optional string to grep/filter (e.g. "ERROR", "NullPointerException")'),
    logFile: z.string().optional().describe('Log filename inside the logs folder (default: "error.log"). Common ones: error.log, access.log, request.log')
  }).passthrough()
};

const aclSchemas = {
  setAcl: z.object({
    path: z.string().describe('The JCR path where the ACL should be applied (e.g., "/content/my-site")'),
    principalId: z.string().describe('The user or group ID (e.g., "everyone", "my-editors-group")'),
    privileges: z.record(z.enum(['granted', 'denied'])).describe('Key-value pairs of privileges. E.g., {"jcr:read":"granted", "jcr:write":"denied", "jcr:all":"granted"}')
  }).passthrough(),
  getAcl: z.object({
    path: z.string().describe('The JCR path to check for ACLs'),
    effective: z.boolean().optional().describe('If true, returns the evaluated (effective) ACLs including inherited ones. If false, returns only locally bound ACEs. Default is false.')
  }).passthrough(),
  removeAcl: z.object({
    path: z.string().describe('The JCR path where the ACL should be removed'),
    principalId: z.string().describe('The user or group ID whose ACE should be removed')
  }).passthrough()
};

// ─── Files (Sightly / JS / CSS) Schemas ───────────────
const fileSchemas = {
  readAemFile: z.object({
    path: z.string().describe('The JCR path to the file (e.g., "/apps/my-site/components/title/title.html")')
  }).passthrough(),
  writeAemFile: z.object({
    path: z.string().describe('The JCR path to the file (e.g., "/apps/my-site/components/title/title.html")'),
    content: z.string().describe('The raw text content to write to the file.'),
    mimeType: z.string().optional().describe('Optional MIME type. Auto-detected from extension if not provided (e.g., text/html, application/javascript).')
  }).passthrough()
};

// ─── Combined Schemas ─────────────────────────────────
export const toolSchemas = {
  ...contentSchemas,
  ...siteSchemas,
  ...pageSchemas,
  ...componentSchemas,
  ...assetSchemas,
  ...searchSchemas,
  ...templateSchemas,
  ...workflowSchemas,
  ...contentFragmentSchemas,
  ...experienceFragmentSchemas,
  ...crxPackageSchemas,
  ...graphqlSchemas,
  ...msmSchemas,
  ...tagsSchemas,
  ...replicationSchemas,
  ...dispatcherSchemas,
  ...queryBuilderSchemas,
  ...osgiSchemas,
  ...userSchemas,
  ...logSchemas,
  ...aclSchemas,
  ...fileSchemas,
} as const;

export type ToolName = keyof typeof toolSchemas;

export const toolDescriptions: Record<ToolName, string> = {
  updateComponent: 'Update component properties in AEM',
  scanPageComponents: 'Scan a page to discover all components and their properties',
  fetchSites: 'Get all top-level AEM site roots under /content. Returns site name, path, and language root structure.',
  fetchLanguageMasters: 'Get language masters for a specific site',
  fetchAvailableLocales: 'Get available locales for a site',
  getAllTextContent: 'Get all text content from a page including titles, text components, and descriptions',
  getPageTextContent: 'Get text content from a specific page',
  getPageImages: 'Get all images from a page, including those within Experience Fragments',
  updateImagePath: 'Update the image path for an image component and verify the update',
  getPageContent: 'Get complete page content including resolved Experience Fragments and Content Fragments. Returns full content tree. For text-only extraction, use getPageTextContent. For raw JCR nodes, use getNodeContent.',
  listPages: 'List child pages directly under a path (non-recursive, structural). For finding pages by content or name, use enhancedPageSearch instead.',
  getNodeContent: 'Get raw JCR node properties at a specific path and depth. Low-level tool — use getPageContent for pages or scanPageComponents for component discovery.',
  listChildren: 'Legacy: List child nodes',
  getPageProperties: 'Get page properties',
  searchContent: 'Structured content search with filters (type, property values, path scope, fulltext). More flexible than executeJCRQuery. Use for finding nodes by property values or content type.',
  executeJCRQuery: 'Execute fulltext search on cq:Page nodes under /content. Uses QueryBuilder internally, NOT raw JCR-SQL2. For structured property-based queries, use searchContent instead.',
  getAssetMetadata: 'Get DAM asset metadata including title, description, dimensions, format, tags, and custom properties. Path must be under /content/dam.',
  enhancedPageSearch: 'Intelligent page search with comprehensive fallback strategies and cross-section search',
  createPage: 'Create a new page in AEM. The resourceType will be automatically extracted from the template structure if not provided.',
  deletePage: 'Delete a page from AEM',
  createComponent: 'Create a component at a specific JCR path (you must know the exact container path). For automatic container detection and cq:template application, use addComponent instead.',
  addComponent: 'Add a component to a page with automatic parsys/container detection and cq:template application. Preferred over createComponent for most use cases.',
  deleteComponent: 'Delete a component from AEM',
  unpublishContent: 'Unpublish content from the publish environment',
  activatePage: 'Publish a page immediately via direct replication (synchronous). For approval-based publishing workflows, use startWorkflow with the request_for_activation model.',
  deactivatePage: 'Deactivate (unpublish) a single page',
  updateAsset: 'Update an existing asset in AEM DAM',
  deleteAsset: 'Delete an asset from AEM DAM',
  getTemplates: 'Get available page templates',
  getTemplateStructure: 'Get detailed structure of a specific template',
  getComponents: 'Get all components from the configured component root path (projectRoot1) or a specified path. Shows component name, title, description, resource type, and other metadata.',
  bulkUpdateComponents: 'Update multiple components in a single operation with validation and rollback support',
  convertComponents: 'Find all components of a specific resource type on a page, delete them, and create new components of another type at the same location. Returns required properties if target component needs them.',
  bulkConvertComponents: 'Convert components across multiple pages. Find all components of a specific resource type on multiple pages, delete them, and create new components of another type at the same location.',
  listWorkflowModels: 'List all available workflow models in AEM. Returns common workflows like request_for_activation (publish), request_for_deactivation (unpublish), request_for_deletion (delete pages), and others.',
  startWorkflow: 'Start a workflow instance. Common workflows: request_for_activation (publish pages), request_for_deactivation (unpublish pages), request_for_deletion (delete pages).',
  listWorkflowInstances: 'List workflow instances, optionally filtered by state',
  getWorkflowInstance: 'Get details of a specific workflow instance by ID',
  updateWorkflowInstanceState: 'Update workflow instance state (RUNNING, SUSPENDED, ABORTED)',
  getInboxItems: 'Get all work items in the inbox (work items assigned to current user)',
  completeWorkItem: 'Complete or advance a work item to the next step in the workflow',
  delegateWorkItem: 'Delegate a work item to another user or group',
  getWorkItemRoutes: 'Get available routes for a work item (to see what steps are available)',
  getContentFragment: 'Get a content fragment with all fields, variations, and metadata',
  listContentFragments: 'List content fragments under a path with optional model filter',
  manageContentFragment: 'Create, update, or delete a content fragment. Use action param to specify operation.',
  manageContentFragmentVariation: 'Create, update, or delete a variation within a content fragment',
  getExperienceFragment: 'Get an experience fragment with all variations, components, and metadata',
  listExperienceFragments: 'List experience fragments under a path with optional template filter',
  manageExperienceFragment: 'Create, update, or delete an experience fragment. Auto-creates master variation on create.',
  manageExperienceFragmentVariation: 'Create, update, or delete a variation within an experience fragment',
  listPackages: 'List all CRX packages available in AEM package manager',
  createAndDownloadPackage: 'Create a new content package (ZIP) in AEM based on paths/filters, build it, and download it locally to your machine.',
  uploadAndInstallPackage: 'Upload a local ZIP content package to AEM and install it automatically. Critical for bulk structure migrations.',
  runGraphQLQuery: 'Execute a GraphQL query against the AEM Headless GraphQL endpoint. Essential for verifying Content Fragment data models.',
  rolloutPage: 'Rollout changes from a blueprint (master) page to its connected LiveCopies.',
  getLiveCopyStatus: 'Get the MSM (Multi Site Manager) live copy status of a page, showing its blueprint and whether inheritance is cancelled.',
  listTags: 'List tag namespaces and tags from AEM taxonomy (/content/cq:tags).',
  createTag: 'Create a new AEM Tag or Tag Namespace.',
  updateTag: 'Update properties (like title and description) of an existing AEM Tag or Tag Namespace.',
  deleteTag: 'Delete an existing AEM Tag or Tag Namespace.',
  setTags: 'Apply an array of Tags to an AEM page, asset, or component.',
  manageReplication: 'Publish/Unpublish pages or assets from the Author instance to the Publisher instance.',
  flushCache: 'Invalidate and flush the AEM Dispatcher Cache for a specific path directly.',
  runQueryBuilder: 'Execute an advanced AEM Query Builder SQL2/XPath query by providing predicate combinations (path, type, main, p.limit, etc). Ideal for audits and deep content discovery.',
  listBundles: 'List all OSGi bundles installed in the AEM instance.',
  manageBundle: 'Start, stop, update, or refresh a specific OSGi Java bundle.',
  listAuthorizables: 'List users or groups in AEM using QueryBuilder.',
  createUser: 'Create a new user in AEM with optional intermediate path and properties.',
  createGroup: 'Create a new group in AEM with optional intermediate path and properties.',
  addMemberToGroup: 'Add a user or group to an existing group in AEM.',
  removeMemberFromGroup: 'Remove a user or group from an existing group in AEM.',
  changePassword: 'Change the password of an existing AEM user.',
  deleteAuthorizable: 'Delete a user or group from AEM.',
  tailLogs: 'Tails the AEM logs using the Felix console tailer. Useful for reading error.log and troubleshooting server-side errors.',
  setAcl: 'Modifies or sets an Access Control Entry (ACE) for a user/group on a specific JCR path.',
  getAcl: 'Retrieves the Access Control List (ACL) or Effective ACL for a specific JCR path.',
  removeAcl: 'Removes an Access Control Entry (ACE) for a user/group from a specific JCR path.',
  readAemFile: 'Reads the raw text content of a file in AEM (useful for reading .html Sightly templates, .js, or .css files directly).',
  writeAemFile: 'Writes or updates raw text content into a file in AEM via Sling Post Servlet. Enables live-patching of Sightly/Scripts.'
};

/**
 * Convert Zod schemas to the ToolDefinition[] format consumed by mcp.server.ts.
 * This is the ONLY place where Zod → JSON Schema conversion happens.
 */
function buildToolDefinitions(): ToolDefinition[] {
  return (Object.keys(toolSchemas) as ToolName[]).map((name) => {
    const { $schema, ...schema } = zodToJsonSchema(toolSchemas[name], { target: 'jsonSchema7' }) as Record<string, unknown>;
    return {
      name,
      description: toolDescriptions[name],
      inputSchema: schema,
    };
  });
}

export const tools: ToolDefinition[] = buildToolDefinitions();

/**
 * Inject an optional "instance" parameter into every tool's inputSchema.
 * Called only when multiple AEM instances are configured.
 */
export function injectInstanceParam(
  toolDefs: ToolDefinition[],
  instanceNames: string[],
  defaultName: string,
): ToolDefinition[] {
  return toolDefs.map((tool) => {
    const schema = tool.inputSchema as Record<string, any>;
    return {
      ...tool,
      inputSchema: {
        ...schema,
        properties: {
          ...(schema.properties || {}),
          instance: {
            type: 'string',
            description: `Target AEM instance. Available: ${instanceNames.join(', ')}. Default: "${defaultName}"`,
            enum: instanceNames,
          },
        },
      },
    };
  });
}

export const toolAnnotations: Record<string, { group: string; readOnly: boolean; complexity: 'low' | 'medium' | 'high' }> = {
  // Content & Text
  getAllTextContent: { group: 'content', readOnly: true, complexity: 'low' },
  getPageTextContent: { group: 'content', readOnly: true, complexity: 'low' },
  getPageImages: { group: 'content', readOnly: true, complexity: 'low' },
  updateImagePath: { group: 'content', readOnly: false, complexity: 'medium' },
  getPageContent: { group: 'content', readOnly: true, complexity: 'low' },
  getPageProperties: { group: 'content', readOnly: true, complexity: 'low' },
  // Sites
  fetchSites: { group: 'sites', readOnly: true, complexity: 'low' },
  fetchLanguageMasters: { group: 'sites', readOnly: true, complexity: 'low' },
  fetchAvailableLocales: { group: 'sites', readOnly: true, complexity: 'low' },
  // Pages
  listPages: { group: 'pages', readOnly: true, complexity: 'low' },
  createPage: { group: 'pages', readOnly: false, complexity: 'medium' },
  deletePage: { group: 'pages', readOnly: false, complexity: 'high' },
  activatePage: { group: 'pages', readOnly: false, complexity: 'medium' },
  deactivatePage: { group: 'pages', readOnly: false, complexity: 'medium' },
  unpublishContent: { group: 'pages', readOnly: false, complexity: 'medium' },
  enhancedPageSearch: { group: 'search', readOnly: true, complexity: 'low' },
  getNodeContent: { group: 'content', readOnly: true, complexity: 'low' },
  listChildren: { group: 'content', readOnly: true, complexity: 'low' },
  // Components
  updateComponent: { group: 'components', readOnly: false, complexity: 'medium' },
  scanPageComponents: { group: 'components', readOnly: true, complexity: 'low' },
  createComponent: { group: 'components', readOnly: false, complexity: 'high' },
  addComponent: { group: 'components', readOnly: false, complexity: 'medium' },
  deleteComponent: { group: 'components', readOnly: false, complexity: 'high' },
  getComponents: { group: 'components', readOnly: true, complexity: 'low' },
  bulkUpdateComponents: { group: 'components', readOnly: false, complexity: 'high' },
  convertComponents: { group: 'components', readOnly: false, complexity: 'high' },
  bulkConvertComponents: { group: 'components', readOnly: false, complexity: 'high' },
  // Assets
  getAssetMetadata: { group: 'assets', readOnly: true, complexity: 'low' },
  updateAsset: { group: 'assets', readOnly: false, complexity: 'medium' },
  deleteAsset: { group: 'assets', readOnly: false, complexity: 'high' },
  // Search
  searchContent: { group: 'search', readOnly: true, complexity: 'low' },
  executeJCRQuery: { group: 'search', readOnly: true, complexity: 'medium' },
  // Templates
  getTemplates: { group: 'templates', readOnly: true, complexity: 'low' },
  getTemplateStructure: { group: 'templates', readOnly: true, complexity: 'low' },
  // Workflows
  listWorkflowModels: { group: 'workflows', readOnly: true, complexity: 'low' },
  startWorkflow: { group: 'workflows', readOnly: false, complexity: 'medium' },
  listWorkflowInstances: { group: 'workflows', readOnly: true, complexity: 'low' },
  getWorkflowInstance: { group: 'workflows', readOnly: true, complexity: 'low' },
  updateWorkflowInstanceState: { group: 'workflows', readOnly: false, complexity: 'medium' },
  getInboxItems: { group: 'workflows', readOnly: true, complexity: 'low' },
  completeWorkItem: { group: 'workflows', readOnly: false, complexity: 'medium' },
  delegateWorkItem: { group: 'workflows', readOnly: false, complexity: 'medium' },
  getWorkItemRoutes: { group: 'workflows', readOnly: true, complexity: 'low' },
  // Content Fragments
  getContentFragment: { group: 'fragments-content', readOnly: true, complexity: 'low' },
  listContentFragments: { group: 'fragments-content', readOnly: true, complexity: 'low' },
  manageContentFragment: { group: 'fragments-content', readOnly: false, complexity: 'medium' },
  manageContentFragmentVariation: { group: 'fragments-content', readOnly: false, complexity: 'medium' },
  // Experience Fragments
  getExperienceFragment: { group: 'fragments-experience', readOnly: true, complexity: 'low' },
  listExperienceFragments: { group: 'fragments-experience', readOnly: true, complexity: 'low' },
  manageExperienceFragment: { group: 'fragments-experience', readOnly: false, complexity: 'medium' },
  manageExperienceFragmentVariation: { group: 'fragments-experience', readOnly: false, complexity: 'medium' },
  // CRX Packages
  listPackages: { group: 'crx-packages', readOnly: true, complexity: 'low' },
  createAndDownloadPackage: { group: 'crx-packages', readOnly: false, complexity: 'high' },
  uploadAndInstallPackage: { group: 'crx-packages', readOnly: false, complexity: 'high' },
  // GraphQL
  runGraphQLQuery: { group: 'graphql', readOnly: true, complexity: 'medium' },
  // MSM
  rolloutPage: { group: 'msm', readOnly: false, complexity: 'high' },
  getLiveCopyStatus: { group: 'msm', readOnly: true, complexity: 'low' },
  // Tags
  listTags: { group: 'tags', readOnly: true, complexity: 'low' },
  createTag: { group: 'tags', readOnly: false, complexity: 'medium' },
  updateTag: { group: 'tags', readOnly: false, complexity: 'medium' },
  deleteTag: { group: 'tags', readOnly: false, complexity: 'medium' },
  setTags: { group: 'tags', readOnly: false, complexity: 'medium' },
  // Replication
  manageReplication: { group: 'replication', readOnly: false, complexity: 'medium' },
  // Dispatcher
  flushCache: { group: 'dispatcher', readOnly: false, complexity: 'medium' },
  // QueryBuilder
  runQueryBuilder: { group: 'querybuilder', readOnly: true, complexity: 'high' },
  // OSGi
  listBundles: { group: 'osgi', readOnly: true, complexity: 'medium' },
  manageBundle: { group: 'osgi', readOnly: false, complexity: 'high' },
  // Users
  listAuthorizables: { group: 'users', readOnly: true, complexity: 'low' },
  createUser: { group: 'users', readOnly: false, complexity: 'medium' },
  createGroup: { group: 'users', readOnly: false, complexity: 'medium' },
  addMemberToGroup: { group: 'users', readOnly: false, complexity: 'low' },
  removeMemberFromGroup: { group: 'users', readOnly: false, complexity: 'low' },
  changePassword: { group: 'users', readOnly: false, complexity: 'medium' },
  deleteAuthorizable: { group: 'users', readOnly: false, complexity: 'high' },
  // Logs
  tailLogs: { group: 'logs', readOnly: true, complexity: 'low' },
  // ACLs
  setAcl: { group: 'acls', readOnly: false, complexity: 'high' },
  getAcl: { group: 'acls', readOnly: true, complexity: 'medium' },
  removeAcl: { group: 'acls', readOnly: false, complexity: 'high' },
  // Files / Scripts
  readAemFile: { group: 'files', readOnly: true, complexity: 'medium' },
  writeAemFile: { group: 'files', readOnly: false, complexity: 'high' }
};
