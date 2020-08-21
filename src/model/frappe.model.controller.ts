import { RenovationConfig } from "../config";
import RenovationController from "../renovation.controller";
import {
  deepCompare,
  getJSON,
  renovationError,
  renovationLog,
  renovationWarn
} from "../utils";
import { ErrorDetail } from "../utils/error";
import { DBBasicValues, DBFilter } from "../utils/filters";
import {
  contentType,
  FrappeRequestOptions,
  httpMethod,
  RenovationError,
  Request,
  RequestResponse
} from "../utils/request";
import RenovationDocument from "./document";
import {
  AddTagParams,
  AssignDocParams,
  CancelDocParams,
  CompleteDocAssignmentParams,
  DeleteDocParams,
  GetDocParams,
  GetDocsAssignedToUserParams,
  GetDocsAssignedToUserResponse,
  GetExportReportParams,
  GetListParams,
  GetReportParams,
  GetTaggedDocsParams,
  GetTagsParams,
  GetUsersAssignedToDocParams,
  GetUsersAssignedToDocResponse,
  GetValueParams,
  RemoveTagParams,
  SaveDocParams,
  SaveSubmitDocParams,
  SearchLinkParams,
  SearchLinkResponse,
  SetValueParams,
  SubmitDocParams,
  UnAssignDocParams
} from "./interfaces";
import ModelController from "./model.controller";

/**
 * Frappe Model Controller containing methods and properties related to document CRUD operations extended from parent class
 */
export default class FrappeModelController extends ModelController {
  public handleError(errorId: string, error: ErrorDetail): ErrorDetail {
    let err = {} as ErrorDetail;
    switch (errorId) {
      case "get_doc":
        if (
          error.info &&
          ((error.info.data &&
            error.info.data.exception &&
            error.info.data.exception.includes("DoesNotExistError")) ||
            error.info.httpCode === 404)
        ) {
          err = this.handleError("non_existing_doc", error);
        } else if (error.info.httpCode === 412) {
          err = this.handleError("wrong_input", error);
        } else {
          err = this.handleError(null, error);
        }
        break;

      case "wrong_input":
        err = {
          ...error,
          type: RenovationError.DataFormatError,
          title: "Wrong input",
          info: {
            ...error.info,
            httpCode: 412,
            cause: "The input arguments are in the wrong type/format",
            suggestion:
              "Use the correct parameters types/formats referencing the functions signature"
          }
        };
        break;
      case "delete_doc":
      case "get_report":
        renovationLog(error);
        if (error.info.httpCode === 404) {
          err = this.handleError("non_existing_doc", error);
        } else {
          err = this.handleError(null, error);
        }
        break;
      case "set_value":
      case "add_tag":
      case "remove_tag":
        if (error.info.httpCode === 500) {
          err = this.handleError("non_existing_doctype", error);
        } else if (error.info.httpCode === 404) {
          err = this.handleError("non_existing_doc", error);
        } else {
          err = this.handleError(null, error);
        }
        break;

      case "get_value":
        if (error.info.httpCode === 404) {
          err = this.handleError("non_existing_doctype", error);
        } else if (
          error.info.httpCode === 200 &&
          deepCompare(error.info.data, {})
        ) {
          err = this.handleError("non_existing_doc", error);
        } else if (error.info.httpCode === 500) {
          err = this.handleError("non_existing_docfield", error);
        } else {
          this.handleError(null, error);
        }
        break;

      case "save_doc":
        if (
          error.info &&
          error.info.data &&
          error.info.data.exception &&
          error.info.data.exception.includes("DuplicateEntryError")
        ) {
          err = {
            ...error,
            title: "Duplicate document found",
            type: RenovationError.DuplicateEntryError,
            info: {
              ...error.info,
              httpCode: 409,
              cause: "Duplicate doc found while saving",
              suggestion:
                "Change the 'name' field or delete the existing document"
            }
          };
        } else {
          err = this.handleError(null, error);
        }
        break;
      case "submit_doc":
      case "save_submit_doc":
      case "cancel_doc":
        // TODO:
        if (error.info.httpCode === 500) {
          err = this.handleError("non_existing_doctype", error);
        } else if (error.info.httpCode === 404) {
          err = this.handleError("non_existing_doc", error);
        } else {
          err = this.handleError(null, error);
        }
        break;
      case "search_link":
      case "get_tagged_docs":
        if (error.info.httpCode === 404) {
          err = this.handleError("non_existing_doctype", error);
        } else {
          err = this.handleError(null, error);
        }
        break;

      case "get_tags":
        if (error.info.httpCode === 500) {
          err = this.handleError("non_existing_doctype", error);
        } else {
          err = this.handleError(null, error);
        }
        break;

      case "non_existing_doc":
        err = {
          ...error,
          type: RenovationError.NotFoundError,
          title: RenovationController.DOCNAME_NOT_EXIST_TITLE,
          info: {
            ...error.info,
            httpCode: 404,
            cause: "Docname does not exist",
            suggestion:
              "Make sure the queried document name is correct or create the required document"
          }
        };
        break;
      case "non_existing_doctype":
        err = {
          ...error,
          type: RenovationError.NotFoundError,
          title: RenovationController.DOCTYPE_NOT_EXIST_TITLE,
          info: {
            ...error.info,
            httpCode: 404,
            cause: "DocType does not exist",
            suggestion:
              "Make sure the queried DocType is input correctly or create the required DocType"
          }
        };
        break;

      case "non_existing_docfield":
        err = {
          ...error,
          title: "DocField is not valid",
          type: RenovationError.NotFoundError,
          info: {
            ...error.info,
            httpCode: 404,
            cause: "DocField is not defined for the DocType",
            suggestion: "Make sure the docfield is input. It is case-sensitive"
          }
        };
        break;
      case "get_list":
      case "assign_doc":
      case "complete_doc_assignment":
      case "unassign_doc":
      case "get_docs_assigned_to_user":
      case "get_users_assigned_to_doc":
      default:
        err = RenovationController.genericError(error);
    }
    return err;
  }

