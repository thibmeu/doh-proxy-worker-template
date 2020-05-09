/**
 * Collection of methods to interact with urls from a Worker
 * @packageDocumentation
 */

/**
 * Convert a search query to a javascript object
 * @param query - HTTP query. Format: ?<param1=value1>(&<param2=value2>)*
 * @returns Object retrieved from query parameters. Cast it on <T>
 */
export const paramsToObject = <T>(query: string): T =>
  Object.fromEntries(
    query
      .slice(1)
      .split('&')
      .map((c) => c.split('=').map((s) => decodeURIComponent(s))),
  )

/**
 * Convert an object into a search query
 * @param query - Parameters to be passed
 * @returns Search query. Format: <param1=value1>(&<param2=value2>)*
 */
export const objectToParams = <T>(o: T) =>
  '?' +
  Object.entries(o)
    .map((c) => c.map((p) => encodeURIComponent(p)).join('='))
    .join('&')
