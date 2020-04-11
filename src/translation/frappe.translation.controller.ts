import RenovationController from "../renovation.controller";
import { renovationWarn } from "../utils";
import { ErrorDetail } from "../utils/error";
import {
  contentType,
  FrappeRequestOptions,
  httpMethod,
  Request,
  RequestResponse
} from "../utils/request";
import { LoadTranslationsParams } from "./interfaces";
import TranslationController from "./translation.controller";

/**
 * Class handling the translation of Frappe
 */
export default class FrappeTranslationController extends TranslationController {
  public handleError(errorId: string, error: ErrorDetail): ErrorDetail {
    let err = {} as ErrorDetail;
    switch (errorId) {
      case "loadtranslation":
      default:
        err = RenovationController.genericError(error);
    }
    return err;
  }
  /**
   * Loads the translation of the selected language
   * @param loadTranslationsParams
   */
  public async loadTranslations(
    loadTranslationsParams: LoadTranslationsParams
  ): Promise<RequestResponse<{ [x: string]: string }>>;
  /**
   * Loads the translation of the selected language
   * @param lang The selected language
   * @deprecated
   */
  public async loadTranslations(
    lang?: string
  ): Promise<RequestResponse<{ [x: string]: string }>>;
  public async loadTranslations(
    loadTranslationsParams?: string | LoadTranslationsParams
  ) {
    let args: LoadTranslationsParams = {};
    if (typeof loadTranslationsParams === "string") {
      args = {
        lang: loadTranslationsParams
      };
      renovationWarn(
        "LTS-Renovation-Core",
        "loadTranslations(lang) is deprecated, please use the interfaced approach instead"
      );
    } else if (loadTranslationsParams) {
      args = loadTranslationsParams;
    }
    args.lang = args.lang || this.currentLanguage;

    const r = await Request(
      `${this.getHostUrl()}/api/method/renovation_core.utils.client.get_lang_dict`,
      httpMethod.GET,
      FrappeRequestOptions.headers,
      {
        contentType: contentType["application/x-www-form-urlencoded"],
        data: {
          lang: args.lang
        }
      }
    );
    if (r.success && r.data) {
      r.data = r.data.message;
      this.setMessagesDict({ dict: r.data });
      return r;
    } else {
      return RequestResponse.fail(this.handleError("loadtranslation", r.error));
    }
  }
}
