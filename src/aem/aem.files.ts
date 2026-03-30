import { AEMFetch } from './aem.fetch.js';
import { createSuccessResponse, safeExecute } from './aem.errors.js';

export class FileManager {
  private readonly fetch: AEMFetch;

  constructor(fetch: AEMFetch) {
    this.fetch = fetch;
  }

  /**
   * Reads the raw content of a file in AEM (e.g. .html, .js, .css, .txt, .json)
   * This retrieves the text content rather than the JCR properties tree.
   */
  async readAemFile(path: string): Promise<object> {
    return safeExecute<object>(async () => {
      // By passing true to isHtml, AEMFetch returns raw text instead of trying to parse JSON
      // This works for any text-based file in the repository served directly by AEM
      const content = await this.fetch.get(path, undefined, {}, undefined, true);
      
      return createSuccessResponse({
        path,
        content: content,
        type: path.split('.').pop() || 'unknown',
        length: typeof content === 'string' ? content.length : 0
      }, 'readAemFile');
    }, 'readAemFile');
  }

  /**
   * Writes raw content to a file in AEM (Hot-patching Sightly, JS, CSS, etc.)
   * Uses Sling Post Servlet to update the jcr:data property inside the nt:file/nt:resource structure.
   */
  async writeAemFile(params: { path: string; content: string; mimeType?: string }): Promise<object> {
    return safeExecute<object>(async () => {
      const { path, content, mimeType } = params;
      
      const body = new URLSearchParams();
      // Sling Post Servlet conventions for creating/updating a file
      body.append('jcr:primaryType', 'nt:file');
      body.append('jcr:content/jcr:primaryType', 'nt:resource');
      body.append('jcr:content/jcr:data', content);
      
      if (mimeType) {
        body.append('jcr:content/jcr:mimeType', mimeType);
      } else {
        // Simple heuristic for mime-types if not provided
        const ext = path.split('.').pop()?.toLowerCase();
        let guessedMimeType = 'text/plain';
        if (ext === 'html') guessedMimeType = 'text/html';
        else if (ext === 'js') guessedMimeType = 'application/javascript';
        else if (ext === 'css') guessedMimeType = 'text/css';
        else if (ext === 'json') guessedMimeType = 'application/json';
        else if (ext === 'xml') guessedMimeType = 'application/xml';
        
        body.append('jcr:content/jcr:mimeType', guessedMimeType);
      }
      
      // Use true for isHtml because the Sling Post endpoint returns an HTML status page, not JSON
      await this.fetch.post(path, body, {}, undefined, true);
      
      return createSuccessResponse({
        path,
        status: 'updated',
        bytesWritten: content.length,
        mimeType: mimeType || 'auto-detected'
      }, 'writeAemFile');
    }, 'writeAemFile');
  }
}