  /**
   * Gets the document by parsing the object to `RenovationDocument`
   * @param getDocParams The object to be parsed
   * @returns {Promise<RequestResponse<RenovationDocument>>} The parsed document within `RequestResponse`
   */
  public getDoc(
    getDocParams: GetDocParams
  ): Promise<RequestResponse<RenovationDocument>>;

  /**
   * Gets the document from the local cache if it exists, else from the backend
   * @param doctype The target doctype
   * @param docname The document referenced by its name
   * @returns {Promise<RequestResponse<RenovationDocument>>} `RenovationDocument` contained within `RequestResponse`.
   * @deprecated
   * Returns failure if doesn't exist in cache or backend
   */
  public async getDoc(
    doctype: string,
    docname: string
  ): Promise<RequestResponse<RenovationDocument>>;
  public async getDoc(
    getDocParams: GetDocParams | string,
    docname?: string
  ): Promise<RequestResponse<RenovationDocument>> {
    await this.getCore().frappe.checkAppInstalled(["getDoc"], false);
    let args: GetDocParams;
    if (typeof getDocParams === "string") {
      args = {
        doctype: getDocParams,
        docname
      };
      renovationWarn(
        "LTS-Renovation-Core",
        "getDoc(doctype, docname) is deprecated, Please use the interfaced method"
      );
    } else {
      args = getDocParams;
    }

    if (args.doctype && Object.keys(args).indexOf("docname") < 0) {
      return super.getDoc(args);
    }

    if (typeof args.doctype === "string" && typeof args.docname === "string") {
      if (
        this.locals[args.doctype] &&
        this.locals[args.doctype][args.docname] &&
        !args.forceFetch
      ) {
        return super.getDoc(args); // Returns resolved RequestResponse with doc
      }
      let response;
      const config = RenovationConfig.instance;
      if (this.getCore().frappe.getAppVersion("renovation_core")) {
        this.loadDocType(args.doctype);

        response = await Request(
          `${config.hostUrl}/api/method/renovation/doc/` +
            `${encodeURIComponent(args.doctype as string)}/${encodeURIComponent(
              args.docname as string
            )}`,
          httpMethod.GET,
          FrappeRequestOptions.headers
        );
      } else {
        response = await Request(
          `${config.hostUrl}/api/resource/` +
            `${encodeURIComponent(args.doctype as string)}/${encodeURIComponent(
              args.docname as string
            )}`,
          httpMethod.GET,
          FrappeRequestOptions.headers
        );
      }
      if (response.success) {
        const responseObj = getJSON(response.data);
        if (responseObj && responseObj.hasOwnProperty("data")) {
          if (responseObj.data !== "failed") {
            const doc = new RenovationDocument(
              Object.assign({ doctype: args.doctype }, responseObj.data)
            );
            this.addToLocals({ doc });
            return RequestResponse.success(doc);
          }
          response.data = responseObj;
        }
      }
      // Hmm, server doesnt know about this doc.
      // Lets check if it name has something like New DocType
      if (
        args.docname &&
        (args.docname as string).indexOf(`New ${args.doctype}`) >= 0
      ) {
        const doc = await this.newDoc({ doctype: args.doctype as string });
        return RequestResponse.success(doc);
      }
      response.success = false;
      return RequestResponse.fail(
        this.handleError("get_doc", {
          info: {
            data: response.data,
            httpCode: response.httpCode,
            rawResponse: response._
          }
        })
      );
    }
    // Indicates a wrong input
    return RequestResponse.fail(
      this.handleError("get_doc", {
        info: {
          httpCode: 412
        }
      })
    );
  }

  /**
   * Get list of entries on a doc
   *
   * By default, only the name of the documents is fetched
   *
   * By default, child tables are not included and have to be specified under `tableFields` of `GetListParams`
   *
   * If the `fields` property is specified as `["*"]`, all the fields of a document will be fetched as `RenovationDocument[]`
   *
   * @param getListParams The field input as interface `GetListArgument`
   * @returns {Promise<RequestResponse<[{[x: string]: DBBasicValues | [{}]}]>>} The list of documents within `RequestResponse`
   */
  public async getList(
    getListParams: GetListParams
  ): Promise<RequestResponse<[{ [x: string]: DBBasicValues | [{}] }]>>;
  /**
   * Get list of entries on a doc (no child doc)
   *
   * By default, only the name of the documents is fetched
   *
   * By default, child tables are not included and have to be specified under `tableFields` of `GetListParams`
   *
   * If the `fields` property is specified as `["*"]`, all the fields of a document will be fetched as `RenovationDocument[]`
   *
   * @param doctype The target doctype
   * @param fields The fields to include
   * @param filters The filters to be applied when fetching the documents
   * @param orderBy Sorting criteria
   * @param limitPageStart From which document to get (Useful for pagination)
   * @param limitPageLength Number of documents to return
   * @param parent The parent doctype
   * @deprecated
   * @returns {Promise<RequestResponse<[{[x: string]: DBBasicValues | [{}]}]>>} The list of documents within `RequestResponse`
   */
  public async getList(
    doctype: string,
    fields?: string[],
    filters?: DBFilter,
    orderBy?: string,
    limitPageStart?: number,
    limitPageLength?: number,
    parent?: string
  ): Promise<RequestResponse<[{ [x: string]: DBBasicValues | [{}] }]>>;
  public async getList(
    getListParams: string | GetListParams,
    fields?: string[],
    filters?: DBFilter,
    orderBy?: string,
    limitPageStart?: number,
    limitPageLength?: number,
    parent?: string
  ): Promise<RequestResponse<[{ [x: string]: DBBasicValues | [{}] }]>> {
    if (typeof getListParams === "string" || arguments.length > 1) {
      renovationWarn(
        "LTS-Renovation-Core",
        "getList(doctype, fields, filters..) is deprecated, Please use the interfaced method"
      );
      return await this.getList({
        doctype: getListParams as string,
        fields,
        filters,
        orderBy,
        limitPageStart: limitPageStart || 0,
        limitPageLength: limitPageLength || 99,
        parent,
        tableFields: undefined,
        withLinkFields: undefined
      });
    }
    await this.getCore().frappe.checkAppInstalled(["getList"], false);

    const args = getListParams as GetListParams;
    args.limitPageStart = args.limitPageStart || 0;
    args.limitPageLength = args.limitPageLength || 99;
    args.orderBy = args.orderBy || "modified desc";
    args.fields = args.fields || ["name"];

    // Whether custom features are used
    const isUsingCustomFeatures = !!args.withLinkFields || !!args.tableFields;

    if (
      !this.getCore().frappe.getAppVersion("renovation_core") &&
      isUsingCustomFeatures
    ) {
      // Will throw an error
      await this.getCore().frappe.checkAppInstalled([
        "tableFields",
        "withLinkFields"
      ]);
    }
    const config = RenovationConfig.instance;
    let response;
    if (this.getCore().frappe.getAppVersion("renovation_core")) {
      response = await Request(
        `${config.hostUrl}`,
        httpMethod.POST,
        FrappeRequestOptions.headers,
        {
          contentType: contentType["query-string"],
          data: {
            cmd: "renovation_core.db.query.get_list_with_child",
            doctype: args.doctype,
            fields: args.fields.join(","),
            filters: JSON.stringify(args.filters),
            order_by: args.orderBy,
            limit_start: args.limitPageStart,
            limit_page_length: args.limitPageLength,
            parent,
            table_fields: args.tableFields,
            with_link_fields:
              args.withLinkFields != null
                ? JSON.stringify(args.withLinkFields)
                : null
          }
        }
      );
    } else {
      response = await Request(
        `${config.hostUrl}`,
        httpMethod.POST,
        FrappeRequestOptions.headers,
        {
          contentType: contentType["application/json"],
          data: {
            cmd: "frappe.client.get_list",
            doctype: args.doctype,
            fields: args.fields.join(","),
            filters: JSON.stringify(args.filters),
            order_by: args.orderBy,
            limit_start: args.limitPageStart,
            limit_page_length: args.limitPageLength,
            parent
          }
        }
      );
    }
    if (response.success) {
      const responseObj = getJSON(response.data);
      if (args.fields.indexOf("*") !== -1) {
        // resolve as documents
        const docs: RenovationDocument[] = [];
        for (const item of responseObj.message || []) {
          docs.push(
            new RenovationDocument(
              Object.assign({ doctype: args.doctype }, item)
            )
          );
        }
        return RequestResponse.success(
          docs as [{ [x: string]: DBBasicValues }]
        );
      }
      return RequestResponse.success(responseObj.message || []);
    } else {
      return RequestResponse.fail(this.handleError("get_list", response.error));
    }
  }

