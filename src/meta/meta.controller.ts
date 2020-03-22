import { RequestResponse } from "..";
import DocType from "../model/doctype";
import RenovationController from "../renovation.controller";
import { DBFilter } from "../utils/filters";
import { toTitleCase } from "../utils/string";
import {
  DocInfo,
  GetDocCountParams,
  GetDocInfoParams,
  GetDocMetaParams,
  GetFieldLabelParams,
  GetReportMetaParams,
  LoadDocTypeScriptsParams,
  ReportMeta
} from "./interfaces";

/**
 * Class responsible for the operations of the doctypes' meta fields
 * @abstract
 */
export default abstract class MetaController extends RenovationController {
  /**
   * Holds the doctype's in the cache
   */
  // tslint:disable-next-line: variable-name
  private _docTypeCache: { [x: string]: DocType } = {};

  /**
   * Getter for the doctype Cache
   */
  public get docTypeCache() {
    return this._docTypeCache;
  }

  /**
   * Set the doctype cache. If a `null` or `undefined` value is passed, the cache is set to an empty object
   * @param v The whole doctype cache
   */
  public set docTypeCache(v: { [x: string]: DocType }) {
    this._docTypeCache = v || {};
  }

  /**
   * Clears all docmeta from the cache
   */
  public clearCache() {
    this.docTypeCache = {};
  }

  /**
   * Gets total number of docs for specified filters
   *
   * @param getDocCountParams {GetDocCountParams}
   * @returns {Promise<RequestResponse<number>>} The number of documents within `RequestResponse`
   */
  public abstract async getDocCount(
    getDocCountParams: GetDocCountParams
  ): Promise<RequestResponse<number>>;
  /**
   * Gets total number of docs for specified filters
   *
   * @param doctype The target doctype
   * @param filters The filters applied to get the doc count. Defaults to no filters
   * @deprecated
   * @returns {Promise<RequestResponse<number>>} The number of documents within `RequestResponse`
   */
  public abstract async getDocCount(
    doctype: string,
    filters?: DBFilter
  ): Promise<RequestResponse<number>>;

  /**
   * Loads a doctype meta
   *
   * Check `getDocMeta`
   *
   * @param doctype The target doctype
   * @deprecated
   * @returns {Promise<RequestResponse<DocType>>} `DocType` with `RequestResponse`.
   *
   * Returns failed `RequestResponse` if doctype not in cache
   */
  public async loadDocType(doctype: string): Promise<RequestResponse<DocType>> {
    console.warn(
      "LTS-Renovation-Core",
      "loadDocType(doctype) is deprecated. Use getDocMeta instead"
    );
    return this.getDocMeta({ doctype });
  }

  /**
   * Gets the docInfo of a certain document of a certain doctypes
   *
   * @param doctype The target doctype
   * @param docname The target docname (identifier)
   * @deprecated
   * @returns {Promise<RequestResponse<DocInfo>>} The document's info within `RequestResponse`
   */
  public abstract async getDocInfo(
    doctype: string,
    docname: string
  ): Promise<RequestResponse<DocInfo>>;
  /**
   * Gets the docInfo of a certain document of a certain doctypes
   *
   * @param getDocInfoParams {GetDocInfoParams}
   *
   * @returns {Promise<RequestResponse<DocInfo>>} The document's info within `RequestResponse`
   */
  public abstract async getDocInfo(
    getDocInfoParams: GetDocInfoParams
  ): Promise<RequestResponse<DocInfo>>;

  /**
   * Gets the report meta of a report
   *
   * @param report The target report
   * @deprecated
   * @returns {Promise<RequestResponse<ReportMeta>>} Report meta within `RequestResponse`
   */
  public abstract async getReportMeta(
    report: string
  ): Promise<RequestResponse<ReportMeta>>;
  /**
   * Gets the report meta of a report
   *
   * @param getReportMetaParams {GetReportMetaParams}
   *
   * @returns {Promise<RequestResponse<ReportMeta>>} Report meta within `RequestResponse`
   */
  public abstract async getReportMeta(
    // tslint:disable-next-line:unified-signatures
    getReportMetaParams: GetReportMetaParams
  ): Promise<RequestResponse<ReportMeta>>;

