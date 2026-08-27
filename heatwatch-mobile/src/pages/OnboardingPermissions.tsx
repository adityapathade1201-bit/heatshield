import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext.tsx';
import { MapPin, Bell, ChevronRight, Check } from 'lucide-react';
import { Geolocation } from '@capacitor/geolocation';
import { LocalNotifications } from '@capacitor/local-notifications';

export function OnboardingPermissions() {
  const { completeOnboarding } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleLocation = async () => {
    setLoading(true);
    try {
      await Geolocation.requestPermissions();
      setStep(2);
    } catch (err) {
      console.error('Location error:', err);
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  const handleNotifications = async () => {
    setLoading(true);
    try {
      await LocalNotifications.requestPermissions();
      completeOnboarding();
    } catch (err) {
      console.error('Notification error:', err);
      completeOnboarding();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-between p-8 bg-slate-50 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-slate-200">
        <motion.div
          className="h-full bg-blue-600"
          initial={{ width: '0%' }}
          animate={{ width: step === 1 ? '50%' : '100%' }}
        />
      </div>

      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div
            key="location"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center space-y-12 w-full max-w-sm"
          >
            <div className="w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center relative">
               <div className="absolute inset-0 bg-blue-50 rounded-3xl animate-pulse" />
               <MapPin size={48} className="text-blue-600 z-10" />
            </div>

            <div className="space-y-4 text-center">
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Location Access</h2>
              <p className="text-slate-500 font-medium">
                We use your location to provide local heat conditions, nearby alerts, and location-specific recommendations.
              </p>
            </div>

            <div className="w-full space-y-3 pt-8">
              <div className="flex items-center gap-3 text-slate-600 text-sm font-medium px-4">
                <Check size={16} className="text-blue-600" />
                <span>Local heat conditions</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600 text-sm font-medium px-4">
                <Check size={16} className="text-blue-600" />
                <span>Nearby heat alerts</span>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="notifications"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center space-y-12 w-full max-w-sm"
          >
            <div className="w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center relative">
               <div className="absolute inset-0 bg-orange-50 rounded-3xl animate-pulse" />
               <Bell size={48} className="text-orange-500 z-10" />
            </div>

            <div className="space-y-4 text-center">
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Stay Warned</h2>
              <p className="text-slate-500 font-medium">
                Allow notifications to receive important heat-health warnings and real-time alerts.
              </p>
            </div>

            <div className="w-full space-y-3 pt-8">
              <div className="flex items-center gap-3 text-slate-600 text-sm font-medium px-4">
                <Check size={16} className="text-orange-500" />
                <span>Critical heat warnings</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600 text-sm font-medium px-4">
                <Check size={16} className="text-orange-500" />
                <span>Daily safety tips</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full space-y-4 z-10 pt-8">
        <button
          disabled={loading}
          onClick={step === 1 ? handleLocation : handleNotifications}
          className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
        >
          {loading ? 'Requesting...' : step === 1 ? 'Allow Location' : 'Enable Notifications'}
          <ChevronRight size={20} />
        </button>
        <button
          disabled={loading}
          onClick={step === 1 ? () => setStep(2) : completeOnboarding}
          className="w-full py-4 bg-transparent text-slate-400 rounded-2xl font-bold text-lg hover:text-slate-600 transition-colors"
        >
          Not Now
        </button>
      </div>
    </div>
  );
}
