import RenovationController from "../renovation.controller";
import { ErrorDetail } from "../utils/error";
import { RequestResponse } from "../utils/request";
import {
  InvokeLoggerParams,
  LogManagerParams,
  LogResponse
} from "./interfaces";

/**
 * A class for managing logs made in logs.leam.ae
 */
export default class LogManager extends RenovationController {
  /** The private def. tags */
  private _defaultTags: string[] = [];

  public clearCache() {
    // no cache to clear for now
  }
  public handleError(errorId: string, error: ErrorDetail) {
    return RenovationController.genericError(error);
  }

  /**
   * Use this function to set the basic set of tags to be set for the logs raised from the client side
   * @param tags Array of tags
   */
  public setDefaultTags(tags: string[]) {
    this._defaultTags = tags;
  }

  /**
   * Basic Logging
   * @param params
   */
  public info(params: LogManagerParams): Promise<RequestResponse<LogResponse>>;
  public info(
    content: string,
    tags?: string[],
    title?: string
  ): Promise<RequestResponse<LogResponse>>;
  /**
   * Basic Logging
   * @param {string} content
   * @param {string[]} tags
   * @param {string} title
   */
  public async info(
    content: string | LogManagerParams,
    tags: string[] = [],
    title?: string
  ) {
    const args = this.processLogManagerParams(content, tags, title);
    return this.invokeLogger({
      cmd: "renovation_core.utils.logging.log_info",
      ...args
    });
  }

  /**
   * Basic Logging
   * @param params
   */
  public warning(
    params: LogManagerParams
  ): Promise<RequestResponse<LogResponse>>;
  public warning(
    content: string,
    tags?: string[],
    title?: string
  ): Promise<RequestResponse<LogResponse>>;
  /**
   * Basic Logging
   * @param {string} content
   * @param {string[]} tags
   * @param {string} title
   */
  public async warning(
    content: string | LogManagerParams,
    tags: string[] = [],
    title?: string
  ) {
    const args = this.processLogManagerParams(content, tags, title);
    return this.invokeLogger({
      cmd: "renovation_core.utils.logging.log_warning",
      ...args
    });
  }

  /**
   * Basic Logging
   * @param params
   */
  public error(params: LogManagerParams): Promise<RequestResponse<LogResponse>>;
  public error(
    content: string,
    tags?: string[],
    title?: string
  ): Promise<RequestResponse<LogResponse>>;
  /**
   * Basic Logging
   * @param {string} content
   * @param {string[]} tags
   * @param {string} title
   */
  public async error(
    content: string | LogManagerParams,
    tags: string[] = [],
    title?: string
  ) {
    const args = this.processLogManagerParams(content, tags, title);
    return this.invokeLogger({
      cmd: "renovation_core.utils.logging.log_error",
      ...args
    });
  }

  /**
   * Log client side request
   * @param {RequestResponse} r
   * @param {string[]} tags
   */
  public async logRequest(r: RequestResponse<any>, tags?: string[]) {
    const _tags = ["frontend-request"];
    if (tags) {
      _tags.push(...tags);
    }

    const req = r._.request;
    const reqTxt = `Headers:\n${req._header}\nParams:\n${JSON.stringify(
      req.data.data
    )}`;
    const responseTxt = `Status: ${r._.status}\nHeaders:\n${Object.entries(
      r._.headers
    ).reduce(
      (a, b) => `${a}${b[0]}: ${b[1]}\n`,
      ""
    )}\n\nBody:\n${JSON.stringify(r._.data)}`;

    return this.invokeLogger({
      cmd: "renovation_core.utils.logging.log_client_request",
      request: reqTxt,
      response: responseTxt,
      tags: _tags
    });
  }

  /**
   * A wrapper fn for backend endpoint
   * @param {InvokeLoggerParams} params
   */
  private async invokeLogger(params: InvokeLoggerParams) {
    if (params.tags && typeof params.tags === "object") {
      params.tags.push(...this._defaultTags);
      // frappe param bug
      params.tags = JSON.stringify(params.tags);
    } else {
      params.tags = JSON.stringify(this._defaultTags);
    }
    return this.getCore()
      .call({
        ...params
      })
      .then(r => {
        if (r.success) {
          r.data = r.data.message;
          r.data.tags = (r.data.tags || []).map(x => x.tag);
        }
        return r;
      });
  }

  /**
   * Processes polymorphic params to uniform obj
   * @param content
   * @param tags
   * @param title
   */
  private processLogManagerParams(
    content: string | LogManagerParams,
    tags?: string[],
    title?: string
  ): LogManagerParams {
    let args: LogManagerParams = null;
    if (typeof content === "string") {
      args = {
        content,
        tags,
        title
      };
    } else {
      args = content;
    }

    return args;
  }
}
