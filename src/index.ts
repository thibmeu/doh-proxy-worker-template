/**
 * Entry of the Cloudflare worker
 * As for Service Workers, a Cloudflare Worker listens on 'fetch' events.
 * @packageDocumentation
 */
import { handleRequest } from './handler'

/**
 * Entry point to the worker
 * @dev https://developers.cloudflare.com/workers/quickstart
 */
addEventListener('fetch', (event: any) => {
  event.respondWith(handleRequest(event.request))
})
