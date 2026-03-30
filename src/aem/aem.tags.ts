import { AEMFetch } from './aem.fetch.js';
import { createSuccessResponse, safeExecute } from './aem.errors.js';

export class TagsManager {
  private readonly fetch: AEMFetch;

  constructor(fetch: AEMFetch) {
    this.fetch = fetch;
  }

  async listTags(namespace?: string, depth?: number): Promise<object> {
    return safeExecute<object>(async () => {
      // Si el usuario especifica depth, lo usa. Si no, usa -1 (todo) si hay namespace, o 1 si es global.
      const d = depth !== undefined ? depth : (namespace ? -1 : 1);
      const path = namespace ? `/content/cq:tags/${namespace}.${d}.json` : `/content/cq:tags.${d}.json`;
      const data = await this.fetch.get(path);
      return createSuccessResponse({ path, data }, 'listTags');
    }, 'listTags');
  }

  async createTag(params: { tagPath: string; title: string; description?: string }): Promise<object> {
    return safeExecute<object>(async () => {
      const { tagPath, title, description } = params;
      // Tag path example: 'default/my-tag'
      const endpoint = `/content/cq:tags/${tagPath.replace(/^\//, '')}`;
      const body: Record<string, any> = {
        'jcr:primaryType': 'cq:Tag',
        'jcr:title': title,
      };
      
      if (description) {
        body['jcr:description'] = description;
      }

      await this.fetch.post(endpoint, body);
      return createSuccessResponse({ path: endpoint, tagPath, title }, 'createTag');
    }, 'createTag');
  }

  async updateTag(params: { tagPath: string; title?: string; description?: string }): Promise<object> {
    return safeExecute<object>(async () => {
      const { tagPath, title, description } = params;
      const endpoint = `/content/cq:tags/${tagPath.replace(/^\//, '')}`;
      const body: Record<string, any> = {};
      
      if (title) {
        body['jcr:title'] = title;
      }
      if (description !== undefined) {
        body['jcr:description'] = description;
      }

      await this.fetch.post(endpoint, body);
      return createSuccessResponse({ path: endpoint, tagPath, updatedFiles: Object.keys(body) }, 'updateTag');
    }, 'updateTag');
  }

  async deleteTag(tagPath: string): Promise<object> {
    return safeExecute<object>(async () => {
      // Usamos Sling Post con :operation=delete
      const endpoint = `/content/cq:tags/${tagPath.replace(/^\//, '')}`;
      await this.fetch.post(endpoint, {
        ':operation': 'delete'
      });
      return createSuccessResponse({ path: endpoint, tagPath }, 'deleteTag');
    }, 'deleteTag');
  }

  async setTags(params: { contentPath: string; tags: string[] }): Promise<object> {
    return safeExecute<object>(async () => {
      let { contentPath, tags } = params;
      
      // Auto-append jcr:content if targeting a page or asset directly
      if (!contentPath.endsWith('/jcr:content') && !contentPath.includes('/jcr:content/')) {
        contentPath = `${contentPath}/jcr:content`;
      }

      // We use Sling Post Servlet to update the array
      // By using string array and TypeHint, Sling correctly saves it as a String[].
      // If tags is empty array, Sling might need specially handling like cq:tags@Delete (using standard Sling magic if needed, but [] usually works or we can define it).
      const body: Record<string, any> = {
        'cq:tags': tags,
        'cq:tags@TypeHint': 'String[]'
      };

      if (tags.length === 0) {
        // Force delete if array is empty
        body['cq:tags@Delete'] = 'true';
        delete body['cq:tags'];
      }

      await this.fetch.post(contentPath, body);
      return createSuccessResponse({ path: contentPath, tags }, 'setTags');
    }, 'setTags');
  }
}
