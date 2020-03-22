import { RequestResponse } from "..";
import { RenovationConfig } from "../config";
import RenovationController from "../renovation.controller";
import {
  DefaultValueTypes,
  GetDefaultParams,
  SetDefaultParams
} from "./interfaces";

/**
 * Class for getting and setting key-value pair
 * @abstract
 */
export default abstract class DefaultsController extends RenovationController {
  constructor(config: RenovationConfig) {
    super(config);
  }

  /**
   * Gets the value of the key. Can specify the parent if the key is duplicated under a different parent
   * Note that this is only when the user is logged in
   * @param getDefaultParams {GetDefaultParams} The key and parent within `GetDefaultParams`
   * @returns {Promise<RequestResponse<unknown>>} The value of the key within `RequestResponse`, if any
   *
   * If the key doesn't exist, an empty success `RequestResponse` is returned
   */
  public abstract async getDefault(
    getDefaultParams: GetDefaultParams
  ): Promise<RequestResponse<unknown>>;
  /**
   * Gets the value of the key. Can specify the parent if the key is duplicated under a different parent
   * Note that this is only when the user is logged in
   *
   * If the key doesn't exist, an empty success `RequestResponse` is returned
   * @param key The key to lookup
   * @param parent The parent if any. `undefined` by default and will be retrieved globally
   * @deprecated
   */
  public abstract async getDefault(
    key: string,
    parent?: string
  ): Promise<RequestResponse<unknown>>;

  /**
   * Sets a default value in backend for a specified key. Can specify the parent if the key is duplicated under a different parent
   * @param setDefaultParams {SetDefaultParams} The params required for setting a default
   * @returns {Promise<RequestResponse<DefaultValueTypes>>} Success `RequestResponse` if set, failed otherwise
   */
  public abstract async setDefault(
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
  public abstract async setDefault(
    key: string,
    value: DefaultValueTypes,
    parent?: string
  ): Promise<RequestResponse<DefaultValueTypes>>;

  /**
   * Clears the cache. Currently empty method
   */
  // tslint:disable-next-line:no-empty
  public clearCache() {}
}
