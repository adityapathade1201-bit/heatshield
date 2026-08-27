import type {
  ActionExplanationResponse,
  AIOverviewResponse,
  AlertsResponse,
  ForecastResponse,
  LocationsResponse,
  MunicipalBriefResponse,
  MunicipalResponseSummary,
  PriorityWardItem,
  ResponseActionsResponse,
  RiskResponse,
  ThermalResponse,
  TrendsResponse,
  WardAIAnalysisResponse,
  WeatherResponse,
} from '../types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001'
export const DEFAULT_COORDINATES = { latitude: 18.5204, longitude: 73.8567, location: 'Pune' }

async function get<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`)
  if (!response.ok) throw new Error(`Backend request failed (${response.status})`)
  return response.json() as Promise<T>
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) throw new Error(`Backend request failed (${response.status})`)
  return response.json() as Promise<T>
}

function query(params: Record<string, string | number>) {
  return new URLSearchParams(Object.entries(params).map(([key, value]) => [key, String(value)])).toString()
}

export function getWeather(latitude = DEFAULT_COORDINATES.latitude, longitude = DEFAULT_COORDINATES.longitude, location = DEFAULT_COORDINATES.location) {
  return get<WeatherResponse>(`/api/weather?${query({ latitude, longitude, location })}`)
}

export function getThermal(latitude = DEFAULT_COORDINATES.latitude, longitude = DEFAULT_COORDINATES.longitude, location = DEFAULT_COORDINATES.location) {
  return get<ThermalResponse>(`/api/thermal?${query({ latitude, longitude, location })}`)
}

export function getRisk(location = DEFAULT_COORDINATES.location, latitude?: number, longitude?: number) {
  const params: Record<string, string | number> = { location }
  if (latitude !== undefined && longitude !== undefined) {
    params.latitude = latitude
    params.longitude = longitude
  }
  return get<RiskResponse>(`/api/risk?${query(params)}`)
}

export function getForecast(latitude = DEFAULT_COORDINATES.latitude, longitude = DEFAULT_COORDINATES.longitude, location = DEFAULT_COORDINATES.location) {
  return get<ForecastResponse>(`/api/forecast?${query({ latitude, longitude, location })}`)
}

export function getLocations() { return get<LocationsResponse>('/api/locations') }

export function getTrends(location = DEFAULT_COORDINATES.location, latitude?: number, longitude?: number) {
  const params: Record<string, string | number> = { location }
  if (latitude !== undefined && longitude !== undefined) {
    params.latitude = latitude
    params.longitude = longitude
  }
  return get<TrendsResponse>(`/api/trends?${query(params)}`)
}

export function getAlerts() { return get<AlertsResponse>('/api/alerts') }

export function updateAlertStatus(alertId: string, status: string) {
  return post<{ status: string; alert_id: string; new_status: string }>(`/api/alerts/${alertId}/status`, { status })
}

export function getResponseActions() { return get<ResponseActionsResponse>('/api/response-actions') }

export function updateActionStatus(actionId: string, status: string) {
  return post<{ status: string; action_id: string; new_status: string }>(`/api/response-actions/${actionId}/status`, { status })
}

export function getMunicipalSummary() { return get<MunicipalResponseSummary>('/api/municipal-summary') }

// Phase 7 AI Heat Intelligence Endpoints
export function getAIOverview() { return get<AIOverviewResponse>('/api/ai/overview') }
export function getWardAIAnalysis(ward = 'Shivajinagar') { return get<WardAIAnalysisResponse>(`/api/ai/ward-analysis?${query({ ward })}`) }
export function getAIPriorityRecommendations() { return get<PriorityWardItem[]>('/api/ai/priority-recommendations') }
export function getMunicipalBrief() { return get<MunicipalBriefResponse>('/api/ai/municipal-brief') }
export function getAIActionExplanation(actionId: string) { return get<ActionExplanationResponse>(`/api/ai/explain-action?${query({ action_id: actionId })}`) }

export function submitObservation(observation: {
  location_ward: string;
  feeling: string;
  shade_available: string;
  water_available: string;
  cooling_location: string;
}) {
  return post<{ status: string; observation_id: string }>('/api/observations', observation)
}

