import { ErrorDetail } from "../utils/error";
import UIController from "./ui.controller";

export default class FrappeUIController extends UIController {
  public handleError(errorId: string, error: ErrorDetail): ErrorDetail {
    return undefined;
  }
}
