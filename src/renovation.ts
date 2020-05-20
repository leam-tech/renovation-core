import { Subject } from "rxjs/Subject";
import AuthController from "./auth/auth.controller";
import FrappeAuthController from "./auth/frappe.auth.controller";
import { RenovationBackend, RenovationConfig } from "./config";
import DashboardController from "./dashboard/dashboard.controller";
import FrappeDashboardController from "./dashboard/frappe.dashboard.controller";
import DefaultsController from "./defaults/defaults.controller";
import FrappeDefaultsController from "./defaults/frappe.defaults.controller";
import Frappe from "./lib/frappe";
import LogManager from "./lib/log.manager";
import { MessageBus } from "./lib/message.bus";
import ScriptManager from "./lib/script.manager";
import { SocketIOClient } from "./lib/socketio";
import FrappeMetaController from "./meta/frappe.meta.controller";
import MetaController from "./meta/meta.controller";
import FrappeModelController from "./model/frappe.model.controller";
import ModelController from "./model/model.controller";
import FrappePermissionController from "./perm/frappe.perm.controller";
import PermissionController from "./perm/perm.controller";
import FrappeStorageController from "./storage/frappe.storage.controller";
import StorageController from "./storage/storage.controller";
import FrappeTranslationController from "./translation/frappe.translation.controller";
import TranslationController from "./translation/translation.controller";
import FrappeUIController from "./ui/frappe.ui.controller";
import UIController from "./ui/ui.controller";
import {
  getJSON,
  logger,
  renovationLog,
  RenovationUtils,
  renovationWarn
} from "./utils";
import { extendCoreDateUtils } from "./utils/date";
import {
  contentType,
  FrappeRequestOptions,
  httpMethod,
  onBrowser,
  Request,
  RequestResponse,
  setClientId
} from "./utils/request";

/**
 * Main class to access all functionality of Renovation
 */
export class Renovation {
  /**
   * The `AuthController` instance
   */
  public auth!: AuthController;
  /**
   * The `DefaultsController` instance
   */
  public defaults!: DefaultsController;
  /**
   * The `ModelController` instance
   */
  public model!: ModelController;
  /**
   * The `MetaController` instance
   */
  public meta!: MetaController;
  /**
   * The `PermissionController` instance
   */
  public perm!: PermissionController;
  /**
   * The `StorageController` instance
   */
  public storage!: StorageController;
  /**
   * The `UIController` instance
   */
  public ui!: UIController;
  /**
   * The `ScriptManager` instance
   */
  public scriptManager!: ScriptManager;
  /**
   * The `LogManager` instance
   */
  public log!: LogManager;
  /**
   * The `Dashboard` instance
   */
  public dashboard!: DashboardController;
  /**
   * The `RenovationConfig` instance
   */
  public config!: RenovationConfig;
  /**
   * The `Frappe` instance
   *
   * Only initialized if the backend is `frappe`
   */
  public frappe?: Frappe;
  /**
   * The `TranslationController` instance
   */
  public translate!: TranslationController;
  /**
   * The `SocketIOClient` instance
   */
  public socketio!: SocketIOClient;
  /**
   * The `MessageBus` property
   */
  public bus = new MessageBus();
  /**
   * The `Request` function
   */
  public request;
  /**
   * Instance holding all the util functions
   */
  public utils: RenovationUtils = {} as any;
  /**
   * Method for calling custom cmds defined in the backend
   */
  public call: (
    {},
    extraHeaders?: { [x: string]: any }
  ) => Promise<RequestResponse<any>>; // move to frappe when another backend comes

  /**
   * An observable holding the messages to be used in the front-end
   */
  public messages: Subject<any> = new Subject();

