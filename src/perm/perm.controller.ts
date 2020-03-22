import { RequestResponse } from "..";
import RenovationDocument from "../model/document";
import RenovationController from "../renovation.controller";
import {
  CanAmendParams,
  CanCancelParams,
  CanCreateParams,
  CanDeleteParams,
  CanEmailParams,
  CanExportParams,
  CanGetReportParams,
  CanImportParams,
  CanPrintParams,
  CanReadParams,
  CanRecursiveDeleteParams,
  CanSearchParams,
  CanSetUserPermissionsParams,
  CanSubmitParams,
  CanWriteParams,
  GetPermParams,
  HasPermParams,
  HasPermsParams
} from "./interfaces";
import { Permission, PermissionType } from "./perm.model";

/**
 * Class containing permission properties/caches & methods
 * @abstract
 */
export default abstract class PermissionController extends RenovationController {
  /**
   * Holds the basic permissions
   */
  protected basicPerms: BasicPermInfo = null;
  /**
   * Holds the permissions for each doctype
   */
  private doctypePerms: { [ind: string]: Array<Partial<Permission>> } = {};

  /**
   * Resets the `basicPerms` and `doctypePerms` properties
   */
  public clearCache() {
    this.basicPerms = null;
    this.doctypePerms = {};
  }

  /**
   * Returns if the user has perm for a particular event
   * @param {HasPermParams} hasPermParams
   *
   * @returns {Promise<boolean>} true if the permission is set to true, false otherwise.
   *
   * If there are errors, false is returned
   */
  public async hasPerm(hasPermParams: HasPermParams): Promise<boolean>;
  /**
   * Returns if the user has perm for a particular event
   * @param doctype The target doctype
   * @param ptype The permission type (read, write, etc...)
   * @param permLevel The permission level to check. Defaults to 0
   * @param docname A specific document. Defaults to `null`
   * @deprecated
   * @returns {Promise<boolean>} true if the permission is set to true, false otherwise.
   *
   * If there are errors, false is returned
   */
  public async hasPerm(
    doctype: string,
    ptype: PermissionType,
    permLevel?: number,
    docname?: string
  ): Promise<boolean>;
  public async hasPerm(
    hasPermParams: HasPermParams | string,
    ptype?: PermissionType,
    permLevel?: number,
    docname?: string
  ): Promise<boolean> {
    let args: HasPermParams;
    if (typeof hasPermParams === "string") {
      console.warn(
        "LTS-Renovation-Core",
        "hasPerm(doctype, ptype, permlevel, docname) is deprecated",
        "Please use the interfaced method instead"
      );
      args = {
        doctype: hasPermParams,
        docname,
        ptype,
        permLevel
      };
    } else {
      args = hasPermParams;
    }

    if (!this.doctypePerms[args.doctype]) {
      const permsR = await this.getPerm({ doctype: args.doctype });
      if (permsR.success) {
        this.doctypePerms[args.doctype] = permsR.data;
      }
    }

    args.permLevel = args.permLevel || 0;
    const perms = this.doctypePerms[args.doctype];

    if (!perms) {
      return false;
    }
    if (!perms[args.permLevel]) {
      return false;
    }

    let perm = !!perms[args.permLevel][args.ptype];
    if (args.permLevel === 0 && args.docname) {
      const docinfo = await this.config.coreInstance.meta.getDocInfo({
        doctype: args.doctype,
        docname: args.docname
      });
      if (
        docinfo.success &&
        docinfo.data &&
        !docinfo.data.permissions[args.ptype]
      ) {
        perm = false;
      }
    }
    return perm;
  }

  /**
   * Checks for the list of permissions against a doctype
   * @param {HasPermsParams} hasPermsParams
   *
   * @returns {Promise<boolean>} true if all the permissions is set to true, false otherwise.
   *
   * If there are errors, false is returned
   */
  public async hasPerms(hasPermsParams: HasPermsParams): Promise<boolean>;
  /**
   * Checks for the list of permissions against a doctype
   * @param doctype The target doctype
   * @param ptypes The list of permissions to check
   * @param docname A specific document.
   * @deprecated
   * @returns {Promise<boolean>} true if all the permissions is set to true, false otherwise.
   *
   * If there are errors, false is returned
   */
  public async hasPerms(
    doctype: string,
    ptypes: PermissionType[],
    docname?: string
  ): Promise<boolean>;
  public async hasPerms(
    hasPermParams: HasPermsParams | string,
    ptypes?: PermissionType[],
    docname?: string
  ): Promise<boolean> {
    let args: HasPermsParams;
    if (typeof hasPermParams === "string") {
      console.warn(
        "LTS-Renovation-Core",
        "hasPerms(doctype, ptypes, docname) is deprecated",
        "Please use the interfaced method instead"
      );
      args = {
        doctype: hasPermParams,
        docname,
        ptypes
      };
    } else {
      args = hasPermParams;
    }

    for (const p of args.ptypes) {
      const hasPerm = await this.hasPerm({
        doctype: args.doctype,
        ptype: p,
        permLevel: 0,
        docname: args.docname
      });
      if (!hasPerm) {
        return false;
      }
    }
    return true;
  }

