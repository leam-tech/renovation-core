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
