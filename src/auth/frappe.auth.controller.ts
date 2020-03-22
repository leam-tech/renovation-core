import { RenovationConfig } from "../config";
import RenovationController from "../renovation.controller";
import { asyncSleep, getJSON } from "../utils";
import { ErrorDetail } from "../utils/error";
import {
  contentType,
  FrappeRequestOptions,
  httpMethod,
  onBrowser,
  RenovationError,
  Request,
  RequestResponse,
  SessionStatus,
  SessionStatusInfo
} from "../utils/request";
import AuthController from "./auth.controller";
import {
  LoginParams,
  PinLoginParams,
  SendOTPParams,
  SendOTPResponse,
  VerifyOTPParams,
  VerifyOTPResponse
} from "./interfaces";

/**
 * Frappe Authentication Controller containing methods and properties related to Frappe
 */
export default class FrappeAuthController extends AuthController {
  constructor(config: RenovationConfig) {
    super(config);
  }

  public handleError(errorId: string, error: ErrorDetail): ErrorDetail {
    let err = {} as ErrorDetail;

    switch (errorId) {
      case "verify_otp":
        errorId = error.info.data.status;
        err = this.handleError(errorId, error);
        break;
      case "invalid_pin":
        err = {
          ...error,
          type: RenovationError.AuthenticationError,
          title: "Wrong OTP",
          description: "Entered OTP is wrong",
          info: {
            ...error.info,
            httpCode: 401,
            cause: "Wrong OTP entered",
            suggestion:
              "Enter correct OTP received by SMS or generate a new OTP"
          }
        };
        break;
      case "user_not_found":
      case "no_linked_user":
        err = {
          ...error,
          type: RenovationError.NotFoundError,
          title: "User not found",
          info: {
            ...error.info,
            httpCode: 404,
            cause:
              "User is either not registered or does not have a mobile number",
            suggestion: "Create user or add a mobile number"
          }
        };
        break;

      case "pin_login":
        err = {
          ...error,
          title: "Incorrect Pin",
          info: {
            ...error.info,
            cause: "Wrong PIN is entered",
            suggestion: "Re-enter the PIN correctly"
          }
        };
        break;

      case "login":
        switch (error.info.data.message) {
          case "User disabled or missing":
            err = this.handleError("login_user_non_exist", error);
            break;
          case "Incorrect password":
            err = this.handleError("login_incorrect_password", error);
            break;
          default:
            err = this.handleError(null, error);
        }
        break;
      case "login_incorrect_password":
        err = {
          ...error,
          title: "Incorrect Password",
          type: RenovationError.AuthenticationError,
          info: {
            ...error.info,
            cause: error.info.data.message, // Server Response: Incorrect password
            suggestion: "Enter the correct credentials"
          }
        };
        break;

      case "login_user_non_exist":
        err = {
          ...error,
          title: "User not found",
          type: RenovationError.NotFoundError,
          info: {
            ...error.info,
            httpCode: 404, // Indicating not found
            cause: error.info.data.message, // Server Response: User disabled or missing
            suggestion: "Create the new user or enable it if disabled"
          }
        };
        break;
      // No specific errors
      case "get_current_user_roles":
      case "logout":
      case "send_otp":
      default:
        err = RenovationController.genericError(error);
    }

    return err;
  }

  /**
   * Checks the session's status (Whether the user is logged in or not)
   *
   * If it exists in the cache, the status will be compared between the server's session silently
   *
   * @returns {Promise<RequestResponse<SessionStatusInfo>>} The session status within `RequestResponse`
   */
  public async checkLogin(): Promise<RequestResponse<SessionStatusInfo>> {
    // check localStorage for previous login

    let resolved = false;
    let info: SessionStatusInfo | null = null;
    if (onBrowser) {
      info = this.getSessionFromLocalStorage();
      if (info && info.loggedIn) {
        resolved = true;
        // if session status was updated in 3 seconds, dont request backend
        if (new Date().getTime() / 1000 - (info.timestamp || 0) < 3) {
          console.warn(
            "Renovation Core: Last login status updated less than three seconds ago."
          );
        } else {
          this.verifySessionWithBackend(resolved, info);
        }
        return RequestResponse.success(info);
      } else {
        // no login info or not logged in
        info = info || {
          loggedIn: false,
          timestamp: new Date().getTime() / 1000
        };
        return RequestResponse.failed(403, info || { loggedIn: false });
      }
    }
    return await this.verifySessionWithBackend(resolved, null);
  }

