import { Info, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import type { RiskLevel } from '../types';

interface HeatRiskCardProps {
  score: number;
  level: RiskLevel;
  location: string;
  temp: number;
  feelsLike: number;
}

const levelColors: Record<RiskLevel, string> = {
  low: 'text-green-500 bg-green-500',
  moderate: 'text-orange-500 bg-orange-500',
  high: 'text-orange-600 bg-orange-600',
  severe: 'text-red-600 bg-red-600',
  extreme: 'text-purple-600 bg-purple-600',
};

const levelText: Record<RiskLevel, string> = {
  low: 'Low Risk',
  moderate: 'Moderate Risk',
  high: 'High Risk',
  severe: 'Severe Risk',
  extreme: 'Extreme Risk',
};

const levelRecommendation: Record<RiskLevel, string> = {
  low: 'Take normal precautions.',
  moderate: 'Limit prolonged outdoor activity.',
  high: 'Avoid peak heat exposure.',
  severe: 'Stay hydrated and avoid direct sun.',
  extreme: 'Stay indoors in a cool place.',
};

export function HeatRiskCard({ score, level, location, temp, feelsLike }: HeatRiskCardProps) {
  const colorClass = levelColors[level] || 'text-blue-500 bg-blue-500';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-[32px] p-6 shadow-[0_8px_40px_rgba(0,0,0,0.04)] border border-slate-100 space-y-6"
    >
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <p className="text-blue-600 text-[10px] font-bold uppercase tracking-widest">Today's Heat Status</p>
          <div className="flex items-center gap-1">
            <MapPin size={12} className="text-slate-400" />
            <h3 className="text-slate-900 font-bold tracking-tight">{location}</h3>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="p-2 bg-slate-50 rounded-xl text-slate-400">
            <Info size={16} />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-baseline gap-1">
            <span className="text-6xl font-black text-slate-900 tracking-tighter">{score}</span>
            <span className="text-slate-400 font-bold text-sm">/100</span>
          </div>
          <div className="flex flex-col">
            <span className={colorClass.split(' ')[0] + " font-black text-lg leading-none"}>
              {levelText[level]}
            </span>
            <span className="text-slate-500 text-xs font-medium mt-1">
              {levelRecommendation[level]}
            </span>
          </div>
        </div>

        <div className="relative w-32 h-32 flex flex-col items-center justify-center">
            <div className={`absolute inset-0 ${colorClass.split(' ')[1]} opacity-10 rounded-full animate-pulse-slow`} />
            <div className="relative z-10 flex flex-col items-center">
               <span className="text-3xl font-black text-slate-900 leading-none">{Math.round(temp)}°C</span>
               <span className="text-slate-400 text-[10px] font-bold mt-1">FEELS LIKE {Math.round(feelsLike)}°C</span>
            </div>
            {/* Simple sun illustration could go here */}
            <div className="absolute top-1 right-1">
               <div className="w-8 h-8 bg-yellow-400 rounded-full shadow-[0_0_20px_rgba(250,204,21,0.5)]" />
            </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-50">
         <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Shivajinagar, Pune • Updated 7:30 PM</span>
      </div>
    </motion.div>
  );
}
