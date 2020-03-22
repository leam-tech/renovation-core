import IO from "socket.io-client";
import { RenovationConfig } from "../config";
import RenovationController from "../renovation.controller";
import { ErrorDetail } from "../utils/error";
import {
  applyCookieHeader,
  isBrowser,
  FrappeRequestOptions
} from "../utils/request";
import {
  GetSocketParams,
  SocketIOConnectParams,
  SocketIOEmitParams,
  SocketIOOffParams,
  SocketIOOnParams
} from "./interfaces";

/**
 * Class for functionality of SocketIO operations
 */
export class SocketIOClient extends RenovationController {
  /**
   * Whether the socket is connected.
   *
   * If the socket is `null`, returns false
   *
   * @returns {boolean} true if connected, false otherwise
   */
  get isConnected(): boolean {
    if (!this.getSocket({ logError: false })) {
      return false;
    }
    return this.getSocket({ logError: false }).connected;
  }

  /**
   * The instance of the socket
   */
  private socket: SocketIOClient.Socket = null;

  constructor(config: RenovationConfig) {
    super(config);
    // @ts-ignore
    this.io = IO;
  }

  /**
   * Connect to the socket endpoint in the server.
   *
   * If the socket is already connected, the socket will be disconnected before reconnecting
   * @param {SocketIOConnectParams} socketIOConnectParams
   */
  public connect(socketIOConnectParams?: SocketIOConnectParams);
  /**
   * Connect to the socket endpoint in the server.
   *
   * If the socket is already connected, the socket will be disconnected before reconnecting
   * @param url The URL to the socketIO server. Defaults to the host URL configured
   * @param path The path to the socket.io endpoint
   * @deprecated
   */
  public connect(url?: string, path?: string);
  public connect(
    socketIOConnectParams?: SocketIOConnectParams | string,
    path?: string
  ) {
    let args: SocketIOConnectParams = {};
    if (typeof socketIOConnectParams === "string") {
      args = {
        url: socketIOConnectParams,
        path
      };
      console.warn(
        "LTS-Renovation-Core",
        "SocketIO.connect(url, path) is deprecated",
        "Please use the interfaced approach instead"
      );
    } else if (socketIOConnectParams) {
      args = socketIOConnectParams;
    }

    args.url = args.url || this.config.hostUrl;
    args.path = args.path || "/socket.io";
    if (args.url.indexOf("http") < 0 && isBrowser()) {
      // we are running in production
      // url should have just the hostname
      // and path have the core-hostUrl/socketio
      const lc = window.location;
      // lc.host has port info
      args.path = `${args.url}${args.path}`;
      args.url = `${lc.protocol}//${lc.host}`;
    }

    if (this.socket) {
      this.socket.disconnect();
    }
    console.log(
      "LTS-Renovation-Core",
      `Connecting socket on ${args.url}${args.path}`
    );

    // if not onBrowser, cookies are applied
    const headers = {} as { [x: string]: string[] };
    // Auth headers
    if (FrappeRequestOptions.headers.Authorization) {
      headers.Authorization = FrappeRequestOptions.headers.Authorization;
    }
    applyCookieHeader(headers);

    this.socket = IO.connect(args.url, {
      secure: args.url.split("/")[0] === "https:",
      path: args.path,
      transportOptions: {
        polling: {
          extraHeaders: headers
        }
      }
    });
  }

  /**
   * Gets the reference of the socket in the class
   * @returns {SocketIOClient.Socket} The socketIO reference, `null` if not defined
   */
  public getSocket(getSocketParams?: GetSocketParams): SocketIOClient.Socket {
    if (!getSocketParams) {
      getSocketParams = {
        logError: true
      };
    }
    if (!this.socket && getSocketParams && getSocketParams.logError) {
      console.error(
        "Socket isnt initialized, please call core.socket.connect()"
      );
    }
    return this.socket;
  }

  /**
   * Emits the event with a payload
   *
   * If the socket is `null`, the function returns void
   * @param socketIOEmitParams
   */
  public emit(socketIOEmitParams: SocketIOEmitParams): boolean;
  /**
   * Emits the event with a payload
   *
   * If the socket is `null`, the function returns void
   * @param event The event name
   * @param data The payload for the event handler (on)
   * @deprecated
   */
  public emit(event: string, ...data: [unknown?]): boolean;
  public emit(
    socketIOEmitParams: SocketIOEmitParams | string,
    ...data: [unknown?]
  ): boolean {
    let args: SocketIOEmitParams;
    if (typeof socketIOEmitParams === "string") {
      args = {
        event: socketIOEmitParams,
        data
      };
      console.warn(
        "LTS-Renovation-Core",
        "SocketIO.emit(event, ...data) is deprecated",
        "Please use the interfaced approach instead"
      );
    } else {
      args = socketIOEmitParams;
    }

    if (!this.isConnected) {
      console.error("Socket isn't connected to emit ", args.event, data);
      return false;
    }
    args.data = args.data || [];
    if (!Array.isArray(args.data)) {
      args.data = [args.data];
    }
    this.getSocket().emit(args.event, ...args.data);
    return true;
  }

  /**
   * Subscribe to the event
   * @param {SocketIOOnParams} socketIOOnParams
   */
  public on(socketIOOnParams: SocketIOOnParams);
  /**
   * Subscribe to the event
   * @param event The event name
   * @param callback The callback once the event is emitted
   * @deprecated
   */
  public on(event: string, callback: (data: unknown) => void);
  public on(
    socketIOOnParams: SocketIOOnParams | string,
    callback?: (data: unknown) => void
  ) {
    let args: SocketIOOnParams;
    if (typeof socketIOOnParams === "string") {
      args = {
        event: socketIOOnParams,
        callback
      };
      console.warn(
        "LTS-Renovation-Core",
        "SocketIO.on(event, callback) is deprecated",
        "Please use the interfaced approach instead"
      );
    } else {
      args = socketIOOnParams;
    }

    this.getSocket().on(args.event, args.callback);
  }

  /**
   * Unsubscribe from the event
   * @param {SocketIOOffParams} socketIOOffParams
   */
  public off(socketIOOffParams: SocketIOOffParams);
  /**
   * Unsubscribe from the event
   * @param event The event name
   * @param callback The callback once unsubscribed
   * @deprecated
   */
  public off(event: string, callback?: (data: unknown) => void);
  public off(
    socketIOOffParams: SocketIOOffParams | string,
    callback?: (data: unknown) => void
  ) {
    let args: SocketIOOffParams;
    if (typeof socketIOOffParams === "string") {
      args = {
        event: socketIOOffParams,
        callback
      };
      console.warn(
        "LTS-Renovation-Core",
        "SocketIO.off(event, callback) is deprecated",
        "Please use the interfaced approach instead"
      );
    } else {
      args = socketIOOffParams;
    }

    this.getSocket().off(args.event, args.callback);
  }

  /**
   * Disconnects and sets socket as null
   */
  public disconnect() {
    const socket = this.getSocket({ logError: false });
    if (this.isConnected) {
      socket.disconnect();
    }
    this.socket = null;
  }

  /**
   * Clears the cache. Currently empty method
   */
  // tslint:disable-next-line:no-empty
  public clearCache() {}

  public handleError(errorId: string, error: ErrorDetail): ErrorDetail {
    throw new Error("Method not implemented.");
  }
}