  /**
   * Get a single value from db
   *
   * @param {GetValueParams} getValueParams
   * @returns {Promise<RequestResponse<{[x: string]: DBBasicValues}>>} The value of the field within `RequestResponse`
   */
  public async getValue(
    getValueParams: GetValueParams
  ): Promise<RequestResponse<{ [x: string]: DBBasicValues }>>;
  /**
   * Get a single value from db
   *
   * @param doctype The target doctype
   * @param docname The target document
   * @param docfield The target field
   * @deprecated
   * @returns {Promise<RequestResponse<{[x: string]: DBBasicValues}>>} The value of the field within `RequestResponse`
   */
  public async getValue(
    doctype: string,
    docname: string,
    docfield: string
  ): Promise<RequestResponse<{ [x: string]: DBBasicValues }>>;
  public async getValue(
    getValueParams: GetValueParams | string,
    docname?: string,
    docfield?: string
  ): Promise<RequestResponse<{ [x: string]: DBBasicValues }>> {
    let args: GetValueParams;
    if (typeof getValueParams === "string") {
      renovationWarn(
        "LTS-Renovation-Core",
        "getValue(doctype, docname, docfield) is deprecated, Please use the interfaced method"
      );
      args = {
        doctype: getValueParams,
        docname,
        docfield
      };
    } else {
      args = getValueParams;
    }

    const response = await Request(
      RenovationConfig.instance.hostUrl,
      httpMethod.GET,
      FrappeRequestOptions.headers,
      {
        contentType: contentType["query-string"],
        data: {
          cmd: "frappe.client.get_value",
          doctype: args.doctype,
          filters: args.docname,
          fieldname: args.docfield
        }
      }
    );
    if (response.success) {
      const resp = getJSON(response.data);
      if (resp && !deepCompare(resp, {})) {
        response.data = resp.message;
      } else {
        response.success = false;
        return RequestResponse.fail(
          this.handleError("get_value", {
            info: {
              data: response.data,
              httpCode: response.httpCode,
              rawResponse: response._
            }
          })
        );
      }
      return response;
    } else {
      return RequestResponse.fail(
        this.handleError("get_value", response.error)
      );
    }
  }

  /**
   * Delete doc, even from backend
   *
   * If the document exists in locals cache, it will be deleted as well
   *
   * @param {DeleteDocParams} deleteDocParams
   * @returns {Promise<RequestResponse<string | null>>} The deleted document within `RequestResponse`
   *
   * If the document doesn't exists, returns a failure
   */
  public async deleteDoc(
    deleteDocParams: DeleteDocParams
  ): Promise<RequestResponse<string | null>>;
  /**
   * Delete doc, even from backend
   *
   * If the document exists in locals cache, it will be deleted as well
   *
   * @param doctype The target doctype
   * @param docname The name of the targeted document'
   * @deprecated
   * @returns {Promise<RequestResponse<string | null>>} The deleted document within `RequestResponse`
   *
   * If the document doesn't exists, returns a failure
   */
  public async deleteDoc(
    doctype: string,
    docname: string
  ): Promise<RequestResponse<string | null>>;
  public async deleteDoc(
    deleteDocParams: DeleteDocParams | string,
    docname?: string
  ): Promise<RequestResponse<string | null>> {
    let args: DeleteDocParams;
    if (typeof deleteDocParams === "string") {
      renovationWarn(
        "LTS-Renovation-Core",
        "deleteDoc(doctype, docname) is deprecated, Please use the interfaced method"
      );
      args = {
        doctype: deleteDocParams,
        docname
      };
    } else {
      args = deleteDocParams;
    }
    const response = await Request(
      `${this.config.hostUrl}/api/resource/${encodeURIComponent(
        args.doctype
      )}/${encodeURIComponent(args.docname)}`,
      httpMethod.DELETE,
      FrappeRequestOptions.headers
    );
    if (response.success) {
      if (
        this.locals[args.doctype] &&
        this.locals[args.doctype][args.docname]
      ) {
        delete this.locals[args.doctype][args.docname];
      }
      return response;
    } else {
      return RequestResponse.fail(
        this.handleError("delete_doc", response.error)
      );
    }
  }

