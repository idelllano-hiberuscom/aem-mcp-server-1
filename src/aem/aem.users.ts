import { AEMFetch } from './aem.fetch.js';
import { createSuccessResponse, safeExecute } from './aem.errors.js';

export class UserManager {
  private readonly fetch: AEMFetch;

  constructor(fetch: AEMFetch) {
    this.fetch = fetch;
  }

  /**
   * Lists authorizables (Users or Groups) using AEM QueryBuilder
   */
  async listAuthorizables(type: 'rep:User' | 'rep:Group', limit: number = 100): Promise<object> {
    return safeExecute<object>(async () => {
      const endpoint = '/bin/querybuilder.json';
      const params = new URLSearchParams({
        'path': type === 'rep:User' ? '/home/users' : '/home/groups',
        'type': type,
        'p.limit': limit.toString(),
        'p.hits': 'selective',
        'p.properties': 'rep:principalName rep:authorizableId jcr:primaryType'
      });
      const data = await this.fetch.get(`${endpoint}?${params.toString()}`);
      return createSuccessResponse(data, `list${type === 'rep:User' ? 'Users' : 'Groups'}`);
    }, 'listAuthorizables');
  }

  /**
   * Creates a new AEM User
   */
  async createUser(params: { userId: string; password?: string; path?: string; properties?: Record<string, string> }): Promise<object> {
    return safeExecute<object>(async () => {
      const endpoint = '/system/userManager/user.create.html';
      const body = new URLSearchParams();
      body.append(':name', params.userId);
      body.append('rep:password', params.password || params.userId);
      
      if (params.path) {
          body.append('rep:authorizableId', params.userId);
          body.append('intermediatePath', params.path);
      }
      
      if (params.properties) {
        for (const [key, value] of Object.entries(params.properties)) {
          body.append(key, value);
        }
      }
      
      await this.fetch.post(endpoint, body, {}, undefined, true);
      return createSuccessResponse({ userId: params.userId, status: 'created' }, 'createUser');
    }, 'createUser');
  }

  /**
   * Creates a new AEM Group
   */
  async createGroup(params: { groupId: string; path?: string; properties?: Record<string, string> }): Promise<object> {
    return safeExecute<object>(async () => {
      const endpoint = '/system/userManager/group.create.html';
      const body = new URLSearchParams();
      body.append(':name', params.groupId);
      
      if (params.path) {
          body.append('rep:authorizableId', params.groupId);
          body.append('intermediatePath', params.path);
      }

      if (params.properties) {
        for (const [key, value] of Object.entries(params.properties)) {
          body.append(key, value);
        }
      }
      
      await this.fetch.post(endpoint, body, {}, undefined, true);
      return createSuccessResponse({ groupId: params.groupId, status: 'created' }, 'createGroup');
    }, 'createGroup');
  }

  /**
   * Adds an authorizable (user or group) to a Group
   */
  async addMemberToGroup(params: { memberId: string; groupId: string }): Promise<object> {
    return safeExecute<object>(async () => {
      const endpoint = `/system/userManager/group/${params.groupId}.update.html`;
      const body = new URLSearchParams();
      body.append(':member', params.memberId);
      
      await this.fetch.post(endpoint, body, {}, undefined, true);
      return createSuccessResponse({ memberId: params.memberId, groupId: params.groupId, status: 'added' }, 'addMemberToGroup');
    }, 'addMemberToGroup');
  }

  /**
   * Removes an authorizable from a Group
   */
  async removeMemberFromGroup(params: { memberId: string; groupId: string }): Promise<object> {
    return safeExecute<object>(async () => {
      const endpoint = `/system/userManager/group/${params.groupId}.update.html`;
      const body = new URLSearchParams();
      body.append(':member@Delete', params.memberId);
      
      await this.fetch.post(endpoint, body, {}, undefined, true);
      return createSuccessResponse({ memberId: params.memberId, groupId: params.groupId, status: 'removed' }, 'removeMemberFromGroup');
    }, 'removeMemberFromGroup');
  }

  /**
   * Changes the password of an existing AEM user
   */
  async changePassword(params: { userId: string; oldPassword?: string; newPassword: string }): Promise<object> {
    return safeExecute<object>(async () => {
      const endpoint = `/system/userManager/user/${params.userId}.changePassword.html`;
      const body = new URLSearchParams();
      if (params.oldPassword) {
        body.append('oldPwd', params.oldPassword);
      }
      body.append('newPwd', params.newPassword);
      body.append('newPwdConfirm', params.newPassword);
      
      await this.fetch.post(endpoint, body, {}, undefined, true);
      return createSuccessResponse({ userId: params.userId, status: 'password_changed' }, 'changePassword');
    }, 'changePassword');
  }

  /**
   * Deletes a user or a group
   */
  async deleteAuthorizable(params: { id: string; type: 'user' | 'group' }): Promise<object> {
    return safeExecute<object>(async () => {
      const endpoint = `/system/userManager/${params.type}/${params.id}.delete.html`;
      await this.fetch.post(endpoint, new URLSearchParams(), {}, undefined, true);
      
      return createSuccessResponse({ id: params.id, type: params.type, status: 'deleted' }, 'deleteAuthorizable');
    }, 'deleteAuthorizable');
  }
}
