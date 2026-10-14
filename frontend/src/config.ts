/** Centralised runtime configuration. Nothing else reads import.meta.env. */

const rawBase = import.meta.env.VITE_API_BASE_URL ?? '/api'

export const config = {
  /** Base URL for every API call, with no trailing slash. */
  apiBaseUrl: rawBase.replace(/\/+$/, ''),
  /** Per-request timeout. The backend's own check timeout is 10s. */
  requestTimeoutMs: 20_000,
  /** How often monitoring data refreshes while the tab is visible. */
  autoRefreshMs: 30_000,
  /** How often the /health indicator polls. */
  healthPollMs: 15_000,
  /** Max concurrent per-website requests (history, incidents). */
  fetchConcurrency: 6,
  /** How many recent checks to fetch per website for the heartbeat strip. */
  heartbeatChecks: 30,
} as const

/** Limits mirrored from backend/app/schemas.py and routers/stats.py. */
export const limits = {
  nameMaxLength: 100,
  intervalMin: 15,
  intervalMax: 3600,
  intervalDefault: 60,
  statsHoursMin: 1,
  statsHoursMax: 720,
  responseTimesLimitMax: 500,
  checkHistoryLimitMax: 100,
} as const