  /**
   * Builds permission from docmeta
   * @param getPermParams
   * @returns {Promise<RequestResponse<Array<Partial<Permission>>>>} The permissions of the user for the doctype
   *
   * If the DocMeta or User Roles fail, a success response will be returned with the following in data
   *
   * ``` json
   * [
   *    {
   *      read: false,
   *      _ifOwner: {}
   *    }
   * ]
   * ```
   *
   */
  public async getPerm(
    getPermParams: GetPermParams
  ): Promise<RequestResponse<Array<Partial<Permission>>>>;
  /**
   * Builds permission from docmeta
   * @param doctype The target doctype
   * @param doc The target document
   * @deprecated
   * @returns {Promise<RequestResponse<Array<Partial<Permission>>>>} The permissions of the user for the doctype
   *
   * If the DocMeta or User Roles fail, a success response will be returned with the following in data
   *
   * ``` json
   * [
   *    {
   *      read: false,
   *      _ifOwner: {}
   *    }
   * ]
   * ```
   *
   */
  public async getPerm(
    doctype: string,
    doc?: RenovationDocument
  ): Promise<RequestResponse<Array<Partial<Permission>>>>;
  public async getPerm(
    getPermParams: GetPermParams | string,
    doc = null
  ): Promise<RequestResponse<Array<Partial<Permission>>>> {
    let args: GetPermParams;
    if (typeof getPermParams === "string") {
      console.warn(
        "LTS-Renovation-Core",
        "getPerm(doctype, doc) is deprecated",
        "Please use the interfaced method instead"
      );
      args = {
        doctype: getPermParams,
        doc
      };
    } else {
      args = getPermParams;
    }

    const perm: Array<Partial<Permission>> = [
      {
        read: false,
        _ifOwner: {}
      }
    ];

    if (this.config.coreInstance.auth.getCurrentUser() === "Administrator") {
      perm[0].read = true;
    }

    const responses = await Promise.all([
      this.getCore().meta.getDocMeta({ doctype: args.doctype }),
      this.getCore().auth.getCurrentUserRoles()
    ]);
    const metaR = responses[0];
    const rolesR = responses[1];

    if (!metaR.success) {
      return RequestResponse.success(perm);
    }

    if (!rolesR.success) {
      return RequestResponse.success(perm);
    }

    // read from meta.permissions
    for (const dp of metaR.data.permissions) {
      // apply only if this DocPerm role is present for currentUser
      if (rolesR.data.indexOf(dp.role) < 0) {
        continue;
      }
      // permlevels 0,1,2..
      if (!perm[dp.permLevel]) {
        perm[dp.permLevel] = {};
        perm[dp.permLevel].permLevel = dp.permLevel;
      }

      // For User permissions
      // NOTE: this data is required for displaying match rules in ListComponent
      // tslint:disable-next-line:forin
      for (const k in PermissionType) {
        perm[dp.permLevel][k] = perm[dp.permLevel][k] || (dp[k] || false);
      }
    }
    // TODO: Implement Document Specific rules
    return RequestResponse.success(perm);
  }

  /**
   * Loads the basic params from the backend for the current user
   *
   * If a user isn't signed in, the Guest basic permissions is retrieved
   */
  public abstract async loadBasicPerms(): Promise<RequestResponse<{}>>;

  /**
   * Check if the user can create a doctype
   * @param {CanCreateParams} canCreateParams
   * @returns {Promise<boolean>} true if allowed, false otherwise
   */
  public async canCreate(canCreateParams: CanCreateParams): Promise<boolean>;
  /**
   * Check if the user can create a doctype
   * @param doctype The target doctype
   * @deprecated
   * @returns {Promise<boolean>} true if allowed, false otherwise
   */
  // tslint:disable-next-line: unified-signatures
  public async canCreate(doctype: string): Promise<boolean>;
  public async canCreate(
    canCreateParams: CanCreateParams | string
  ): Promise<boolean> {
    let args: CanCreateParams;
    if (typeof canCreateParams === "string") {
      console.warn(
        "LTS-Renovation-Core",
        "canCreate(doctype) is deprecated",
        "Please use the interfaced method instead"
      );
      args = {
        doctype: canCreateParams
      };
    } else {
      args = canCreateParams;
    }
    return await this.canInUserPermissions("can_create", args.doctype);
  }

