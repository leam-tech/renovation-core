import Cookies from "js-cookie";
import { deepCloneObject, deepCompare, renovationWarn } from "..";
import { RenovationConfig } from "../config";
import RenovationController from "../renovation.controller";

import {
  FrappeRequestOptions,
  isBrowser,
  renovationSessionKey,
  RequestResponse,
  SessionStatus,
  SessionStatusInfo
} from "../utils/request";
import {
  LoginParams,
  PinLoginParams,
  SendOTPParams,
  SendOTPResponse,
  VerifyOTPParams,
  VerifyOTPResponse
} from "./interfaces";

/**
 * Class containing authentication properties and methods.
 *
 * Authentication methods include standard email/pwd login as well as OTP login.
 *
 * @abstract
 */
export default abstract class AuthController extends RenovationController {
  /**
   * Set this to true to disable JWT
   */
  public set enableJwt(value) {
    this.useJwt = value;
  }

  public get enableJwt() {
    return this.useJwt;
  }

  /**
   * Holds the current user name
   *
   */
  protected currentUser: string;
  /**
   * Holds the current JWT Token
   */
  protected currentToken: string;
  /**
   * Enable jwt if this is true only
   */
  protected useJwt: boolean = false;
  /**
   * The current user's roles
   *
   */
  protected currentUserRoles: string[] = [];

  protected constructor(config: RenovationConfig) {
    super(config);

    /* observable for clearing localStorage
     * Will be called anytime the observables value is changed
     */
    SessionStatus.subscribe(v => {
      renovationWarn("RenovationCore SessionUpdate", v);
      const localSession = this.getSessionFromLocalStorage();
      if (
        // Avoid infinite recursion
        v.session_expired &&
        localSession &&
        (localSession.session_expired === undefined ||
          localSession.session_expired === null)
      ) {
        const _session = deepCloneObject(v);
        delete _session.session_expired;
        this.updateSession({
          data: _session,
          loggedIn: false,
          useTimestamp: _session.timestamp,
          sessionExpired: true
        });
      }
    });
    const session = this.getSessionFromLocalStorage();
    this.updateSession({
      data: session,
      loggedIn: !!session && !!session.loggedIn,
      // its mandatory not to update timestamp on loading from local storage
      // this causes checkLogin() to verify with backend
      // otherwise, it will return logged in
      useTimestamp: !!session && session.timestamp
    });
  }

  /**
   * Gets the name of currentUser
   */
  public getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Gets the current jwt token
   */
  public getCurrentToken() {
    return !!this.currentToken ? `Token ${this.currentToken}` : null;
  }

  /**
   * Returns information about the current user/session
   * @returns {Promise<RequestResponse<SessionStatusInfo>>} The session status within `RequestResponse`
   *
   */
  public abstract async checkLogin(): Promise<
    RequestResponse<SessionStatusInfo>
  >;

  /**
   * Login using email and password.
   * @param loginParams {LoginParams} Email and Password
   * @returns {Promise<RequestResponse<SessionStatusInfo>>} The session status within `RequestResponse`
   */
  public abstract async login(
    loginParams: LoginParams
  ): Promise<RequestResponse<SessionStatusInfo>>;
  /**
   * Login using email and password.
   * @param email {string} Email of the user
   * @param password {string} Password of the user
   * @deprecated
   *
   * @returns {Promise<RequestResponse<SessionStatusInfo>>} The session status within `RequestResponse`
   */
  public abstract async login(
    email: string,
    password: string
  ): Promise<RequestResponse<SessionStatusInfo>>;

  /**
   * PIN Login (Quick Login)
   * @param pinLoginParams {PinLoginParams} Parameters of quick login (Pin Login)
   *
   * @returns {Promise<RequestResponse<SessionStatusInfo>>} The session status within `RequestResponse`
   */
  public abstract async pinLogin(
    pinLoginParams: PinLoginParams
  ): Promise<RequestResponse<SessionStatusInfo>>;
  /**
   * PIN Login (Quick Login)
   * @param user
   * @param pin
   * @deprecated
   *
   * @returns {Promise<RequestResponse<SessionStatusInfo>>} The session status within `RequestResponse`
   */
  public abstract async pinLogin(
    user: string,
    pin: string
  ): Promise<RequestResponse<SessionStatusInfo>>;

