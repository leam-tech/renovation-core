import { underScoreToCamel } from "../utils/string";

/**
 * ifOwner & _ifOwner
 * ifOwner is available in DocPerm only.
 * _ifOwner is available in Permission
 * -->  ifOwner specifies that this instance (or line) of DocPerm is applicable only if user is owner
 * -->  _ifOwner signifies the set of permissions to apply if user if the owner
 */

// tslint:disable-next-line:interface-name
export interface Permission {
  create: boolean;
  read: boolean;
  write: boolean;
  delete: boolean;
  submit: boolean;
  cancel: boolean;
  amend: boolean;
  report: boolean;
  import: boolean;
  export: boolean;
  print: boolean;
  email: boolean;
  share: boolean;
  recursive_delete: boolean;
  setUserPermissions: boolean;
  permLevel: number;
  _ifOwner: Partial<Permission>;
}

/**
 * Class containing properties of a document permissions.
 */
export class DocPerm implements Partial<Permission> {
  /**
   * Helper method to parse DocPerms from frappe format to another format. The below are the operations done on the docperms
   *
   * - Change bool types to true/false instead of 1/0 respectively
   * - Change underscore naming syntax to camelCase
   * @param perm The target permission
   * @returns {DocPerm} The parsed docperm
   */
  public static fromFrappeDocPerm(perm: FrappeDocPerm): DocPerm {
    const dp = new DocPerm();
    // tslint:disable-next-line:forin
    for (const k in perm) {
      const kF = underScoreToCamel(k);
      const value = kF in PermissionType ? perm[k] === 1 : perm[k];
      dp[kF] = value;
    }
    // tslint:disable-next-line:no-string-literal
    delete dp["permlevel"]; // comes since there is no _
    dp.permLevel = perm.permlevel;
    dp.ifOwner = perm.if_owner === 1;
    return dp;
  }

  // Permission Start
  /**
   * Read permission
   */
  public read: boolean = false;
  /**
   * Create permission
   */
  public create: boolean = false;
  /**
   * Write permission
   */
  public write: boolean = false;

  /**
   * Delete permission
   */
  public delete: boolean = false;
  /**
   * Submit permission
   */
  public submit: boolean = false;
  /**
   * Cancel permission
   */
  public cancel: boolean = false;
  /**
   * Amend permission
   */
  public amend: boolean = false;
  /**
   * Report permission
   */
  public report: boolean = false;
  /**
   * Import permission
   */
  public import: boolean = false;
  /**
   * Export permission
   */
  public export: boolean = false;
  /**
   * Print permission
   */
  public print: boolean = false;
  /**
   * Email permission
   */
  public email: boolean = false;
  /**
   * Share permission
   */
  public share: boolean = false;
  /**
   * Set User Permissions permission
   */
  public setUserPermissions: boolean = false;
  // Permission End

  /**
   * Current role
   */
  public role: string = "";
  /**
   * Whether the user is owner of a document
   */
  public ifOwner: boolean = false;
  /**
   * The level of permissions (0-9)
   */
  public permLevel: number = 0;
}

export enum PermissionType {
  create = "create",
  read = "read",
  write = "write",
  delete = "delete",
  submit = "submit",
  cancel = "cancel",
  amend = "amend",
  report = "report",
  import = "import",
  export = "export",
  print = "print",
  recursive_delete = "recursive_delete",
  email = "email",
  share = "share",
  setUserPermissions = "setUserPermissions"
}

export interface FrappeDocPerm {
  amend: 0 | 1;
  cancel: 0 | 1;
  create: 0 | 1;
  creation: "20 | 113-0 | 15-0 | 13 10 | 1:45:46";
  delete: 0 | 1;
  docstatus: 0 | 1;
  doctype: "DocPerm";
  email: 0 | 1;
  export: 0 | 1;
  idx: number;
  if_owner: 0 | 1;
  import: 0 | 1;
  match: null;
  modified: string;
  modified_by: string;
  name: string;
  owner: string;
  parent: string;
  parentfield: "permissions";
  parenttype: "DocType";
  permlevel: 0 | 1;
  print: 0 | 1;
  read: 0 | 1;
  recursive_delete: 0 | 1;
  report: 0 | 1;
  role: string;
  set_user_permissions: 0 | 1;
  share: 0 | 1;
  submit: 0 | 1;
  write: 0 | 1;
}