  /**
   * Get report values
   *
   * @param {GetReportParams} getReportParams
   * @returns {Promise<RequestResponse<{ result; columns }>>} The report returned within `RequestResponse`
   */
  public async getReport(
    getReportParams: GetReportParams
  ): Promise<RequestResponse<{ result; columns }>>;
  /**
   * Get report values
   *
   * @param report The report name
   * @param filters Filters to apply when getting the report. Defaults to `{}`
   * @param user The target user. Defaults to `null`
   * @deprecated
   * @returns {Promise<RequestResponse<{ result; columns }>>} The report returned within `RequestResponse`
   */
  public async getReport(
    report: string,
    filters?: { [x: string]: DBBasicValues },
    user?: string
  ): Promise<RequestResponse<{ result; columns }>>;
  public async getReport(
    getReportParams: GetReportParams | string,
    filters = {},
    user = null
  ): Promise<RequestResponse<{ result; columns }>> {
    await this.getCore().frappe.checkAppInstalled([
      "getReport (Renovation Report)"
    ]);
    let args: GetReportParams;
    if (typeof getReportParams === "string") {
      renovationWarn(
        "LTS-Renovation-Core",
        "getReport(report, filters, user) is deprecated, Please use the interfaced method"
      );
      args = {
        report: getReportParams,
        filters,
        user
      };
    } else {
      args = getReportParams;
    }

    const response = await Request(
      `${this.config.hostUrl}/api/method/renovation/report`,
      httpMethod.POST,
      FrappeRequestOptions.headers,
      {
        contentType: contentType["application/json"],
        data: {
          report: args.report,
          filters: args.filters,
          user: args.user
        }
      }
    );
    if (response.success) {
      return response;
    } else {
      return RequestResponse.fail(
        this.handleError("get_report", response.error)
      );
    }
  }

  /**
   * Get the report exported as Excel or PDF
   *
   * Currently only **Excel** is supported
   *
   * @param exportReportParams The params object required to fetch the report exported
   * @returns {Promise<RequestResponse<any>>} The binary data included in `RequestResponse`
   */
  public async exportReport(
    exportReportParams: GetExportReportParams
    // TODO: Define an interface for the response
  ): Promise<RequestResponse<any>> {
    if (!exportReportParams.includeIndentation) {
      exportReportParams.includeIndentation = 0;
    }
    if (!exportReportParams.filters) {
      exportReportParams.filters = {};
    }
    if (!exportReportParams.fileFormatType) {
      exportReportParams.fileFormatType = "Excel";
    }

    const response = await Request(
      this.config.hostUrl,
      httpMethod.POST,
      FrappeRequestOptions.headers,
      {
        contentType: contentType["application/x-www-form-urlencoded"],
        data: {
          cmd: "frappe.desk.query_report.export_query",
          report_name: exportReportParams.reportName,
          file_format_type: exportReportParams.fileFormatType,
          filters: JSON.stringify(exportReportParams.filters),
          visible_idx: JSON.stringify(exportReportParams.visibleIDX),
          include_indentation: exportReportParams.includeIndentation
        }
      },
      "blob"
    );

    if (response.success) {
      return RequestResponse.success(
        response.data,
        response.httpCode,
        response._
      );
    }
    return RequestResponse.fail(
      this.handleError("export_report", response.error)
    );
  }

  /**
   * Sets a single value in db
   *
   * @param {SetValueParams} setValueParams
   * @returns {Promise<RequestResponse<RenovationDocument>>} The updated document as `RenovationDocument` within `RequestResponse`
   */
  public async setValue(
    setValueParams: SetValueParams
  ): Promise<RequestResponse<RenovationDocument>>;
  /**
   * Sets a single value in db
   *
   * @param doctype The target doctype
   * @param docname The target document
   * @param docfield The target field
   * @param docvalue The value to be set
   * @deprecated
   * @returns {Promise<RequestResponse<RenovationDocument>>} The updated document as `RenovationDocument` within `RequestResponse`
   */
  public async setValue(
    doctype: string,
    docname: string,
    docfield: string,
    docvalue: DBBasicValues
  ): Promise<RequestResponse<RenovationDocument>>;
  public async setValue(
    setValueParams: SetValueParams | string,
    docname?: string,
    docfield?: string,
    value?: DBBasicValues
  ): Promise<RequestResponse<RenovationDocument>> {
    let args: SetValueParams;
    if (typeof setValueParams === "string") {
      renovationWarn(
        "LTS-Renovation-Core",
        "setValue(doctype, docname, df, value) is deprecated, Please use the interfaced method"
      );
      args = {
        doctype: setValueParams,
        docname,
        docfield,
        value
      };
    } else {
      args = setValueParams;
    }

    const response = await Request(
      RenovationConfig.instance.hostUrl,
      httpMethod.POST,
      FrappeRequestOptions.headers,
      {
        contentType: contentType["application/json"],
        data: {
          cmd: "frappe.client.set_value",
          doctype: args.doctype,
          name: args.docname,
          fieldname: args.docfield,
          value:
            typeof args.value === "string"
              ? args.value
              : JSON.stringify(args.value)
        }
      }
    );
    if (response.success) {
      const resp = getJSON(response.data);
      if (resp) {
        response.data = resp.message;
      }
      return response;
    }
    return RequestResponse.fail(this.handleError("set_value", response.error));
  }

