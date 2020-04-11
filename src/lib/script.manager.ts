import { renovationWarn, RequestResponse } from "..";
import { RenovationConfig } from "../config";
import RenovationDocument from "../model/document";
import { Renovation } from "../renovation";
import RenovationController from "../renovation.controller";
import { ErrorDetail } from "../utils/error";
import {
  ScriptManagerAddEventParams,
  ScriptManagerAddEventsParams,
  ScriptManagerAddScriptsParams,
  ScriptManagerLoadScriptsParams,
  ScriptManagerTriggerEventParams
} from "./interfaces";

/**
 * Class handling Renovation Scripts that are used to customize behavior in the front-end
 */
export default class ScriptManager extends RenovationController {
  /**
   * Holds the doctypes events
   *
   * Each doctype has events as keys. Each event is an array of functions
   */
  public events: {
    // doctype
    [x: string]: {
      // event
      [x: string]: [((core: Renovation, doc: RenovationDocument) => void)?];
    };
  };

  constructor(config: RenovationConfig) {
    super(config);
    this.events = {};
  }
  public handleError(errorId: string, error: ErrorDetail): ErrorDetail {
    let err = {} as ErrorDetail;
    if (errorId === "loadScripts") {
      err = { ...error, title: "load Scripts failure!" };
    } else {
      err = RenovationController.genericError(error);
    }
    return err;
  }

  /**
   * Clears the cache. Currently empty method
   */
  // tslint:disable-next-line:no-empty
  public clearCache() {}

  /**
   * Loads all RenovationScript associated with a doctype
   * @param {ScriptManagerLoadScriptsParams} scriptManagerLoadScriptsParams
   *
   * @returns {Promise<RequestResponse<boolean>>} `RequestResponse` containing true if loaded / exists in cache, false otherwise
   */
  public async loadScripts(
    scriptManagerLoadScriptsParams: ScriptManagerLoadScriptsParams
  ): Promise<RequestResponse<boolean>>;
  /**
   * Loads all RenovationScript associated with a doctype
   * @param doctype {string} The doctype for which to load the scripts
   * @deprecated
   * @returns {Promise<RequestResponse<boolean>>} `RequestResponse` containing true if loaded / exists in cache, false otherwise
   */
  // tslint:disable-next-line: unified-signatures
  public async loadScripts(doctype: string): Promise<RequestResponse<boolean>>;
  public async loadScripts(
    scriptManagerLoadScriptsParams: ScriptManagerLoadScriptsParams | string
  ): Promise<RequestResponse<boolean>> {
    let args: ScriptManagerLoadScriptsParams;
    if (typeof scriptManagerLoadScriptsParams === "string") {
      renovationWarn(
        "LTS-Renovation-Core",
        "loadScripts(doctype) is deprecated, please use the interfaced approach instead"
      );
      args = {
        doctype: scriptManagerLoadScriptsParams
      };
    } else {
      args = scriptManagerLoadScriptsParams;
    }

    if (!this.events[args.doctype]) {
      this.events[args.doctype] = {};
      const codeResponse = await this.getCore().model.getList({
        doctype: "Renovation Script",
        fields: ["name", "code"],
        filters: {
          target_dt: args.doctype
        }
      });
      if (codeResponse.success) {
        for (const item of codeResponse.data) {
          this.addScript({
            doctype: args.doctype,
            name: item.name as string,
            code: item.code as string
          });
        }
        return RequestResponse.success(true);
      } else {
        return RequestResponse.fail(
          this.handleError("loadScripts", codeResponse.error)
        );
      }
    } else {
      return RequestResponse.success(true);
    }
  }

  /**
   * Evaluates the script of a doctype
   * @param scriptManagerAddScriptsParams {ScriptManagerAddScriptsParams}
   */
  public addScript(
    scriptManagerAddScriptsParams: ScriptManagerAddScriptsParams
  ) {
    try {
      // tslint:disable-next-line:no-eval
      eval(scriptManagerAddScriptsParams.code)(this.getCore());
    } catch (e) {
      renovationWarn(
        `Renovation Script Error: ${scriptManagerAddScriptsParams.doctype}: ${
          scriptManagerAddScriptsParams.name
        }`,
        e
      );
    }
  }

