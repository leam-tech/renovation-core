export * from "./json";
export { asyncSleep } from "./functions";

export interface RenovationUtils {
  getJSON: (s: string) => object;
  datetime: {
    getToday: () => string;
    addDays: (date, days) => string;
    addMonths: (date, months) => string;
    format: (date) => string;
    distanceInWordsToNow: (date) => string;
  };
}
// tslint:disable-next-line:no-var-requires
export const logger = require("debug");
export const renovationLog = logger("renovation-core-log");
export const renovationWarn = logger("renovation-core-warn");
export const renovationError = logger("renovation-core-error");
