import { DocFieldTypes } from "../model/docfield";
import { DocPerm } from "../perm/perm.model";
import { DBFilter } from "../utils/filters";

export interface GetDocCountParams {
  doctype: string;
  filters?: DBFilter;
}

export interface GetDocInfoParams {
  doctype: string;
  docname: string;
}

export interface DocInfo {
  attachments: [
    {
      file_name: string;
      file_url: string;
      name: string;
      is_private: string;
    }
  ];
  assignments: [];
  communications: [];
  permissions: DocPerm;
  rating: number;
  shared: [];
  total_comments: number;
  versions: [
    {
      owner: string;
      creation: string;
      name: string;
      data: string;
    }
  ];
  views: [];
}

export interface ReportMeta {
  name: string;
  doctype: string;
  filters: [
    {
      default_value: string;
      fieldname: string;
      fieldtype: DocFieldTypes;
      options: string;
      label: string;
    }
  ];
  report: string;
}

export interface GetReportMetaParams {
  report: string;
}

export interface GetFieldLabelParams {
  doctype: string;
  fieldname: string;
}

export interface GetDocMetaParams {
  doctype: string;
}

export interface LoadDocTypeScriptsParams {
  doctype: string;
}
