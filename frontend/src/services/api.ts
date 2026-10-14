import { limits } from '@/config'
import type {
  CheckResult,
  DeleteResponse,
  HealthResponse,
  Incident,
  StatsOverview,
  StatsResponseTimes,
  StatsUptime,
  Website,
  WebsiteCreatePayload,
} from '@/types/api'
import { request } from './http'

type Opts = { signal?: AbortSignal }

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Math.trunc(value)))

// NOTE: list/create use a trailing slash because the backend declares them as
// "/websites/". Without it FastAPI answers with a redirect.

export const api = {
  health: (o?: Opts) => request<HealthResponse>('/health', o),

  listWebsites: (o?: Opts) => request<Website[]>('/websites/', o),
  createWebsite: (payload: WebsiteCreatePayload, o?: Opts) =>
    request<Website>('/websites/', { method: 'POST', body: payload, ...o }),
  getWebsite: (id: number, o?: Opts) => request<Website>(`/websites/${id}`, o),
  deleteWebsite: (id: number, o?: Opts) =>
    request<DeleteResponse>(`/websites/${id}`, { method: 'DELETE', ...o }),

  /** Runs a check synchronously; the backend can take up to ~10s to answer. */
  runCheck: (id: number, o?: Opts) =>
    request<CheckResult>(`/websites/${id}/check`, { method: 'POST', timeoutMs: 30_000, ...o }),
  getChecks: (id: number, limit = 20, o?: Opts) =>
    request<CheckResult[]>(
      `/websites/${id}/checks?limit=${clamp(limit, 1, limits.checkHistoryLimitMax)}`,
      o,
    ),
  getIncidents: (id: number, o?: Opts) => request<Incident[]>(`/websites/${id}/incidents`, o),

  getOverview: (o?: Opts) => request<StatsOverview>('/stats/overview', o),
  getUptime: (hours = 24, o?: Opts) =>
    request<StatsUptime>(
      `/stats/uptime?hours=${clamp(hours, limits.statsHoursMin, limits.statsHoursMax)}`,
      o,
    ),
  getResponseTimes: (hours = 24, limit = 100, o?: Opts) =>
    request<StatsResponseTimes>(
      `/stats/response-times?hours=${clamp(hours, limits.statsHoursMin, limits.statsHoursMax)}&limit=${clamp(limit, 1, limits.responseTimesLimitMax)}`,
      o,
    ),
}
