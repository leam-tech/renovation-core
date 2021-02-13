import { Subject } from "rxjs";
import { renovationWarn } from "../utils";
import { MessageBusGetSubjectParams, MessageBusPostParams } from "./interfaces";

/**
 * Class for handling the Message Bus used in the front-end mostly
 */
export class MessageBus {
  /**
   * Object holding the buses
   */
  private buses = {};

  /**
   * Post message onto a bus with id
   * @param {MessageBusPostParams} messageBusPostParams
   */
  public post(messageBusPostParams: MessageBusPostParams);
  /**
   * Post message onto a bus with id
   * @param id {string} bus id
   * @param data {unknown} Data to be added to the bus
   * @deprecated
   */
  public post(id: string, data: unknown);
  public post(
    messageBusPostParams: MessageBusPostParams | string,
    data?: unknown
  ) {
    let args: MessageBusPostParams;
    if (typeof messageBusPostParams === "string") {
      renovationWarn(
        "LTS-Renovation-Core",
        "post(id, data) is deprecated, please use the interfaced approach instead"
      );
      args = {
        id: messageBusPostParams,
        data
      };
    } else {
      args = messageBusPostParams;
    }

    if (!this.buses[args.id]) {
      return;
    }
    (this.buses[args.id] as Subject<unknown>).next(args.data);
  }

  /**
   * Returns a Subject<unknown> instance to which can be subscribed for events
   * @param messageBusGetSubjectParams {string} ID of message bus to listen to
   * @returns {Subject<unknown>} The subject returned
   */
  public getSubject(
    messageBusGetSubjectParams: MessageBusGetSubjectParams
  ): Subject<unknown>;
  /**
   * Returns a Subject<unknown> instance to which can be subscribed for events
   * @param id {string} ID of message bus to listen to
   * @returns {Subject<unknown>} The subject returned
   * @deprecated
   */
  // tslint:disable-next-line: unified-signatures
  public getSubject(id: string): Subject<unknown>;
  public getSubject(
    messageBusGetSubjectParams: MessageBusGetSubjectParams | string
  ): Subject<unknown> {
    let args: MessageBusGetSubjectParams;
    if (typeof messageBusGetSubjectParams === "string") {
      renovationWarn(
        "LTS-Renovation-Core",
        "getSubject(id) is deprecated, please use the interfaced approach instead"
      );
      args = {
        id: messageBusGetSubjectParams
      };
    } else {
      args = messageBusGetSubjectParams;
    }

    if (!this.buses[args.id]) {
      this.buses[args.id] = new Subject();
    }
    return this.buses[args.id];
  }
}
