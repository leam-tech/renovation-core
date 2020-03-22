/**
 * Class to initialize RenovationDocument
 */
export default class RenovationDocument {
  [x: string]: any;

  /**
   * Creates a {RenovationDocument} instance with a set of properties added to each property of the input
   *
   * The passed obj should include the property 'doctype'
   *
   * @param obj The raw object to transform to `RenovationDocument`
   */
  constructor(obj?: any) {
    if (obj && !obj.hasOwnProperty("doctype")) {
      throw new Error("Invalid object for doctype");
    }

    if (obj) {
      for (const key in obj) {
        if (!obj.hasOwnProperty(key)) {
          continue;
        }
        Object.defineProperty(this, key, {
          value: obj[key],
          writable: true,
          enumerable: true,
          configurable: true
        });
      }
    }
  }
}
