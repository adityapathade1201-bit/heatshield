import { useState, useEffect } from 'react';
import { alertService } from '../services/api';
import type { HeatAlert } from '../types';

export function useAlerts() {
  const [alerts, setAlerts] = useState<HeatAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const data = await alertService.getAlerts();
      setAlerts(data.alerts);
      setError(null);
    } catch (err) {
      console.error('Error fetching alerts:', err);
      setError('Unable to load alerts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  return { alerts, loading, error, refresh: fetchAlerts };
}