  /**
   * Check if the user can read a doctype
   * @param {CanReadParams} canReadParams
   * @returns {Promise<boolean>} true if allowed, false otherwise
   */
  public async canRead(canReadParams: CanReadParams): Promise<boolean>;
  /**
   * Check if the user can read a doctype
   * @param doctype The target doctype
   * @deprecated
   * @returns {Promise<boolean>} true if allowed, false otherwise
   */
  // tslint:disable-next-line: unified-signatures
  public async canRead(doctype: string): Promise<boolean>;
  public async canRead(
    canReadParams: CanReadParams | string
  ): Promise<boolean> {
    let args: CanReadParams;
    if (typeof canReadParams === "string") {
      console.warn(
        "LTS-Renovation-Core",
        "canRead(doctype) is deprecated",
        "Please use the interfaced method instead"
      );
      args = {
        doctype: canReadParams
      };
    } else {
      args = canReadParams;
    }
    return await this.canInUserPermissions("can_read", args.doctype);
  }

  /**
   * Check if the user can write a doctype
   * @param {CanWriteParams} canWriteParams
   * @returns {Promise<boolean>} true if allowed, false otherwise
   */
  public async canWrite(canWriteParams: CanWriteParams): Promise<boolean>;
  /**
   * Check if the user can write a doctype
   * @param doctype The target doctype
   * @deprecated
   * @returns {Promise<boolean>} true if allowed, false otherwise
   */
  // tslint:disable-next-line: unified-signatures
  public async canWrite(doctype: string): Promise<boolean>;
  public async canWrite(
    canWriteParams: CanWriteParams | string
  ): Promise<boolean> {
    let args: CanWriteParams;
    if (typeof canWriteParams === "string") {
      console.warn(
        "LTS-Renovation-Core",
        "canWrite(doctype) is deprecated",
        "Please use the interfaced method instead"
      );
      args = {
        doctype: canWriteParams
      };
    } else {
      args = canWriteParams;
    }
    return await this.canInUserPermissions("can_write", args.doctype);
  }

  /**
   * Check if the user can cancel a doctype
   * @param {CanCancelParams} canCancelParams
   * @returns {Promise<boolean>} true if allowed, false otherwise
   */
  public async canCancel(canCancelParams: CanCancelParams): Promise<boolean>;
  /**
   * Check if the user can cancel a doctype
   * @param doctype The target doctype
   * @deprecated
   * @returns {Promise<boolean>} true if allowed, false otherwise
   */
  // tslint:disable-next-line: unified-signatures
  public async canCancel(doctype: string): Promise<boolean>;
  public async canCancel(
    canCancelParams: CanCancelParams | string
  ): Promise<boolean> {
    let args: CanCreateParams;
    if (typeof canCancelParams === "string") {
      console.warn(
        "LTS-Renovation-Core",
        "canCancel(doctype) is deprecated",
        "Please use the interfaced method instead"
      );
      args = {
        doctype: canCancelParams
      };
    } else {
      args = canCancelParams;
    }
    return await this.canInUserPermissions("can_cancel", args.doctype);
  }

  /**
   * Check if the user can delete a doctype
   * @param {CanDeleteParams} canDeleteParams
   * @returns {Promise<boolean>} true if allowed, false otherwise
   */
  public async canDelete(canDeleteParams: CanDeleteParams): Promise<boolean>;
  /**
   * Check if the user can delete a doctype
   * @param doctype The target doctype
   * @deprecated
   * @returns {Promise<boolean>} true if allowed, false otherwise
   */
  // tslint:disable-next-line: unified-signatures
  public async canDelete(doctype: string): Promise<boolean>;
  public async canDelete(
    canDeleteParams: CanDeleteParams | string
  ): Promise<boolean> {
    let args: CanDeleteParams;
    if (typeof canDeleteParams === "string") {
      console.warn(
        "LTS-Renovation-Core",
        "canDelete(doctype) is deprecated",
        "Please use the interfaced method instead"
      );
      args = {
        doctype: canDeleteParams
      };
    } else {
      args = canDeleteParams;
    }
    return await this.canInUserPermissions("can_delete", args.doctype);
  }

