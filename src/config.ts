import { Renovation } from "./renovation";

export declare type RenovationBackend = "frappe" | "firebase";

/**
 * Class containing static instance of its self
 *
 * It also includes the host URL and the backend chosen (Currently only frappe is enabled)
 */
export class RenovationConfig {
  /**
   * A static instance of its self
   *
   * Useful for use in files containing exported functions only
   */
  // tslint:disable-next-line:variable-name
  private static _instance: RenovationConfig;

  /**
   * A setting property to disable submission used in defaults
   */
  public disableSubmission: boolean = false;

  constructor(
    public coreInstance: Renovation,
    public backend: RenovationBackend,
    public hostUrl?: string
  ) {}

  /**
   * A getter for the static instance
   */
  public static get instance(): RenovationConfig {
    return this._instance;
  }

  /**
   * A setter for the static instance
   */
  public static set instance(value) {
    this._instance = value;
  }
}
