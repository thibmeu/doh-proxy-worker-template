import fetchMock, { enableFetchMocks } from 'jest-fetch-mock'
enableFetchMocks()
fetchMock.dontMock()

import makeServiceWorkerEnv from 'service-worker-mock'
declare var global: any
Object.assign(global, makeServiceWorkerEnv())
