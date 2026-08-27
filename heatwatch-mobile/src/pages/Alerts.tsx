import { useState } from 'react';
import { AlertCard } from '../components/AlertCard.tsx';
import { useAlerts } from '../hooks/useAlerts.ts';
import { ShieldCheck, RefreshCw, Search, AlertTriangle, BellRing } from 'lucide-react';
import { motion } from 'framer-motion';

export function Alerts() {
  const { alerts, loading, error, refresh } = useAlerts();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const [simulated, setSimulated] = useState(false);
  const localAlerts = [
    { id: 'local-1', alert_type: 'Yellow Heat Advisory - Hadapsar & Yerawada', severity: 'high' as const, ward: 'Hadapsar & Yerawada', risk_score: 78, current_risk_score: 78, expected_peak_score: 86, expected_peak_time: '14:00', created_at: new Date().toISOString(), status: 'active' as const, recommended_response: 'Limit prolonged outdoor activity.' },
    { id: 'local-2', alert_type: 'PMC Hydration Kiosk Active - Shivajinagar', severity: 'moderate' as const, ward: 'Shivajinagar', risk_score: 52, current_risk_score: 52, expected_peak_score: 60, expected_peak_time: '15:00', created_at: new Date().toISOString(), status: 'active' as const, recommended_response: 'Free drinking water available.' },
  ];

  const visibleAlerts = alerts.length ? alerts : localAlerts;
  const filteredAlerts = visibleAlerts.filter((alert) => {
    if (filter === 'Critical' && !['severe', 'extreme'].includes(alert.severity)) return false;
    if (filter === 'Advisories' && !alert.alert_type.toLowerCase().includes('advisory')) return false;
    if (filter === 'Hydration Points' && !alert.alert_type.toLowerCase().includes('hydration')) return false;
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      alert.alert_type?.toLowerCase().includes(query) ||
      alert.ward?.toLowerCase().includes(query) ||
      alert.recommended_response?.toLowerCase().includes(query) ||
      alert.severity?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6 pb-12">
      <header className="flex justify-between items-center px-1">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Alert Center</h1>
          <p className="text-slate-500 text-xs font-medium">Real-time civic heat advisories</p>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          aria-label="Refresh alerts"
          className="p-2.5 bg-white border border-slate-200/80 shadow-sm rounded-xl text-slate-500 hover:text-blue-600 disabled:opacity-50 transition-colors"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </header>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search alerts by ward or risk level..."
          className="w-full bg-white border border-slate-200/80 rounded-xl py-3 pl-10 pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
        />
      </div>
      <div className="flex flex-wrap gap-2">{['All', 'Critical', 'Advisories', 'Hydration Points'].map(chip => <button key={chip} onClick={() => setFilter(chip)} className={`px-3 py-2 rounded-xl text-xs font-bold ${filter === chip ? 'bg-blue-600 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>{chip}</button>)}<button onClick={() => setSimulated(true)} className="ml-auto px-3 py-2 rounded-xl text-xs font-bold bg-amber-50 text-amber-700 flex items-center gap-2"><BellRing size={14} /> Simulate Live Alert</button></div>
      {simulated && <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold">Live alert simulated. Pune responders have been notified.</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            >
              <RefreshCw size={28} className="text-blue-600" />
            </motion.div>
            <p className="text-slate-500 text-sm font-medium">Checking active alerts...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center bg-white rounded-2xl space-y-4 border border-slate-200/80 shadow-sm">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500">
              <AlertTriangle size={24} />
            </div>
            <div className="space-y-1">
              <p className="text-slate-900 font-semibold text-base">Unable to load alerts</p>
              <p className="text-slate-500 text-xs">Please verify your connection and try again.</p>
            </div>
            <button
              onClick={refresh}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-medium text-sm shadow-sm transition-colors"
            >
              Retry
            </button>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 space-y-3 bg-white border border-slate-200/70 rounded-2xl shadow-sm text-center">
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
              <ShieldCheck size={26} />
            </div>
            <div className="space-y-1 max-w-xs">
              <p className="text-base font-semibold text-slate-900">No active heat alerts</p>
              <p className="text-xs text-slate-500 leading-relaxed">
                You're all caught up. We'll notify you when heat conditions require attention.
              </p>
            </div>
          </div>
        ) : (
          filteredAlerts.map((alert) => <AlertCard key={alert.id} alert={alert} />)
        )}
      </div>
    </div>
  );
}