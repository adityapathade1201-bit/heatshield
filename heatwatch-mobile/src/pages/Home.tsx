import { HeatRiskCard } from '../components/HeatRiskCard.tsx';
import { useHomeData } from '../hooks/useHomeData.ts';
import { useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { Droplets, Wind, Sun, Gauge, Thermometer, RefreshCw, ChevronRight, Cloud, MapPin, CloudRain, Navigation, Eye, Sunrise, Sunset } from 'lucide-react';
import { clsx } from 'clsx';
import { defaultRisk, defaultWeather, type WeatherResponse } from '../types';

export function Home() {
  const { weather, risk, refresh } = useHomeData();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const safeWeather: WeatherResponse = weather ?? defaultWeather;
  const safeRisk = risk ?? defaultRisk;
  const currentHour = Math.max(0, safeWeather.hourly.time.findIndex((time) => time >= safeWeather.observed_at));

  return (
    <div className="space-y-8 pb-12">
      <header className="flex justify-between items-center px-1">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span className="text-blue-600">HeatWatch</span>
          </h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{now.toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })} • {now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })} IST</p>
        </div>
        <button onClick={refresh} className="p-2.5 bg-white shadow-sm rounded-2xl text-slate-400 hover:text-blue-600 transition-colors">
          <RefreshCw size={20} />
        </button>
      </header>

      <WeatherHero weather={safeWeather} now={now} />

      <HeatRiskCard
        score={safeRisk.score}
        level={safeRisk.level}
        location={safeWeather.location}
        temp={safeWeather.conditions.temperature_c}
        feelsLike={safeWeather.conditions.apparent_temperature_c}
      />

      <WardHeatMap />

      <PremiumWidgets weather={safeWeather} />

      <section className="space-y-4">
        <div className="flex justify-between items-center px-2">
          <h3 className="text-slate-900 text-sm font-black tracking-tight">Weather Overview</h3>
          <button className="text-blue-600 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
            See More <ChevronRight size={10} />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricSmall icon={Thermometer} label="Temp" value={`${Math.round(weather.conditions.temperature_c)}°`} color="text-orange-500" />
          <MetricSmall icon={Droplets} label="Humidity" value={`${weather.conditions.humidity_percent}%`} color="text-blue-500" />
          <MetricSmall icon={Sun} label="Heat Index" value={`${Math.round(weather.conditions.apparent_temperature_c)}°`} color="text-orange-600" />
          <MetricSmall icon={Sun} label="UV Index" value={Math.round(weather.conditions.uv_index)} color="text-red-500" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
           <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-50 flex flex-col items-center gap-2">
              <Sun size={18} className="text-orange-500" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">UV Index</span>
              <span className="text-lg font-black text-slate-900">{Math.round(weather.conditions.uv_index)}</span>
              <span className="text-[8px] font-bold text-red-500 uppercase">Very High</span>
           </div>
           <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-50 flex flex-col items-center gap-2">
              <Wind size={18} className="text-blue-500" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Wind</span>
              <span className="text-lg font-black text-slate-900">{Math.round(weather.conditions.wind_speed_kph)}</span>
              <span className="text-[8px] font-bold text-slate-400 uppercase">{compassLabel(weather.wind_direction_deg)} • KM/H</span>
           </div>
           <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-50 flex flex-col items-center gap-2">
              <Gauge size={18} className="text-slate-400" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Air Quality</span>
              <span className="text-lg font-black text-slate-900">{Math.round(weather.air_quality.european_aqi)}</span>
              <span className="text-[8px] font-bold text-orange-500 uppercase">Moderate</span>
           </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-slate-900 text-sm font-black tracking-tight px-2">Daily Forecast</h3>
        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-50 overflow-x-auto">
          <div className="flex justify-between min-w-[320px]">
            {safeWeather.hourly.time.slice(currentHour, currentHour + 6).map((time, index) => <ForecastDay key={time} time={index === 0 ? 'Now' : formatForecastTime(time)} icon={index === 0 ? Sun : Cloud} temp={Math.round(safeWeather.hourly.temperature_c[currentHour + index] ?? 24.5)} active={index === 0} />)}
          </div>
        </div>
      </section>
    </div>
  );
}

function formatForecastTime(value: string) {
  return new Date(value).toLocaleTimeString('en-IN', { hour: 'numeric', hour12: true });
}