  /**
   * Gets the label to be used on a field
   * @param getFieldLabelParams {GetFieldLabelParams}
   *
   * @returns {Promise<string>} The field label, otherwise the field will be changed to uppercase
   */
  public async getFieldLabel(
    getFieldLabelParams: GetFieldLabelParams
  ): Promise<string>;
  /**
   * Gets the label to be used on a field
   * @param doctype {string} Target doctype
   * @param fieldname {string} The target field name
   * @deprecated
   * @returns {Promise<string>} The field label, otherwise the field will be changed to uppercase
   */
  public async getFieldLabel(
    doctype: string,
    fieldname: string
  ): Promise<string>;
  public async getFieldLabel(
    getFieldLabelParams: GetFieldLabelParams | string,
    fieldname?: string
  ): Promise<string> {
    const args: GetFieldLabelParams =
      typeof getFieldLabelParams === "string"
        ? { doctype: getFieldLabelParams, fieldname }
        : getFieldLabelParams;

    const docmetaR = await this.getDocMeta({ doctype: args.doctype });
    let label = args.fieldname;
    const standardFields = {
      name: "Name",
      docstatus: "DocStatus"
    };

    if (standardFields.hasOwnProperty(args.fieldname)) {
      label = standardFields[args.fieldname];
    }

    if (!docmetaR.success) {
      console.warn("getFieldLabel: Failed to read docmeta");
    } else {
      const docmeta = docmetaR.data;
      let field = docmeta.fields.find(f => f.fieldname === args.fieldname);
      if (!field) {
        field = docmeta.disabledFields.find(
          f => f.fieldname === args.fieldname
        );
      }
      if (field) {
        label = field.label;
      } else {
        label = toTitleCase(label);
      }
    }

    return this.config.coreInstance.translate.getMessage({ txt: label });
  }

  /**
   * Similar to loadDoctype, but checks cache first
   * @param getDocMetaParams {GetDocMetaParams}
   * @returns {Promise<RequestResponse<DocType>>} `DocType` within `RequestResponse`.
   */
  public abstract async getDocMeta(
    getDocMetaParams: GetDocMetaParams
  ): Promise<RequestResponse<DocType>>;
  /**
   * Similar to loadDoctype, but checks cache first
   * @param doctype The target doctype
   * @deprecated
   * @returns {Promise<RequestResponse<DocType>>} `DocType` within `RequestResponse`.
   */
  public abstract async getDocMeta(
    // tslint:disable-next-line:unified-signatures
    doctype: string
  ): Promise<RequestResponse<DocType>>;

  /**
   * Loads the scripts of a doctype
   *
   * @param loadDocTypeScriptsParams {LoadDocTypeScriptsParams}
   * @returns {Promise<RequestResponse<boolean>>} Whether the Doctype Script is loaded
   */
  protected async loadDoctypeScripts(
    loadDocTypeScriptsParams: LoadDocTypeScriptsParams
  ): Promise<RequestResponse<boolean>>;
  /**
   * Loads the scripts of a doctype
   *
   * @param doctype The target doctype
   * @returns {Promise<RequestResponse<boolean>>} Whether the Doctype Script is loaded
   * @deprecated
   */
  protected async loadDoctypeScripts(
    // tslint:disable-next-line:unified-signatures
    doctype: string
  ): Promise<RequestResponse<boolean>>;
  protected async loadDoctypeScripts(
    doctype: LoadDocTypeScriptsParams | string
  ): Promise<RequestResponse<boolean>> {
    const dt = typeof doctype === "string" ? doctype : doctype.doctype;
    return this.config.coreInstance.scriptManager.loadScripts({ doctype: dt });
  }
}
