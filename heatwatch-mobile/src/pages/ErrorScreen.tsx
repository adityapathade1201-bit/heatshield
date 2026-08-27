import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, RefreshCw, Globe, ChevronLeft, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ErrorScreenProps {
  onRetry?: () => Promise<void> | void;
  message?: string;
}

export function ErrorScreen({ onRetry, message }: ErrorScreenProps) {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);
  const [checkStatus, setCheckStatus] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      if (onRetry) {
        await onRetry();
      }
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Retry failed:', err);
    } finally {
      setRetrying(false);
    }
  };

  const handleCheckConnection = async () => {
    setChecking(true);
    setCheckStatus(null);
    try {
      if (onRetry) {
        await onRetry();
        navigate('/', { replace: true });
        return;
      }
      navigate('/', { replace: true });
    } finally {
      setChecking(false);
      setCheckStatus(navigator.onLine ? 'Connection check requested. Reloading weather data...' : 'No internet connection detected on your device.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 p-6 sm:p-8">
      <header className="flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)} 
          aria-label="Go back"
          className="p-2 text-slate-400 hover:text-slate-900 transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-slate-900">Connection Interrupted</h1>
        <button 
          onClick={handleRetry} 
          disabled={retrying}
          aria-label="Retry loading data"
          className="ml-auto p-2 text-slate-400 hover:text-blue-600 disabled:opacity-50 transition-colors"
        >
          <RefreshCw size={20} className={retrying ? 'animate-spin' : ''} />
        </button>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center space-y-8 max-w-sm mx-auto text-center py-6">
        <motion.button
          type="button"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleRetry}
          disabled={retrying}
          className="relative w-28 h-28 bg-white rounded-full shadow-lg shadow-orange-500/10 flex items-center justify-center cursor-pointer focus:outline-none"
          aria-label="Tap to retry connection"
        >
          <div className="absolute inset-0 bg-orange-50 rounded-full scale-110 opacity-60" />
          <AlertCircle size={56} className="text-orange-500 z-10" />
        </motion.button>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Connection Interrupted</h2>
          <p className="text-slate-500 text-sm font-medium leading-relaxed">
            {message || 'Unable to load weather data. Please check your connection.'}
          </p>
        </div>

        <div className="w-full space-y-3 text-left">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-3">
            <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Possible reasons</p>
            <ul className="space-y-2.5">
              <li className="flex items-center gap-3 text-slate-600 text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                No internet connection
              </li>
              <li className="flex items-center gap-3 text-slate-600 text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                Server temporarily unavailable or loading
              </li>
              <li className="flex items-center gap-3 text-slate-600 text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                Slow or unstable network
              </li>
            </ul>
          </div>

          {checkStatus && (
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700 flex items-start gap-2">
              <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
              <span>{checkStatus}</span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3 pb-6 max-w-sm mx-auto w-full">
        <button
          onClick={handleRetry}
          disabled={retrying}
          className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-semibold text-base shadow-md shadow-blue-600/10 flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
        >
          <RefreshCw size={18} className={retrying ? 'animate-spin' : ''} />
          {retrying ? 'Reconnecting...' : 'Retry Connection'}
        </button>
        <button
          onClick={handleCheckConnection}
          disabled={checking}
          className="w-full py-3.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-xl font-semibold text-base flex items-center justify-center gap-2 transition-colors"
        >
          <Globe size={18} className="text-slate-400" />
          {checking ? 'Checking Status...' : 'Check Connection'}
        </button>
      </div>
    </div>
  );
}