  /**
   * Save a document
   *
   * @param {SaveDocParams} saveDocParams
   * @returns {Promise<RequestResponse<RenovationDocument>>} The saved document within `RequestResponse`
   *
   * If the document is duplicated, returns a failure
   */
  public async saveDoc(
    saveDocParams: SaveDocParams
  ): Promise<RequestResponse<RenovationDocument>>;
  /**
   * Save a document
   *
   * @param doc The document to be saved
   * @deprecated
   * @returns {Promise<RequestResponse<RenovationDocument>>} The saved document within `RequestResponse`
   *
   * If the document is duplicated, returns a failure
   */
  public async saveDoc(
    // tslint:disable-next-line: unified-signatures
    doc: RenovationDocument
  ): Promise<RequestResponse<RenovationDocument>>;
  public async saveDoc(
    saveDocParams: SaveDocParams | RenovationDocument
  ): Promise<RequestResponse<RenovationDocument>> {
    let doc: RenovationDocument;
    // @ts-ignore
    if (saveDocParams.doc && !saveDocParams.doctype) {
      doc = saveDocParams.doc;
    } else {
      renovationWarn(
        "LTS-Renovation-Core",
        "saveDoc(doc) is deprecated, Please use the interfaced method"
      );
      doc = saveDocParams;
    }

    await this.getCore().frappe.checkAppInstalled(["saveDoc"], false);

    let response;
    const config = RenovationConfig.instance;

    if (this.getCore().frappe.getAppVersion("renovation_core")) {
      this.config.coreInstance.scriptManager.trigger({
        doctype: doc.doctype,
        docname: doc.name,
        event: "validate"
      });

      response = await Request(
        `${config.hostUrl}/api/method/renovation/doc/` +
          `${encodeURIComponent(doc.doctype)}/${
            doc.__islocal ? "" : `${encodeURIComponent(doc.name)}`
          }`,
        doc.__islocal ? httpMethod.POST : httpMethod.PUT,
        FrappeRequestOptions.headers,
        {
          contentType: contentType["application/json"],
          data: { doc }
        }
      );
    } else {
      response = await Request(
        `${config.hostUrl}/api/resource/` +
          `${encodeURIComponent(doc.doctype)}/${
            doc.__islocal ? "" : `${encodeURIComponent(doc.name)}`
          }`,
        doc.__islocal ? httpMethod.POST : httpMethod.PUT,
        FrappeRequestOptions.headers,
        {
          contentType: contentType["application/json"],
          data: { ...doc }
        }
      );
    }
    if (response.success) {
      const responseObj = getJSON(response.data);
      if (responseObj && responseObj.status === "success") {
        Object.assign(doc, responseObj.data, {
          __islocal: 0,
          __unsaved: 0
        });

        this.addToLocals({ doc });
        return RequestResponse.success(doc);
      }
    }
    response.success = false;
    return RequestResponse.fail(
      this.handleError("save_doc", {
        info: {
          data: response.data,
          rawResponse: response._,
          httpCode: response.httpCode
        }
      })
    );
  }

  /**
   * Submit a submittable document
   *
   * @param {SubmitDocParams} submitDocParams
   * @returns {Promise<RequestResponse<RenovationDocument>>} The submitted document within `RequestResponse`
   *
   * If the doctype or document don't exist, returns failure
   */
  public async submitDoc(
    submitDocParams: SubmitDocParams
  ): Promise<RequestResponse<RenovationDocument>>;
  /**
   * Submit a submittable document
   *
   * @param doc The document to be submitted
   * @deprecated
   * @returns {Promise<RequestResponse<RenovationDocument>>} The submitted document within `RequestResponse`
   *
   * If the doctype or document don't exist, returns failure
   */
  // tslint:disable-next-line: unified-signatures
  public async submitDoc(
    // tslint:disable-next-line:unified-signatures
    doc: RenovationDocument
  ): Promise<RequestResponse<RenovationDocument>>;
  public async submitDoc(
    submitDocParams: SubmitDocParams | RenovationDocument
  ): Promise<RequestResponse<RenovationDocument>> {
    let doc: RenovationDocument;
    // @ts-ignore
    if (submitDocParams.doc && !submitDocParams.doctype) {
      doc = submitDocParams.doc;
    } else {
      doc = submitDocParams;
      renovationWarn(
        "LTS-Renovation-Core",
        "submitDoc(doc) is deprecated, Please use the interfaced method"
      );
    }

    const config = RenovationConfig.instance;
    const response = await Request(
      `${config.hostUrl}`,
      httpMethod.POST,
      FrappeRequestOptions.headers,
      {
        contentType: contentType["application/json"],
        data: {
          doc,
          cmd: "frappe.client.submit"
        }
      }
    );
    if (response.success) {
      const responseObj = getJSON(response.data);
      if (responseObj && !responseObj.exc && responseObj.message) {
        Object.assign(doc, responseObj.message, {
          __islocal: 0,
          __unsaved: 0
        });
        this.addToLocals({ doc });
        return RequestResponse.success(doc);
      }
    }
    response.success = false;
    return RequestResponse.fail(
      this.handleError("submit_doc", {
        info: {
          data: response.data,
          rawResponse: response._,
          httpCode: response.httpCode
        }
      })
    );
  }

