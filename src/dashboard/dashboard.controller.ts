import { BehaviorSubject } from "rxjs";
import { RequestResponse } from "..";
import { RenovationConfig } from "../config";
import RenovationController from "../renovation.controller";
import {
  DashboardData,
  DashboardDataTypes,
  DashboardLayout
} from "./dashboard.types";
import {
  FrappeDashboard,
  GetDashboardDataParams,
  GetDashboardLayoutParams,
  GetDashboardMetaParams,
  RefreshDataParams
} from "./interfaces";

/**
 * Class to handle Dashboard (Meta & Data)
 * @abstract
 */
export default abstract class DashboardController extends RenovationController {
  /**
   * Getter for the dashboardMetaCache
   */
  get dashboardMetaCache(): { [p: string]: FrappeDashboard } {
    return this._dashboardMetaCache;
  }

  /**
   * Observable for changes in the data that need to be emitted
   */
  public dashboardDataListener: BehaviorSubject<
    RequestResponse<any>
  > = new BehaviorSubject(null);

  /**
   * The dashboard cache storing already fetched dashboard for performance.
   *
   * Updated implicitly when fetching dashboards
   *
   * Example
   *
   * ```
   * {
   *   'Sales Balance': DashboardMeta
   * }
   * ```
   */
  protected _dashboardMetaCache: { [x: string]: FrappeDashboard } = {};
  protected constructor(config?: RenovationConfig) {
    super(config);
  }

  // tslint:disable-next-line:no-empty
  public clearCache() {}

  /**
   * Returns all the details about dashboard-layout and meta's of involved dashboards
   * If layout name is unspecified, it will return user default dashboard-layout
   * @returns {DashboardLayout} Layouting info along with meta info
   */
  public abstract async getDashboardLayout(
    param?: GetDashboardLayoutParams
  ): Promise<RequestResponse<DashboardLayout>>;

  /**
   * Returns a list of available layouts
   * This can be restricted based on role permissions
   */
  public abstract async getAvailableLayouts(): Promise<
    RequestResponse<Array<{ title: string; name: string }>>
  >;

  /**
   * Gets the dashboard from the cache first, network later
   *
   * Implicitly, it will get the data of the dashboard before emitting it
   * @param getDashboardMetaParams
   * @return {Promise<RequestResponse<FrappeDashboard>>} The dashboard within `RequestResponse`
   */
  public abstract async getDashboardMeta(
    getDashboardMetaParams: GetDashboardMetaParams
  ): Promise<RequestResponse<FrappeDashboard>>;

  /**
   *
   * Gets all dashboards cache first, network later
   *
   * Implicitly, it will get the data of each dashboard before emitting it
   *
   * @return {Promise<RequestResponse<FrappeDashboard[]>>} The Dashboard list contained within `RequestResponse`
   * @abstract
   */
  public abstract async getAllDashboardsMeta(): Promise<
    RequestResponse<FrappeDashboard[]>
  >;
  /**
   * Get the data of all the dashboards indexed by their names
   * @returns {RequestResponse<DashboardData>} The data stored in the cache, if any. Else `{}`
   */
  public abstract getAllDashboardData(): {
    [x: string]: RequestResponse<DashboardData>;
  };

  /**
   * Get the dashboard data from the cache
   * @param getDashboardDataParams
   * @returns {RequestResponse<any>|undefined} The data stored in the cache, if any. Else `undefined`
   */
  public abstract getDashboardData(
    getDashboardDataParams: GetDashboardDataParams
  ): Promise<RequestResponse<DashboardDataTypes>>;

  /**
   * Refreshes the data of all dashboards.
   * @param refreshDataParams
   * @returns {Promise<RequestResponse<string|null>>}
   */
  public abstract refreshData(refreshDataParams?: RefreshDataParams);
}