export function WeatherHero({ weather, now }: { weather: NonNullable<ReturnType<typeof useHomeData>['weather']>; now: Date }) {
  const conditions = weather.conditions;
  return <button type="button" className="origin-hero text-left w-full" onClick={() => openWeatherSearch('current weather forecast pune')} aria-label="Search current Pune weather"><div className="origin-rain" aria-hidden="true">{Array.from({ length: 18 }, (_, index) => <i key={index} style={{ left: `${(index * 17) % 100}%`, animationDelay: `${(index % 7) * -0.45}s`, animationDuration: `${1.4 + (index % 4) * 0.35}s` }} />)}<b /><b /><b /></div><div className="origin-hero-top"><div><span className="origin-eyebrow"><CloudRain size={14} /> LIVE WEATHER · {now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} IST</span><h2>{conditions.temperature_c.toFixed(1)}°C</h2><p>{conditions.condition} <span>•</span> Feels like {conditions.apparent_temperature_c.toFixed(1)}°C</p></div><div className="origin-location"><MapPin size={16} /><select defaultValue={weather.location} aria-label="Select location" onClick={(event) => event.stopPropagation()}><option>Pune</option><option>Shivajinagar</option><option>Hadapsar</option><option>Kothrud</option></select><ChevronRight size={15} /></div></div><div className="origin-hero-bottom"><span>Visibility {weather.visibility_km.toFixed(1)} km</span><span>Updated {formatWeatherTime(weather.observed_at)}</span><span>{now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}</span></div></button>;
}

