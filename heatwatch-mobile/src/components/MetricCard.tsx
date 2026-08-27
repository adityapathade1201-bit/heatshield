import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  unit?: string;
  description?: string;
  color?: string;
  className?: string;
}

export function MetricCard({ icon: Icon, label, value, unit, description, color, className }: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx(
        "bg-white rounded-[28px] p-5 flex flex-col justify-between aspect-square shadow-sm border border-slate-50",
        className
      )}
    >
      <div className="flex justify-between items-start">
        <div className="p-2.5 rounded-xl bg-slate-50">
          <Icon size={20} className={color || "text-slate-400"} />
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{label}</p>
        <div className="flex items-baseline gap-1">
          <p className="text-2xl font-black text-slate-900 tracking-tight">{value}</p>
          {unit && <span className="text-slate-400 text-xs font-bold uppercase">{unit}</span>}
        </div>
        {description && (
          <p className="text-slate-500 text-[10px] font-medium leading-tight">{description}</p>
        )}
      </div>
    </motion.div>
  );
}