  /**
   * Generates and send an OTP to the mobile specified
   * if newPIN is true, a prev. sent, cached pin wont be used. Instead a fresh one will be issued
   * @param sendOTPParams The OTP generation parameters
   * @returns {Promise<RequestResponse<SendOTPResponse>>} The generation response within `RequestResponse`
   */
  public abstract async sendOTP(
    sendOTPParams: SendOTPParams
  ): Promise<RequestResponse<SendOTPResponse>>;

  /**
   * Verifies if the PIN entered by the user matches
   * if loginToUser is true, it will start a session
   * @param verifyOTPParams The OTP verification parameters
   * @returns {Promise<RequestResponse<VerifyOTPResponse>>} The response of verification within `RequestResponse`
   */
  public abstract async verifyOTP(
    verifyOTPParams: VerifyOTPParams
  ): Promise<RequestResponse<VerifyOTPResponse>>;

  /**
   * Returns an array of roles assigned to the currently logged in user
   */
  public abstract async getCurrentUserRoles(): Promise<
    RequestResponse<string[]>
  >;

  /**
   * Invoke to generate a sms pin
   * @param num mobile number
   * @param newPIN should we generate a new pin or use old one
   * @returns {Promise<RequestResponse<SendOTPResponse>>}
   * @deprecated Check `sendOTP`
   */
  public async smsLoginGeneratePIN(
    num: string,
    newPIN = false
  ): Promise<RequestResponse<SendOTPResponse>> {
    renovationWarn(
      "LTS-Renovation-Core",
      "smsLoginGeneratePIN is deprecated, please use sendOTP instead"
    );
    return await this.sendOTP({ mobile: num, newOTP: newPIN });
  }

  /**
   * Confirm the PIN got via SMS for authentication
   * @param num mobile number
   * @param pin pin provided by user
   * @param loginToUser should we update session
   * @returns {Promise<RequestResponse<VerifyOTPResponse>>}
   * @deprecated Check `verifyOTP`
   */
  public async smsLoginVerifyPIN(
    num: string,
    pin: string,
    loginToUser: boolean
  ): Promise<RequestResponse<VerifyOTPResponse>> {
    renovationWarn(
      "LTS-Renovation-Core",
      "smsLoginVerifyPIN is deprecated, please use verifyOTP instead"
    );
    return await this.verifyOTP({ mobile: num, OTP: pin, loginToUser });
  }

  /**
   * Logs out the current user
   *
   * @returns {Promise<RequestResponse<any>} `RequestResponse` without data. Either success or fail
   */
  public abstract async logout(): Promise<RequestResponse<{}>>;

  /**
   * Useful if environment is server
   * @param sessionStatusInfo
   */
  public abstract async setSessionStatusInfo({
    sessionStatusInfo
  }: {
    sessionStatusInfo: SessionStatusInfo;
  });

  /**
   * Clears the current user's roles
   */
  public clearCache() {
    this.currentUserRoles = [];
  }

