import { RenovationConfig } from "./config";
import { Renovation } from "./renovation";
import { ErrorDetail, IErrorHandler } from "./utils/error";
import { RenovationError } from "./utils/request";

/**
 * A superclass to be inherited by controllers
 *
 * It contains the following methods that are concrete:
 * - getCore() => returns the Renovation instance
 * - getHostUrl() => returns the host URL used to connect to the backend
 */
export default abstract class RenovationController implements IErrorHandler {
  public static readonly GENERIC_ERROR_TITLE = "Generic Error";
  public static readonly DOCTYPE_NOT_EXIST_TITLE = "DocType doesn't exist";
  public static readonly DOCNAME_NOT_EXIST_TITLE = "Docname doesn't exist";
  /**
   * A generic method to parse a `GenericError`. The following is achieved on the object:
   *
   * - Set type as `GenericError` by default if not already set
   * - Set title as 'Generic Error` by default if not already set
   *
   * @param {ErrorDetail} errorDetail The error object to be parsed
   * @return {ErrorDetail} The parsed `ErrorDetail` object
   */
  public static genericError(errorDetail: ErrorDetail): ErrorDetail {
    return {
      ...errorDetail,
      title: errorDetail.title
        ? errorDetail.title
        : RenovationController.GENERIC_ERROR_TITLE,
      type: errorDetail.type ? errorDetail.type : RenovationError.GenericError,
      info: { ...errorDetail.info, httpCode: 400 }
    };
  }
  constructor(protected config: RenovationConfig) {}

  /**
   * Error Handler to be implemented by each controller
   * @param {string} errorId The identifier of the error. Can be defined on the spot.
   * @param {ErrorDetail} error The error object from `RequestResponse`
   * @return {ErrorDetail} The modified error object
   */
  public abstract handleError(errorId: string, error: ErrorDetail): ErrorDetail;

  /**
   * Clears the cache. Needs to be implemented by the extended classes
   */
  public abstract clearCache();

  /**
   * Gets the reference to the core instance
   * @returns {Renovation} The renovation instance
   */
  public getCore(): Renovation {
    return this.config.coreInstance;
  }

  /**
   * Gets the configured host URL
   * @returns {string} The host URL
   */
  public getHostUrl(): string {
    return this.config.hostUrl;
  }

  // public abstract handleError(errorId: string, error: ErrorDetail): ErrorDetail;
}
