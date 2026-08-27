import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { MapPin, Bell, Shield, ArrowRight, UserPlus, LogIn, CloudSun } from 'lucide-react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Geolocation } from '@capacitor/geolocation';

export function Onboarding() {
  const [step, setStep] = useState(1);
  const { signIn, setPermission, completeOnboarding } = useAuth();

  const nextStep = () => setStep(s => s + 1);

  const handleSignIn = () => {
    console.log('Onboarding: Sign In button pressed');
    signIn();
    nextStep();
  };

  const handleLocation = async () => {
    console.log('Onboarding: Location permission request started');
    try {
      const status = await Geolocation.requestPermissions();
      console.log('Onboarding: Location permission result:', status.location);
      setPermission('location', status.location === 'granted' ? 'granted' : 'denied');
    } catch (error) {
      console.error('Onboarding: Location permission error:', error);
      setPermission('location', 'denied');
    }
    nextStep();
  };

  const handleNotifications = async () => {
    console.log('Onboarding: Notification permission request started');
    try {
      const status = await LocalNotifications.requestPermissions();
      console.log('Onboarding: Notification permission result:', status.display);
      setPermission('notification', status.display === 'granted' ? 'granted' : 'denied');
    } catch (error) {
      console.error('Onboarding: Notification permission error:', error);
      setPermission('notification', 'denied');
    }
    console.log('Onboarding: Completing onboarding flow');
    completeOnboarding();
  };

  const containerVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-slate-800 relative z-10">
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            variants={containerVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex flex-col items-center text-center space-y-8"
          >
            <div className="w-24 h-24 bg-municipal-blue rounded-3xl flex items-center justify-center shadow-2xl shadow-municipal-blue/20">
              <CloudSun size={48} className="text-white" />
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tight text-municipal-blue">HeatWatch</h1>
              <p className="text-xl text-slate-500 font-medium">Pune's Heat Health Companion</p>
              <p className="text-slate-400">Stay informed. Stay safe.</p>
            </div>
            <div className="flex flex-col w-full gap-4 pt-8">
              <button
                onClick={nextStep}
                className="w-full py-4 bg-municipal-blue text-white rounded-2xl font-bold text-lg shadow-xl shadow-municipal-blue/20 flex items-center justify-center gap-2"
              >
                Get Started <ArrowRight size={20} />
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            variants={containerVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex flex-col items-center text-center space-y-8 w-full max-w-sm"
          >
             <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center">
              <Shield size={40} className="text-municipal-blue" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-800">Secure Access</h2>
              <p className="text-slate-500">Sign in to your HeatWatch account</p>
            </div>
            <div className="w-full space-y-4">
              <button
                onClick={handleSignIn}
                className="w-full py-4 bg-municipal-blue text-white rounded-2xl font-bold flex items-center justify-center gap-3"
              >
                <LogIn size={20} /> Sign In
              </button>
              <button
                onClick={handleSignIn}
                className="w-full py-4 bg-white border-2 border-slate-100 text-slate-600 rounded-2xl font-bold flex items-center justify-center gap-3"
              >
                <UserPlus size={20} /> Create Account
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            variants={containerVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex flex-col items-center text-center space-y-8"
          >
            <div className="w-20 h-20 bg-sky-50 rounded-full flex items-center justify-center">
              <MapPin size={40} className="text-municipal-sky" />
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-800">Location Access</h2>
              <p className="text-slate-500">
                HeatWatch uses your location to provide local heat and weather conditions for your specific ward.
              </p>
            </div>
            <div className="flex flex-col w-full gap-4">
              <button
                onClick={handleLocation}
                className="w-full py-4 bg-municipal-blue text-white rounded-2xl font-bold shadow-lg"
              >
                Allow Location
              </button>
              <button onClick={nextStep} className="text-slate-400 font-medium py-2">
                Maybe later
              </button>
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div
            key="step4"
            variants={containerVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex flex-col items-center text-center space-y-8"
          >
            <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center">
              <Bell size={40} className="text-heat-high" />
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-800">Stay Warned</h2>
              <p className="text-slate-500">
                Allow notifications to receive important heat-health warnings and real-time alerts.
              </p>
            </div>
            <div className="flex flex-col w-full gap-4">
              <button
                onClick={handleNotifications}
                className="w-full py-4 bg-municipal-blue text-white rounded-2xl font-bold shadow-lg"
              >
                Enable Notifications
              </button>
              <button onClick={completeOnboarding} className="text-slate-400 font-medium py-2">
                Not now
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
