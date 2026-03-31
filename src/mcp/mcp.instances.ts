import { MCPRequestHandler } from './mcp.aem-handler.js';
import { CliParams, InstanceConfig } from '../types.js';
import { LOGGER } from '../utils/logger.js';

/**
 * Registry of named AEM instances. Each instance has its own MCPRequestHandler
 * with independent connection config (host, auth).
 *
 * Parse format: "name:host:user:pass,name2:host2:user2:pass2"
 * URLs with protocol: "name:https://host:user:pass"
 */
export class InstanceRegistry {
  private handlers: Map<string, MCPRequestHandler> = new Map();
  private defaultInstance: string;

  constructor(cliParams: CliParams) {
    const instances = this.parseInstances(cliParams);

    for (const inst of instances) {
      const handlerParams: CliParams = {
        host: inst.host,
        user: inst.user,
        pass: inst.pass,
        id: inst.id,
        secret: inst.secret,
      };
      this.handlers.set(inst.name, new MCPRequestHandler(handlerParams));
      LOGGER.log(`Registered AEM instance: "${inst.name}" → ${inst.host}`);
    }

    this.defaultInstance = instances[0].name;
    LOGGER.log(`Default instance: "${this.defaultInstance}"`);
  }

  private parseInstances(params: CliParams): InstanceConfig[] {
    if (params.instances) {
      const entries = params.instances.split(',').map((s) => s.trim()).filter(Boolean);
      const instances: InstanceConfig[] = [];

      for (const entry of entries) {
        const parts = entry.split(':');
        if (parts.length < 2) {
          LOGGER.error(`Invalid instance format: "${entry}" — expected at least "name:host"`);
          continue;
        }

        let name = parts[0];
        let host = '';
        let user = '';
        let pass = '';
        let id = '';
        let secret = '';

        let credentialParts: string[] = [];

        if (parts[1]?.startsWith('//') || parts[2]?.startsWith('//')) {
          // Format with protocol in host, e.g. name:https://author-...:oauth:clientId:clientSecret
          host = parts[1] + ':' + parts[2];
          let nextIdx = 3;
          if (parts[nextIdx] && /^\d+$/.test(parts[nextIdx])) {
            host += ':' + parts[nextIdx];
            nextIdx++;
          }
          credentialParts = parts.slice(nextIdx);
        } else {
          // Format without protocol in host, e.g. name:author.example.com:user:pass
          host = parts[1];
          if (!host.startsWith('http')) {
            host = `http://${host}`;
          }
          credentialParts = parts.slice(2);
        }

        // Credentials format options:
        // 1) name:host:user:pass
        // 2) name:host:oauth:clientId:clientSecret
        // 3) name:host                -> uses global --id/--secret or --user/--pass
        // 4) name:host:basic:user:pass
        const mode = credentialParts[0]?.toLowerCase();
        if (mode === 'oauth') {
          id = credentialParts[1] || '';
          secret = credentialParts.slice(2).join(':') || '';
        } else if (mode === 'basic') {
          user = credentialParts[1] || '';
          pass = credentialParts.slice(2).join(':') || '';
        } else if (credentialParts.length >= 2) {
          user = credentialParts[0] || '';
          pass = credentialParts.slice(1).join(':') || '';
        }

        // If instance credentials are omitted, reuse global CLI credentials.
        if (!id && !secret && !user && !pass) {
          if (params.id && params.secret) {
            id = params.id;
            secret = params.secret;
          } else {
            user = params.user || 'admin';
            pass = params.pass || 'admin';
          }
        }

        if ((id && !secret) || (!id && secret)) {
          LOGGER.error(`Invalid OAuth credentials in instance "${name}". Both clientId and clientSecret are required.`);
          continue;
        }

        instances.push({
          name,
          host,
          user: user || '',
          pass: pass || '',
          id: id || undefined,
          secret: secret || undefined,
        });
      }

      if (instances.length === 0) {
        throw new Error('No valid instances parsed from --instances flag');
      }
      return instances;
    }

    return [{
      name: 'default',
      host: params.host || 'http://localhost:4502',
      user: params.user || 'admin',
      pass: params.pass || 'admin',
      id: params.id,
      secret: params.secret,
    }];
  }

  getHandler(instanceName?: string): MCPRequestHandler {
    const name = instanceName || this.defaultInstance;
    const handler = this.handlers.get(name);
    if (!handler) {
      const available = Array.from(this.handlers.keys()).join(', ');
      throw new Error(`Unknown AEM instance: "${name}". Available: ${available}`);
    }
    return handler;
  }

  getDefaultName(): string {
    return this.defaultInstance;
  }

  getInstanceNames(): string[] {
    return Array.from(this.handlers.keys());
  }
}
