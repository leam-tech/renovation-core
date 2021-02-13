import axios, { AxiosResponse } from "axios";
import qs from "qs";
import { BehaviorSubject } from "rxjs";
import { RenovationConfig } from "../config";
import { ErrorDetail } from "./error";
import { renovationError, renovationLog, renovationWarn } from "./index";
import { getJSON } from "./json";

// determine if browser or node
export let onBrowser = true;

/**
 * Whether the process is NodeJS
 * @returns {boolean} `true` if on NodeJS
 */
export function isNodeJS() {
  // @ts-ignore
  if (typeof process === "undefined") {
    return false;
  }
  return (
    // @ts-ignore
    (((process || {}).release || {}).name || "").search(/node|io.js/) !== -1
  );
}

if (typeof window === "undefined" || isNodeJS()) {
  onBrowser = false;
}

/**
 * Whether the process is in the browser
 * @returns {boolean} `true` if on Browser
 */
export function isBrowser() {
  return onBrowser;
}

let clientId: string | null = null;
if (onBrowser) {
  const id = localStorage.getItem("renovation_core_client_id");

  if (id) {
    setClientId(id);
  }
}

/**
 * Sets client Id
 * @param id Client Id
 */
export function setClientId(id: string) {
  clientId = id;
  renovationLog(`Client: ${id}`);
  if (onBrowser) {
    localStorage.setItem("renovation_core_client_id", id);
  }
}

/**
 * Get the client id set
 *
 * @returns {string|null} The client ID set or null if not set
 */
export function getClientId(): string | null {
  return clientId;
}

/**
 * Resets the client ID and remove `X-Client-Site` header
 */
export function resetClientId() {
  clientId = null;
  delete FrappeRequestOptions.headers["X-Client-Site"];
  if (onBrowser) {
    localStorage.removeItem("renovation_core_client_id");
  }
}

/**
 * Sets X-Client-Id header value
 * @param headers The header dict
 */
export function applyClientId(headers: { [x: string]: any }) {
  const id = getClientId();
  if (!id) {
    return;
  }
  headers["X-Client-Site"] = id;
}

// Errors
export enum RenovationError {
  AuthenticationError,
  PermissionError,
  NotFoundError,
  NetworkError,
  GenericError,
  DataFormatError,
  DuplicateEntryError
}

export enum httpMethod {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  DELETE = "DELETE"
}

export enum contentType {
  "query-string" = "query-string",
  "application/json" = "application/json",
  "application/x-www-form-urlencoded" = "application/x-www-form-urlencoded",
  "multipart/form-data" = "multipart/form-data"
}

// tslint:disable-next-line:interface-name
export interface SessionStatusInfo {
  [x: string]: any;
  loggedIn: boolean;
  timestamp: number;
  currentUser?: string;
}
export type AxiosResponseType =
  | "arraybuffer"
  | "blob"
  | "document"
  | "json"
  | "text"
  | "stream";

/**
 * Holds the session status as `BehaviorSubject`. Initial value set as:
 *
 * ``` json
 * {
 *   loggedIn: false,
 *   timestamp: new Date().getTime() / 1000
 * }
 * ```
 *
 */
// tslint:disable-next-line:variable-name
export const SessionStatus: BehaviorSubject<SessionStatusInfo> = new BehaviorSubject(
  {
    loggedIn: false,
    timestamp: new Date().getTime() / 1000
  } as SessionStatusInfo
);

export const axiosInstance = axios.create();

/**
 * Wrapper for underlying HTTP Client used
 * @param url The URL of the endpoint
 * @param method The method of the API based on the enum `httpMethod`
 * @param headers The headers to be used for the request
 * @param data The body of the request if it is a POST or Querystring
 * @param responseType The response type that is expected from the backend (Mostly used in case of blobs)
 * @returns The `RequestResponse` object which encapsulates the parsed response of axios as success or failure
 */
