import {
  deepCompare,
  renovationError,
  RenovationError,
  renovationLog,
  RequestResponse
} from "..";
import { RenovationConfig } from "../config";
import RenovationController from "../renovation.controller";
import { ErrorDetail } from "../utils/error";
import DashboardController from "./dashboard.controller";
import {
  DashboardData,
  DashboardDataTypes,
  DashboardLayout
} from "./dashboard.types";
import {
  FrappeDashboard,
  FrappeDashboardParams,
  GetDashboardDataParams,
  GetDashboardLayoutParams,
  GetDashboardMetaParams,
  RefreshDataParams
} from "./interfaces";

/**
 * Class to handle Dashboard (Meta & Data)
 */
export default class FrappeDashboardController extends DashboardController {
  /**
   * Holder for `Renovation Dashboard` doctype name
   */
  private readonly docTypeName = "Renovation Dashboard";

  /**
   * Holds the data of each dashboard enclosed within `RequestResponse`
   *
   * Example
   *
   * ```
   * {
   *   'Sales Balance': RequestResponse
   * }
   * ```
   */
  private _dashboardDataCache: {
    [x: string]: RequestResponse<DashboardData>;
  } = {};

  constructor(config?: RenovationConfig) {
    super(config);
  }

  /**
   * Returns all the details about dashboard-layout and meta's of involved dashboards
   * If layout name is unspecified, it will return user default dashboard-layout
   * @returns {DashboardLayout} Layout info along with meta info
   */
  public async getDashboardLayout(
    getDashboardLayoutParams?: GetDashboardLayoutParams
  ): Promise<RequestResponse<DashboardLayout>> {
    await this.getCore().frappe.checkAppInstalled(["getDashboardLayout"]);
    const layout = getDashboardLayoutParams
      ? getDashboardLayoutParams.layout
      : undefined;
    const r = await this.getCore().call({
      cmd: "renovation_core.renovation_dashboard_def.get_dashboard_layout",
      layout
    });
    if (r.success) {
      r.data = r.data.message || null;
    }

    return r;
  }

  /**
   * Returns a list of available layouts
   * This can be restricted based on role permissions
   */
  public async getAvailableLayouts(): Promise<
    RequestResponse<Array<{ title: string; name: string }>>
  > {
    await this.getCore().frappe.checkAppInstalled(["getAvailableLayouts"]);
    const r = await this.getCore().call({
      cmd: "renovation_core.renovation_dashboard_def.get_user_dashboard_layouts"
    });
    if (r.success) {
      r.data = r.data.message || [];
    }

    return r;
  }

  /**
   * Gets the dashboard from the cache first, network later
   *
   * Implicitly, it will get the data of the dashboard before emitting it
   *
   * @param getDashboardMetaParams The params for each dashboard. Defaults to the params defined by the `default_value` for each param.
   * @returns {Promise<RequestResponse<FrappeDashboard>>} The dashboard within `RequestResponse`
   */
  public async getDashboardMeta(
    getDashboardMetaParams: GetDashboardMetaParams
  ): Promise<RequestResponse<FrappeDashboard>> {
    const cachedDashboard = this.getDashboardFromCache(
      getDashboardMetaParams.dashboardName
    );
    if (cachedDashboard) {
      // TODO: Re update only if cache is old enough
      // this.fetchDashboard(params.dashboardName);
      return RequestResponse.success(cachedDashboard);
    } else {
      // this.executeCMD(this.dashboardMetaCache[dashboardName], params);

      return await this.fetchDashboard(getDashboardMetaParams.dashboardName);
    }
  }

  /**
   * Gets all dashboards cache first, network later
   *
   * Implicitly, it will get the data of each dashboard before emitting it
   *
   * @returns {Promise<RequestResponse<FrappeDashboard[]>>} The Dashboard list contained within `RequestResponse`
   */
  public async getAllDashboardsMeta(): Promise<
    RequestResponse<FrappeDashboard[]>
  > {
    await this.getCore().frappe.checkAppInstalled(["getAllDashboardMeta"]);

    const cachedDashboards = this.getDashboardsFromCache();
    if (cachedDashboards) {
      this.fetchDashboards();
      return RequestResponse.success(cachedDashboards);
    } else {
      const dashboards = await this.fetchDashboards();

      // for (const dashboard of Object.values(this.dashboardMetaCache)) {
      //   dashboard.exc_type === "cmd"
      //     ? this.executeCMD(dashboard)
      //     : this.executeEval(dashboard);
      // }
      return dashboards;
    }
  }