  /**
   * Check if the user can import a doctype
   * @param {CanImportParams} canImportParams
   * @returns {Promise<boolean>} true if allowed, false otherwise
   */
  public async canImport(canImportParams: CanImportParams): Promise<boolean>;
  /**
   * Check if the user can import a doctype
   * @param doctype The target doctype
   * @deprecated
   * @returns {Promise<boolean>} true if allowed, false otherwise
   */
  // tslint:disable-next-line: unified-signatures
  public async canImport(doctype: string): Promise<boolean>;
  public async canImport(
    canImportParams: CanImportParams | string
  ): Promise<boolean> {
    let args: CanImportParams;
    if (typeof canImportParams === "string") {
      console.warn(
        "LTS-Renovation-Core",
        "canImport(doctype) is deprecated",
        "Please use the interfaced method instead"
      );
      args = {
        doctype: canImportParams
      };
    } else {
      args = canImportParams;
    }
    return await this.canInUserPermissions("can_import", args.doctype);
  }

  /**
   * Check if the user can export a doctype
   * @param {CanExportParams} canExportParams
   * @returns {Promise<boolean>} true if allowed, false otherwise
   */
  public async canExport(canExportParams: CanExportParams): Promise<boolean>;
  /**
   * Check if the user can export a doctype
   * @param doctype The target doctype
   * @deprecated
   * @returns {Promise<boolean>} true if allowed, false otherwise
   */
  // tslint:disable-next-line: unified-signatures
  public async canExport(doctype: string): Promise<boolean>;
  public async canExport(
    canExportParams: CanExportParams | string
  ): Promise<boolean> {
    let args: CanExportParams;
    if (typeof canExportParams === "string") {
      console.warn(
        "LTS-Renovation-Core",
        "canExport(doctype) is deprecated",
        "Please use the interfaced method instead"
      );
      args = {
        doctype: canExportParams
      };
    } else {
      args = canExportParams;
    }
    return await this.canInUserPermissions("can_export", args.doctype);
  }

  /**
   * Check if the user can print a doctype
   * @param {CanPrintParams} canPrintParams
   * @returns {Promise<boolean>} true if allowed, false otherwise
   */
  public async canPrint(canPrintParams: CanPrintParams): Promise<boolean>;
  /**
   * Check if the user can print a doctype
   * @param doctype The target doctype
   * @deprecated
   * @returns {Promise<boolean>} true if allowed, false otherwise
   */
  // tslint:disable-next-line: unified-signatures
  public async canPrint(doctype: string): Promise<boolean>;
  public async canPrint(
    canPrintParams: CanPrintParams | string
  ): Promise<boolean> {
    let args: CanPrintParams;
    if (typeof canPrintParams === "string") {
      console.warn(
        "LTS-Renovation-Core",
        "canPrint(doctype) is deprecated",
        "Please use the interfaced method instead"
      );
      args = {
        doctype: canPrintParams
      };
    } else {
      args = canPrintParams;
    }
    return await this.canInUserPermissions("can_print", args.doctype);
  }

  /**
   * Check if the user can email a doctype
   * @param {CanEmailParams} canEmailParams
   * @returns {Promise<boolean>} true if allowed, false otherwise
   */
  public async canEmail(canEmailParams: CanEmailParams): Promise<boolean>;
  /**
   * Check if the user can email a doctype
   * @param doctype The target doctype
   * @deprecated
   * @returns {Promise<boolean>} true if allowed, false otherwise
   */
  // tslint:disable-next-line: unified-signatures
  public async canEmail(doctype: string): Promise<boolean>;
  public async canEmail(
    canEmailParams: CanEmailParams | string
  ): Promise<boolean> {
    let args: CanEmailParams;
    if (typeof canEmailParams === "string") {
      console.warn(
        "LTS-Renovation-Core",
        "canEmail(doctype) is deprecated",
        "Please use the interfaced method instead"
      );
      args = {
        doctype: canEmailParams
      };
    } else {
      args = canEmailParams;
    }
    return await this.canInUserPermissions("can_email", args.doctype);
  }

