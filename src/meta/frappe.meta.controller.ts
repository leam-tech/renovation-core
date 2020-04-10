import { RenovationConfig } from "../config";
import DocType from "../model/doctype";
import { PermissionType } from "../perm/perm.model";
import RenovationController from "../renovation.controller";
import { asyncSleep, getJSON } from "../utils";
import { ErrorDetail } from "../utils/error";
import { DBFilter } from "../utils/filters";
import {
  contentType,
  FrappeRequestOptions,
  httpMethod,
  RenovationError,
  Request,
  RequestResponse
} from "../utils/request";
import {
  DocInfo,
  GetDocCountParams,
  GetDocInfoParams,
  GetDocMetaParams,
  GetReportMetaParams,
  ReportMeta
} from "./interfaces";
import MetaController from "./meta.controller";

/**
 * Class responsible for the operations of the doctypes' meta fields
 */
export default class FrappeMetaController extends MetaController {
  public handleError(errorId: string, error: ErrorDetail): ErrorDetail {
    let err = {} as ErrorDetail;

    switch (errorId) {
      // As of now, they share the same possible errors
      case "get_doc_count":
        let containsMissingTable: boolean;
        if (
          error.info &&
          error.info.rawError &&
          error.info.rawError.response &&
          error.info.rawError.response.data &&
          error.info.rawError.response.data.exc
        ) {
          containsMissingTable = (error.info.rawError.response.data
            .exc as string).includes("TableMissingError");
        }

        if (error.info.httpCode === 404 || containsMissingTable) {
          err = this.handleError("doctype_not_exist", error);
        } else {
          err = this.handleError(null, error);
        }
        break;
      case "get_doc_meta":
        if (error.info.httpCode === 404) {
          err = this.handleError("doctype_not_exist", error);
        } else {
          err = this.handleError(null, error);
        }
        break;

      case "get_doc_info":
        if (error.info.httpCode === 404) {
          err = this.handleError("docname_not_exist", error);
        } else if (error.info.httpCode === 500) {
          err = this.handleError("doctype_not_exist", error);
        } else if (error.title === "DocInfo Not Found") {
          err = {
            ...error,
            type: RenovationError.NotFoundError,
            info: {
              ...error.info,
              httpCode: 404,
              cause: "DocInfo not found"
            }
          };
        } else {
          err = this.handleError(null, error);
        }
        break;

      case "get_report_meta":
        if (
          error.info &&
          error.info.data &&
          error.info.data.exception &&
          error.info.data.exception.includes("DoesNotExist")
        ) {
          err = {
            ...error,
            title: "Renovation Report does not exist",
            type: RenovationError.NotFoundError,
            info: {
              ...error.info,
              httpCode: 404,
              cause: "The target report does not exist",
              suggestion: "Make sure the name is correct or create the report"
            }
          };
        } else {
          err = this.handleError(null, error);
        }
        break;

      case "doctype_not_exist":
        err = {
          ...error,
          title: RenovationController.DOCTYPE_NOT_EXIST_TITLE,
          type: RenovationError.NotFoundError,
          info: {
            ...error.info,
            httpCode: 404,
            cause: "DocType does not exist",
            suggestion:
              "Make sure the queried DocType is input correctly or create the required DocType"
          }
        };
        break;

      case "docname_not_exist":
        err = {
          ...error,
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
      default:
        err = RenovationController.genericError(error);
    }

    return err;
  }
  /**
   * Get the number of documents based on a filter
   * @param getDocCountParams {GetDocCountParams}
   * @returns {Promise<RequestResponse<number>>} The number of documents within `RequestResponse`
   */
  public async getDocCount(
    getDocCountParams: GetDocCountParams
  ): Promise<RequestResponse<number>>;
  /**
   * Get the number of documents based on a filter
   *
   * @param doctype The target doctype
   * @param filters The filters applied to get the doc count. Defaults to no filters
   * @deprecated
   * @returns {Promise<RequestResponse<number>>} The number of documents within `RequestResponse`
   */
  public async getDocCount(
    doctype: string,
    filters?: DBFilter
  ): Promise<RequestResponse<number>>;
  public async getDocCount(
    getDocCountParams: string | GetDocCountParams,
    filters?: DBFilter
  ): Promise<RequestResponse<number>> {
    let args: GetDocCountParams;
    if (typeof getDocCountParams === "string") {
      console.warn(
        "LTS-Renovation-Core",
        "getDocCount(getDocCountParams, filters) is deprecated, please use the interfaced approach instead"
      );
      args = {
        doctype: getDocCountParams,
        filters
      };
    } else {
      args = getDocCountParams as GetDocCountParams;
    }
    const config = RenovationConfig.instance;
    const response = await Request(
      `${config.hostUrl}/api/method/frappe.desk.reportview.get`,
      httpMethod.GET,
      FrappeRequestOptions.headers,
      {
        contentType: contentType["query-string"],
        data: {
          doctype: args.doctype,
          fields: JSON.stringify([
            `count(\`tab${args.doctype}\`.name) as total_count`
          ]),
          filters: JSON.stringify(args.filters),
          cmd: "frappe.desk.reportview.get"
        }
      }
    );
    if (response.success) {
      const responseJSON = getJSON(response.data);
      return RequestResponse.success(responseJSON.message.values[0][0]);
    }
    return RequestResponse.fail(
      this.handleError("get_doc_count", response.error)
    );
  }

  /**
   * Similar to loadDoctype, but checks cache first
   * @param getDocMetaParams {GetDocMetaParams}
   * @returns {Promise<RequestResponse<DocType>>} `DocType` within `RequestResponse`.
   *
   * Returns failed `RequestResponse` if doctype not in cache
   */
  public async getDocMeta(
    getDocMetaParams: GetDocMetaParams
  ): Promise<RequestResponse<DocType>>;
  /**
   * Similar to loadDoctype, but checks cache first
   * @param doctype The target doctype
   * @deprecated
   * @returns {Promise<RequestResponse<DocType>>} `DocType` within `RequestResponse`.
   *
   */
  // tslint:disable-next-line: unified-signatures
  public async getDocMeta(doctype: string): Promise<RequestResponse<DocType>>;
  public async getDocMeta(
    getDocMetaParams: string | GetDocMetaParams
  ): Promise<RequestResponse<DocType>> {
    let doctype;
    if (typeof getDocMetaParams === "string") {
      doctype = getDocMetaParams;
      console.warn(
        "LTS-Renovation-Core",
        "loadDocType(doctype) is deprecated, please use the interfaced approach instead"
      );
    } else {
      doctype = getDocMetaParams.doctype;
    }
    if (this.docTypeCache[doctype]) {
      // @ts-ignore
      if (this.docTypeCache[doctype] !== "__loading") {
        return RequestResponse.success(this.docTypeCache[doctype]);
      } else {
        while (
          this.docTypeCache[doctype] && // have to check this, this is the failure case and stops loading
          // @ts-ignore
          this.docTypeCache[doctype] === "__loading"
        ) {
          await asyncSleep(100);
        }
        if (this.docTypeCache[doctype]) {
          return RequestResponse.success(this.docTypeCache[doctype]);
        } else {
          return RequestResponse.fail(
            this.handleError("get_doc_meta", { info: {} } as ErrorDetail)
          );
        }
      }
    } else {
      // @ts-ignore
      this.docTypeCache[doctype] = "__loading"; // for having a single request going..
      // prevent other parallel loads // {} is mandatory
      this.config.coreInstance.scriptManager.events[doctype] = {};
      const response = await this.config.coreInstance.call({
        cmd: "renovation_core.utils.meta.get_bundle",
        doctype
      });

      if (response.success) {
        const responseObj = response.data.message;
        const metas = {}; // local var first, Object.assign together later
        for (const dmeta of responseObj.metas) {
          if (dmeta.doctype === "DocType") {
            metas[dmeta.name] = DocType.fromFrappeDocType(dmeta);
            // append __messages for translations
            this.config.coreInstance.translate.extendDictionary({
              dict: dmeta.__messages
            });
            // Renovation Scripts
            for (const s of dmeta.renovation_scripts || []) {
              this.config.coreInstance.scriptManager.addScript({
                doctype,
                ...s
              });
            }
          }
        }
        Object.assign(this.docTypeCache, metas);
        // trigger read perm which creates the perm dict in rcore.perms.doctypePerms
        // tslint:disable-next-line:forin
        for (const d in metas) {
          if (!metas[d].isTable) {
            // perm for normal doctypes only, not for Child docs
            this.config.coreInstance.perm.hasPerm({
              doctype: d,
              ptype: PermissionType.read
            });
          }
        }
        return RequestResponse.success(this.docTypeCache[doctype]);
      } else {
        delete this.docTypeCache[doctype]; // unset __loading
        return response.success
          ? response
          : RequestResponse.fail(
              this.handleError("get_doc_meta", response.error)
            );
      }
    }
  }

  /**
   * Gets the docInfo of a certain document of a certain doctypes
   *
   * @param doctype The target doctype
   * @param docname The target docname (identifier)
   * @deprecated
   * @returns {Promise<RequestResponse<DocInfo>>} The document's info within `RequestResponse`
   */
  public async getDocInfo(
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
  public async getDocInfo(
    getDocInfoParams: GetDocInfoParams
  ): Promise<RequestResponse<DocInfo>>;
  public async getDocInfo(
    getDocInfoParams: string | GetDocInfoParams,
    docname?: string
  ): Promise<RequestResponse<DocInfo>> {
    let args: GetDocInfoParams;
    if (typeof getDocInfoParams === "string") {
      args = {
        doctype: getDocInfoParams,
        docname
      };
      console.warn(
        "LTS-Renovation-Core",
        "getDocInfo(getDocInfoParams, docname) is deprecated, please use the interfaced method"
      );
    } else {
      args = getDocInfoParams;
    }

    const config = RenovationConfig.instance;
    const response = await Request(
      `${config.hostUrl}`,
      httpMethod.GET,
      FrappeRequestOptions.headers,
      {
        contentType: contentType["query-string"],
        data: {
          cmd: "frappe.desk.form.load.get_docinfo",
          doctype: args.doctype,
          name: args.docname
        }
      }
    );
    if (response.success) {
      const responseObj = getJSON(response.data);
      if (responseObj.docinfo) {
        const s = this.config.coreInstance.storage;
        for (const attachment of responseObj.docinfo.attachments) {
          attachment.complete_url = s.getUrl(attachment.file_url);
        }
        return RequestResponse.success(responseObj.docinfo);
      } else {
        response.data = responseObj || response.data;
        response.success = false;
        return RequestResponse.fail(
          this.handleError("get_doc_info", {
            title: "DocInfo Not Found",
            info: {
              data: response.data,
              httpCode: response.httpCode,
              rawResponse: response._
            }
          })
        );
      }
    } else {
      return response.success
        ? response
        : RequestResponse.fail(
            this.handleError("get_doc_info", response.error)
          );
    }
  }

  /**
   * Gets the report meta of Renovation Report
   *
   * @param report The target report
   * @deprecated
   * @returns {Promise<RequestResponse<ReportMeta>>} Report meta within `RequestResponse`
   */
  public async getReportMeta(
    report: string
  ): Promise<RequestResponse<ReportMeta>>;
  /**
   * Gets the report meta of Renovation Report
   *
   * @param getReportMetaParams {GetReportMetaParams}
   *
   * @returns {Promise<RequestResponse<ReportMeta>>} Report meta within `RequestResponse`
   */
  public async getReportMeta(
    // tslint:disable-next-line:unified-signatures
    getReportMetaParams: GetReportMetaParams
  ): Promise<RequestResponse<ReportMeta>>;
  public async getReportMeta(
    getReportMetaParams: string | GetReportMetaParams
  ): Promise<RequestResponse<ReportMeta>> {
    let args: GetReportMetaParams;
    if (typeof getReportMetaParams === "string") {
      console.warn(
        "LTS-Renovation-Core",
        "getReportMeta(report) is deprecated, please use the interfaced approach"
      );
      args = { report: getReportMetaParams };
    } else {
      args = getReportMetaParams;
    }

    const r = (await this.config.coreInstance.model.getDoc({
      doctype: "Renovation Report",
      docname: args.report
    })) as RequestResponse<ReportMeta>;

    return r.success
      ? r
      : RequestResponse.fail(
          this.handleError(
            "get_report_meta",
            r.error || {
              info: {
                data: r.data
              }
            }
          )
        );
  }
}