  /**
   * Saves the document first, then submit, in a single db transaction
   *
   * @param saveSubmitDocParams The document to be saved and submitted
   * @returns {Promise<RequestResponse<RenovationDocument>>} The saved and submitted document within `RequestResponse`
   *
   * If the doctype or document don't exist, returns failure
   *
   */
  public async saveSubmitDoc(
    saveSubmitDocParams: SaveSubmitDocParams
  ): Promise<RequestResponse<RenovationDocument>>;
  /**
   * Saves the document first, then submit, in a single db transaction
   *
   * @param doc The document to be saved and submitted
   * @deprecated
   * @returns {Promise<RequestResponse<RenovationDocument>>} The saved and submitted document within `RequestResponse`
   *
   * If the doctype or document don't exist, returns failure
   *
   */
  // tslint:disable-next-line: unified-signatures
  public async saveSubmitDoc(
    // tslint:disable-next-line:unified-signatures
    doc: RenovationDocument
  ): Promise<RequestResponse<RenovationDocument>>;
  public async saveSubmitDoc(
    saveSubmitDocParams: SaveSubmitDocParams | RenovationDocument
  ): Promise<RequestResponse<RenovationDocument>> {
    await this.getCore().frappe.checkAppInstalled(["saveSubmitDoc"]);
    let doc: RenovationDocument;
    // @ts-ignore
    if (saveSubmitDocParams.doc && !saveSubmitDocParams.doctype) {
      doc = saveSubmitDocParams.doc;
    } else {
      doc = saveSubmitDocParams;
      renovationWarn(
        "LTS-Renovation-Core",
        "saveSubmitDoc(doc) is deprecated, Please use the interfaced method"
      );
    }

    const config = RenovationConfig.instance;
    const response = await Request(
      `${config.hostUrl}`,
      httpMethod.POST,
      FrappeRequestOptions.headers,
      {
        contentType: contentType["application/json"],
        data: {
          cmd: "renovation_core.utils.doc.save_submit_doc",
          doc
        }
      }
    );
    if (response.success) {
      const responseObj = getJSON(response.data);
      if (responseObj && !responseObj.exc && responseObj.message) {
        Object.assign(doc, responseObj.message, {
          __islocal: 0,
          __unsaved: 0
        });
        this.addToLocals({ doc });
        return RequestResponse.success(doc);
      }
    }
    response.success = false;
    return RequestResponse.fail(
      this.handleError("saveSubmitDoc", response.error)
    );
  }

  /**
   * Cancels the submitted document
   *
   * @param {CancelDocParams} cancelDocParams
   * @returns {Promise<RequestResponse<RenovationDocument>>} The cancelled document within `RequestResponse`
   *
   * If the doctype or document don't exist, returns failure
   *
   */
  public async cancelDoc(
    cancelDocParams: CancelDocParams
  ): Promise<RequestResponse<RenovationDocument>>;
  /**
   * Cancels the submitted document
   *
   * @param doc The document to be cancelled
   * @deprecated
   * @returns {Promise<RequestResponse<RenovationDocument>>} The cancelled document within `RequestResponse`
   *
   * If the doctype or document don't exist, returns failure
   *
   */
  // tslint:disable-next-line: unified-signatures
  public async cancelDoc(
    // tslint:disable-next-line:unified-signatures
    doc: RenovationDocument
  ): Promise<RequestResponse<RenovationDocument>>;
  public async cancelDoc(
    cancelDocParams: CancelDocParams | RenovationDocument
  ): Promise<RequestResponse<RenovationDocument>> {
    let doc: RenovationDocument;
    // @ts-ignore
    if (cancelDocParams.doc && !cancelDocParams.doctype) {
      doc = cancelDocParams.doc;
    } else {
      doc = cancelDocParams;
      renovationWarn(
        "LTS-Renovation-Core",
        "cancelDoc(doc) is deprecated, Please use the interfaced method"
      );
    }

    const config = RenovationConfig.instance;
    const response = await Request(
      `${config.hostUrl}`,
      httpMethod.POST,
      FrappeRequestOptions.headers,
      {
        contentType: contentType["application/json"],
        data: {
          doctype: doc.doctype,
          name: doc.name,
          cmd: "frappe.client.cancel"
        }
      }
    );
    if (response.success) {
      const responseObj = getJSON(response.data);
      if (responseObj && !responseObj.exc && responseObj.message) {
        Object.assign(doc, responseObj.message, {
          __islocal: 0,
          __unsaved: 0
        });
        this.addToLocals({ doc });
        return RequestResponse.success(doc);
      } else {
        renovationError(responseObj || response);
      }
    }
    response.success = false;
    return RequestResponse.fail(this.handleError("cancelDoc", response.error));
  }

  /**
   * Search for Link field values
   *
   * @param {SearchLinkParams} searchLinkParams
   *
   * @returns {Promise<RequestResponse<[SearchLinkResponse]>>} The search results within `RequestResponse`
   */
  public async searchLink(
    searchLinkParams: SearchLinkParams
  ): Promise<RequestResponse<[SearchLinkResponse]>>;
  /**
   * Search for Link field values
   *
   * @param doctype The target doctype
   * @param txt The term to be searched
   * @param options Optional parameter for the API
   * @deprecated
   * @returns {Promise<RequestResponse<[SearchLinkResponse]>>} The search results within `RequestResponse`
   */
  public async searchLink(
    doctype: string,
    txt: string,
    options?: unknown
  ): Promise<RequestResponse<[SearchLinkResponse]>>;
  public async searchLink(
    searchLinkParams: SearchLinkParams | string,
    txt?: string,
    options?: unknown
  ): Promise<RequestResponse<[SearchLinkResponse]>> {
    let args: SearchLinkParams;
    if (typeof searchLinkParams === "string") {
      args = {
        doctype: searchLinkParams,
        txt,
        options
      };
      renovationWarn(
        "LTS-Renovation-Core",
        "searchLink(doctype, txt, options) is deprecated, Please use the interfaced method"
      );
    } else {
      args = searchLinkParams;
    }

    const config = RenovationConfig.instance;
    const response = await Request(
      `${config.hostUrl}`,
      httpMethod.GET,
      FrappeRequestOptions.headers,
      {
        contentType: contentType["query-string"],
        data: Object.assign(
          {
            cmd: "frappe.desk.search.search_link",
            txt: args.txt,
            doctype: args.doctype
          },
          args.options || {}
        )
      }
    );
    if (response.success) {
      response.data = (getJSON(response.data) || {}).results || response.data;
      return response;
    } else {
      return RequestResponse.fail(
        this.handleError("search_link", response.error)
      );
    }
  }

  // Assignments

