import { useState, useEffect } from 'react';
import { weatherService, riskService } from '../services/api.ts';
import { defaultRisk, defaultWeather, type WeatherResponse, type RiskResponse } from '../types';

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
        riskService.getRiskSummary()
      ]);
      setWeather(weatherData);
      setRisk(riskData);
      setError(null);
    } catch (err) {
      console.error('Error fetching home data:', err);
      setWeather(defaultWeather);
      setRisk(defaultRisk);
      setError('Unable to load weather data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 300000); // Refresh every 5 mins
    return () => clearInterval(interval);
  }, []);

  return { weather, risk, loading, error, refresh: fetchData };
}
