import { useState, useEffect } from 'react';
import { weatherService, riskService } from '../services/api.ts';
import { defaultRisk, defaultWeather, type WeatherResponse, type RiskResponse } from '../types';

function normalizeWeather(value: WeatherResponse): WeatherResponse {
  return {
    ...defaultWeather,
    ...value,
    conditions: {
      ...defaultWeather.conditions,
      ...(value?.conditions ?? {}),
    },
    air_quality: {
      ...defaultWeather.air_quality,
      ...(value?.air_quality ?? {}),
    },
    hourly: {
      ...defaultWeather.hourly,
      ...(value?.hourly ?? {}),
      time: value?.hourly?.time ?? defaultWeather.hourly.time,
      temperature_c: value?.hourly?.temperature_c ?? defaultWeather.hourly.temperature_c,
      apparent_temperature_c: value?.hourly?.apparent_temperature_c ?? defaultWeather.hourly.apparent_temperature_c,
      relative_humidity_percent: value?.hourly?.relative_humidity_percent ?? defaultWeather.hourly.relative_humidity_percent,
    },
    daily: {
      ...defaultWeather.daily,
      ...(value?.daily ?? {}),
      time: value?.daily?.time ?? defaultWeather.daily.time,
      temperature_max_c: value?.daily?.temperature_max_c ?? defaultWeather.daily.temperature_max_c,
      temperature_min_c: value?.daily?.temperature_min_c ?? defaultWeather.daily.temperature_min_c,
      sunrise: value?.daily?.sunrise ?? defaultWeather.daily.sunrise,
      sunset: value?.daily?.sunset ?? defaultWeather.daily.sunset,
    },
  };
}

export function useHomeData() {
  const [weather, setWeather] = useState<WeatherResponse>(defaultWeather);
  const [risk, setRisk] = useState<RiskResponse>(defaultRisk);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [weatherData, riskData] = await Promise.all([
        weatherService.getCurrentWeather(),
        riskService.getRiskSummary(),
      ]);
      setWeather(normalizeWeather(weatherData));
      setRisk(riskData ?? defaultRisk);
      setError(null);
    } catch (err) {
      console.error('Error fetching home data:', err);
      setWeather(defaultWeather);
      setRisk(defaultRisk);
      setError('Unable to load live weather data. Showing safe fallback data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
    const interval = setInterval(() => void fetchData(), 300000);
    return () => clearInterval(interval);
  }, []);

  return { weather, risk, loading, error, refresh: fetchData };
}