export async function Request(
  url,
  method: httpMethod,
  headers,
  data?: { contentType: contentType; data: any },
  responseType: AxiosResponseType = "json"
): Promise<RequestResponse<any>> {
  // tslint:disable-next-line:variable-name
  let _method = "GET";

  applyCookieHeader(headers);
  switch (method) {
    case httpMethod.GET:
      _method = "GET";
      break;
    case httpMethod.POST:
      _method = "POST";
      break;
    case httpMethod.PUT:
      _method = "PUT";
      break;
    case httpMethod.DELETE:
      _method = "DELETE";
      break;
    default:
      throw new Error("Not Implemented");
  }

  // data dict
  // tslint:disable-next-line:variable-name
  const _data = {};
  if (data) {
    let property = "form";
    switch (data.contentType) {
      case contentType["query-string"]:
        headers["content-type"] = "";
        property = "params";
        break;
      case contentType["application/json"]:
        headers["content-type"] = "application/json";
        property = "data";
        break;
      case contentType["application/x-www-form-urlencoded"]:
        property = "data";
        data.data = qs.stringify(data.data);
        headers["content-type"] = "application/x-www-form-urlencoded";
        break;
      case contentType["multipart/form-data"]:
        property = "data";
        break;
      default:
        headers["content-type"] = "";
    }
    _data[property] = data.data;
  } else {
    headers["content-type"] = ""; // mandatory
  }

  applyClientId(headers);

  // tslint:disable-next-line:variable-name
  let _response;
  let r: RequestResponse<any>;
  try {
    const response = await axiosInstance({
      method: _method,
      withCredentials: true,
      url,
      headers,
      ..._data,
      responseType
    });

    _response = response;
    cookieHandler(response);
    if (Math.floor(response.status / 100) === 2) {
      r = RequestResponse.success(response.data, response.status);
    } else {
      r = RequestResponse.fail({
        info: {
          httpCode: response.status,
          rawResponse: response,
          data: response.data
        }
      });
    }
  } catch (err) {
    _response = err;
    if (err.response && err.response.data) {
      err = err.response.data;
    }
    r = RequestResponse.fail({
      info: {
        httpCode: _response.response ? _response.response.status : undefined,
        rawError: _response,
        data: err
      }
    });
  } finally {
    messageChecker(r);
    errorChecker(r);

    if (!r.success) {
      // renovationLog("Failed AXIOS Response", _response);
    }
    // tslint:disable-next-line:no-string-literal
    r._ = _response;
    // ref to param details are kept for logging purposes
    r._.request.data = data;
  }
  return r;
}

/**
 * Checks if the response contains messages and adds them to the message bus to be used by the front-end
 * @param r The response object as `RequestResponse`
 */
function messageChecker(r: RequestResponse<any>) {
  if (r.data?._server_messages) {
    r.data._server_messages = getJSON(r.data._server_messages);
    for (let messg of r.data._server_messages) {
      messg = getJSON(messg);
      RenovationConfig.instance.coreInstance.messages.next(messg);
    }
  }
}

/**
 * Checks for the errors in the response
 *
 * If the response contains a 'session_expired', the session status is set to logged out
 *
 * @param r The response object as `RequestResponse`
 */
function errorChecker(r: RequestResponse<any>) {
  // r.data is tried for JSON
  // r.data.exc will have frappe exc
  if (!r.success) {
    const excContains = (sx: string) => {
      return r.data?.exc ? r.data.exc.indexOf(sx) >= 0 : false;
    };

    if (r.data?.session_expired) {
      SessionStatus.next({
        loggedIn: false,
        timestamp: new Date().getTime() / 1000,
        session_expired: true
      });
    }

    // TODO: Other errors?
    if (excContains("PermissionError")) {
      r.exc = RenovationError.PermissionError;
      r.error.type = RenovationError.PermissionError;
    } else if (excContains("AuthenticationError")) {
      r.exc = RenovationError.AuthenticationError;
      r.error.type = RenovationError.AuthenticationError;
    }

    // {"_server_messages":"[\"{\\\"message\\\": \\\"Invalid Request\\\", \\\"indicator\\\": \\\"red\\\"}\"]"}
    let data = getJSON(r.data?._server_messages);
    if (data && data.length > 0) {
      data = getJSON(data[0]);
      if (data.message === "Invalid Request") {
        renovationError("Invalid Request. Best to Relogin");
        // tslint:disable-next-line: no-empty
        try {
          RenovationConfig.instance.coreInstance.auth.logout();
        } catch (e) {
          renovationWarn(e);
        }
        SessionStatus.next({
          loggedIn: false,
          timestamp: new Date().getTime() / 1000
        });
      }
    }
  }
}

