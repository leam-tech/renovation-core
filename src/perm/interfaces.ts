import RenovationDocument from "../model/document";
import { PermissionType } from "./perm.model";

export interface HasPermParams {
  doctype: string;
  ptype: PermissionType;
  permLevel?: number;
  docname?: string;
}

export interface HasPermsParams {
  doctype: string;
  ptypes: PermissionType[];
  docname?: string;
}

export interface GetPermParams {
  doctype: string;
  doc?: RenovationDocument;
}

export interface CanCreateParams {
  doctype: string;
}

export interface CanReadParams {
  doctype: string;
}

export interface CanWriteParams {
  doctype: string;
}

export interface CanCancelParams {
  doctype: string;
}

export interface CanDeleteParams {
  doctype: string;
}

export interface CanImportParams {
  doctype: string;
}

export interface CanExportParams {
  doctype: string;
}

export interface CanPrintParams {
  doctype: string;
}

export interface CanEmailParams {
  doctype: string;
}

export interface CanSearchParams {
  doctype: string;
}

export interface CanGetReportParams {
  doctype: string;
}

export interface CanSetUserPermissionsParams {
  doctype: string;
}

export interface CanSubmitParams {
  doctype: string;
}

export interface CanAmendParams {
  doctype: string;
}

export interface CanRecursiveDeleteParams {
  doctype: string;
}