  /**
   * Check if the user can search a doctype
   * @param {CanSearchParams} canSearchParams
   * @returns {Promise<boolean>} true if allowed, false otherwise
   */
  public async canSearch(canSearchParams: CanSearchParams): Promise<boolean>;
  /**
   * Check if the user can search a doctype
   * @param doctype The target doctype
   * @deprecated
   * @returns {Promise<boolean>} true if allowed, false otherwise
   */
  // tslint:disable-next-line: unified-signatures
  public async canSearch(doctype: string): Promise<boolean>;
  public async canSearch(
    canSearchParams: CanSearchParams | string
  ): Promise<boolean> {
    let args: CanSearchParams;
    if (typeof canSearchParams === "string") {
      console.warn(
        "LTS-Renovation-Core",
        "canSearch(doctype) is deprecated",
        "Please use the interfaced method instead"
      );
      args = {
        doctype: canSearchParams
      };
    } else {
      args = canSearchParams;
    }
    return await this.canInUserPermissions("can_search", args.doctype);
  }

  /**
   * Check if the user can get report of a doctype
   * @param {CanGetReportParams} canGetReportParams
   * @returns {Promise<boolean>} true if allowed, false otherwise
   */
  public async canGetReport(
    canGetReportParams: CanGetReportParams
  ): Promise<boolean>;
  /**
   * Check if the user can get report of a doctype
   * @param doctype The target doctype
   * @deprecated
   * @returns {Promise<boolean>} true if allowed, false otherwise
   */
  // tslint:disable-next-line: unified-signatures
  public async canGetReport(doctype: string): Promise<boolean>;
  public async canGetReport(
    canGetReportParams: CanGetReportParams | string
  ): Promise<boolean> {
    let args: CanGetReportParams;
    if (typeof canGetReportParams === "string") {
      console.warn(
        "LTS-Renovation-Core",
        "canGetReport(doctype) is deprecated",
        "Please use the interfaced method instead"
      );
      args = {
        doctype: canGetReportParams
      };
    } else {
      args = canGetReportParams;
    }
    return await this.canInUserPermissions("can_get_report", args.doctype);
  }

  /**
   * Check if the user can set user permissions of a doctype
   * @param {CanSetUserPermissionsParams} canSetUserPermissionsParams
   * @returns {Promise<boolean>} true if allowed, false otherwise
   */
  public async canSetUserPermissions(
    canSetUserPermissionsParams: CanSetUserPermissionsParams
  ): Promise<boolean>;
  /**
   * Check if the user can set user permissions of a doctype
   * @param doctype The target doctype
   * @deprecated
   * @returns {Promise<boolean>} true if allowed, false otherwise
   */
  // tslint:disable-next-line: unified-signatures
  public async canSetUserPermissions(doctype: string): Promise<boolean>;
  public async canSetUserPermissions(
    canSetUserPermissionsParams: CanSetUserPermissionsParams | string
  ): Promise<boolean> {
    let args: CanSetUserPermissionsParams;
    if (typeof canSetUserPermissionsParams === "string") {
      console.warn(
        "LTS-Renovation-Core",
        "canSetUserPermissions(doctype) is deprecated",
        "Please use the interfaced method instead"
      );
      args = {
        doctype: canSetUserPermissionsParams
      };
    } else {
      args = canSetUserPermissionsParams;
    }
    return await this.canInUserPermissions(
      "can_set_user_permissions",
      args.doctype
    );
  }

  /**
   * Check if the user can submit a doctype. The permission cache needs to be loaded
   * @param {CanSubmitParams} canSubmitParams
   * @returns {boolean} true if allowed, false otherwise
   */
  public async canSubmit(canSubmitParams: CanSubmitParams): Promise<boolean>;
  /**
   * Check if the user can submit a doctype. The permission cache needs to be loaded
   * @param doctype The target doctype
   * @deprecated
   * @returns {boolean} true if allowed, false otherwise
   */
  // tslint:disable-next-line: unified-signatures
  public async canSubmit(doctype: string): Promise<boolean>;
  public async canSubmit(
    canSubmitParams: CanSubmitParams | string
  ): Promise<boolean> {
    let args: CanSubmitParams;
    if (typeof canSubmitParams === "string") {
      console.warn(
        "LTS-Renovation-Core",
        "canSubmit(doctype) is deprecated",
        "Please use the interfaced method instead"
      );
      args = {
        doctype: canSubmitParams
      };
    } else {
      args = canSubmitParams;
    }
    // not provided in bootinfo
    const perms = this.doctypePerms[args.doctype];
    if (perms) {
      return perms[0].submit || false;
    }
    console.warn(
      "Renovation Core",
      "Permissions",
      "Permission Cache not loaded to retrieve correct perm for canSubmit"
    );
    // no perms
    return false;
  }

