import { getEnv } from '@/shared/lib/env'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface HttpClientError extends Error {
  status: number
  payload?: unknown
}

interface HttpClientOptions extends Omit<RequestInit, 'headers' | 'method'> {
  headers?: HeadersInit
  method?: HttpMethod
  parseJson?: boolean
}

const { apiBaseUrl } = getEnv()

const buildUrl = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${apiBaseUrl}${normalizedPath}`
}

const raiseError = async (response: Response): Promise<never> => {
  let payload: unknown

  try {
    payload = await response.clone().json()
  } catch {
    payload = await response.text().catch(() => undefined)
  }

  const httpError = new Error(response.statusText) as HttpClientError
  httpError.status = response.status
  httpError.payload = payload
  throw httpError
}

const mergeHeaders = (headers: HeadersInit | undefined) => {
  const merged = new Headers(headers)

  if (!merged.has('Content-Type')) {
    merged.set('Content-Type', 'application/json')
  }

  return merged
}

export const httpClient = async <T>(path: string, options: HttpClientOptions = {}) => {
  const { parseJson = true, method, headers, credentials, ...requestInit } = options

  const normalizedMethod = (method ?? 'GET').toUpperCase() as HttpMethod

  const response = await fetch(buildUrl(path), {
    ...requestInit,
    method: normalizedMethod,
    headers: mergeHeaders(headers),
    credentials: credentials ?? 'include',
  })

  if (!response.ok) {
    await raiseError(response)
  }

  if (!parseJson) {
    return undefined as T
  }

  return (await response.json()) as T
}
