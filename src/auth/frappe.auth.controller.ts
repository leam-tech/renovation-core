import zxcvbn from "zxcvbn";
import { RenovationConfig } from "../config";
import RenovationController from "../renovation.controller";
import { asyncSleep, getJSON, renovationError, renovationWarn } from "../utils";
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
  ChangePasswordParams,
  EstimatePasswordParams,
  GenerateResetOTPParams,
  GenerateResetOTPResponse,
  LoginParams,
  LoginViaAppleParams,
  LoginViaGoogleParams,
  PasswordResetInfoParams,
  PinLoginParams,
  ResetPasswordInfo,
  SendOTPParams,
  SendOTPResponse,
  UpdatePasswordParams,
  UpdatePasswordResponse,
  VerifyOTPParams,
  VerifyOTPResponse,
  VerifyResetOTPParams,
  VerifyResetOTPResponse
} from "./interfaces";

/**
 * Frappe Authentication Controller containing methods and properties related to Frappe
 */
export default class FrappeAuthController extends AuthController {
  constructor(config: RenovationConfig, useJWT: boolean) {
    super(config, useJWT);
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
        const errorData = error.info.data;
        if (errorData && errorData.message === "Quick Login PIN time expired") {
          err = {
            ...error,
            title: "Quick Login PIN Usage Window Expired",
            info: {
              ...error.info,
              cause: "Quick PIN Usage window expired",
              suggestion: "Login with full credentials"
            }
          };
        } else {
          err = {
            ...error,
            title: "Incorrect Pin",
            info: {
              ...error.info,
              cause: "Wrong PIN is entered",
              suggestion: "Re-enter the PIN correctly"
            }
          };
        }
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

      case "change_pwd":
        if (error.type === RenovationError.AuthenticationError) {
          err = {
            ...error,
            title: "Invalid Password",
            info: {
              ...error.info,
              cause: "Wrong old password",
              suggestion:
                "Check that the current password is correct, or reset the password"
            }
          };
        } else if (
          error.info.httpCode === 417 &&
          error.info.data._server_messages.length &&
          error.info.data._server_messages[0].includes("Invalid Password")
        ) {
          err = {
            ...error,
            title: "Weak Password",
            info: {
              ...error.info,
              cause: "Password does not pass the policy",
              suggestion:
                "Use stronger password, including uppercase, digits and special characters"
            }
          };
        }
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
          renovationWarn(
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
      renovationWarn(
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
    await this.getCore().frappe.checkAppInstalled(["pinLogin"]);
    if (typeof user === "string") {
      renovationWarn(
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
    await this.getCore().frappe.checkAppInstalled(["sendOTP"]);

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
    await this.getCore().frappe.checkAppInstalled(["verifyOTP"]);

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
    await this.getCore().frappe.checkAppInstalled(["getCurrentUserRoles"]);

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

  public async setSessionStatusInfo({
    sessionStatusInfo
  }: {
    sessionStatusInfo: SessionStatusInfo;
  }) {
    await this.updateSession({
      loggedIn: sessionStatusInfo.loggedIn,
      data: sessionStatusInfo
    });
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
          renovationWarn(
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
        renovationWarn("Renovation Core", "INVALID SESSION");
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
    if (lang == null || lang.trim() == "") {
      throw new Error("Language cannot be null or an empty string");
    }
    const currentSession = SessionStatus.value;

    if (!currentSession || !currentSession.loggedIn) {
      throw new Error(
        "No user logged in. This operation requires a logged in user"
      );
    }

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

  /**
   * Changes the password of the currently logged in user.
   *
   * Validates the old (current) password before changing it.
   *
   * Validates for compliance with the Password Policy (zxcvbn).
   * @param args The old and new password
   */
  public async changePassword(
    args: ChangePasswordParams
  ): Promise<RequestResponse<boolean>> {
    await this.getCore().frappe.checkAppInstalled(["changePassword"]);

    if (
      !args ||
      !args.old_password ||
      !args.new_password ||
      args.old_password === "" ||
      args.new_password === ""
    ) {
      renovationError("Passwords must be specified");
      return;
    }

    if (!this.currentUser || this.currentUser == "Guest") {
      renovationError("Need to be signed in to change password");
      return;
    }

    const response = await this.config.coreInstance.call({
      cmd: "renovation_core.utils.auth.change_password",
      old_password: args.old_password,
      new_password: args.new_password
    });

    if (response.success) {
      return RequestResponse.success(
        response.success,
        response.httpCode,
        response._
      );
    } else {
      const err = RequestResponse.fail(
        this.handleError("change_pwd", response.error)
      );
      err.data = false;
      return err;
    }
  }

  /**
   * Gets the password possible reset methods & hints about these methods.
   *
   * @param args The type (email or sms) of the user id and the id itself
   */
  public async getPasswordResetInfo(
    args: PasswordResetInfoParams
  ): Promise<RequestResponse<ResetPasswordInfo>> {
    await this.getCore().frappe.checkAppInstalled(["getPasswordResetInfo"]);

    if (!args || !args.type) {
      renovationError("ID type can't be empty");
      return;
    }
    if (!args.id || args.id === "") {
      renovationError("ID can't be empty");
      return;
    }

    const response = await this.config.coreInstance.call({
      cmd: "renovation_core.utils.forgot_pwd.get_reset_info",
      id_type: args.type,
      id: args.id
    });

    if (response.success) {
      if (response.data.message != null) {
        return RequestResponse.success(
          response.data.message,
          response.httpCode,
          response._
        );
      }
    }
    return RequestResponse.fail(response.error);
  }

  /**
   * Generates the OTP and sends it through the chosen medium.
   *
   * This is the first step for resetting a forgotten password.
   * @param args The user's id and the medium on which to receive the OTP
   */
  public async generatePasswordResetOTP(
    args: GenerateResetOTPParams
  ): Promise<RequestResponse<GenerateResetOTPResponse>> {
    await this.getCore().frappe.checkAppInstalled(["generatePasswordResetOTP"]);
    if (!args || !args.type) {
      renovationError("ID type can't be empty");
      return;
    }
    if (!args.id || args.id === "") {
      renovationError("ID can't be empty");
      return;
    }
    if (!args.medium_type) {
      renovationError("Medium type can't be empty");
      return;
    }
    if (!args.medium_type || args.medium_id === "") {
      renovationError("Medium ID can't be empty");
      return;
    }

    const response = await this.config.coreInstance.call({
      cmd: "renovation_core.utils.forgot_pwd.generate_otp",
      id_type: args.type,
      id: args.id,
      medium: args.medium_type,
      medium_id: args.medium_id
    });

    if (response.success) {
      const otpResponse = response.data.message as GenerateResetOTPResponse;

      if (otpResponse.sent) {
        return RequestResponse.success(
          otpResponse,
          response.httpCode,
          response._
        );
      } else {
        const failResponse = RequestResponse.fail({
          title: otpResponse.reason,
          info: { httpCode: 400 }
        });
        failResponse.data = otpResponse;
        return failResponse;
      }
    }
    return RequestResponse.fail(response.error);
  }

  /**
   * Verifies the OTP sent through `generatePasswordResetOTP`.
   *
   * This is the second step for resetting a forgotten password.
   * @param args The otp received along with the user's id and the medium.
   */
  public async verifyPasswordResetOTP(
    args: VerifyResetOTPParams
  ): Promise<RequestResponse<VerifyResetOTPResponse>> {
    await this.getCore().frappe.checkAppInstalled(["verifyPasswordResetOTP"]);
    if (!args || !args.type) {
      renovationError("ID type can't be empty");
      return;
    }
    if (!args.id || args.id === "") {
      renovationError("ID can't be empty");
      return;
    }
    if (!args.medium_type) {
      renovationError("Medium type can't be empty");
      return;
    }
    if (!args.medium_type || args.medium_id === "") {
      renovationError("Medium ID can't be empty");
      return;
    }
    if (!args.otp || args.otp === "") {
      renovationError("OTP can't be empty");
      return;
    }

    const response = await this.config.coreInstance.call({
      cmd: "renovation_core.utils.forgot_pwd.verify_otp",
      id_type: args.type,
      id: args.id,
      medium: args.medium_type,
      medium_id: args.medium_id,
      otp: args.otp
    });

    if (response.success) {
      const otpResponse = response.data.message as VerifyResetOTPResponse;

      if (otpResponse.verified) {
        return RequestResponse.success(
          otpResponse,
          response.httpCode,
          response._
        );
      } else {
        const failResponse = RequestResponse.fail({
          title: otpResponse.reason,
          info: { httpCode: 400 }
        });
        failResponse.data = otpResponse;
        return failResponse;
      }
    }
    return RequestResponse.fail(response.error);
  }

  /**
   * Updates (resets) the password to the chosen password by passing the reset_token.
   *
   * This is the final step for resetting a forgotten password.
   * @param args The new password and the reset token.
   */
  public async updatePasswordWithToken(
    args: UpdatePasswordParams
  ): Promise<RequestResponse<UpdatePasswordResponse>> {
    await this.getCore().frappe.checkAppInstalled(["updatePasswordWithToken"]);
    if (!args || !args.reset_token) {
      renovationError("Reset Token can't be empty");
      return;
    }
    if (!args.new_password || args.new_password === "") {
      renovationError("Password can't be empty");
      return;
    }

    const response = await this.config.coreInstance.call({
      cmd: "renovation_core.utils.forgot_pwd.update_password",
      reset_token: args.reset_token,
      new_password: args.new_password
    });

    if (response.success) {
      const updatePasswordResponse = response.data
        .message as UpdatePasswordResponse;

      if (updatePasswordResponse.updated) {
        return RequestResponse.success(
          updatePasswordResponse,
          response.httpCode,
          response._
        );
      } else {
        const failResponse = RequestResponse.fail({
          title: updatePasswordResponse.reason,
          info: { httpCode: 400 }
        });
        failResponse.data = updatePasswordResponse;
        return failResponse;
      }
    }
    return RequestResponse.fail(response.error);
  }

  /**
   * Estimate the password's strength from 0-4.
   *
   * Optionally can specify other inputs like email, first name, etc..
   *
   * ZXCVBNResult.score : Integer from 0-4 (useful for implementing a strength bar)
   *  0 # too guessable: risky password. (guesses < 10^3)
   *  1 # very guessable: protection from throttled online attacks. (guesses < 10^6)
   *  2 # somewhat guessable: protection from unthrottled online attacks. (guesses < 10^8)
   *  3 # safely unguessable: moderate protection from offline slow-hash scenario. (guesses < 10^10)
   *  4 # very unguessable: strong protection from offline slow-hash scenario. (guesses >= 10^10)
   *
   * ZXCVBNResult.feedback : verbal feedback to help choose better passwords. set when score <= 2.
   *
   * ZXCVBNResult.calcTime : how long it took to calculate an answer in milliseconds.
   *
   * Frappé uses the inputs: [email, firstName, lastName, middleName & dateOfBirth] if available to compute the strength,
   * so make sure the same is specified, if available, to match the estimation done in the backend.
   *
   *
   * @param args The arguments including password (mandatory) and other user inputs.
   */
  public estimatePassword(args: EstimatePasswordParams): zxcvbn.ZXCVBNResult {
    if (!args.password || args.password === "") {
      renovationError("Password can't be empty");
      return;
    }

    const userInputs: string[] = [];

    for (let arg in args.user_inputs || {}) {
      if (arg === "otherInputs") {
        // Only add them to the userInputs if they array is not empty
        if (args[arg] && args.user_inputs[arg].length != 0) {
          userInputs.push(...args[arg]);
        }
      } else {
        // Only add them to the userInputs if they are non-empty
        if (args[arg] && args.user_inputs[arg] !== "") {
          userInputs.push(args[arg]);
        }
      }
    }
    return zxcvbn(args.password, userInputs);
  }

  /**
   * Logs in using Google Auth code.
   *
   * Optionally can pass `state` which is usually a JWT or base64 encoded data
   * @param args: Contains the auth_code and optionally a state.
   */
  public async loginViaGoogle(
    args: LoginViaGoogleParams
  ): Promise<RequestResponse<SessionStatusInfo>> {
    await this.getCore().frappe.checkAppInstalled(["loginViaGoogle"]);

    if (!args?.code || args.code === "") {
      renovationError("Auth Code cannot be empty");
      return;
    }

    const response = await this.config.coreInstance.call({
      cmd: "renovation_core.oauth.login_via_google",
      code: args.code,
      state: args.state,
      use_jwt: this.enableJwt
    });

    if (response.success) {
      await this.updateSession({
        loggedIn: response.success,
        data: response.data
      }); // updates localStorage

      return response.success
        ? RequestResponse.success(
            SessionStatus.getValue(),
            response.httpCode,
            response._
          )
        : RequestResponse.fail(response.error);
    }
  }

  /**
   * Logs in using Apple Auth code.
   *
   * In addition need to specify the option (native | android | web)
   *
   * Optionally can pass `state` which is usually a JWT or base64 encoded data
   * @param args: Contains the auth_code, the option and optionally a state.
   */
  public async loginViaApple(
    args: LoginViaAppleParams
  ): Promise<RequestResponse<SessionStatusInfo>> {
    await this.getCore().frappe.checkAppInstalled(["loginViaApple"]);

    if (!args?.code || args.code === "") {
      renovationError("Auth Code cannot be empty");
      return;
    }

    if (!args.option) {
      renovationError("Apple option must be specified");
      return;
    }

    const response = await this.config.coreInstance.call({
      cmd: "renovation_core.oauth.login_via_apple",
      code: args.code,
      state: args.state,
      option: args.option,
      use_jwt: this.enableJwt
    });

    if (response.success) {
      await this.updateSession({
        loggedIn: response.success,
        data: response.data
      }); // updates localStorage

      return response.success
        ? RequestResponse.success(
            SessionStatus.getValue(),
            response.httpCode,
            response._
          )
        : RequestResponse.fail(response.error);
    }
  }

  /**
   * Sets the session locally obtained externally.
   *
   * Verifies the session with the backend.
   *
   * @param sessionStatusInfo The session that's obtained externally
   */
  public async setExternalSession(
    sessionStatusInfo: SessionStatusInfo
  ): Promise<RequestResponse<SessionStatusInfo>> {
    if (!sessionStatusInfo) {
      renovationError("Session can't be undefined");
      return;
    }

    if (!sessionStatusInfo.user) {
      renovationError(
        "Only a valid session can be set.\nUse .logout() if you want to clear the session"
      );
      return;
    }

    if (this.enableJwt && !sessionStatusInfo.token) {
      renovationError("Token missing in the session");
      return;
    }

    if (this.enableJwt) {
      this.setAuthToken({ token: sessionStatusInfo.token });
    }
    return await this.verifySessionWithBackend(false, sessionStatusInfo);
  }
}
