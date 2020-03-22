/**
 * Helper function to convert string to Title Case
 *
 * Examples:
 *
 * - hello world -> Hello World
 * - hello_world -> Hello_world
 * @param s {string} string to be converted
 * @returns {string} Converted string to Title case
 */
export const toTitleCase = (s: string): string =>
  (s || "").replace(
    /\w\S*/g,
    txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
/**
 * Helper function to convert an underscore to camel case
 *
 * Example:
 *
 * - hello_world -> helloWorld
 * @param s {string} underscore case string to be converted
 * @returns {string} Converted string to Title case
 */
export const underScoreToCamel = (s: string): string =>
  (s || "").replace(/(\_[a-z])/g, $1 => $1.toUpperCase().replace("_", ""));
/**
 * Helper function to convert an underscore to Title case
 *
 * Example:
 *
 * hello_world -> Hello World
 * @param s {string} underscore case string to be converted
 * @returns {string} Converted string to Title case
 */
export const underScoreToTitle = (s: string): string => {
  s = (s || "").replace(/(\_[a-z])/g, $1 => $1.toUpperCase().replace("_", " "));
  s = s.replace(s.charAt(0), s.charAt(0).toUpperCase());
  return s;
};
