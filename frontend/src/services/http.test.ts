import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, parseErrorDetail, request } from './http'
import { api } from './api'

afterEach(() => vi.restoreAllMocks())

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

describe('parseErrorDetail', () => {
  it('reads a string detail', () => {
    expect(parseErrorDetail({ detail: 'Website not found' }, 404).message).toBe('Website not found')
  })

  it('maps FastAPI validation items to fields', () => {
    const body = {
      detail: [
        { loc: ['body', 'url'], msg: 'Input should be a valid URL', type: 'url_parsing' },
        { loc: ['body', 'check_interval_seconds'], msg: 'Input should be greater than or equal to 15' },
      ],
    }
    const { message, fieldErrors } = parseErrorDetail(body, 422)
    expect(fieldErrors.url).toBe('Input should be a valid URL')
    expect(fieldErrors.check_interval_seconds).toMatch(/greater than or equal to 15/)
    expect(message).toContain('url: Input should be a valid URL')
  })

  it('falls back when there is no detail', () => {
    expect(parseErrorDetail(null, 500).message).toBe('Request failed with status 500.')
  })
})

describe('request', () => {
  it('returns parsed JSON and prefixes the base URL', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(json({ status: 'healthy', database: 'connected' }))
    await expect(api.health()).resolves.toEqual({ status: 'healthy', database: 'connected' })
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/health')
  })

  it('throws ApiError with status and detail on HTTP errors', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(json({ detail: 'Website not found' }, 404))
    const error = await api.getWebsite(9).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).status).toBe(404)
    expect((error as ApiError).message).toBe('Website not found')
    expect((error as ApiError).isNotFound).toBe(true)
  })

  it('reports network failures plainly', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'))
    const error = (await request('/health').catch((e: unknown) => e)) as ApiError
    expect(error.kind).toBe('network')
  })

  it('treats an empty 502 from the proxy as the backend being down', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 502 }))
    const error = (await request('/health').catch((e: unknown) => e)) as ApiError
    expect(error.status).toBe(502)
    expect(error.message).toMatch(/could not reach the backend/)
  })

  it('reports aborts distinctly', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
        }),
    )
    const controller = new AbortController()
    const pending = request('/health', { signal: controller.signal }).catch((e: unknown) => e)
    controller.abort()
    expect(((await pending) as ApiError).kind).toBe('aborted')
  })

  it('times out', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
        }),
    )
    const error = (await request('/health', { timeoutMs: 10 }).catch((e: unknown) => e)) as ApiError
    expect(error.kind).toBe('timeout')
  })
})

describe('api query clamping', () => {
  it('keeps hours and limits inside the backend bounds', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(() => Promise.resolve(json({})))
    await api.getUptime(9999)
    await api.getResponseTimes(0, 9999)
    await api.getChecks(1, 500)
    expect(fetchMock.mock.calls.map((c) => c[0])).toEqual([
      '/api/stats/uptime?hours=720',
      '/api/stats/response-times?hours=1&limit=500',
      '/api/websites/1/checks?limit=100',
    ])
  })

  it('posts the exact create payload to the trailing-slash route', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(json({ id: 1 }, 201))
    await api.createWebsite({ name: 'A', url: 'https://a.test', check_interval_seconds: 60 })
    const [url, init] = fetchMock.mock.calls[0] ?? []
    expect(url).toBe('/api/websites/')
    expect(init?.method).toBe('POST')
    expect(JSON.parse(String(init?.body))).toEqual({ name: 'A', url: 'https://a.test', check_interval_seconds: 60 })
  })
})