  /**
   * Clears the cache of the dashboard meta and data
   */
  public clearCache() {
    this._dashboardMetaCache = {};
    this._dashboardDataCache = {};
  }

  /**
   * Get the data of all the dashboards indexed by their names
   * @returns The data stored in the cache, if any. Else `{}`
   */
  public getAllDashboardData(): {
    [x: string]: RequestResponse<DashboardData>;
  } {
    return this._dashboardDataCache;
  }

  /**
   * Get the dashboard data from the cache
   * @param getDashboardDataParams
   * @returns {RequestResponse<any>|undefined} The data stored in the cache, if any. Else `undefined`
   */
  public async getDashboardData(
    getDashboardDataParams: GetDashboardDataParams
  ): Promise<RequestResponse<DashboardDataTypes>> {
    // check if present in meta
    const dR = await this.getDashboardMeta({
      dashboardName: getDashboardDataParams.dashboardName
    });
    if (!dR.success) {
      renovationError(dR);
      return RequestResponse.fail(
        this.handleError("get_dashboard_data", dR.error)
      );
    }
    const dashboard = dR.data;
    return dashboard.exc_type === "cmd"
      ? this.executeCMD({ dashboard, params: getDashboardDataParams.params })
      : this.executeEval({ dashboard });
  }

  /**
   * Refreshes the data of all dashboards.
   * @returns {Promise<RequestResponse<string|null>>}
   * @param refreshDataParams
   */
  public async refreshData(
    refreshDataParams?: RefreshDataParams
  ): Promise<RequestResponse<string | null>> {
    let dashboards: FrappeDashboard[] = [];

    if (
      refreshDataParams &&
      refreshDataParams.dashboardName &&
      this._dashboardMetaCache[refreshDataParams.dashboardName]
    ) {
      dashboards = [this._dashboardMetaCache[refreshDataParams.dashboardName]];
    } else {
      dashboards = Object.values(this._dashboardMetaCache);
    }

    if (dashboards.length !== 0) {
      try {
        await Promise.all(
          dashboards.map(async dashboard =>
            dashboard.exc_type === "cmd"
              ? this.executeCMD({ dashboard })
              : this.executeEval({ dashboard })
          )
        );

        return RequestResponse.success(null);
      } catch (e) {
        return RequestResponse.fail(
          this.handleError("refresh_data", {
            info: { data: e },
            title: "Something wrong happened refreshing the data"
          })
        );
      }
    }
  }

  public handleError(errorId: string, error: ErrorDetail): ErrorDetail {
    let err = {} as ErrorDetail;

    switch (errorId) {
      case "get_dashboard_meta":
        if (
          error.info &&
          error.info.data &&
          error.info.data.exception &&
          error.info.data.exception.includes("DoesNotExist")
        ) {
          err = this.handleError("dashboard_not_exist", error);
        } else {
          err = RenovationController.genericError(error);
        }
        break;

      case "get_dashboard_data":
        if (error.info && error.info.httpCode === 404) {
          err = this.handleError("dashboard_not_exist", error);
        } else {
          err = RenovationController.genericError(error);
        }
        break;

      case "execute_cmd":
        if (error.type === RenovationError.DataFormatError) {
          err = {
            ...error,
            title: "Required params missing",
            info: { ...error.info }
          };
        } else {
          err = RenovationController.genericError(error);
        }
        break;
      case "dashboard_not_exist":
        err = {
          ...error,
          title: "Dashboard does not exist",
          type: RenovationError.NotFoundError,
          info: {
            ...error.info,
            cause: "Dashboard does not exist",
            suggestion:
              "Make sure the dashboard name is correct or create the dashboard",
            httpCode: 404
          }
        };
        break;
      case "refresh_data":
      case "execute_eval":
      case "fetch_dashboards":
      default:
        err = RenovationController.genericError(error);
    }
    return err;
  }

  /**
   * Gets the data of a dashboard if it's `exc_type` is `eval`
   *
   * The data is compared with previous data, if any, before emitting to the observable
   *
   * The data is also updated in the `_dashboardDataCache`
   *
   * @param dashboard The dashboard to get the data for
   * @returns {Promise<RequestResponse<any>>} The data enclosed within `RequestResponse`
   */
  private async executeEval({
    dashboard
  }: {
    dashboard: FrappeDashboard;
  }): Promise<RequestResponse<any>> {
    // TODO:
    return RequestResponse.fail(
      this.handleError("execute_eval", {
        title: "Method not implemented yet",
        info: {}
      })
    );
  }

