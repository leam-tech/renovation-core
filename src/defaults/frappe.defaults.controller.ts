import { RenovationConfig } from "../config";
import RenovationController from "../renovation.controller";
import { getJSON, renovationWarn } from "../utils";
import { ErrorDetail } from "../utils/error";
import {
  contentType,
  FrappeRequestOptions,
  httpMethod,
  Request,
  RequestResponse
} from "../utils/request";
import DefaultsController from "./defaults.controller";
import {
  DefaultValueTypes,
  GetDefaultParams,
  SetDefaultParams
} from "./interfaces";

/**
 * Class for getting and setting key-value pair
 */
export default class FrappeDefaultsController extends DefaultsController {
  /**
   * Renovation specific settings
   */
  private static renovationCustomSettings: string[] = ["disableSubmission"];
  public handleError(errorId: string, error: ErrorDetail): ErrorDetail {
    // Since this is the only possible error as of now
    return RenovationController.genericError(error);
  }

  /**
   * Gets the value of the key. Can specify the parent if the key is duplicated under a different parent
   * Note that this is only when the user is logged in
   * @param getDefaultParams {GetDefaultParams} The key and parent within `GetDefaultParams`
   * @returns {Promise<RequestResponse<unknown>>} The value of the key within `RequestResponse`, if any
   *
   * If the key doesn't exist, an empty success `RequestResponse` is returned
   */
  public async getDefault(
    getDefaultParams: GetDefaultParams
  ): Promise<RequestResponse<unknown>>;
  /**
   * Gets the value of the key. Can specify the parent if the key is duplicated under a different parent
   * Note that this is only when the user is logged in
   *
   * If the key doesn't exist, an empty success `RequestResponse` is returned
   * @param key The key to lookup
   * @param parent The parent if any. `undefined` by default
   * @deprecated
   */
  public async getDefault(
    key: string,
    parent?: string
  ): Promise<RequestResponse<unknown>>;
  public async getDefault(
    getDefaultParams: string | GetDefaultParams,
    parent = "__default"
  ): Promise<RequestResponse<unknown>> {
    await this.getCore().frappe.checkAppInstalled(["getDefault"]);
    if (typeof getDefaultParams === "string") {
      renovationWarn(
        "LTS-Renovation-Core",
        "getDefault(key, parent) is deprecated, please use the interfaced approach instead"
      );
      return this.getDefault({
        key: getDefaultParams,
        parent
      });
    }

    if (
      FrappeDefaultsController.renovationCustomSettings.indexOf(
        getDefaultParams.key
      ) !== -1
    ) {
      getDefaultParams.key = `renovation:${getDefaultParams.key}`;
    }

    if (!getDefaultParams.parent) {
      getDefaultParams.parent = "__default";
    }

    const r = await Request(
      `${this.getHostUrl()}/api/method/renovation_core.utils.client.get_default`,
      httpMethod.POST,
      FrappeRequestOptions.headers,
      {
        contentType: contentType["application/x-www-form-urlencoded"],
        data: {
          key: getDefaultParams.key,
          parent: getDefaultParams.parent
        }
      }
    );
    if (r.success && r.data) {
      r.data = getJSON(r.data.message);
    }
    return r.success
      ? r
      : RequestResponse.fail(this.handleError(null, r.error));
  }

  /**
   * Sets a default value in backend for a specified key. Can specify the parent if the key is duplicated under a different parent
   * @param setDefaultParams {SetDefaultParams} The params required for setting a default
   * @returns {Promise<RequestResponse<DefaultValueTypes>>} Success `RequestResponse` if set, failed otherwise
   */
  public async setDefault(
    setDefaultParams: SetDefaultParams
  ): Promise<RequestResponse<DefaultValueTypes>>;
  /**
   * Sets a default value in backend for a specified key. Can specify the parent if the key is duplicated under a different parent
   * @param key The key to be set
   * @param value The value of the key
   * @param parent The user to associate with, leave undefined to let it defined for global
   * @deprecated
   * @returns {Promise<RequestResponse<DefaultValueTypes>>} Success `RequestResponse` if set, failed otherwise
   */
  public async setDefault(
    key: string,
    value: DefaultValueTypes,
    parent?: string
  ): Promise<RequestResponse<DefaultValueTypes>>;
  public async setDefault(
    setDefaultParams: string | SetDefaultParams,
    value?: DefaultValueTypes,
    parent = "__default"
  ): Promise<RequestResponse<DefaultValueTypes>> {
    if (typeof setDefaultParams === "string") {
      renovationWarn(
        "LTS-Renovation-Core",
        "setDefault(key, value, parent) is deprecated, please use the interfaced approach instead"
      );
      return this.setDefault({
        key: setDefaultParams,
        value,
        parent
      });
    }

    if (
      FrappeDefaultsController.renovationCustomSettings.indexOf(
        setDefaultParams.key
      ) !== -1
    ) {
      setDefaultParams.key = `renovation:${setDefaultParams.key}`;
    }

    if (!setDefaultParams.parent) {
      setDefaultParams.parent = "__default";
    }

    const args = setDefaultParams as SetDefaultParams;
    if (typeof args.value !== "string") {
      args.value = JSON.stringify(args.value);
    }

    const config = RenovationConfig.instance;
    const response = await Request(
      `${config.hostUrl}/api/method/frappe.client.set_default`,
      httpMethod.POST,
      FrappeRequestOptions.headers,
      {
        contentType: contentType["application/x-www-form-urlencoded"],
        data: {
          key: args.key,
          value: args.value,
          parent: args.parent
        }
      }
    );
    if (response.success) {
      return RequestResponse.success(args.value);
    } else {
      return RequestResponse.fail(this.handleError(null, response.error));
    }
  }
}
