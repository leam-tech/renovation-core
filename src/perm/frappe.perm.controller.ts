import RenovationController from "../renovation.controller";
import { asyncSleep } from "../utils";
import { ErrorDetail } from "../utils/error";
import {
  FrappeRequestOptions,
  httpMethod,
  Request,
  RequestResponse
} from "../utils/request";
import PermissionController from "./perm.controller";

/**
 * Frappe Permission Controller with extended methods & properties
 *
 * Includes a method for loading basic permissions
 */
export default class FrappePermissionController extends PermissionController {
  public handleError(errorId: string, error: ErrorDetail): ErrorDetail {
    let err = {} as ErrorDetail;

    switch (errorId) {
      case "load_basic_perms":
      default:
        err = RenovationController.genericError(error);
    }

    return err;
  }
  /**
   * Loads the basic params from the backend for the current user
   *
   * If a user isn't signed in, the Guest basic permissions is retrieved
   */
  public async loadBasicPerms() {
    if (this.basicPerms) {
      if (this.basicPerms.isLoading) {
        await asyncSleep(50);
        return this.loadBasicPerms();
      } else {
        return RequestResponse.success(this.basicPerms);
      }
    }

    // @ts-ignore
    this.basicPerms = {
      isLoading: true
    };

    // the current user when request was initiated
    // this is necessary to help race conditions
    const user = this.getCore().auth.getCurrentUser() || "Guest";

    const r = await Request(
      `${this.getHostUrl()}/api/method/renovation_core.utils.client.get_current_user_permissions`,
      httpMethod.POST,
      FrappeRequestOptions.headers
    );
    if (r.success && r.data) {
      this.basicPerms = Object.assign(r.data.message || {}, {
        _user: user
      });
    }
    return r.success
      ? r
      : RequestResponse.fail(this.handleError("load_basic_perms", r.error));
  }
}