  /**
   * Check if the user can amend a doctype. The permission cache needs to be loaded
   * @param {CanAmendParams} canAmendParams
   * @returns {boolean} true if allowed, false otherwise
   */
  public async canAmend(canAmendParams: CanAmendParams): Promise<boolean>;
  /**
   * Check if the user can amend a doctype. The permission cache needs to be loaded
   * @param doctype The target doctype
   * @deprecated
   * @returns {boolean} true if allowed, false otherwise
   */
  // tslint:disable-next-line: unified-signatures
  public async canAmend(doctype: string): Promise<boolean>;
  public async canAmend(
    canAmendParams: CanAmendParams | string
  ): Promise<boolean> {
    let args: CanCreateParams;
    if (typeof canAmendParams === "string") {
      console.warn(
        "LTS-Renovation-Core",
        "canAmend(doctype) is deprecated",
        "Please use the interfaced method instead"
      );
      args = {
        doctype: canAmendParams
      };
    } else {
      args = canAmendParams;
    }
    // not provided in bootinfo
    const perms = this.doctypePerms[args.doctype];
    if (perms) {
      return perms[0].amend || false;
    }
    console.warn(
      "Renovation Core",
      "Permissions",
      "Permission Cache not loaded to retrieve correct perm for canSubmit"
    );
    // no perms
    return false;
  }

  /**
   * Check if the user can recursively delete a doctype. The permission cache needs to be loaded
   * @param {CanRecursiveDeleteParams} canRecursiveDeleteParams
   * @returns {boolean} true if allowed, false otherwise
   */
  public async canRecursiveDelete(
    canRecursiveDeleteParams: CanRecursiveDeleteParams
  ): Promise<boolean>;
  /**
   * Check if the user can recursively delete a doctype. The permission cache needs to be loaded
   * @param doctype The target doctype
   * @returns {boolean} true if allowed, false otherwise
   * @deprecated
   */
  // tslint:disable-next-line: unified-signatures
  public async canRecursiveDelete(doctype: string): Promise<boolean>;
  public async canRecursiveDelete(
    canRecursiveDeleteParams: CanRecursiveDeleteParams | string
  ): Promise<boolean> {
    let args: CanRecursiveDeleteParams;
    if (typeof canRecursiveDeleteParams === "string") {
      console.warn(
        "LTS-Renovation-Core",
        "canRecursiveDelete(doctype) is deprecated",
        "Please use the interfaced method instead"
      );
      args = {
        doctype: canRecursiveDeleteParams
      };
    } else {
      args = canRecursiveDeleteParams;
    }
    const perms = this.doctypePerms[args.doctype];
    if (perms) {
      return perms[0].recursive_delete || false;
    }
    console.warn(
      "Renovation Core",
      "Permissions",
      "Permission Cache not loaded to retrieve correct perm for canSubmit"
    );
    // no perms
    return false;
  }

  /**
   * Check if the user has the permission part of the basic permissions
   *
   * If the basic permissions aren't loaded, they are loaded first
   * @param arrayProp The property of the permission
   * @param doctype The target doctype
   * @returns {boolean} true if allowed, false otherwise
   */
  private async canInUserPermissions(
    arrayProp: string,
    doctype: string
  ): Promise<boolean> {
    if (!this.validateBasicPerms()) {
      await this.loadBasicPerms();
    }
    return (
      this.basicPerms &&
      this.basicPerms[arrayProp] &&
      this.basicPerms[arrayProp].indexOf &&
      this.basicPerms[arrayProp].indexOf(doctype) >= 0
    );
  }

  /**
   * Verifies if basic perms is valid
   * and the user to which it was originally loaded is actually the current user
   */
  private validateBasicPerms() {
    if (!this.basicPerms || this.basicPerms.isLoading) {
      // just return false here
      return false;
    } else if (
      this.basicPerms &&
      this.basicPerms._user !== this.getCore().auth.getCurrentUser()
    ) {
      console.warn("LTS-Renovation-Core", "Basic Perm mismatch");
      this.basicPerms = null;
      return false;
    }
    return true;
  }
}

interface BasicPermInfo {
  can_search: string[];
  can_email: string[];
  can_export: string[];
  can_get_report: string[];
  can_cancel: string[];
  can_print: string[];
  can_set_user_permissions: string[];
  can_delete: string[];
  can_write: string[];
  can_import: string[];
  can_read: string[];
  can_create: string[];
  isLoading?: boolean;
  /** the user to whom this perm was loaded */
  _user: string;
}
