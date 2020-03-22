/**
 * Interface to implement in error throwing classes
 *
 * Preferably use switch/cases with default error handling
 */
import { AxiosError, AxiosResponse } from "axios";
import { RenovationError } from "./request";

export interface IErrorHandler {
  /**
   * Method that handles errors by parsing the raw response or custom input.
   * If other errors are to be added, then they will be handled here as if-else or switch-case
   * Each error needs to be supplied an ID, or null if a Generic Error were to be returned
   *
   * @param {string} errorId The identifier of the error for each error per controller. If `null` is passed, consider it a GenericError
   * @param {ErrorDetail} error The error object to be handled
   * @return {ErrorDetail} The final error object
   */
  handleError(errorId: string, error: ErrorDetail): ErrorDetail;
}

/**
 * ErrorDetail interface to be used in the RequestResponse body
 */
export interface ErrorDetail {
  /**
   * Title of the message. Can be used in the front-end
   */
  title?: string;
  /**
   * A short description of the error than can be used in the front-end
   */
  description?: string;
  /**
   * Type of error (validation, permission, etc...)
   */
  type?: RenovationError;
  /**
   * More details
   */
  info: {
    /**
     * Message from the server (back-end), if from the server
     */
    server_messages?: string[];
    /**
     * HTTP code if the is from the server
     */
    httpCode?: number;
    /**
     * A cause of the error, if any
     */
    cause?: string;
    /**
     * A suggestion message, if any, to resolve the error
     */
    suggestion?: string;
    /**
     * Further details for debugging/logging
     */
    data?: any;
    /**
     * The raw response from axios
     */
    rawResponse?: AxiosResponse;

    /**
     * The raw error from axios
     */
    rawError?: AxiosError;
  };
}
