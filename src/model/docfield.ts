import { underScoreToCamel } from "../utils/string";

enum DocFieldType {
  number,
  string,
  date,
  datetime
}

/**
 * Class containing properties of a docfield. In addition, it contains helper functions for frappe docs.
 */
export default class DocField {
  /**
   * Helper method to parse DocFields from frappe format to another format. The below are the operations done on the docfield
   *
   * - Change bool types to true/false instead of 1/0 respectively
   * - Change underscore naming syntax to camelCase
   * @param field The target field
   * @returns {DocField} The parsed docfield
   */
  public static fromFrappeDocField(field: FrappeDocField): DocField {
    const f = new DocField();

    const boolTypes = [
      "reqd",
      "search_index",
      "in_list_view",
      "in_standard_filter",
      "in_global_search",
      "bold",
      "collapsible",
      "hidden",
      "read_only",
      "unique",
      "set_only_once",
      "allow_bulk_edit",
      "ignore_user_permissions",
      "allow_on_submit",
      "report_hide",
      "remember_last_selected_value",
      "ignore_xss_filter",
      "in_filter",
      "no_copy",
      "print_hide",
      "print_hide_if_no_value",
      "translatable"
    ];

    // tslint:disable-next-line:forin
    for (const prop in field) {
      const value =
        boolTypes.indexOf(prop) >= 0 ? field[prop] === 1 : field[prop];
      f[underScoreToCamel(prop)] = value;
    }
    return f;
  }

  [x: string]: any;

  /**
   * The human readable label of the field
   *
   * For example: `item_name` field would have a label called "Item Name"
   */
  public label: string = "";

  /**
   * The type of the fields defined in frappe such as `Data`, `Link`, `Select`, etc
   */
  public fieldtype = "";

  /**
   * The name of the field which is the field's identifier
   */
  public fieldname = "";

  /**
   * Options contained for the docfield.
   *
   * Link datatype will hold the doctype of the linked doctype
   * Select datatype will contain the list of the options delimited by a line break
   */
  public options = "";

  /**
   * Whether the field is mandatory
   */
  public reqd = false;

  /**
   * Whether the field is hidden
   */
  public hidden: boolean = false;

  /**
   * Whether the field is collapsible in the UI
   */
  public collapsible = false;

  /**
   * Whether the field is not editable and just read-only
   */
  public readOnly = false;

  /**
   * Whether the field is translatable
   */
  public translatable = false;

  /**
   * Whether the field should appear in the list view of the doctype
   */
  public inListView = false;

  /**
   * Whether to include the field in the default filters appearing in list view, for instance
   */
  public inStandardFilter = false;
}

export type DocFieldTypes =
  | "Attach"
  | "Attach Image"
  | "Barcode"
  | "Button"
  | "Check"
  | "Code"
  | "Color"
  | "Column Break"
  | "Currency"
  | "Data"
  | "Date"
  | "Datetime"
  | "Dynamic Link"
  | "Float"
  | "Fold"
  | "Geolocation"
  | "Heading"
  | "HTML"
  | "HTML Editor"
  | "Image"
  | "Int"
  | "Link"
  | "Long Text"
  | "Password"
  | "Percent"
  | "Read Only"
  | "Section Break"
  | "Select"
  | "Small Text"
  | "Table"
  | "Text"
  | "Text Editor"
  | "Time"
  | "Signature";

export interface FrappeDocField {
  allow_bulk_edit: 0 | 1;
  allow_in_quick_entry: 0 | 1;
  allow_on_submit: 0 | 1;
  bold: 0 | 1;
  collapsible: 0 | 1;
  collapsible_depends_on: string;
  columns: 0 | 1;
  creation: string;
  default: string;
  depends_on: string;
  description: string;
  docstatus: 0 | 1;
  doctype: "DocField";
  fetch_from: string;
  fetch_if_empty: 0 | 1;
  fieldname: string;
  fieldtype: DocFieldTypes;
  hidden: 0 | 1;
  idx: number;
  ignore_user_permissions: 0 | 1;
  ignore_xss_filter: 0 | 1;
  in_filter: 0 | 1;
  in_global_search: 0 | 1;
  in_list_view: 0 | 1;
  in_standard_filter: 0 | 1;
  is_custom_field: boolean;
  label: string;
  length: 0 | 1;
  linked_document_type: string;
  modified: string;
  modified_by: string;
  name: string;
  no_copy: 0 | 1;
  oldfieldname: string;
  oldfieldtype: string;
  options: string;
  owner: string;
  parent: string;
  parentfield: "fields";
  parenttype: "DocType";
  permlevel: 0 | 1;
  precision: string;
  print_hide: 0 | 1;
  print_hide_if_no_value: 0 | 1;
  print_width: string;
  read_only: 0 | 1;
  remember_last_selected_value: 0 | 1;
  report_hide: 0 | 1;
  reqd: 0 | 1;
  search_fields: string;
  search_index: 0 | 1;
  set_only_once: 0 | 1;
  translatable: 0 | 1;
  trigger: string;
  unique: 0 | 1;
  width: string;
}