function formatWeatherTime(value: string) {
  return new Date(value).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function uvLabel(value: number) {
  if (value < 3) return 'Weak';
  if (value < 6) return 'Moderate';
  if (value < 8) return 'High';
  return 'Extreme';
}

function compassLabel(degrees: number) {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return directions[Math.round(degrees / 45) % directions.length];
}

function openWeatherSearch(query: string) {
  window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank', 'noopener,noreferrer');
}

export function PremiumWidgets({ weather }: { weather: NonNullable<ReturnType<typeof useHomeData>['weather']> }) {
  const conditions = weather.conditions;
  const widget = (search: string, content: ReactNode, className = '') => <button type="button" className={`origin-widget text-left cursor-pointer active:scale-95 transition-transform hover:border-blue-400 ${className}`} onClick={() => openWeatherSearch(search)}>{content}</button>;
  const air = weather.air_quality;
  const sunrise = formatWeatherTime(weather.daily.sunrise[0]);
  const sunset = formatWeatherTime(weather.daily.sunset[0]);
  return <section className="origin-widget-grid" aria-label="Premium meteorological widgets">{widget('current feels like temperature pune', <><WidgetHeading icon={Thermometer} title="Feels Like" /><strong>{conditions.apparent_temperature_c.toFixed(1)}°C</strong><div className="origin-gradient-slider"><i style={{ left: `${Math.min(92, Math.max(8, conditions.apparent_temperature_c * 2.2))}%` }} /></div><small>{conditions.apparent_temperature_c < 27 ? 'Comfortable' : 'Warm'}</small></>)}{widget('current wind speed and direction pune', <><WidgetHeading icon={Navigation} title="Wind Direction" /><div className="origin-compass"><span>N</span><span>E</span><span>S</span><span>W</span><i style={{ transform: `rotate(${weather.wind_direction_deg}deg)` }} /><b>Force {Math.max(1, Math.round(conditions.wind_speed_kph / 4))}<br /><small>{compassLabel(weather.wind_direction_deg)}</small></b></div><small className="origin-widget-note">{conditions.wind_speed_kph.toFixed(1)} km/h · {compassLabel(weather.wind_direction_deg)}</small></>)}{widget('current humidity percentage pune', <><WidgetHeading icon={Droplets} title="Humidity" /><div className="origin-drop"><Droplets size={35} /><strong>{conditions.humidity_percent}%</strong></div><small>{conditions.humidity_percent > 70 ? 'Damp' : 'Comfortable'} · Live</small></>)}{widget('current uv index pune', <><WidgetHeading icon={Sun} title="UV Index" /><div className="origin-spectrum" /><strong className="origin-widget-value">{conditions.uv_index.toFixed(1)} <small>Level · {uvLabel(conditions.uv_index)}</small></strong></>)}{widget('current visibility distance pune', <><WidgetHeading icon={Eye} title="Visibility" /><div className="origin-visibility"><i /><i /><i /><i /><i /></div><strong className="origin-widget-value">{weather.visibility_km.toFixed(1)} km <small>{weather.visibility_km > 5 ? 'Normal' : 'Reduced'}</small></strong></>)}{widget('current barometric pressure pune hpa', <><WidgetHeading icon={Gauge} title="Pressure" /><div className="origin-pressure"><i /><span>{Math.round(conditions.surface_pressure_hpa)}</span></div><strong className="origin-widget-value">{conditions.surface_pressure_hpa.toFixed(0)} hPa <small>Average</small></strong></>)}{widget('current air quality index pune pm2.5', <><WidgetHeading icon={ActivityIcon} title="Air Quality" /><div className="origin-aqi-gauge"><strong>{Math.round(air.european_aqi)}</strong><span>{air.european_aqi <= 50 ? 'Good' : air.european_aqi <= 100 ? 'Moderate' : 'Poor'}</span></div><div className="origin-aqi-bars">{[['PM2.5', air.pm2_5], ['PM10', air.pm10], ['SO2', air.sulphur_dioxide], ['CO', air.carbon_monoxide]].map(([label, value]) => <div key={label}><span>{label}</span><i><b style={{ width: `${Math.min(100, Number(value) * 2)}%` }} /></i><em>{Number(value).toFixed(0)}</em></div>)}</div></>, 'origin-aqi')}{widget('today sunrise and sunset time pune', <><WidgetHeading icon={Sunrise} title="Sunrise & Sunset" /><svg viewBox="0 0 300 100" role="img" aria-label="Sun and moon trajectory"><path d="M15 82 Q150 -15 285 82" /><circle cx="150" cy="28" r="6" /><circle cx="220" cy="53" r="5" /></svg><div><span><Sunrise size={14} />{sunrise} Sunrise</span><span><Sunset size={14} />{sunset} Sunset</span></div></>, 'origin-sun-path')}</section>;
}

function WidgetHeading({ icon: Icon, title }: { icon: ComponentType<{ size?: number }>; title: string }) { return <div className="origin-widget-heading"><Icon size={16} /><span>{title}</span></div>; }
function ActivityIcon({ size = 16 }: { size?: number }) { return <span style={{ fontSize: size }}>◉</span>; }

function WardHeatMap() {
  const wards = [
    ['Shivajinagar', 'Moderate', 'bg-emerald-500'],
    ['Hadapsar', 'High', 'bg-red-500'],
    ['Katraj', 'Moderate', 'bg-amber-500'],
    ['Baner', 'Low', 'bg-emerald-500'],
    ['Kothrud', 'High', 'bg-red-500'],
  ];
  return <section className="bg-white rounded-3xl p-5 shadow-sm border border-slate-50 space-y-4"><div className="flex items-center justify-between"><div><h3 className="text-slate-900 text-sm font-black">Pune Ward Heat Map</h3><p className="text-slate-400 text-[10px] font-medium">Live neighborhood heat indicators</p></div><MapPin size={18} className="text-blue-500" /></div><div className="relative h-44 overflow-hidden rounded-2xl bg-blue-50"><div className="absolute inset-0 opacity-50" style={{ backgroundImage: 'linear-gradient(#bfdbfe 1px, transparent 1px), linear-gradient(90deg, #bfdbfe 1px, transparent 1px)', backgroundSize: '28px 28px' }} />{wards.map(([name, level, color], index) => <button key={name} title={`${name}: ${level}`} className={`absolute w-5 h-5 rounded-full border-4 border-white shadow-lg ${color}`} style={{ left: `${12 + index * 19}%`, top: `${28 + (index % 3) * 20}%` }} />)}<span className="absolute bottom-2 left-3 text-[9px] font-bold tracking-widest text-blue-400">PUNE MUNICIPAL LIMITS</span></div><div className="flex flex-wrap gap-3 text-[10px] font-bold text-slate-500">{[['bg-emerald-500', 'Low / Moderate'], ['bg-amber-500', 'High'], ['bg-red-500', 'Very High']].map(([color, label]) => <span key={label} className="flex items-center gap-1.5"><i className={`w-2 h-2 rounded-full ${color}`} />{label}</span>)}</div><div className="grid grid-cols-2 sm:grid-cols-5 gap-2">{wards.map(([name, level, color]) => <div key={name} className="rounded-xl bg-slate-50 p-2"><span className="block text-[10px] font-bold text-slate-700">{name}</span><span className="flex items-center gap-1 text-[9px] text-slate-400"><i className={`w-1.5 h-1.5 rounded-full ${color}`} />{level}</span></div>)}</div></section>;
}

function MetricSmall({ icon: Icon, label, value, color }: any) {
  return (
    <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-50 flex flex-col items-center gap-1">
      <Icon size={14} className={color} />
      <span className="text-xs font-black text-slate-900">{value}</span>
      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{label}</span>
    </div>
  );
}

function ForecastDay({ time, icon: Icon, temp, active }: any) {
  return (
    <div className={clsx(
      "flex flex-col items-center gap-3 px-3 py-1 rounded-2xl",
      active && "bg-blue-50/50"
    )}>
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{time}</span>
      <Icon size={20} className={active ? "text-orange-500" : "text-slate-300"} />
      <span className="text-sm font-black text-slate-900">{temp}°C</span>
    </div>
  );
}
