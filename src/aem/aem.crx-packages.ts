import { AEMFetch } from './aem.fetch.js';
import { createSuccessResponse, safeExecute, createAEMError, AEM_ERROR_CODES } from './aem.errors.js';
import * as fs from 'fs';
import * as path from 'path';

export class CRXPackageManager {
  private readonly fetch: AEMFetch;

  constructor(fetch: AEMFetch) {
    this.fetch = fetch;
  }

  async listPackages(): Promise<object> {
    return safeExecute<object>(async () => {
      // The endpoint for listing packages in JSON format
      const data = await this.fetch.get('/crx/packmgr/service/.json/?cmd=ls');
      
      return createSuccessResponse({
        packages: data?.results || [],
        total: data?.results?.length || 0
      }, 'listPackages');
    }, 'listPackages');
  }

  async createAndDownloadPackage(request: any): Promise<object> {
    return safeExecute<object>(async () => {
      const { groupName, packageName, version, filters, localSaveDirectory } = request;
      
      // Define path in AEM
      const pkgPath = `/etc/packages/${groupName}/${packageName}-${version}.zip`;
      
      // 1. Create the package definition
      const createFormData = new URLSearchParams();
      createFormData.append('cmd', 'create');
      createFormData.append('groupName', groupName);
      createFormData.append('packageName', packageName);
      createFormData.append('version', version);
      createFormData.append('_charset_', 'utf-8');

      const createData = await this.fetch.post('/crx/packmgr/service/.json?cmd=create', createFormData);
      if (createData && !createData.success && createData.success === false) {
        throw createAEMError(AEM_ERROR_CODES.SYSTEM_ERROR, `Failed to create package: ${createData.msg}`);
      }

      // 2. Set filters using update.jsp
      // CRX requires the filter as a JSON string in this exact format
      const filterRules = filters.map((f: any) => ({
        root: f.root,
        rules: f.rules || []
      }));
      const filterFormData = new URLSearchParams();
      filterFormData.append('path', pkgPath);
      filterFormData.append('filter', JSON.stringify(filterRules));
      filterFormData.append('_charset_', 'utf-8');

      await this.fetch.post('/crx/packmgr/update.jsp', filterFormData, {}, undefined, true); // update.jsp usually returns HTML

      // 3. Build the package contents
      const buildData = await this.fetch.post(`/crx/packmgr/service/.json${pkgPath}?cmd=build`, new URLSearchParams());
      if (buildData && !buildData.success && buildData.success === false) {
        throw createAEMError(AEM_ERROR_CODES.SYSTEM_ERROR, `Failed to build package: ${buildData.msg}`);
      }

      // 4. Download the package as binary
      const response = await this.fetch.getBuffer(pkgPath); 
      
      // Save it locally
      const resolvedDir = path.resolve(localSaveDirectory || process.cwd());
      if (!fs.existsSync(resolvedDir)) {
        fs.mkdirSync(resolvedDir, { recursive: true });
      }
      
      const filePath = path.join(resolvedDir, `${packageName}-${version}.zip`);
      fs.writeFileSync(filePath, response);

      return createSuccessResponse({
        success: true,
        message: `Package ${packageName}-${version}.zip created and downloaded successfully.`,
        packagePath: pkgPath,
        localFilePath: filePath,
        size: response.length
      }, 'createAndDownloadPackage');
    }, 'createAndDownloadPackage');
  }

  async uploadAndInstallPackage(request: any): Promise<object> {
    return safeExecute<object>(async () => {
      const { localFilePath, force = true } = request;
      
      const resolvedPath = path.resolve(localFilePath);
      if (!fs.existsSync(resolvedPath)) {
        throw createAEMError(AEM_ERROR_CODES.INVALID_PARAMETERS, `Local file not found: ${resolvedPath}`);
      }

      const fileBuffer = fs.readFileSync(resolvedPath);
      const filename = path.basename(resolvedPath);
      const mimeType = 'application/zip';
      
      const blob = new Blob([fileBuffer], { type: mimeType });
      
      // 1. Upload Package (requires multipart/form-data)
      const formData = new FormData();
      formData.append('package', blob, filename);
      if (force) {
        formData.append('force', 'true');
      }

      const uploadData = await this.fetch.post('/crx/packmgr/service/.json/?cmd=upload', formData);
      if (uploadData && !uploadData.success && uploadData.success === false) {
        throw createAEMError(AEM_ERROR_CODES.SYSTEM_ERROR, `Failed to upload package: ${uploadData.msg}`);
      }
      
      const pkgPath = uploadData.path || `/etc/packages/my_packages/${filename}`; 

      // 2. Install Package
      const installData = await this.fetch.post(`/crx/packmgr/service/.json${pkgPath}?cmd=install`, new URLSearchParams());
      if (installData && !installData.success && installData.success === false) {
        throw createAEMError(AEM_ERROR_CODES.SYSTEM_ERROR, `Failed to install package: ${installData.msg}`);
      }

      return createSuccessResponse({
        success: true,
        message: `Package ${filename} uploaded and installed successfully.`,
        packagePath: pkgPath,
      }, 'uploadAndInstallPackage');
    }, 'uploadAndInstallPackage');
  }
}