  /**
   * Assigns a doc to a particular User
   * Use bulk_assign
   * @param {AssignDocParams} assignDocParams
   */
  public async assignDoc(
    assignDocParams: AssignDocParams
  ): Promise<RequestResponse<any>> {
    let cmd = "frappe.desk.form.assign_to.add";
    if (assignDocParams.bulkAssign) {
      cmd = "frappe.desk.form.assign_to.add_multiple";
    }
    if (assignDocParams.myself) {
      assignDocParams.assignTo = this.getCore().auth.getCurrentUser();
    }
    // in v13, assign_to accepts a json array
    let assignTo = assignDocParams.assignTo;
    if (this.config.coreInstance.frappe.frappeVersion.major > 12) {
      if (typeof assignDocParams.assignTo === "string") {
        assignDocParams.assignTo = [assignDocParams.assignTo];
      }
      assignTo = JSON.stringify(assignDocParams.assignTo);
    }
    const r = await this.getCore().call({
      cmd,
      doctype: assignDocParams.doctype,
      name: assignDocParams.bulkAssign
        ? JSON.stringify(assignDocParams.docnames)
        : assignDocParams.docname,
      description: assignDocParams.description,

      assign_to: assignTo,
      myself: !!assignDocParams.myself ? 1 : 0,

      priority: assignDocParams.priority,
      date: assignDocParams.dueDate,
      bulk_assign: !!assignDocParams.bulkAssign ? 1 : 0,
      notify: !!assignDocParams.notify ? 1 : 0
    });
    if (r.success) {
      r.data = r.data.message;
      return r;
    } else {
      return RequestResponse.fail(this.handleError("assign_doc", r.error));
    }
  }

  /**
   * Completes a doc assignment made by assignDoc()
   * @param {CompleteDocAssignmentParams} completeDocAssignmentParams
   */
  public async completeDocAssignment(
    completeDocAssignmentParams: CompleteDocAssignmentParams
  ): Promise<RequestResponse<any>> {
    const r = await this.getCore().call({
      cmd: "frappe.desk.form.assign_to.remove",
      doctype: completeDocAssignmentParams.doctype,
      name: completeDocAssignmentParams.docname,
      assign_to: completeDocAssignmentParams.assignedTo
    });
    if (r.success) {
      r.data = r.data.message;
      return r;
    } else {
      return RequestResponse.fail(
        this.handleError("complete_doc_assignment", r.error)
      );
    }
  }

  /**
   * UnAssigns a user by deleting the `ToDo` doctype
   * @param unAssignDocParams
   */
  public async unAssignDoc(
    unAssignDocParams: UnAssignDocParams
  ): Promise<RequestResponse<any>> {
    await this.getCore().frappe.checkAppInstalled(["unAssignDoc"]);
    const r = await this.getCore().call({
      cmd: "renovation_core.utils.assign_doc.unAssignDocFromUser",
      doctype: unAssignDocParams.doctype,
      docname: unAssignDocParams.docname,
      user: unAssignDocParams.unAssignFrom
    });
    if (r.success) {
      r.data = r.data.message;
      return r;
    } else {
      return RequestResponse.fail(this.handleError("unassign_doc", r.error));
    }
  }

  /**
   * Gets the documents that are assigned to a user
   * @param {GetDocsAssignedToUserParams} getDocsAssignedToUserParams
   * @return {Promise<RequestResponse<GetDocsAssignedToUserResponse[]>>}
   */
  public async getDocsAssignedToUser(
    getDocsAssignedToUserParams: GetDocsAssignedToUserParams
  ): Promise<RequestResponse<GetDocsAssignedToUserResponse[]>> {
    await this.getCore().frappe.checkAppInstalled(["GetDocsAssignedToUser"]);
    if (!getDocsAssignedToUserParams.assignedTo) {
      // ToDo isnt supposed to be set for Guests
      getDocsAssignedToUserParams.assignedTo = this.getCore().auth.getCurrentUser();
    }
    if (!getDocsAssignedToUserParams.status) {
      getDocsAssignedToUserParams.status = "Open";
    }

    // DocType "ToDo" perm is set to allow read for All
    const r = await this.getCore().call({
      cmd: "renovation_core.utils.assign_doc.getDocsAssignedToUser",
      user: getDocsAssignedToUserParams.assignedTo,
      status: getDocsAssignedToUserParams.status,
      doctype: getDocsAssignedToUserParams.doctype || undefined
    });
    if (r.success) {
      r.data = r.data.message;
      // @ts-ignore
      return r as RequestResponse<GetDocsAssignedToUserResponse[]>;
    } else {
      return RequestResponse.fail(
        this.handleError("get_docs_assigned_to_user", r.error)
      );
    }
  }

  /**
   * Gets the list of users assigned to a document
   * @param {GetUsersAssignedToDocParams} getUsersAssignedToDocParams
   * @return {Promise<RequestResponse<GetUsersAssignedToDocResponse[]>>}
   */
  public async getUsersAssignedToDoc(
    getUsersAssignedToDocParams: GetUsersAssignedToDocParams
  ): Promise<RequestResponse<GetUsersAssignedToDocResponse[]>> {
    const r = await this.getCore().model.getList({
      doctype: "ToDo",
      filters: {
        reference_name: getUsersAssignedToDocParams.docname,
        reference_type: getUsersAssignedToDocParams.doctype
      },
      fields: [
        "date as dueDate",
        "status",
        "assigned_by as assignedBy",
        "assigned_by_full_name as assignedByFullName",
        "owner as assignedTo",
        "priority",
        "description"
      ]
    });
    if (r.success) {
      // @ts-ignore
      return r as RequestResponse<GetUsersAssignedToDocResponse[]>;
    } else {
      return RequestResponse.fail(
        this.handleError("get_users_assigned_to_doc", r.error)
      );
    }
  }

  // TAGS

  /**
   * Adds a tag to document
   *
   * @param addTagParams The target doctype
   *
   * @returns {Promise<RequestResponse<string>>} The tag within `RequestResponse`
   */
  public async addTag(
    addTagParams: AddTagParams
  ): Promise<RequestResponse<string>>;
  /**
   * Adds a tag to document
   *
   * @param doctype The target doctype
   * @param docname The target document
   * @param tag The tag to be added
   * @deprecated
   * @returns {Promise<RequestResponse<string>>} The tag within `RequestResponse`
   */
  public async addTag(
    doctype: string,
    docname: string,
    tag: string
  ): Promise<RequestResponse<string>>;
  public async addTag(
    addTagParams: AddTagParams | string,
    docname?: string,
    tag?: string
  ): Promise<RequestResponse<string>> {
    let args: AddTagParams;
    if (typeof addTagParams === "string") {
      args = {
        doctype: addTagParams,
        docname,
        tag
      };
      renovationWarn(
        "LTS-Renovation-Core",
        "addTag(doctype, name, tag) is deprecated, Please use the interfaced method"
      );
    } else {
      args = addTagParams;
    }

    const r = await this.getCore().call({
      cmd:
        this.config.coreInstance.frappe.frappeVersion.major >= 12
          ? "frappe.desk.doctype.tag.tag.add_tag"
          : "frappe.desk.tags.add_tag",
      dt: args.doctype,
      dn: args.docname,
      tag: args.tag
    });

    if (r.success) {
      r.data = r.data.message;
      return r;
    } else {
      return RequestResponse.fail(this.handleError("add_tag", r.error));
    }
  }

