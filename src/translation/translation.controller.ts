import { renovationWarn, RequestResponse } from "..";
import RenovationController from "../renovation.controller";
import {
  ExtendDictParams,
  GetMessageParams,
  LoadTranslationsParams,
  SetCurrentLanguageParams,
  SetMessagesDictParams
} from "./interfaces";

/**
 * Class handling the translations and setting the language
 */
export default abstract class TranslationController extends RenovationController {
  /**
   * The current set language
   */
  protected currentLanguage = "en";
  /**
   * Messages dictionary
   * {
   *  'en': {
   *     ----
   *  },
   *  'ar': {
   *     ----
   *  }
   * }
   */
  private messages = {};

  /**
   * Loads the translation of the selected language
   * @param loadTranslationsParams
   */
  public abstract async loadTranslations(
    loadTranslationsParams: LoadTranslationsParams
  ): Promise<RequestResponse<{ [x: string]: string }>>;
  /**
   * Loads the translation of the selected language
   * @param lang The selected language
   * @deprecated
   */
  public abstract async loadTranslations(
    lang?: string
  ): Promise<RequestResponse<{ [x: string]: string }>>;

  /**
   * Get the messages
   * @param {GetMessageParams} getMessageParams
   * @returns The message as per the key if the input is a string, the input as-is otherwise
   */
  public getMessage(getMessageParams: GetMessageParams);
  /**
   * Get the messages
   * @param txt The key of the message if a string is passed, returned as-is otherwise
   * @returns The message as per the key if the input is a string, the input as-is otherwise
   *
   * @deprecated
   */
  // tslint:disable-next-line:unified-signatures
  public getMessage(txt: string);
  public getMessage(getMessageParams: GetMessageParams | string) {
    let args: GetMessageParams;
    if (!getMessageParams || typeof getMessageParams !== "object") {
      renovationWarn(
        "LTS-Renovation-Core",
        "getMessage(txt) is deprecated, please use the interfaced approach instead"
      );
      args = { txt: getMessageParams } as GetMessageParams;
    } else {
      args = getMessageParams;
    }
    args.lang = args.lang || this.currentLanguage;
    if (!args.txt) {
      return args.txt;
    }
    if (typeof args.txt !== "string") {
      return args.txt;
    }
    return (this.messages[args.lang] || {})[args.txt] || args.txt;
  }

  /**
   * Set the message dictionary (Overwrite)
   * @param setMessagesDictParams
   */
  public setMessagesDict(setMessagesDictParams: SetMessagesDictParams);
  /**
   * Set the message dictionary (Overwrite)
   * @param msgs The message dictionary
   * @deprecated
   */
  // tslint:disable-next-line: unified-signatures
  public setMessagesDict(msgs: { [x: string]: string });
  public setMessagesDict(
    setMessagesDictParams: SetMessagesDictParams | { [x: string]: string }
  ) {
    let args: SetMessagesDictParams;
    if (
      Object.keys(setMessagesDictParams).length <= 2 &&
      setMessagesDictParams.dict
    ) {
      args = setMessagesDictParams as SetMessagesDictParams;
    } else {
      args = {
        dict: setMessagesDictParams as { [x: string]: string },
        lang: this.currentLanguage
      };
      renovationWarn(
        "LTS-Renovation-Core",
        "setMessagesDict(msgs) is deprecated, please use the interfaced approach instead"
      );
    }
    args.lang = args.lang || this.currentLanguage;
    this.messages[args.lang] = args.dict;
  }

  /**
   * Add an object to the dictionary
   * @param extendDictParams
   */
  public extendDictionary(extendDictParams: ExtendDictParams);
  /**
   * Add an object to the dictionary
   * @param dict The dictionary to be appended
   * @deprecated
   */
  // tslint:disable-next-line: unified-signatures
  public extendDictionary(dict: { [x: string]: string });
  public extendDictionary(
    extendDictParams: ExtendDictParams | { [x: string]: string }
  ) {
    let args: ExtendDictParams;
    if (
      extendDictParams &&
      Object.keys(extendDictParams).length <= 2 &&
      extendDictParams.dict
    ) {
      args = extendDictParams as ExtendDictParams;
    } else {
      args = {
        dict: extendDictParams as { [x: string]: string },
        lang: this.currentLanguage
      };
      renovationWarn(
        "LTS-Renovation-Core",
        "extendDictParams(dict) is deprecated, please use the interfaced approach instead"
      );
    }

    if (args.dict && typeof args.dict === "object") {
      this.messages[args.lang] = this.messages[args.lang] || {};
      Object.assign(this.messages[args.lang], args.dict);
    }
  }

  /**
   * Clears the cache. Currently empty method
   */
  // tslint:disable-next-line:no-empty
  public clearCache() {}

  /**
   * A setter for `currentLanguage`. Defaults to 'en'
   * @param setCurrentLanguageParams
   */
  public setCurrentLanguage(
    setCurrentLanguageParams: SetCurrentLanguageParams
  ) {
    this.currentLanguage = setCurrentLanguageParams.lang || "en";
  }

  /**
   * A getter for `currentLanguage`
   * @returns The current language set
   */
  public getCurrentLanguage(): string {
    return this.currentLanguage;
  }
}
