import { DBBasicValues, DBFilter } from "../utils/filters";
import DocField from "./docfield";
import RenovationDocument from "./document";

export interface NewDocParams {
  doctype: string;
}

export interface GetNewNameParams {
  doctype: string;
}

export interface CopyDocParams {
  doc: RenovationDocument;
}

export interface AmendDocParams {
  doc: RenovationDocument;
}

export interface AddChildDocParams {
  doc: RenovationDocument;
  field: string | DocField;
}

export interface DeleteDocParams {
  doctype: string;
  docname: string;
}

export type GetDocParams =
  | { [x: string]: DBBasicValues }
  | { doctype: string; docname: string; forceFetch?: boolean };

export interface GetListParams {
  doctype: string;
  fields?: string[];
  orderBy?: string;
  limitPageStart?: number;
  limitPageLength?: number;
  filters?: DBFilter;
  parent?: string;
  tableFields?: {
    [x: string]: string[];
  };
  withLinkFields?: string[];
}

export interface GetReportParams {
  report: string;
  filters: { [x: string]: DBBasicValues };
  user?: string;
}

export interface GetValueParams {
  doctype: string;
  docname: string;
  docfield: string;
}

export interface SetValueParams {
  doctype: string;
  docname: string;
  docfield: string;
  value: DBBasicValues;
}

export interface SetLocalValueParams {
  doctype: string;
  docname: string;
  docfield: string;
  value: DBBasicValues;
}

export interface SaveDocParams {
  doc: RenovationDocument;
}

export interface SubmitDocParams {
  doc: RenovationDocument;
}

export interface SaveSubmitDocParams {
  doc: RenovationDocument;
}

export interface CancelDocParams {
  doc: RenovationDocument;
}

export interface SearchLinkParams {
  doctype: string;
  txt: string;
  options?: unknown;
}

export interface AddToLocalsParams {
  doc: RenovationDocument;
}

export interface GetFromLocalsParams {
  doctype: string;
  docname: string;
}

export interface AddTagParams {
  doctype: string;
  docname: string;
  tag: string;
}

export interface RemoveTagParams {
  doctype: string;
  docname: string;
  tag: string;
}

export interface GetTaggedDocsParams {
  doctype: string;
  tag: string;
}

export interface GetTagsParams {
  doctype: string;
  likeTag?: string;
}

export interface SearchLinkResponse {
  description: string;
  value: string;
}

export interface AssignDocParams {
  assignTo: string | string[];
  myself?: boolean;
  description?: string;
  dueDate?: string;
  doctype: string;
  docname?: string;
  docnames?: string[];

  notify?: boolean;
  priority?: "Low" | "Medium" | "High";
  /** Use docnames: [] instead while using bulkAssign */
  bulkAssign?: boolean;
}

export interface UnAssignDocParams {
  doctype: string;
  docname: string;
  unAssignFrom: string;
}

export interface GetDocsAssignedToUserParams {
  /** Defaults to current logged in user */
  assignedTo: string;
  doctype?: string;
  /** Default: Open */
  status?: "Open" | "Closed";
}

export interface GetDocsAssignedToUserResponse {
  /** Time to finish task (yyyy-mm-dd) */
  dueDate: string;
  status: "Open" | "Closed";
  /** DocName of the User who assigned this doc originally */
  assignedBy: string;
  /** Full name of the assigned by user */
  assignedByFullName: string;
  /** The assigned to User */
  assignedTo: string;
  priority: "High" | "Medium" | "Low";
  description: string;
  doctype: string;
  docname: string;
}

export interface GetUsersAssignedToDocParams {
  doctype: string;
  docname: string;
}

export interface CompleteDocAssignmentParams {
  doctype: string;
  docname: string;
  assignedTo: string;
}

export interface GetUsersAssignedToDocResponse {
  assignedTo: string;
  /** DocName of the User who assigned this doc originally */
  assignedBy: string;
  /** Full name of the assigned by user */
  assignedByFullName: string;
  /** Time to finish task (yyyy-mm-dd) */
  dueDate: string;
  status: "Open" | "Closed";
  priority: "High" | "Medium" | "Low";
  description: string;
}

export interface GetExportReportParams {
  reportName: string;
  fileFormatType?: "Excel" | "PDF";
  filters?: DBFilter;
  visibleIDX: number[];
  includeIndentation?: number;
}
