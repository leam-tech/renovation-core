import cloneDeep from "lodash/cloneDeep";
import isEqual from "lodash/isEqual";
/**
 *
 * Helper method that parses a JSON string to an object
 *
 * @param s The stringified JSON object
 * @returns {any} The parsed object
 *
 * If the input is `null`, `null` would be returned
 *
 * If the input is an object, the object is returned as-is
 *
 * If the string is wrongly formatted, `null` is returned
 */
export const getJSON = (s: string): any => {
  let obj = null;
  try {
    if (typeof s === "string") {
      obj = JSON.parse(s);
    } else {
      obj = s;
    }
    // tslint:disable-next-line:no-empty
  } catch {}
  return obj;
};

/**
 * A helper method that will clone the object by value and not by reference
 *
 * @param obj Object to be cloned
 * @returns {T} The cloned object
 *
 * If the input is `null`, `null` is returned
 */
export const deepCloneObject = <T>(obj: T): T => {
  return cloneDeep<T>(obj);
};

/**
 * Compares a list of objects if they are equal in value (not by reference)
 * @param args list of objects
 * @returns true if deeply equal, false otherwise
 */
export function deepCompare(...args): boolean {
  // tslint:disable-next-line: one-variable-per-declaration
  let i, l;

  if (arguments.length < 1) {
    return true; // Die silently? Don't know how to handle such case, please help...
    // throw "Need two or more arguments to compare";
  }

  for (i = 1, l = arguments.length; i < l; i++) {
    if (!isEqual(arguments[0], arguments[i])) {
      return false;
    }
  }

  return true;
}