  /**
   * Initialize the state of the renovation instance
   *
   * @param initParams
   * @returns {Promise<void>} Empty response to be awaited for complete initialization
   */
  public async init(initParams: InitParams);
  /**
   * Initialize the state of the renovation instance
   * @param backend The backend `frappe` or `firebase`
   * @param hostUrl The URL of the backend (Site)
   * @param clientId The clientId required for HTTP
   * @param disableLog Whether to disable all kinds of logging.
   * @returns {Promise<void>} Empty response to be awaited for complete initialization
   * @deprecated
   */
  public async init(
    backend: RenovationBackend,
    hostUrl: string,
    clientId?: string,
    disableLog?: boolean
  );
  public async init(args: InitParams | RenovationBackend, ...args1) {
    if ((args as InitParams).disableLog || (args1 || [])[2]) {
      logger.disable();
    } else {
      logger.enable("renovation-core-*");
    }
    if (args1.length) {
      renovationWarn(
        "LTS-Renovation-Core",
        "init(backend,hostUrl,clientId) is deprecated, please use the interfaced approach instead"
      );
      args = {
        backend: args,
        hostURL: args1[0],
        clientId: args1[1],
        disableLog: args1[2]
      } as InitParams;
    }

    const initParams: InitParams = args as InitParams;
    if (!initParams.backend) {
      initParams.backend = "frappe";
    }
    const startTime = Date.now();
    this.request = Request;
    if (initParams.clientId) {
      setClientId(initParams.clientId);
    }

    this.config = new RenovationConfig(
      this,
      initParams.backend,
      initParams.hostURL
    );
    RenovationConfig.instance = this.config;
    this.scriptManager = new ScriptManager(this.config);
    this.socketio = new SocketIOClient(this.config);
    this.log = new LogManager(this.config);
    this.leakCore();
    this.loadUtils();

    this.initCall();

    if (initParams.backend === "frappe") {
      this.frappe = new Frappe(this.config);

      // Load the apps' versions without awaiting
      this.frappe.loadAppVersions();

      this.defaults = new FrappeDefaultsController(this.config);
      this.model = new FrappeModelController(this.config);
      this.meta = new FrappeMetaController(this.config);
      this.perm = new FrappePermissionController(this.config);
      this.storage = new FrappeStorageController(this.config);
      this.ui = new FrappeUIController(this.config);
      this.translate = new FrappeTranslationController(this.config);

      this.dashboard = new FrappeDashboardController(this.config);
      // define auth at last
      // there are calls in auth.updateSession() that calls translate
      this.auth = new FrappeAuthController(this.config);

      if (!initParams.clientId) {
        await this.frappe.updateClientId();
      }
    }
    renovationLog(
      "Renovation Core",
      `Took ${Date.now() - startTime}ms to initialize`
    );
  }

  /**
   * Initiates the property `call` used for generic cmd calling made custom
   */
  public initCall() {
    this.call = async (
      body,
      extraHeaders: { [x: string]: any } = {}
    ): Promise<RequestResponse<any>> => {
      return Request(
        this.config.hostUrl,
        httpMethod.POST,
        { ...FrappeRequestOptions.headers, ...extraHeaders },
        {
          contentType: contentType["application/json"],
          data: body
        }
      );
    };
  }

  /**
   * Clears the cache of the renovation controllers. Involved controllers:
   *
   * - `FrappeModelController`
   * - `FrappeMetaController`
   * - `FrappeAuthController`
   * - `ScriptManager`
   * - `FrappeUIController`
   */
  public clearCache() {
    for (const renovationController of [
      this.model,
      this.meta,
      this.auth,
      this.perm,
      this.scriptManager,
      this.ui
    ]) {
      if (renovationController) {
        renovationController.clearCache();
      }
    }
  }

  /**
   * If the library is used in the library, the instance of this class is assigned to a window object `rcore`
   *
   * Useful for debugging
   */
  public leakCore() {
    if (onBrowser) {
      // tslint:disable-next-line:no-string-literal
      window["rcore"] = this;
    }
  }

  /**
   * Assigns the utility functions to the `utils` property of this class
   */
  public loadUtils() {
    // tslint:disable-next-line:no-string-literal
    this.utils = {
      getJSON
    } as any;
    extendCoreDateUtils(this);
  }
}

export interface InitParams {
  hostURL: string;
  backend?: RenovationBackend;
  clientId?: string;
  disableLog?: boolean;
}
