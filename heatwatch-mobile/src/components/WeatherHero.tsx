import { motion } from 'framer-motion';

interface WeatherHeroProps {
  temp: number;
  feelsLike: number;
  location: string;
}

export function WeatherHero({ temp, feelsLike, location }: WeatherHeroProps) {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center justify-between px-2"
    >
      <div className="space-y-0.5">
        <h2 className="text-slate-900 text-lg font-black tracking-tight">{location}</h2>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Live Updates</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
         <div className="text-right">
            <p className="text-2xl font-black text-slate-900 leading-none">{Math.round(temp)}°C</p>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-tighter">Feels {Math.round(feelsLike)}°</p>
         </div>
         <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-xl">
            ☀️
         </div>
      </div>
    </motion.section>
  );
}
