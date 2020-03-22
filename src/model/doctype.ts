import { DocPerm, FrappeDocPerm } from "../perm/perm.model";
import { underScoreToCamel } from "../utils/string";
import DocField, { FrappeDocField } from "./docfield";

/**
 * Class containing properties of a doctype. In addition, it contains helper functions for frappe docs.
 */
export default class DocType {
  [x: string]: any;

  /**
   * Helper method to parse DocType from frappe format to another format. The below are the operations done on the docfield
   *
   * - Change bool types to true/false instead of 1/0 respectively
   * - Change underscore naming syntax to camelCase
   * - Setup permissions for the doctype
   * @param meta The meta details of a doctype
   * @returns {DocType} The parsed doctype
   */
  public static fromFrappeDocType(meta: FrappeDocType): DocType {
    const dt = new DocType(meta.name);
    const boolTypes = [
      "istable",
      "issingle",
      "editable_grid",
      "quick_entry",
      "track_changes",
      "custom",
      "beta",
      "image_view",
      "track_seen",
      "read_only_onload",
      "hide_heading",
      "hide_toolbar",
      "allow_copy",
      "show_name_in_global_search",
      "is_submittable",
      "allow_import",
      "allow_rename",
      "read_only",
      "in_create",
      "has_web_view",
      "allow_guest_to_view",
      "treeview"
    ];

    // tslint:disable-next-line:forin
    for (const prop in meta) {
      const value =
        boolTypes.indexOf(prop) >= 0 ? meta[prop] === 1 : meta[prop];
      dt[underScoreToCamel(prop)] = value;
    }

    const fields: DocField[] = [];
    for (const f of meta.fields) {
      fields.push(DocField.fromFrappeDocField(f));
    }
    // tslint:disable-next-line:variable-name
    const _fields: DocField[] = [];
    for (const f of meta._fields) {
      _fields.push(DocField.fromFrappeDocField(f));
    }

    // permissions
    const permissions: DocPerm[] = [];
    for (const f of meta.permissions || []) {
      permissions.push(DocPerm.fromFrappeDocPerm(f));
    }
    dt.permissions = permissions;

    const customMap = {
      issingle: "isSingle",
      istable: "isTable"
    };
    // tslint:disable-next-line:forin
    for (const k in customMap) {
      const value = boolTypes.indexOf(k) >= 0 ? meta[k] === 1 : meta[k];
      dt[customMap[k]] = value;
      if (k in dt) {
        delete dt[k];
      }
    }

    dt.disabledFields = _fields;
    dt.fields = fields;
    dt.doctype = meta.name; // since loop overwrites

    return dt;
  }

  /**
   * The name of the field to refer for the image
   */
  public imageField: string = "";

  /**
   * Whether the doctype is submittable. A submittable document can't be deleted once submitted, but rather cancelled
   */
  public isSubmittable = false;

  /**
   * Whether the document is a single type meaning there will only be one document of a doctype
   */
  public isSingle = false;

  /**
   * Whether the document is a table that can be set as a child of another table
   */
  public isTable = false;

  /**
   * The field to refer to as the Title
   */
  public titleField = "";

  /**
   * Whether the document should be presented in a tree view
   */
  public treeview = false;
  /**
   * Hidden fields
   */
  // tslint:disable-next-line:variable-name
  public disabledFields: DocField[] = [];
  /**
   * The fields of the doctype
   */
  public fields: DocField[] = [];
  /**
   * The permissions of the doctype
   */
  public permissions: DocPerm[] = [];

  constructor(public doctype: string) {}
}

export interface FrappeDocType {
  allow_copy: 0;
  allow_events_in_timeline: 0;
  allow_guest_to_view: 0;
  allow_import: 1;
  allow_rename: 1;
  app: string;
  autoname: "field:item_code";
  beta: 0;
  color: string;
  colour: string;
  creation: "2013-05-03 10:45:46";
  custom: 0;
  default_print_format: "";
  description: "A Product or a Service that is bought, sold or kept in stock.";
  docstatus: 0;
  doctype: "DocType";
  document_type: "Setup";
  editable_grid: 1;
  engine: "InnoDB";
  fields: FrappeDocField[];
  has_web_view: 0;
  hide_heading: 0;
  hide_toolbar: 0;
  icon: "fa fa-tag";
  idx: 2;
  image_field: "image";
  image_view: 0;
  in_create: 0;
  is_published_field: boolean;
  is_submittable: 0;
  issingle: 0;
  istable: 0;
  max_attachments: 1;
  menu_index: number;
  modified: "2019-04-05 12:03:24.530849";
  modified_by: "Administrator";
  module: "Stock";
  name: "Item";
  name_case: "";
  owner: "Administrator";
  parent: string;
  parent_node: string;
  parentfield: string;
  parenttype: string;
  permissions: FrappeDocPerm[];
  print_outline: string;
  quick_entry: 1;
  read_only: 0;
  read_only_onload: 0;
  renovation_scripts: { code: string; name: string };
  restrict_to_domain: string;
  route: string;
  search_fields: "item_name,description,item_group,customer_code";
  show_name_in_global_search: 1;
  smallicon: null;
  sort_field: "idx desc,modified desc";
  sort_order: "DESC";
  subject: string;
  tag_fields: string;
  timeline_field: string;
  title_field: "item_name";
  track_changes: 1;
  track_seen: 0;
  track_views: 0;
  treeview: 0;
  __assets_loaded: true;
  __calendar_js: string;
  __css: string;
  __custom_js: "";
  __dashboard: unknown;
  __form_grid_templates: string;
  __js: string;
  __kanban_column_fields: [];
  __linked_with: string;
  __list_js: string;
  __listview_template: string;
  __map_js: string;
  __messages: string;
  __print_formats: string;
  __templates: string;
  __tree_js: string;
  __workflow_docs: [];
  _assign: string;
  _comments: string;
  _fields: FrappeDocField[];
  _last_update: string;
  _liked_by: string;
  _user_tags: string;
}