  /**
   * Login using email and password.
   * @param email {string} Email of the user
   * @param password {string} Password of the user
   * @deprecated
   *
   * @returns {Promise<RequestResponse<SessionStatusInfo>>} The session status within `RequestResponse`
   */
  public async login(
    email: string,
    password: string
  ): Promise<RequestResponse<SessionStatusInfo>>;
  /**
   * Login using email and password.
   * @param loginParams {LoginParams} Email and Password
   *
   * @returns {Promise<RequestResponse<SessionStatusInfo>>} The session status within `RequestResponse`
   */
  public async login(
    loginParams: LoginParams
  ): Promise<RequestResponse<SessionStatusInfo>>;
  public async login(
    loginParams: string | LoginParams,
    password?: string
  ): Promise<RequestResponse<SessionStatusInfo>> {
    if (typeof loginParams === "string") {
      console.warn(
        "LTS-Renovation-Core",
        "login(loginParams, password) is deprecated, please use the interfaced approach instead"
      );
      return this.login({
        email: loginParams,
        password
      });
    }
    const args = loginParams as LoginParams;
    const response = await Request(
      `${this.config.hostUrl}/api/method/login`,
      httpMethod.POST,
      FrappeRequestOptions.headers,
      {
        contentType: contentType["application/x-www-form-urlencoded"],
        data: {
          usr: args.email,
          pwd: args.password,
          use_jwt: this.useJwt ? 1 : 0
        }
      }
    );

    await this.updateSession({
      loggedIn: response.success,
      data: response.data
    }); // updates localStorage

    return response.success
      ? RequestResponse.success(SessionStatus.getValue())
      : RequestResponse.fail(this.handleError("login", response.error));
  }

  /**
   * PIN Login (Quick Login)
   * @param pinLoginParams {PinLoginParams} Parameters of quick login (Pin Login)
   *
   * @returns {Promise<RequestResponse<SessionStatusInfo>>} The session status within `RequestResponse`
   */
  public async pinLogin(
    pinLoginParams: PinLoginParams
  ): Promise<RequestResponse<SessionStatusInfo>>;
  /**
   * PIN Login (Quick Login)
   * @param user The user identifier
   * @param pin The quick login pin (Different from OTP)
   * @deprecated
   *
   * @returns {Promise<RequestResponse<SessionStatusInfo>>} The session status within `RequestResponse`
   */
  public async pinLogin(
    user: string,
    pin: string
  ): Promise<RequestResponse<SessionStatusInfo>>;
  public async pinLogin(
    user: string | PinLoginParams,
    pin?: string
  ): Promise<RequestResponse<SessionStatusInfo>> {
    if (typeof user === "string") {
      console.warn(
        "LTS-Renovation-Core",
        "pinLogin(user, pin) is deprecated, please use the interfaced approach instead"
      );
      return this.pinLogin({
        user,
        pin
      });
    }
    const args = user as PinLoginParams;
    const r = await this.config.coreInstance.call({
      cmd: "renovation_core.utils.auth.pin_login",
      user: args.user,
      pin: args.pin,
      use_jwt: this.useJwt ? 1 : 0
    });

    await this.updateSession({ loggedIn: r.success, data: r.data });
    return r.success
      ? r
      : RequestResponse.fail(this.handleError("pin_login", r.error));
  }

  /**
   * Generates and send an OTP to the mobile specified
   * if newPIN is true, a prev. sent, cached pin wont be used. Instead a fresh one will be issued
   * @param sendOTPParams The OTP generation parameters
   * @returns {Promise<RequestResponse<SendOTPResponse>>} The generation response within `RequestResponse`
   */
  public async sendOTP(
    sendOTPParams: SendOTPParams
  ): Promise<RequestResponse<SendOTPResponse>> {
    const response = await Request(
      `${this.config.hostUrl}/api/method/renovation/auth.sms.generate`,
      httpMethod.POST,
      FrappeRequestOptions.headers,
      {
        contentType: contentType["application/x-www-form-urlencoded"],
        data: {
          mobile: sendOTPParams.mobile,
          newPIN: sendOTPParams.newOTP ? 1 : 0,
          hash: sendOTPParams.hash ? sendOTPParams.hash : null
        }
      }
    );
    if (response.success) {
      response.data = getJSON(response.data) || response.data;
    }
    return response.success
      ? response
      : RequestResponse.fail(this.handleError("send_otp", response.error));
  }

