import { RenovationBackend } from "../config";
import { Renovation } from "../renovation";

/**
 * Class containing initializing methods of Renovation for testing
 *
 * In addition, contains credentials and nock-record modes that can be set globally
 */
export class TestManager {
  /**
   * A getter for the nock-record mode
   */
  static get testMode() {
    return TEST_MODE.record;
  }

  /**
   * Getter for `_skipTest`
   * @return {boolean}
   */
  static get skipTest() {
    return TestManager._skipTest;
  }

  /**
   * Setter for `_skipTest`
   * @param {boolean} value
   */
  set skipTest(value: boolean) {
    TestManager._skipTest = value;
  }

  /**
   * Getter for `_onlyTest`
   * @return {boolean}
   */
  static get onlyTest(): boolean {
    return TestManager._onlyTest;
  }

  /**
   * Setter for `_onlyTest`
   * @param {boolean} value
   */
  static set onlyTest(value: boolean) {
    TestManager._onlyTest = value;
  }
  /**
   * Holds the test instance of Renovation
   */
  public static renovation: Renovation;
  /**
   * Whether the class is used for testing
   */
  public static isTesting = true;
  /**
   * The client ID required for the initializing of Renovation
   *
   * Defaults to 'test-erp'
   */
  public static clientId = "test-erp";

  /**
   * Initializes the Renovation instance
   *
   * @param backend The backend to be used
   * @returns {Renovation} The initialized `Renovation` instance
   */
  public static async init(backend: RenovationBackend): Promise<Renovation> {
    if (this.renovation) {
      return Promise.resolve(this.renovation);
    }
    const credentials = this.getTestUserCredentials();
    this.isTesting = true;
    return new Promise(async resolve => {
      console.log(`CORE INIT: ${this.hostUrls[0]}`);
      this.renovation = new Renovation();
      await this.renovation.init({
        backend,
        hostURL: this.hostUrls[0],
        clientId: TestManager.clientId
      });
      if (backend === "frappe") {
        await this.renovation.auth.login({
          email: credentials.email,
          password: credentials.password
        });
      }
      resolve(this.renovation);
    });
  }

  /**
   * A getter for the used credentials across the testing environment
   */
  public static getTestUserCredentials() {
    return {
      email: "<username>",
      password: "<password>",
      full_name: "Test User"
    };
  }

  /**
   * Returns the type of the test
   * @param {boolean} isSuite
   * @return Returns an it or describe in the following priority:
   * 1- Skip
   * 2- Only
   * 3- Regular
   */
  public static getTestType(isSuite: boolean): any {
    return TestManager._skipTest
      ? isSuite
        ? describe.skip
        : it.skip
      : TestManager._onlyTest
      ? isSuite
        ? describe.only
        : it.only
      : isSuite
      ? describe
      : it;
  }

  /**
   * Holds the host URLs of the backend
   *
   * Useful if another app on another site needs to be tested
   */
  private static hostUrls = [
    "<host_url>",
    "http://localhost:8000"
    // "<host_url>",
  ];

  /**
   * Whether to skip suites/test cases
   * @type {boolean}
   * @private
   */
  private static _skipTest = true;

  /**
   * * Whether to only run the suites/test cases
   * @type {boolean}
   * @private
   */
  private static _onlyTest = false;
}

/**
 * wild: all requests go out to the internet, don't replay anything, doesn't record anything
 * dryrun: The default, use recorded nocks, allow http calls, doesn't record anything, useful for writing new tests
 * record: use recorded nocks, record new nocks
 * lockdown: use recorded nocks, disables all http calls even when not nocked, doesn't record
 */
export enum TEST_MODE {
  wild = "wild",
  dryrun = "dryrun",
  record = "record",
  lockdown = "lockdown"
}
