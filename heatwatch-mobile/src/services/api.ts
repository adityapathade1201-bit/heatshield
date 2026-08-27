import axios from 'axios';
import type {
  RiskResponse,
  AlertsResponse,
  ObservationPayload,
  ObservationResponse
} from '../types';
import type { AirQuality, DailyWeather, HourlyWeather } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001';
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const mockRisk: RiskResponse = {
  location: 'Pune',
  assessed_at: new Date().toISOString(),
  level: 'moderate',
  score: 52,
  drivers: [],
};

const mockAlerts: AlertsResponse = { alerts: [], active_count: 0 };

async function withFallback<T>(request: () => Promise<{ data: T }>, fallback: T): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return (await request()).data;
    } catch (error) {
      lastError = error;
      if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
  console.warn('HeatWatch API unavailable; using local fallback data.', lastError);
  return fallback;
}

export const weatherService = {
  getCurrentWeather: async (location = 'Pune') => {
    const [weatherResponse, airQualityResponse] = await Promise.all([
      axios.get<OpenMeteoWeatherResponse>('https://api.open-meteo.com/v1/forecast', {
        params: {
          latitude: 18.5204,
          longitude: 73.8567,
          current: 'temperature_2m,relative_humidity_2m,apparent_temperature,surface_pressure,wind_speed_10m,wind_direction_10m,uv_index,visibility',
          hourly: 'temperature_2m,relative_humidity_2m,apparent_temperature,direct_normal_irradiance',
          daily: 'temperature_2m_max,temperature_2m_min,sunrise,sunset',
          timezone: 'Asia/Kolkata',
        },
        timeout: 10000,
      }),
      axios.get<OpenMeteoAirQualityResponse>('https://air-quality-api.open-meteo.com/v1/air-quality', {
        params: {
          latitude: 18.5204,
          longitude: 73.8567,
          current: 'pm10,pm2_5,carbon_monoxide,sulphur_dioxide,european_aqi',
          timezone: 'Asia/Kolkata',
        },
        timeout: 10000,
      }),
    ]);
    const current = weatherResponse.data.current;
    const air = airQualityResponse.data.current;
    const hourly = weatherResponse.data.hourly;
    const daily = weatherResponse.data.daily;
    const normalizedHourly: HourlyWeather = {
      time: hourly.time,
      temperature_c: hourly.temperature_2m,
      apparent_temperature_c: hourly.apparent_temperature,
      relative_humidity_percent: hourly.relative_humidity_2m,
    };
    const normalizedDaily: DailyWeather = {
      time: daily.time,
      temperature_max_c: daily.temperature_2m_max,
      temperature_min_c: daily.temperature_2m_min,
      sunrise: daily.sunrise,
      sunset: daily.sunset,
    };
    const quality: AirQuality = {
      european_aqi: air.european_aqi,
      pm2_5: air.pm2_5,
      pm10: air.pm10,
      sulphur_dioxide: air.sulphur_dioxide,
      carbon_monoxide: air.carbon_monoxide,
    };
    return {
      location,
      observed_at: current.time,
      conditions: {
        temperature_c: current.temperature_2m,
        apparent_temperature_c: current.apparent_temperature,
        humidity_percent: current.relative_humidity_2m,
        wind_speed_kph: current.wind_speed_10m,
        surface_pressure_hpa: current.surface_pressure,
        uv_index: current.uv_index,
        condition: weatherDescription(current.weather_code),
        weather_code: current.weather_code,
      },
      wind_direction_deg: current.wind_direction_10m,
      visibility_km: Number((current.visibility / 1000).toFixed(1)),
      air_quality: quality,
      hourly: normalizedHourly,
      daily: normalizedDaily,
      source: 'open-meteo',
    };
  },
};

interface OpenMeteoWeatherResponse {
  current: { time: string; temperature_2m: number; relative_humidity_2m: number; apparent_temperature: number; surface_pressure: number; wind_speed_10m: number; wind_direction_10m: number; uv_index: number; visibility: number; weather_code: number };
  hourly: { time: string[]; temperature_2m: number[]; relative_humidity_2m: number[]; apparent_temperature: number[]; direct_normal_irradiance: number[] };
  daily: { time: string[]; temperature_2m_max: number[]; temperature_2m_min: number[]; sunrise: string[]; sunset: string[] };
}

interface OpenMeteoAirQualityResponse { current: { pm10: number; pm2_5: number; carbon_monoxide: number; sulphur_dioxide: number; european_aqi: number } }

function weatherDescription(code: number): string {
  if ([0, 1].includes(code)) return 'Clear';
  if ([2, 3].includes(code)) return 'Cloudy';
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return 'Showers';
  if ([95, 96, 99].includes(code)) return 'Thunderstorms';
  return 'Overcast';
}

export const riskService = {
  getRiskSummary: async (location = 'Pune') => {
    return withFallback(() => apiClient.get<RiskResponse>('/api/risk', {
      params: { location },
    }), { ...mockRisk, location });
  },
};

export const alertService = {
  getAlerts: async () => {
    return withFallback(() => apiClient.get<AlertsResponse>('/api/alerts'), mockAlerts);
  },
};

export const observationService = {
  submitObservation: async (payload: ObservationPayload) => {
    const response = await apiClient.post<ObservationResponse>(`/api/observations`, payload);
    return response.data;
  },
};

export default apiClient;
