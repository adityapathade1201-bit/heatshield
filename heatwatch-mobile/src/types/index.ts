export type RiskLevel = 'low' | 'moderate' | 'high' | 'severe' | 'extreme';

export interface WeatherConditions {
  temperature_c: number;
  apparent_temperature_c: number;
  humidity_percent: number;
  wind_speed_kph: number;
  surface_pressure_hpa: number;
  uv_index: number;
  condition: string;
  weather_code: number;
}

export interface WeatherResponse {
  location: string;
  observed_at: string;
  conditions: WeatherConditions;
  source: string;
  wind_direction_deg: number;
  visibility_km: number;
  air_quality: AirQuality;
  hourly: HourlyWeather;
  daily: DailyWeather;
}

export interface AirQuality {
  european_aqi: number;
  pm2_5: number;
  pm10: number;
  sulphur_dioxide: number;
  carbon_monoxide: number;
}

export interface HourlyWeather {
  time: string[];
  temperature_c: number[];
  apparent_temperature_c: number[];
  relative_humidity_percent: number[];
}

export interface DailyWeather {
  time: string[];
  temperature_max_c: number[];
  temperature_min_c: number[];
  sunrise: string[];
  sunset: string[];
}

export const defaultWeather: WeatherResponse = {
  location: 'Pune',
  observed_at: new Date().toISOString(),
  conditions: {
    temperature_c: 24.5,
    apparent_temperature_c: 25,
    humidity_percent: 85,
    surface_pressure_hpa: 1008,
    wind_speed_kph: 10.5,
    uv_index: 1,
    condition: 'Clear',
    weather_code: 0,
  },
  wind_direction_deg: 240,
  visibility_km: 8,
  air_quality: { pm2_5: 35, pm10: 23, sulphur_dioxide: 6, carbon_monoxide: 1, european_aqi: 35 },
  hourly: { time: [], temperature_c: [], apparent_temperature_c: [], relative_humidity_percent: [] },
  daily: { time: [], temperature_max_c: [30, 29, 29, 29, 28], temperature_min_c: [22, 22, 23, 22, 22], sunrise: ['06:21'], sunset: ['18:51'] },
  source: 'safe-default',
};

export interface RiskDriver {
  name: string;
  value: string;
  description: string;
}

export interface PeakHeatWindow {
  time: string;
  formatted_time: string;
  risk_score: number;
  risk_level: RiskLevel;
  temperature_c?: number;
  apparent_temperature_c?: number;
}

export interface RiskResponse {
  location: string;
  assessed_at: string;
  level: RiskLevel;
  score: number;
  drivers: RiskDriver[];
  peak_window?: PeakHeatWindow;
}

export const defaultRisk: RiskResponse = {
  location: 'Pune',
  assessed_at: new Date().toISOString(),
  level: 'moderate',
  score: 52,
  drivers: [],
};

export interface HeatAlert {
  id: string;
  alert_type: string;
  severity: RiskLevel;
  ward: string;
  risk_score: number;
  current_risk_score: number;
  expected_peak_score: number;
  expected_peak_time: string;
  created_at: string;
  status: 'active' | 'acknowledged' | 'resolved';
  recommended_response: string;
}

export interface AlertsResponse {
  alerts: HeatAlert[];
  active_count: number;
}

export interface ObservationPayload {
  location_ward: string;
  feeling: string;
  shade_available: string;
  water_available: string;
  cooling_location: string;
}

export interface ObservationResponse {
  status: string;
  observation_id: string;
}
