/** Types mirroring backend/app/schemas.py and routers/stats.py exactly. */

export interface Website {
  id: number
  name: string
  url: string
  check_interval_seconds: number
  is_active: boolean
  created_at: string
}

export interface WebsiteCreatePayload {
  name: string
  url: string
  check_interval_seconds: number
}

export interface CheckResult {
  id: number
  website_id: number
  is_up: boolean
  status_code: number | null
  response_time_ms: number | null
  error_message: string | null
  checked_at: string
}

export type IncidentStatus = 'open' | 'resolved'

export interface Incident {
  id: number
  website_id: number
  started_at: string
  resolved_at: string | null
  /** The backend stores a free string; it writes "open" or "resolved". */
  status: string
  description: string
}

export interface StatsOverview {
  total_websites: number
  websites_up: number
  websites_down: number
  websites_unknown: number
  open_incidents: number
  average_response_time_ms: number | null
}

export interface StatsUptime {
  period_hours: number
  total_checks: number
  successful_checks: number
  failed_checks: number
  uptime_percentage: number | null
}

export interface ResponseTimePoint {
  website_id: number
  website_name: string
  checked_at: string
  response_time_ms: number | null
  is_up: boolean
  status_code: number | null
}

export interface StatsResponseTimes {
  period_hours: number
  /** Newest first. */
  results: ResponseTimePoint[]
}

export interface HealthResponse {
  status: string
  database: string
}

export interface DeleteResponse {
  message: string
}
