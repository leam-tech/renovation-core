import RenovationDocument from "../model/document";
import { Renovation } from "../renovation";

export interface MessageBusPostParams {
  id: string;
  data: unknown;
}

export interface MessageBusGetSubjectParams {
  id: string;
}

export interface ScriptManagerLoadScriptsParams {
  doctype: string;
}

export interface ScriptManagerAddScriptsParams {
  doctype: string;
  code: string;
  name: string;
}

export interface ScriptManagerAddEventParams {
  doctype: string;
  event: string;
  fn: (core: Renovation, doc: RenovationDocument) => void;
}

export interface ScriptManagerAddEventsParams {
  doctype: string;
  eventDict: {
    [x: string]: (core: Renovation, doc: RenovationDocument) => void;
  };
}

export interface ScriptManagerTriggerEventParams {
  doctype: string;
  docname?: string;
  event: string;
  data?: unknown;
}

export interface SocketIOConnectParams {
  url?: string;
  path?: string;
  /**
   * How many reconnection attempts should we try?
   * @default 5
   */
  reconnectionAttempts?: number;
  /**
   * The time delay in milliseconds between reconnection attempts
   * @default 5000
   */
  reconnectionDelay?: number;
}

export interface GetSocketParams {
  logError: boolean;
}

export interface SocketIOEmitParams {
  event: string;
  data: [unknown?];
}

export interface SocketIOOnParams {
  event: string;
  callback: (data: unknown) => void;
}

export interface SocketIOOffParams {
  event: string;
  callback?: (data: unknown) => void;
}

// LogManager

export interface LogManagerParams {
  content: string;
  title?: string;
  tags?: string[];
}

export interface LogResponse {
  name: string;
  type: "Info" | "Error" | "Warning";
  content?: string;
  title?: string;
  request?: string;
  response?: string;
  tags: string[];
}

export interface InvokeLoggerParams {
  cmd: string;
  content?: string;
  title?: string;
  tags?: string[] | string;
  request?: string;
  response?: string;
}

export interface AppVersion {
  title: string;
  description: string;
  branch: string;
  version: string;
  appName: string;
  major: number;
  minor: number;
  patch: number;
}
