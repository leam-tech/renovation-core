import {
  addDays as daddDays,
  addMonths as daddMonths,
  distanceInWordsToNow,
  format,
  parse
} from "date-fns";
import { Renovation } from "../renovation";

/**
 * Adds the data utility methods to a single parent
 * @param core The Renovation Core instance
 */
export function extendCoreDateUtils(core: Renovation) {
  core.utils.datetime = {
    getToday,
    addDays,
    addMonths,
    format,
    distanceInWordsToNow
  };
}

/**
 * The format of the date used to get the today's date
 */
const dateFormat = "YYYY-MM-DD";
/**
 * The format of the time to get the time
 */
const timeFormat = "HH:mm:ss";

/**
 * Get today's date in the set format
 *
 * @returns {string} The date as a string in the format set
 */
export function getToday(): string {
  return format(new Date(), dateFormat);
}

/**
 * Adds days to the date and returns formatted date
 * @param date Date() obj or as a string
 * @param days number of days to add
 * @returns {string} The formatted date after adding days
 */
export function addDays(date, days: number): string {
  return format(daddDays(parse(date), days), dateFormat);
}

/**
 * Adds months to the date and returns formatted date
 * @param date Date() obj or as a string
 * @param months number of months to add
 * @returns {string} The formatted date after adding months
 */
export function addMonths(date, months: number): string {
  return format(daddMonths(parse(date), months), dateFormat);
}
