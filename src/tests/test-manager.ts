import process from "process";
import { RenovationBackend } from "../config";
import { Renovation } from "../renovation";

export enum ENV_VARIABLES {
  // Host URL
  HostURL = "CORE_TS_HOST_URL",
  SecondaryHostUrl = "CORE_TS_HOST_URL_SECONDARY",
  ClientID = "CORE_TS_CLIENT_ID",

  // Users
  PrimaryUser = "CORE_TS_PRIMARY_USER",
  PrimaryUserPwd = "CORE_TS_PRIMARY_USER_PWD",
  PrimaryUserName = "CORE_TS_PRIMARY_USER_NAME",
  PrimaryUserEmail = "CORE_TS_PRIMARY_USER_EMAIL",
  SecondaryUser = "CORE_TS_SECONDARY_USER",
  SecondaryUserPwd = "CORE_TS_SECONDARY_USER_PWD",
  SecondaryUserName = "CORE_TS_SECONDARY_USER_NAME",
  MobileNumber = "CORE_TS_MOBILE_NUMBER",
  PinNumber = "CORE_TS_PIN_NUMBER",

  // Storage
  ExistingFolder = "CORE_TS_EXISTING_FOLDER"
}

/**
 * Class containing initializing methods of Renovation for testing
 */
export class TestManager {
  /**
   * Holds the test instance of Renovation
   */
  public static renovation: Renovation;

  /**
   * Primary User
   */
  public static readonly primaryUser = TestManager.getVariables(
    ENV_VARIABLES.PrimaryUser
  );

  /**
   * Primary User Pwd
   */
  public static readonly primaryUserPwd = TestManager.getVariables(
    ENV_VARIABLES.PrimaryUserPwd
  );

  /**
   * Primary User Full Name
   */
  public static readonly primaryUserName = TestManager.getVariables(
    ENV_VARIABLES.PrimaryUserName
  );

  /**
   * Secondary User
   */
  public static readonly secondaryUser = TestManager.getVariables(
    ENV_VARIABLES.SecondaryUser
  );

  /**
   * Secondary User Pwd
   */
  public static readonly secondaryUserPwd = TestManager.getVariables(
    ENV_VARIABLES.SecondaryUserPwd
  );

  /**
   * Secondary User Full Name
   */
  public static readonly secondaryUserName = TestManager.getVariables(
    ENV_VARIABLES.SecondaryUserName
  );

  /**
   * Initializes the Renovation instance
   *
   * @param backend The backend to be used
   * @param forceInit Whether renovation needs to be reinitialized with a new host URL for instance.
   * @param hostUrl The host URL to connect to if force init is used.
   * @param clientId The client id, if any.
   * @returns {Renovation} The initialized `Renovation` instance
   */
  public static async init(
    backend: RenovationBackend,
    forceInit = false,
    hostUrl?: string,
    clientId?: string
  ): Promise<Renovation> {
    if (this.renovation && !forceInit) {
      return Promise.resolve(this.renovation);
    }

    const url =
      hostUrl && forceInit ? hostUrl : this.getVariables(ENV_VARIABLES.HostURL);

    return new Promise(async resolve => {
      this.renovation = new Renovation();
      await this.renovation.init({
        backend,
        hostURL: url,
        clientId,
        disableLog: true
      });
      resolve(this.renovation);
    });
  }

  /**
   * Get values from environment object
   */
  public static getVariables(variableName: ENV_VARIABLES): string {
    return process ? process.env[variableName] : null;
  }
}