  /**
   * Gets the data of a dashboard if it's `exc_type` is `cmd`
   *
   * The data is compared with previous data, if any, before emitting to the observable
   *
   * The data is also updated in the `_dashboardDataCache`
   *
   * @param dashboard The dashboard to get the data for
   * @param params The params for each dashboard. Defaults to the params defined by the `default_value` for each param.
   * @returns {Promise<RequestResponse<any>>} The data enclosed within `RequestResponse`.
   * If a param's value isn't passed and a default_value for the param isn't defined, it will return a failed `RequestResponse`
   */
  private async executeCMD({
    dashboard,
    params = null
  }: {
    dashboard: FrappeDashboard;
    params?: FrappeDashboardParams[];
  }): Promise<RequestResponse<DashboardDataTypes>> {
    if (!dashboard) {
      return;
    }
    if (!params) {
      params = dashboard.params;
    }
    let dashboardData: RequestResponse<any>;
    const dashboardParams = {};
    for (const param of params || []) {
      if (param.reqd && !param.value && !param.default_value) {
        const paramUnspecified = RequestResponse.fail(
          this.handleError("execute_cmd", {
            type: RenovationError.DataFormatError,
            info: {
              httpCode: 412,
              cause: `Value for param: '${param.param}', is required.`,
              suggestion: " Please specify the required parameters",
              data: params
            }
          })
        );
        this.dashboardDataListener.next(paramUnspecified);
        this._dashboardDataCache[dashboard.name] = paramUnspecified;
        return paramUnspecified;
      }
      dashboardParams[param.param] = param.value
        ? param.value
        : param.default_value;
    }

    if (dashboard.cmd && dashboard.cmd !== "") {
      dashboardData = await this.getCore().call({
        cmd: dashboard.cmd,
        ...dashboardParams
      });
    } else {
      renovationLog("No cmd specified, getting using default");
      dashboardData = await this.executeDefaultCMD(dashboard, params);
      if (!dashboardData.success) {
        const noCMD = RequestResponse.fail(
          this.handleError("execute_cmd", dashboardData.error)
        );
        this.dashboardDataListener.next(noCMD);
        this._dashboardDataCache[dashboard.name] = noCMD;
        return noCMD;
      }
    }
    return await this.updateDashboardData(dashboard, dashboardData);
  }

  /**
   * Execute the default cmd for the dashboard. Used if the cmd isn't defined for a dashboard
   * @param {FrappeDashboard} dashboard The target dashboard
   * @param params The params for each dashboard. Defaults to the params defined by the `default_value` for each param.
   * @return {Promise<RequestResponse<any>>} The data wrapped within `RequestResponse`
   */
  private async executeDefaultCMD(
    dashboard: FrappeDashboard,
    params?: FrappeDashboardParams[]
  ): Promise<RequestResponse<any>> {
    await this.getCore().frappe.checkAppInstalled(["executeDefaultCMD"]);
    const dashboardParams = {};

    for (const param of params || []) {
      // TODO: Add field reqd in the backend
      if (param.reqd && !param.value && !param.default_value) {
        const paramUnspecified = RequestResponse.fail(
          this.handleError("execute_cmd", {
            type: RenovationError.DataFormatError,
            info: {
              httpCode: 412,
              cause: `Value for param: '${param.param}', is required.`,
              suggestion: " Please specify the required parameters",
              data: params
            }
          })
        );
        this.dashboardDataListener.next(paramUnspecified);
        this._dashboardDataCache[dashboard.name] = paramUnspecified;
        return paramUnspecified;
      }
      dashboardParams[param.param] = param.value
        ? param.value
        : param.default_value;
    }
    const defaultDashboardData = await this.getCore().call({
      cmd: "renovation_core.renovation_dashboard_def.get_dashboard_data",
      dashboard: dashboard.name,
      params: {
        ...dashboardParams
      }
    });
    if (!defaultDashboardData.success) {
      return defaultDashboardData;
    }

    return RequestResponse.success(defaultDashboardData.data);
  }