  /**
   * Updates the session.
   *
   * The `SessionStatus` subject is updated if the new session is different than the old one
   *
   * @param data {Partial<SessionStatusInfo>} The data to be included in the session
   * @param loggedIn {boolean} Whether the user is loggedIn or not. Defaults to `false`
   */
  protected async updateSession({
    data = {},
    loggedIn = false,
    useTimestamp,
    sessionExpired = false
  }: {
    data?: Partial<SessionStatusInfo>;
    loggedIn: boolean;
    useTimestamp?: number;
    sessionExpired?: boolean;
  }) {
    // Update when old and new status dictionaries doesnt match
    const old = SessionStatus.value || { loggedIn: false, timestamp: 0 };
    const newStatus: SessionStatusInfo = {
      loggedIn,
      timestamp: 0,
      ...data
    };
    if (loggedIn) {
      // tslint:disable-next-line: no-string-literal
      newStatus.currentUser = data["user"];
    }

    ["timestamp", "home_page", "message"].forEach(f => {
      delete newStatus[f];
      delete old[f];
    });

    // check for old-new mismatch
    if (!deepCompare(old, newStatus)) {
      const token = newStatus.token;
      // lets clear cache before everything else
      this.getCore().clearCache();

      // its better to update the rxSubject before doing anything else
      let session = {
        timestamp: useTimestamp ? useTimestamp : new Date().getTime() / 1000,
        ...newStatus
      } as any;

      if (sessionExpired) {
        // Useful for handling front-end re-login functionality, for instance.
        session = { ...session, session_expired: old.session_expired };
      }

      this.saveSessionToLocalStorage(session);
      this.saveCookieToLocalStorage(session);
      if (newStatus.loggedIn) {
        if (token) {
          // when simply checking auth status, token isnt returned
          this.setAuthToken({ token });
        }
        if (newStatus.lang) {
          this.getCore().translate.setCurrentLanguage({ lang: newStatus.lang });
        }
        if (this.getCore().frappe.getAppVersion("renovation_core"))
          this.getCore().translate.loadTranslations({});
        this.currentUser = newStatus.user;
      } else {
        this.clearAuthToken();
        this.currentUserRoles = [];
        this.currentUser = null;
      }
      // Update SessionStatus after setting token
      // This is important because there might be functions ready to execute
      // right after session updation
      SessionStatus.next(session);
    }
  }

  /**
   * Get the session status from the localStorage in the browser.
   *
   * If not on the browser, an empty string is returned
   * @returns {SessionStatus|null} The session status or null if not on browser or not set in localStorage
   */
  protected getSessionFromLocalStorage(): SessionStatusInfo | null {
    // Set to null instead of empty string
    let info: any = null;
    if (isBrowser()) {
      info = localStorage.getItem(renovationSessionKey);
    }
    return info ? JSON.parse(info) : null;
  }

  /**
   * Sets http header `Authorization` with the obtained token
   * @param setAuthTokenArgs { token: string }
   */
  private setAuthToken(setAuthTokenArgs: { token: string }) {
    if (!this.useJwt) {
      this.clearAuthToken();
      return;
    }
    this.currentToken = setAuthTokenArgs.token;
    const headers = FrappeRequestOptions.headers as { [x: string]: string[] };
    // Can't use the standard Bearer <token> format since frappe treats that as something else
    // frappe/api.py validate_oauth() checks for the presence of the keyword 'Bearer'
    // keyword 'Token' is used for api key & secret pairs
    headers.Authorization = [`JWTToken ${setAuthTokenArgs.token}`];
  }

  /**
   * Clears the `Authorization` Header
   */
  private clearAuthToken() {
    this.currentToken = null;
    const headers = FrappeRequestOptions.headers as { [x: string]: string[] };
    if (headers.Authorization) {
      delete headers.Authorization;
    }
  }

  /**
   * Saves the session to the localStorage in the browser
   *
   * @param info The session status to be saved
   */
  private saveSessionToLocalStorage(info: SessionStatusInfo) {
    if (isBrowser()) {
      localStorage.setItem(renovationSessionKey, JSON.stringify(info));
    }
  }

  /*
   * @param info The session status to be saved
   */
  private saveCookieToLocalStorage(info: SessionStatusInfo) {
    if (isBrowser()) {
      const lc = window.location;
      const url = `${lc.protocol}//${lc.host}`;
      const isSecure = url.split("/")[0] === "https:";
      Cookies.set(renovationSessionKey, info, {
        sameSite: isSecure ? "lax" : "none",
        secure: isSecure
      });
    }
  }

  /**
   * Sets the user's language in Frappé backend.
   *
   * @param lang The language to be set.
   **/
  public abstract async setUserLanguage(lang: string): Promise<boolean>;
}
