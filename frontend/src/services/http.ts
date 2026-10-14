import { config } from '@/config'

export type ApiErrorKind = 'network' | 'timeout' | 'http' | 'parse' | 'aborted'

export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status: number | null
  /** Field-level messages when FastAPI returns a 422 validation payload. */
  readonly fieldErrors: Record<string, string>

  constructor(
    kind: ApiErrorKind,
    message: string,
    status: number | null = null,
    fieldErrors: Record<string, string> = {},
  ) {
    super(message)
    this.name = 'ApiError'
    this.kind = kind
    this.status = status
    this.fieldErrors = fieldErrors
  }

  get isNotFound() {
    return this.status === 404
  }
}

interface ValidationItem {
  loc?: unknown[]
  msg?: string
}

/** Turns FastAPI's `detail` (string or list of validation items) into text. */
export function parseErrorDetail(body: unknown, status: number): {
  message: string
  fieldErrors: Record<string, string>
} {
  const fallback = `Request failed with status ${status}.`
  if (typeof body !== 'object' || body === null || !('detail' in body)) {
    return { message: fallback, fieldErrors: {} }
  }
  const detail = (body as { detail: unknown }).detail

  if (typeof detail === 'string') return { message: detail, fieldErrors: {} }

  if (Array.isArray(detail)) {
    const fieldErrors: Record<string, string> = {}
    const parts: string[] = []
    for (const item of detail as ValidationItem[]) {
      const msg = item?.msg ?? 'Invalid value'
      const loc = Array.isArray(item?.loc) ? item.loc : []
      // loc looks like ["body", "url"]; drop the leading source segment.
      const path = loc.filter((s) => s !== 'body' && s !== 'query' && s !== 'path')
      const field = path.length ? String(path[path.length - 1]) : null
      if (field && !fieldErrors[field]) fieldErrors[field] = msg
      parts.push(field ? `${field}: ${msg}` : msg)
    }
    return { message: parts.join('; ') || fallback, fieldErrors }
  }

  return { message: fallback, fieldErrors: {} }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'DELETE'
  body?: unknown
  signal?: AbortSignal
  timeoutMs?: number
}

/**
 * Single choke point for all network access. Applies the base URL, a timeout,
 * caller cancellation, and normalises every failure into an ApiError.
 */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, signal, timeoutMs = config.requestTimeoutMs } = options

  const controller = new AbortController()
  let timedOut = false
  const timer = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, timeoutMs)
  const onCallerAbort = () => controller.abort()
  if (signal) {
    if (signal.aborted) controller.abort()
    else signal.addEventListener('abort', onCallerAbort, { once: true })
  }

  try {
    let response: Response
    try {
      response = await fetch(`${config.apiBaseUrl}${path}`, {
        method,
        headers: {
          Accept: 'application/json',
          ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      })
    } catch (error) {
      if (timedOut) {
        throw new ApiError('timeout', `The API did not respond within ${Math.round(timeoutMs / 1000)} seconds.`)
      }
      if (signal?.aborted || (error instanceof DOMException && error.name === 'AbortError')) {
        throw new ApiError('aborted', 'Request was cancelled.')
      }
      throw new ApiError('network', 'Cannot reach the UpTrack API. Check that the backend is running.')
    }

    const text = await response.text()
    let json: unknown = undefined
    if (text) {
      try {
        json = JSON.parse(text)
      } catch {
        if (response.ok) throw new ApiError('parse', 'The API returned a response that is not valid JSON.', response.status)
      }
    }

    if (!response.ok) {
      const { message, fieldErrors } = parseErrorDetail(json, response.status)
      // A proxy with no upstream returns 502/503/504 with an HTML or empty body.
      const proxyDown = json === undefined && [502, 503, 504].includes(response.status)
      throw new ApiError(
        'http',
        proxyDown ? 'The API gateway could not reach the backend. Check that it is running.' : message,
        response.status,
        fieldErrors,
      )
    }

    return json as T
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', onCallerAbort)
  }
}

export function isAbortError(error: unknown): boolean {
  return error instanceof ApiError && error.kind === 'aborted'
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return 'Something went wrong.'
}