  /**
   * Verifies if the PIN entered by the user matches
   * if loginToUser is true, it will start a session
   * @param verifyOTPParams The OTP verification parameters
   * @returns {Promise<RequestResponse<VerifyOTPResponse>>} The response of verification within `RequestResponse`
   */
  public async verifyOTP(
    verifyOTPParams: VerifyOTPParams
  ): Promise<RequestResponse<VerifyOTPResponse>> {
    const response = await Request(
      `${this.config.hostUrl}/api/method/renovation/auth.sms.verify`,
      httpMethod.POST,
      FrappeRequestOptions.headers,
      {
        contentType: contentType["application/x-www-form-urlencoded"],
        data: {
          mobile: verifyOTPParams.mobile,
          pin: verifyOTPParams.OTP,
          loginToUser: verifyOTPParams.loginToUser ? 1 : 0,
          use_jwt: this.useJwt ? 1 : 0
        }
      }
    );
    if (response.success) {
      response.data = getJSON(response.data) || response.data;
      if (response.data.status !== "verified") {
        response.success = false;
      } else {
        // successful login
        if (verifyOTPParams.loginToUser) {
          // update session
          // response.data.user is expected from renovation_core
          await this.updateSession({ loggedIn: true, data: response.data });
        }
      }
    }

    if (!response.success && !response.error) {
      response.error = {
        info: {
          data: response.data,
          rawResponse: response._,
          httpCode: response.httpCode
        }
      };
    }
    return response.success
      ? response
      : RequestResponse.fail(this.handleError("verify_otp", response.error));
  }

  /**
   * Get the current user's role from the backend if not stored in `currentUserRoles`, otherwise, get the stored value
   *
   * @returns {Promise<RequestResponse<string[]>>} The list of roles for the user. If a user is not signed-in, the Guest roles are fetched
   */
  public async getCurrentUserRoles(): Promise<RequestResponse<string[]>> {
    if (
      this.currentUserRoles &&
      this.currentUserRoles.length &&
      this.currentUserRoles[0] === "loading"
    ) {
      // someone else invoked this and is being fetched from server
      await asyncSleep(50);
      return await this.getCurrentUserRoles();
    } else if (this.currentUserRoles && this.currentUserRoles.length > 1) {
      return RequestResponse.success(this.currentUserRoles);
    }
    this.currentUserRoles = ["loading"];
    const response = await Request(
      `${this.getHostUrl()}/api/method/renovation_core.utils.client.get_current_user_roles`,
      httpMethod.GET,
      FrappeRequestOptions.headers
    );

    if (response.success && response.data) {
      response.data = response.data.message;
      this.currentUserRoles = response.data;
    } else {
      this.currentUserRoles = null;
    }
    return response.success
      ? response
      : RequestResponse.fail(
          this.handleError("get_current_user_roles", response.error)
        );
  }

  public async logout(): Promise<RequestResponse<any>> {
    await this.updateSession({ loggedIn: false });
    const r = await Request(
      `${this.config.hostUrl}/api/method/frappe.handler.logout`,
      httpMethod.GET,
      FrappeRequestOptions.headers
    );

    return r.success
      ? r
      : RequestResponse.fail(this.handleError("logout", r.error));
  }

  /**
   * Helper method used to verify the session in the backend
   *
   * Does not block the login checking. Will emit to SessionStatus on change.
   *
   * @param resolved Whether the session is resolved in the front-end (browser)
   * @param info The status info, if any.
   */
  private async verifySessionWithBackend(
    resolved = false,
    info: SessionStatusInfo | null
  ) {
    const response = await Request(
      `${this.config.hostUrl}/api/method/frappe.auth.get_logged_user`,
      httpMethod.GET,
      FrappeRequestOptions.headers
    );
    if (response.success) {
      const data = getJSON(response.data);
      if (resolved) {
        // check if same login
        if (data.user !== (info as SessionStatusInfo).currentUser) {
          // login changed
          // notify SessionExpired
          console.warn(
            "RenovationCore",
            "Wrong session assumption. I hope you are listening at SessionStatus"
          );
          await this.updateSession({
            loggedIn: false
          });
        }
      } else {
        await this.updateSession({
          loggedIn: true,
          data
        });
      }
      return RequestResponse.success(data);
    } else {
      if (resolved) {
        // we told system yes we are logged in
        console.warn("Renovation Core", "INVALID SESSION");
      } else {
        await this.updateSession({
          loggedIn: false
        });
        return response;
      }
      await this.updateSession({
        loggedIn: false
      });
    }
  }

  /**
   * Sets the user's language in Frappé backend.
   *
   * Throws an error if lang is `null` or an empty string.
   *
   * Throws an error if the user is not logged in.
   *
   * If successful, updates the lang field of SessionStatus.
   *
   * @param lang The language to be set for the user in the backend.
   */
  public async setUserLanguage(lang: string): Promise<boolean> {
    if (lang == null || lang.trim() == "")
      throw new Error("Language cannot be null or an empty string");
    const currentSession = SessionStatus.value;

    if (!currentSession || !currentSession.loggedIn)
      throw new Error(
        "No user logged in. This operation requires a logged in user"
      );

    const response = await this.getCore().model.setValue({
      doctype: "User",
      docname: currentSession.currentUser,
      docfield: "language",
      value: lang
    });
    if (response.success) {
      currentSession.lang = lang;
      this.updateSession({ loggedIn: true, data: currentSession });
    }
    return response.success;
  }
}