const cookieCache = {};

/**
 * Cookie handler for the response from axios.
 *
 * If the response contains `set-cookie', the cookie is set to `cookieCache` that will be used for subsequent calls
 *
 * If used on the browser, the function will not do anything
 * @param response The response from axios
 */
function cookieHandler(response) {
  if (onBrowser) {
    return;
  }
  if (response.headers["set-cookie"]) {
    for (const v of response.headers["set-cookie"]) {
      // check if there is ;
      let s: any = "";
      if (v.includes(";")) {
        s = v.split(";")[0];
      }
      s = s.split("=");
      cookieCache[s[0]] = s[1];
    }
  }
}

/**
 * Sets the cookies in `cookieCache` to the header
 * @param headers The header object to have the cookies added. Passed as reference
 *
 * * If used on the browser or `cookieCache` is empty, the function will not do anything
 */

export function applyCookieHeader(headers) {
  if (onBrowser || !cookieCache) {
    return;
  }
  let s = "";
  // tslint:disable-next-line:forin
  for (const c in cookieCache) {
    s += `${c}=${cookieCache[c]};`;
  }
  if (s) {
    headers.Cookie = s;
  }
}

/**
 * A helper class for handling and representing responses from the backend
 */
export class RequestResponse<T> {
  /**
   * Returns a success response with `httpCode` [200 default] along with the typed data, if any
   * @param data The data to be set part of the response body
   * @param httpCode The HTTP code
   * @param rawResponse The raw response as `AxiosResponse`
   * @returns {RequestResponse} Object with `httpCode` , `success` as `true` and data
   */
  public static success<F>(
    data: F,
    httpCode?: number,
    rawResponse?: AxiosResponse
  ): RequestResponse<F> {
    const r = new RequestResponse<F>(httpCode || 200, true, data);
    r._ = rawResponse;
    return r;
  }

  /**
   * Returns a failure response with httpCode and success as failure.
   *
   * In addition, the body and exc for the server messages and errors
   * @param httpCode The httpCode to be set. Defaults to 400
   * @param body The body of the response
   * @param exc The server messages / tracebacks
   * @deprecated
   */
  public static failed(
    httpCode?: number,
    body?: any,
    exc?: RenovationError
  ): RequestResponse<any> {
    return new RequestResponse(httpCode || 400, false, body);
  }

  /**
   * Returns a `RequestResponse` instance with the error details
   * @param {ErrorDetail} errorDetail The error detail object
   * @return {RequestResponse<any>} Failed `RequestResponse` containing the status code and `ErrorDetail` object
   */
  public static fail(errorDetail: ErrorDetail): RequestResponse<any> {
    return new RequestResponse<any>(
      errorDetail.info.httpCode,
      false,
      errorDetail.info ? errorDetail.info.data : undefined,
      undefined,
      errorDetail
    );
  }

  /**
   * Placeholder of the response (Temporary)
   */
  public _: AxiosResponse;

  constructor(
    public httpCode: number,
    public success: boolean,
    public data: T,
    public exc?: RenovationError,
    public error?: ErrorDetail
  ) {}
}

/**
 * Default settings for axios request
 */
// tslint:disable-next-line:variable-name
export const FrappeRequestOptions = {
  headers: {
    Accept: ["application/json"],
    "X-Requested-With": ["XMLHttpRequest"]
  } as { [x: string]: string[] },
  jar: true,
  withCredentials: true
};

/** the localStorage key used for session storage */
export const renovationSessionKey = "renovation_core_session_info";