  /**
   * Add a single event for a doctype
   * @param {ScriptManagerAddEventParams} scriptManagerAddEventParams
   */
  public addEvent(scriptManagerAddEventParams: ScriptManagerAddEventParams);
  /**
   * Add a single event for a doctype
   * @param doctype {string} The doctype associated with the script
   * @param event {string} The event name
   * @param fn {Function} Function that will be triggered on event
   * @deprecated
   */
  public addEvent(doctype, event, fn);
  public addEvent(
    scriptManagerAddEventParams: ScriptManagerAddEventParams | string,
    event?: string,
    fn?: () => void
  ) {
    let args: ScriptManagerAddEventParams;
    if (typeof scriptManagerAddEventParams === "string") {
      renovationWarn(
        "LTS-Renovation-Core",
        "addEvent(doctype,event,fn) is deprecated, please use the interfaced approach instead"
      );
      args = {
        doctype: scriptManagerAddEventParams,
        event,
        fn
      };
    } else {
      args = scriptManagerAddEventParams;
    }

    if (!this.events[args.doctype]) {
      this.events[args.doctype] = {};
    }
    if (!this.events[args.doctype][args.event]) {
      this.events[args.doctype][args.event] = [];
    }
    this.events[args.doctype][args.event].push(args.fn);
  }

  /**
   * Add multiple events for a doctype
   * @param {ScriptManagerAddEventsParams} scriptManagerAddEventsParams
   */
  public addEvents(scriptManagerAddEventsParams: ScriptManagerAddEventsParams);
  /**
   * Add multiple events for a doctype
   * @param doctype {string} The doctype associated with the script
   * @param eventDict The object containing the events with their functions
   * @deprecated
   */
  public addEvents(
    doctype: string,
    eventDict: {
      [x: string]: (core: Renovation, doc: RenovationDocument) => void;
    }
  );
  public addEvents(
    arg1: ScriptManagerAddEventsParams | string,
    eventDict?: {
      [x: string]: (core: Renovation, doc: RenovationDocument) => void;
    }
  ) {
    let args: ScriptManagerAddEventsParams;
    if (typeof arg1 === "string") {
      renovationWarn(
        "LTS-Renovation-Core",
        "addEvent(doctype,eventDict) is deprecated, please use the interfaced approach instead"
      );
      args = {
        doctype: arg1,
        eventDict
      };
    } else {
      args = arg1;
    }

    // tslint:disable-next-line:forin
    for (const event in args.eventDict) {
      if (typeof args.eventDict[event] !== "function") {
        continue;
      }
      this.addEvent({
        doctype: args.doctype,
        event,
        fn: args.eventDict[event]
      });
    }
  }

  /**
   * Call all attached event handlers
   * @param {ScriptManagerTriggerEventParams} scriptManagerTriggerEventParams
   */
  public trigger(
    scriptManagerTriggerEventParams: ScriptManagerTriggerEventParams
  );
  /**
   * Call all attached event handlers
   * @param doctype {string} The doctype associated with the script
   * @param docname {string} Name of the document to apply the event's trigger
   * @param event {string} Name of the event triggered
   * @deprecated
   */
  public trigger(doctype: string, docname: string, event: string);
  public trigger(
    scriptManagerTriggerEventParams: ScriptManagerTriggerEventParams | string,
    docname?: string,
    event?: string
  ) {
    let args: ScriptManagerTriggerEventParams;
    if (typeof scriptManagerTriggerEventParams === "string") {
      renovationWarn(
        "LTS-Renovation-Core",
        "trigger(doctype,docname,event) is deprecated, please use the interfaced approach instead"
      );
      args = {
        doctype: scriptManagerTriggerEventParams,
        docname,
        event
      };
    } else {
      args = scriptManagerTriggerEventParams;
    }

    // if event not found, return without throwing
    if (!this.events[args.doctype]) {
      return;
    }

    let doc = null;
    if (args.docname) {
      if (this.getCore().model.locals[args.doctype]) {
        doc = this.getCore().model.locals[args.doctype][args.docname];
        if (!doc) {
          return;
        }
      }
    }
    for (const v of ["*", args.event]) {
      if (this.events[args.doctype][v]) {
        this.events[args.doctype][v].forEach(element => {
          setTimeout(() => element(this.getCore(), doc));
        });
      }
    }

    // recheck display_dependsOn
    this.getCore().ui.checkDisplayDependsOnAll(args.doctype);
  }
}
