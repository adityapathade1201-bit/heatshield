import { useState, useEffect } from 'react';

interface AuthState {
  isAuthenticated: boolean;
  onboardingComplete: boolean;
  locationPermission: 'granted' | 'denied' | 'prompt';
  notificationPermission: 'granted' | 'denied' | 'prompt';
}

const STORAGE_KEY = 'heatwatch_auth_state';

export function useAuth() {
  const [state, setState] = useState<AuthState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {
      isAuthenticated: false,
      onboardingComplete: false,
      locationPermission: 'prompt',
      notificationPermission: 'prompt',
    };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const signIn = () => {
    setState(prev => ({ ...prev, isAuthenticated: true }));
  };

  const signOut = () => {
    setState({
      isAuthenticated: false,
      onboardingComplete: false,
      locationPermission: 'prompt',
      notificationPermission: 'prompt',
    });
    localStorage.removeItem(STORAGE_KEY);
  };

  const completeOnboarding = () => {
    setState(prev => ({ ...prev, onboardingComplete: true }));
  };

  const setPermission = (type: 'location' | 'notification', status: 'granted' | 'denied') => {
    setState(prev => ({
      ...prev,
      [`${type}Permission`]: status
    }));
  };

  return {
    ...state,
    signIn,
    signOut,
    completeOnboarding,
    setPermission
  };
}
