import RenovationController from "../renovation.controller";
import { asyncSleep, renovationError, renovationWarn } from "../utils";
import { ErrorDetail } from "../utils/error";
import {
  axiosInstance,
  getClientId,
  onBrowser,
  RequestResponse,
  resetClientId,
  setClientId
} from "../utils/request";
import { AppVersion } from "./interfaces";

/**
 * Class for handling Frappe related functionality
 */
export default class Frappe extends RenovationController {
  private _appVersions: { [x: string]: AppVersion } = {};

  private _versionsLoaded: boolean = false;

  public get appVersions() {
    return this._appVersions;
  }

  public get versionsLoaded() {
    return this._versionsLoaded;
  }

  public get frappeVersion() {
    return this._appVersions["frappe"];
  }

  public handleError(errorId: string, error: ErrorDetail): ErrorDetail {
    let err = {} as ErrorDetail;
    switch (errorId) {
      case "verifyClientId":
        err = { ...error, title: "Client ID Verification Error" };
        break;
      case "FetchId":
        err = { title: "Failed to Fetch Id", ...error };
        break;
      case "Fetch-id-badrequest":
        err = { title: "Fetch Id Bad Request!", ...error };
        break;
      default:
        err = RenovationController.genericError(error);
    }
    return err;
  }

  /**
   * This returns a promise on which you could await so that
   * you could continue things after bootinfo is loaded
   * @returns {Promise<null>} A `null` response
   * @deprecated
   */
  public async waitForBootInfo(): Promise<null> {
    renovationError("LTS-Renovation-Core", "Bootinfo is deprecated.");
    return null;
  }

  /**
   * Calls renovation_manager frappe site and the server will set
   * x-client-site cookie which is helpful in routing the requests
   * @returns {Promise<RequestResponse<string>>} The clientId if success, else a failed `RequestResponse`
   *
   * If the clientId is set, the saved clientId will be returned.
   *
   * Otherwise, it will be fetched from the backend using the app renovation_bench
   */
  public async updateClientId(): Promise<RequestResponse<string>> {
    const id: string | null = getClientId();
    if (id) {
      this.verifyClientId(id);
      return RequestResponse.success(id);
    }
    return await this.verifyClientId(id);
  }

  /**
   * Clears the cache. Currently empty method
   */
  // tslint:disable-next-line:no-empty
  public clearCache() {}

  /**
   * Verify the client ID from the backend.
   * @param id The client ID, if any
   * @returns {Promise<RequestResponse<any>>} The response from the backend within `RequestResponse`
   */
  private async verifyClientId(
    id: string | null
  ): Promise<RequestResponse<any>> {
    if (onBrowser) {
      id = getClientId();
      let r;
      if (id) {
        setClientId(id);

        // now check for validity
        r = await this.fetchId();
        if (!r.success) {
          // got a localStorage clientId
          // and network error happened
          // forget what we have
          renovationWarn(
            "Renovation Core: Failed to update clientId from renovation_bench",
            "Removing client ids"
          );
          resetClientId();
          return RequestResponse.failed();
        } else if (r.data !== id) {
          renovationWarn(
            "Renovation Core: localStorage and server clientId mismatch",
            "Resetting clientId: " + id
          );
          setClientId(r.data);
        }
      } else {
        // fetch
        const fetchedId = await this.fetchId();
        if (fetchedId.success) {
          setClientId(fetchedId.data);
        } else {
          resetClientId();
          renovationError("Renovation Core: Failed fetching client id");
        }
        return fetchedId;
      }
    } else {
      return RequestResponse.fail(
        this.handleError("verifyClientId", {
          info: {
            cause: "Client ID not defined",
            suggestion: "Please define client id",
            httpCode: 400,
            data: "Please define client id"
          }
        })
      );
    }
  }

  /**
   * Helper method to get the ID from the backend
   *
   * @return {Promise<RequestResponse<any>>} The ID, if any, withing `RequestResponse`
   */
  private async fetchId(): Promise<RequestResponse<any>> {
    try {
      const response = await axiosInstance({
        // plain request, we dont want to send x-client-site here
        method: "POST",
        url: this.config.hostUrl,
        headers: {
          Accept: "application/json",
          "content-type": "application/json",
          "x-client-site": "renovation_manager" // query from renovation_bench always
        },
        withCredentials: true,
        data: {
          cmd: "renovation_bench.get_client_id"
        }
      });

      if (Math.floor(response.status / 100) === 2) {
        return RequestResponse.success(response.data.message);
      } else {
        return RequestResponse.fail(
          this.handleError("FetchId", {
            info: { httpCode: response.status, data: response.data }
          })
        );
      }
    } catch (err) {
      if (err.response && err.response.data) {
        err = err.response.data;
      }
      return RequestResponse.fail(
        this.handleError("Fetch-id-badrequest", {
          info: {
            httpCode: (err.response || { response: 400 }).status,
            data: (err.response || { data: null }).data
          }
        })
      );
    }
  }

  public async loadAppVersions(): Promise<RequestResponse<boolean>> {
    const response = await this.config.coreInstance.call({
      cmd: "renovation_core.utils.site.get_versions"
    });
    this._versionsLoaded = true;
    if (response.success) {
      const versions = response.data.message as { [x: string]: AppVersion };
      if (versions) {
        for (let app in versions) {
          this._appVersions[app] = Frappe.parseAppVersion(versions[app]);
        }
      }
      return RequestResponse.success(true, 200, response._);
    }
    return RequestResponse.fail(
      this.handleError("app_versions", response.error)
    );
  }

  public getAppVersion(appName: string): AppVersion {
    return this._appVersions[appName];
  }

  private static parseAppVersion(version: AppVersion): AppVersion {
    if (version.version && version.version != "") {
      let _version = version.version.match(/\d+(\.\d+){2,}/);
      if (_version && _version.length > 0) {
        const segments = _version[0].split(".");

        if (segments && segments.length === 3) {
          version.major = parseInt(segments[0]);
          version.minor = parseInt(segments[1]);
          version.patch = parseInt(segments[2]);
          return version;
        }
      }
    }
    throw Error("Version empty or not in proper format");
  }

  /**
   * Silent method throwing an error if an app is not installed in the backend
   *
   * Defaults to checking 'renovation_core' and defaults to throw an error
   *
   * Awaits until the version is loaded through loadAppVersions
   */
  public async checkAppInstalled(
    features: string[],
    throwError: boolean = true,
    appName: string = "renovation_core"
  ): Promise<void> {
    while (!this._versionsLoaded) {
      await asyncSleep(100);
    }
    if (!Object.keys(this._appVersions).includes(appName) && throwError) {
      throw Error(
        `The app "${appName}" is not installed in the backend.\nPlease install it to be able to use the feature(s):\n\n${
          features && features.length ? features.join("\n") : ""
        }
         `
      );
    }
  }
}
