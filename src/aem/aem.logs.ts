import { AEMFetch } from './aem.fetch.js';
import { createSuccessResponse, safeExecute } from './aem.errors.js';

export class LogsManager {
  private readonly fetch: AEMFetch;

  constructor(fetch: AEMFetch) {
    this.fetch = fetch;
  }

  /**
   * Tails the AEM logs using the Felix console tailer
   * @param lines Number of lines to tail (default 100)
   * @param filter Optional string to grep/filter (e.g. 'ERROR', 'NullPointerException')
   * @param logFile Log filename inside the logs folder (default 'error.log')
   */
  async tailLogs(params: { lines?: number, filter?: string, logFile?: string }): Promise<object> {
    return safeExecute<object>(async () => {
      const { lines = 100, filter = '', logFile = 'error.log' } = params;
      
      const queryParams = new URLSearchParams({
        tail: lines.toString(),
        grep: filter,
        name: `/logs/${logFile}`
      });

      const endpoint = `/system/console/slinglog/tailer.txt?${queryParams.toString()}`;
      
      // We pass isHtml=true to prevent aem.fetch from trying to parse raw text as JSON
      const rawLogs = await this.fetch.get(endpoint, undefined, {}, undefined, true);
      
      return createSuccessResponse({
        logFile,
        linesRequested: lines,
        filterUsed: filter,
        logs: rawLogs.toString()
      }, 'tailLogs');
    }, 'tailLogs');
  }
}