  /**
   * Updates the Dashboard data cache.
   *
   * Before updating, the incoming data is compared with the cached data
   * @param {FrappeDashboard} dashboard The dashboard object
   * @param {RequestResponse<any>} dashboardData The incoming dashboard data
   * @return {Promise<RequestResponse<any> | RequestResponse<RequestResponse<any>>>} The data within `RequestResponse`
   */
  private async updateDashboardData(
    dashboard: FrappeDashboard,
    dashboardData: RequestResponse<any>
  ) {
    if (dashboardData.success) {
      dashboardData.data = dashboardData.data.message;
      dashboardData.data.dashboardName = dashboard.name;
      dashboardData.data.dashboardType = dashboard.type;

      if (
        !this._dashboardDataCache[dashboard.name] ||
        !deepCompare(
          dashboardData.data,
          this._dashboardDataCache[dashboard.name]
        )
      ) {
        this._dashboardDataCache[dashboard.name] = RequestResponse.success<
          DashboardData
        >(dashboardData.data);
      }
    }
    this.dashboardDataListener.next(dashboardData);
    return dashboardData;
  }

  /**
   * Fetch the meta details of a dashboard from the backend and updates the `_dashboardMetaCache`
   * @param dashboardName Name of the dashboard to be fetched
   * @returns {Promise<RequestResponse<FrappeDashboard>>} The `FrappeDashboard` retrieved within `RequestResponse`
   */
  private async fetchDashboard(
    dashboardName: string
  ): Promise<RequestResponse<FrappeDashboard>> {
    const dashboard = await this.getCore().model.getDoc({
      doctype: this.docTypeName,
      docname: dashboardName
    });

    if (dashboard.success) {
      if ((dashboard.data as FrappeDashboard).name === dashboardName) {
        this.dashboardMetaCache[
          dashboardName
        ] = dashboard.data as FrappeDashboard;
      }
      return RequestResponse.success(dashboard.data as FrappeDashboard);
    }
    return RequestResponse.fail(
      this.handleError("get_dashboard_meta", dashboard.error)
    );
  }

  /**
   * Fetch the meta details of all dashboards from the backend and updates the `_dashboardMetaCache`
   *
   * @returns {Promise<RequestResponse<FrappeDashboard[]>>} The `FrappeDashboard` array retrieved within `RequestResponse`
   */
  private async fetchDashboards(): Promise<RequestResponse<FrappeDashboard[]>> {
    const dashboards = await this.getCore().call({
      cmd: "renovation_core.renovation_dashboard_def.get_all_dashboard_meta"
    });

    if (dashboards.success) {
      dashboards.data = dashboards.data.message || [];
      if (dashboards.data.length > 0) {
        this._dashboardMetaCache = ((dashboards.data as unknown) as FrappeDashboard[])
          .map(dashboard => {
            return { [dashboard.name]: dashboard };
          })
          .reduce((a, b) => {
            return { ...a, ...b };
          });
      }
      return (dashboards as unknown) as RequestResponse<FrappeDashboard[]>;
    }
    return RequestResponse.fail(
      this.handleError("fetch_dashboards", dashboards.error)
    );
  }

  /**
   * Retrieve the dashboard from the cache.
   *
   * - First it checks in the local dashboardMetaCache `_dashboardMetaCache`
   * - If not found, check in the `FrappeModelController` cache
   * - Return `null` otherwise.
   * @param dashboardName The target dashboard to get from the cache
   *
   * @returns {FrappeDashboard|undefined|null} The Dashboard from the cache, null otherwise
   */
  private getDashboardFromCache(
    dashboardName: string
  ): FrappeDashboard | undefined | null {
    const dashboardCacheInModel = this.getCore().model.locals[this.docTypeName];
    if (this.dashboardMetaCache[dashboardName]) {
      return this.dashboardMetaCache[dashboardName];
    } else if (dashboardCacheInModel) {
      return dashboardCacheInModel[dashboardName];
    }
    return null;
  }

  /**
   * Retrieve the dashboards from the cache.
   *
   * - First it checks in the local dashboardMetaCache `_dashboardMetaCache`
   * - If not found, check in the `FrappeModelController` cache
   * - Return `null` otherwise.
   *
   * @returns {FrappeDashboard|undefined|null} The Dashboards from the cache, null otherwise
   */
  private getDashboardsFromCache(): FrappeDashboard[] | undefined | null {
    const dashboardCacheInModel = this.getCore().model.locals[this.docTypeName];
    if (Object.keys(this.dashboardMetaCache).length !== 0) {
      return Object.values(this.dashboardMetaCache);
    } else if (dashboardCacheInModel) {
      Object.values(dashboardCacheInModel);
    }
    return null;
  }
}
