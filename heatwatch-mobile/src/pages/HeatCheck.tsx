import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, CheckCircle2, Thermometer, Umbrella, Droplets, Home as HomeIcon, RefreshCw } from 'lucide-react';
import { observationService } from '../services/api.ts';
import type { ObservationPayload } from '../types';
import { clsx } from 'clsx';

const steps = [
  {
    id: 'feeling',
    question: 'How does this area feel right now?',
    options: [
      { label: 'Comfortable', value: 'Comfortable', icon: '😊' },
      { label: 'Warm', value: 'Warm', icon: '☀️' },
      { label: 'Hot', value: 'Hot', icon: '🔥' },
      { label: 'Very Hot', value: 'Very Hot', icon: '🥵' },
      { label: 'Extremely Hot', value: 'Extremely Hot', icon: '🌋' },
    ],
    icon: Thermometer,
  },
  {
    id: 'shade_available',
    question: 'Is there shade available here?',
    options: [
      { label: 'Yes', value: 'Yes', icon: '🌳' },
      { label: 'Partially', value: 'Partially', icon: '🌤️' },
      { label: 'No', value: 'No', icon: '🏜️' },
    ],
    icon: Umbrella,
  },
  {
    id: 'water_available',
    question: 'Is there drinking water available nearby?',
    options: [
      { label: 'Yes', value: 'Yes', icon: '💧' },
      { label: 'No', value: 'No', icon: '❌' },
      { label: "Don't know", value: "Don't know", icon: '❓' },
    ],
    icon: Droplets,
  },
  {
    id: 'cooling_location',
    question: 'Is there a cooling location (AC/Fans) available?',
    options: [
      { label: 'Yes', value: 'Yes', icon: '❄️' },
      { label: 'No', value: 'No', icon: '❌' },
      { label: "Don't know", value: "Don't know", icon: '❓' },
    ],
    icon: HomeIcon,
  },
];

export function HeatCheck() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Partial<ObservationPayload>>({
    location_ward: 'Pune', // Default
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const navigate = useNavigate();

  const handleSelect = (value: string) => {
    const stepId = steps[currentStep].id;
    setFormData(prev => ({ ...prev, [stepId]: value }));

    if (currentStep < steps.length - 1) {
      setTimeout(() => setCurrentStep(prev => prev + 1), 300);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await observationService.submitObservation(formData as ObservationPayload);
      setShowSuccessModal(true);
      setIsSuccess(true);
    } catch (err) {
      console.error('Submission failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess || showSuccessModal) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6">
       <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl p-8 max-w-sm w-full text-center space-y-5 shadow-2xl">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-32 h-32 bg-green-500 rounded-[40px] flex items-center justify-center shadow-2xl shadow-green-500/20"
        >
          <CheckCircle2 size={64} className="text-white" />
        </motion.div>
        <div className="space-y-3">
           <h2 className="text-2xl font-black text-slate-900 tracking-tight">Observation Submitted Successfully!</h2>
          <p className="text-slate-500 font-medium max-w-[260px] mx-auto">
             Aapka response Pune Heat Action Plan me successfully record ho chuka hai. Thank you for helping your community stay safe!
          </p>
        </div>
        <button
          onClick={() => {
            setIsSuccess(false);
            setShowSuccessModal(false);
            setCurrentStep(0);
            setFormData({ location_ward: 'Pune' });
            navigate('/');
          }}
          className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-xl shadow-blue-600/10 transition-all active:scale-95"
        >
          Return to Home
        </button>
        <button onClick={() => { setIsSuccess(false); setShowSuccessModal(false); setCurrentStep(0); navigate('/alerts'); }} className="w-full py-3 text-blue-600 font-bold">View Live Alerts</button>
       </motion.div>
      </div>
    );
  }

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="space-y-10">
      <header className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
            className={clsx(
              "p-2.5 bg-white shadow-sm rounded-2xl text-slate-400 hover:text-slate-900 transition-all",
              currentStep === 0 && "opacity-0 pointer-events-none"
            )}
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex flex-col items-center">
            <span className="text-xl font-black text-slate-900 tracking-tight">Heat Check</span>
            <span className="text-blue-600 text-[10px] font-black uppercase tracking-[4px]">
              STEP {currentStep + 1} OF {steps.length}
            </span>
          </div>
          <button className="p-2.5 bg-white shadow-sm rounded-2xl text-slate-400 hover:text-blue-600">
             <RefreshCw size={20} />
          </button>
        </div>

        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mx-4">
          <motion.div
            className="h-full bg-blue-600"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </header>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-10"
        >
          <div className="text-center">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">{step.question}</h2>
          </div>

          <div className="grid gap-4 px-2 md:grid-cols-2 lg:grid-cols-3">
            {step.options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={clsx(
                  "flex items-center gap-5 p-5 rounded-[28px] transition-all duration-300 border-2",
                  formData[step.id as keyof ObservationPayload] === option.value
                    ? "bg-blue-50 border-blue-600 scale-[1.02] shadow-xl shadow-blue-900/5"
                    : "bg-white border-transparent text-slate-900 hover:border-slate-100 hover:shadow-lg hover:shadow-slate-200/50 shadow-sm"
                )}
              >
                <div className={clsx(
                   "w-12 h-12 rounded-2xl flex items-center justify-center text-2xl",
                   formData[step.id as keyof ObservationPayload] === option.value ? "bg-white" : "bg-slate-50"
                )}>
                   {option.icon}
                </div>
                <span className={clsx(
                   "font-black tracking-tight text-lg",
                   formData[step.id as keyof ObservationPayload] === option.value ? "text-blue-600" : "text-slate-900"
                )}>{option.label}</span>
                {formData[step.id as keyof ObservationPayload] === option.value && (
                  <CheckCircle2 size={24} className="ml-auto text-blue-600" />
                )}
              </button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {currentStep === steps.length - 1 && formData[step.id as keyof ObservationPayload] && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-6"
        >
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full py-5 bg-blue-600 text-white rounded-[28px] font-black text-xl shadow-2xl shadow-blue-600/20 flex items-center justify-center gap-3 transition-all active:scale-95"
          >
            {isSubmitting ? (
              <RefreshCw className="animate-spin" size={24} />
            ) : (
              <>
                Submit Observation
                <ChevronRight size={24} />
              </>
            )}
          </button>
        </motion.div>
      )}
    </div>
  );
}