  /**
   * Removes a tag to document
   *
   * @param {RemoveTagParams} removeTagParams
   *
   * @return {Promise<RequestResponse<null>>} Empty response within `RequestResponse`
   */
  public async removeTag(
    removeTagParams: RemoveTagParams
  ): Promise<RequestResponse<null>>;
  /**
   * Removes a tag to document
   *
   * @param doctype The target doctype
   * @param docname The target document
   * @param tag Tag to be deleted
   * @deprecated
   * @return {Promise<RequestResponse<null>>} Empty response within `RequestResponse`
   */
  public async removeTag(
    doctype: string,
    docname: string,
    tag: string
  ): Promise<RequestResponse<null>>;
  public async removeTag(
    removeTagParams: RemoveTagParams | string,
    docname?: string,
    tag?: string
  ): Promise<RequestResponse<null>> {
    let args: RemoveTagParams;
    if (typeof removeTagParams === "string") {
      args = {
        doctype: removeTagParams,
        docname,
        tag
      };
      renovationWarn(
        "LTS-Renovation-Core",
        "removeTag(doctype, name, tag) is deprecated, Please use the interfaced method"
      );
    } else {
      args = removeTagParams;
    }

    const response = await this.getCore().call({
      cmd:
        this.config.coreInstance.frappe.frappeVersion.major >= 12
          ? "frappe.desk.doctype.tag.tag.remove_tag"
          : "frappe.desk.tags.remove_tag",
      dt: args.doctype,
      dn: args.docname,
      tag: args.tag
    });
    if (response.success) {
      return response;
    } else {
      return RequestResponse.fail(
        this.handleError("remove_tag", response.error)
      );
    }
  }

  /**
   * Gets all the names of all documents with the param-tag
   *
   * @param {GetTaggedDocsParams} getTaggedDocsParams
   *
   * @return {Promise<RequestResponse<null>>} List of documents within `RequestResponse`
   *
   * If the tag doesn't exist, an empty array is returned
   */
  public async getTaggedDocs(
    getTaggedDocsParams: GetTaggedDocsParams
  ): Promise<RequestResponse<string[]>>;
  /**
   * Gets all the names of all documents with the param-tag
   *
   * @param doctype The target doctype
   * @param tag The target tag for which the documents need to be fetched
   * @deprecated
   * @return {Promise<RequestResponse<null>>} List of documents within `RequestResponse`
   *
   * If the tag doesn't exist, an empty array is returned
   */
  public async getTaggedDocs(
    doctype: string,
    tag: string
  ): Promise<RequestResponse<string[]>>;
  public async getTaggedDocs(
    getTaggedDocsParams: GetTaggedDocsParams | string,
    tag?: string
  ): Promise<RequestResponse<string[]>> {
    let args: GetTaggedDocsParams;
    if (typeof getTaggedDocsParams === "string") {
      args = {
        doctype: getTaggedDocsParams,
        tag
      };
      renovationWarn(
        "LTS-Renovation-Core",
        "getTaggedDoc(doctype, tag) is deprecated, Please use the interfaced method"
      );
    } else {
      args = getTaggedDocsParams;
    }

    const r = await this.getCore().call({
      cmd:
        this.config.coreInstance.frappe.frappeVersion.major >= 12
          ? "frappe.desk.doctype.tag.tag.get_tagged_docs"
          : "frappe.desk.tags.get_tagged_docs",
      doctype: args.doctype,
      tag: args.tag || ""
    });

    if (r.success) {
      r.data = r.data.message;
      return r;
    } else {
      return RequestResponse.fail(this.handleError("get_tagged_docs", r.error));
    }
  }

  /**
   * Returns all tags of a doctype
   *
   * @param {GetTagsParams} getTagsParams
   *
   * @return {Promise<RequestResponse<null>>} Tags list within `RequestResponse`
   */
  public async getTags(
    getTagsParams: GetTagsParams
  ): Promise<RequestResponse<string[]>>;
  /**
   * Returns all tags of a doctype
   *
   * @param doctype The target doctype
   * @param likeTag Tag to be searched. Can be used in the form of SQL's LIKE statements
   * @deprecated
   * @return {Promise<RequestResponse<null>>} Tags list within `RequestResponse`
   */
  public async getTags(
    doctype: string,
    likeTag?: string
  ): Promise<RequestResponse<string[]>>;
  public async getTags(
    getTagParams: GetTagsParams | string,
    likeTag?: string
  ): Promise<RequestResponse<string[]>> {
    let args: GetTagsParams;
    if (typeof getTagParams === "string") {
      renovationWarn(
        "LTS-Renovation-Core",
        "getTags(doctype, likeTag) is deprecated, Please use the interfaced method"
      );
      args = {
        doctype: getTagParams,
        likeTag
      };
    } else {
      args = getTagParams;
    }
    const r = await this.getCore().call({
      cmd:
        this.config.coreInstance.frappe.frappeVersion.major < 12
          ? "frappe.desk.tags.get_tags"
          : "frappe.desk.doctype.tag.tag.get_tags",
      doctype: args.doctype,
      txt: args.likeTag || "",
      cat_tags: JSON.stringify([])
    });

    if (r.success) {
      r.data = r.data.message;
      return r;
    } else {
      return RequestResponse.fail(this.handleError("get_tags", r.error));
    }
  }
}
