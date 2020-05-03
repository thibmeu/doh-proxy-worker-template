export const paramsToObject = (query: string): any =>
  Object.fromEntries(
    query
      .slice(1)
      .split('&')
      .map(c => c.split('=').map(s => decodeURIComponent(s))),
  )
