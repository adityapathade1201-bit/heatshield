import { AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import type { HeatAlert, RiskLevel } from '../types';
import { clsx } from 'clsx';

interface AlertCardProps {
  alert: HeatAlert;
}

const severityColors: Record<RiskLevel, { text: string, bg: string, border: string }> = {
  low: { text: 'text-green-600', bg: 'bg-green-600', border: 'border-green-100' },
  moderate: { text: 'text-orange-500', bg: 'bg-orange-500', border: 'border-orange-100' },
  high: { text: 'text-orange-600', bg: 'bg-orange-600', border: 'border-orange-200' },
  severe: { text: 'text-red-600', bg: 'bg-red-600', border: 'border-red-200' },
  extreme: { text: 'text-purple-600', bg: 'bg-purple-600', border: 'border-purple-200' },
};

export function AlertCard({ alert }: AlertCardProps) {
  const colors = severityColors[alert.severity] || severityColors.moderate;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx(
        "bg-white rounded-[28px] p-5 shadow-sm border border-slate-50 space-y-4",
        "relative overflow-hidden"
      )}
    >
      <div className="flex justify-between items-start relative z-10">
        <div className="flex gap-4">
           <div className={clsx("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", colors.bg, "bg-opacity-10")}>
              <AlertTriangle size={24} className={colors.text} />
           </div>
           <div className="space-y-1">
              <div className="flex items-center gap-2">
                 <h3 className="text-sm font-black text-slate-900 tracking-tight leading-none uppercase">
                    {alert.severity} Heat Warning
                 </h3>
              </div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                 {alert.ward}, Pune • Today, 12:30 PM
              </p>
           </div>
        </div>
        <div className={clsx("px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest", colors.bg, "text-white")}>
           {alert.severity}
        </div>
      </div>

      <div className="pl-16 space-y-3">
         <p className="text-slate-500 text-xs font-medium leading-relaxed">
            High heat conditions expected between 12:30 PM - 4:30 PM. Avoid prolonged outdoor activity.
         </p>
         <div className="pt-2">
            <span className={clsx("text-[10px] font-black uppercase tracking-widest", colors.text)}>
               Stay hydrated and avoid direct sun exposure.
            </span>
         </div>
      </div>
    </motion.div>
  );
}
