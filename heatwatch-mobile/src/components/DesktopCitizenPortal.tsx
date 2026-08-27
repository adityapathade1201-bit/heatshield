import { useEffect, useState, type ReactNode } from 'react';
import { useLocation, NavLink } from 'react-router-dom';
import { Activity, Bell, CheckCircle2, ChevronRight, CloudSun, Droplets, Gauge, MapPin, RefreshCw, ShieldAlert, Sun, Thermometer, Wind } from 'lucide-react';
import { useHomeData } from '../hooks/useHomeData.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { PremiumWidgets, WeatherHero } from '../pages/Home.tsx';
import type { WeatherResponse } from '../types/index.ts';

interface DesktopCitizenPortalProps { children: ReactNode; }

export function DesktopCitizenPortal({ children }: DesktopCitizenPortalProps) {
  const location = useLocation();
  const nav = [
    ['Home', '/', Activity], ['Heat Check', '/check', Thermometer], ['Surveys', '/survey', CheckCircle2],
    ['Alerts', '/alerts', Bell], ['Profile', '/profile', ShieldAlert],
  ] as const;

  return <div className="citizen-portal">
    <header className="citizen-header"><div className="citizen-header-inner">
      <NavLink to="/" className="citizen-brand"><span className="citizen-brand-mark"><ShieldAlert size={19} /></span><span><strong>HeatWatch</strong><small>Pune Heat-Health Network</small></span></NavLink>
      <nav className="citizen-nav">{nav.map(([label, path, Icon]) => <NavLink key={path} to={path} className={({ isActive }) => isActive ? 'active' : ''}><Icon size={16} />{label}</NavLink>)}</nav>
      <div className="citizen-location"><span className="citizen-live-dot" /> Live <span className="citizen-divider" /><MapPin size={14} /> Pune, MH</div>
    </div></header>
    <main className="citizen-main">{location.pathname === '/' ? <DesktopHome /> : children}</main>
  </div>;
}

function DesktopHome() {
  const { user } = useAuth();
  const { weather, risk, loading, refresh } = useHomeData();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  if (loading && !weather) return <div className="citizen-loading"><RefreshCw className="animate-spin" /> Loading Pune weather...</div>;
  if (!weather || !risk) return null;
  const conditions = weather.conditions;
  return <div className="citizen-home">
    <WeatherHero weather={weather} now={now} />
    <div className="citizen-welcome"><div><p className="citizen-kicker">TUESDAY, 27 AUGUST 2026 · 14:32 IST</p><h1>Good afternoon{user?.name ? `, ${user.name.split(' ')[0]}` : ''}</h1><p>Stay informed. Stay cool. Here is your heat safety briefing for Pune.</p></div><button className="citizen-refresh" onClick={refresh} aria-label="Refresh weather"><RefreshCw size={17} /></button></div>
    <div className="citizen-grid">
      <div className="citizen-primary">
        <section className={`citizen-risk-card risk-${risk.level}`}><div className="citizen-risk-top"><div><p className="citizen-kicker">CURRENT HEAT RISK · {weather.location.toUpperCase()}</p><h2>{risk.score}<small>/100</small></h2><span className="citizen-risk-label">{risk.level.toUpperCase()} RISK</span></div><div className="citizen-sun"><Sun size={45} /></div></div><div className="citizen-risk-weather"><div><Thermometer size={16} /><span>Temperature<strong>{Math.round(conditions.temperature_c)}°C</strong></span></div><div><CloudSun size={16} /><span>Feels like<strong>{Math.round(conditions.apparent_temperature_c)}°C</strong></span></div><div><Wind size={16} /><span>Wind<strong>{Math.round(conditions.wind_speed_kph)} km/h</strong></span></div></div><div className="citizen-advice"><CheckCircle2 size={18} /><span><b>Today’s safety advice</b>Limit strenuous outdoor activity between 12 PM and 4 PM. Drink water regularly and seek shade when needed.</span></div></section>
        <ForecastCard weather={weather} />
      </div>
      <aside className="citizen-secondary"><section className="citizen-card"><div className="citizen-card-title"><h2>Weather now</h2><span>Updated {formatWeatherTime(weather.observed_at)}</span></div><div className="citizen-metrics">{[[Thermometer, 'Temperature', `${conditions.temperature_c.toFixed(1)}°C`, `Feels ${conditions.apparent_temperature_c.toFixed(1)}°C`], [Droplets, 'Humidity', `${conditions.humidity_percent}%`, conditions.humidity_percent > 70 ? 'Damp' : 'Comfortable'], [CloudSun, 'Heat Index', `${conditions.apparent_temperature_c.toFixed(1)}°C`, 'Live'], [Sun, 'UV Index', `${conditions.uv_index.toFixed(1)}`, uvLevel(conditions.uv_index)], [Wind, 'Wind', `${conditions.wind_speed_kph.toFixed(1)} km/h`, `${compassDirection(weather.wind_direction_deg)} direction`], [Gauge, 'Air Quality', `${Math.round(weather.air_quality.european_aqi)}`, weather.air_quality.european_aqi <= 100 ? 'Moderate' : 'Poor']].map(([Icon, label, value, detail]) => <div className="citizen-metric" key={label as string}><Icon size={17} /><span>{label as string}<strong>{value as string}</strong><small>{detail as string}</small></span></div>)}</div></section><section className="citizen-check-card"><div className="citizen-check-icon"><Activity size={20} /></div><div><h2>How does the heat feel?</h2><p>Share a quick observation to help your community.</p></div><NavLink to="/check">Start Heat Check <ChevronRight size={15} /></NavLink></section><section className="citizen-alert-card"><Bell size={18} /><div><b>Heat safety alert</b><p>Stay hydrated and check on vulnerable neighbors today.</p></div></section></aside>
    </div>
    <PremiumWidgets weather={weather} />
  </div>;
}

function formatWeatherTime(value: string) { return new Date(value).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }); }
function uvLevel(value: number) { return value < 3 ? 'Weak' : value < 6 ? 'Moderate' : value < 8 ? 'High' : 'Extreme'; }
function compassDirection(degrees: number) { return ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(degrees / 45) % 8]; }

function ForecastCard({ weather }: { weather: WeatherResponse }) {
  const currentHour = Math.max(0, weather.hourly.time.findIndex((time) => time >= weather.observed_at));
  const hourly = weather.hourly.time.slice(currentHour, currentHour + 10);
  const temperatures = weather.hourly.temperature_c.slice(currentHour, currentHour + 10);
  const maxTemperature = Math.max(...temperatures);
  return <section className="citizen-card citizen-forecast"><div className="citizen-card-title"><h2>Forecast</h2><NavLink to="/alerts">View details <ChevronRight size={14} /></NavLink></div><div className="citizen-hourly"><div className="citizen-hourly-chart">{hourly.map((time, index) => <div key={time}><i style={{ height: `${Math.max(12, (temperatures[index] / maxTemperature) * 100)}%` }} /><span>{new Date(time).toLocaleTimeString('en-IN', { hour: 'numeric' })}</span></div>)}</div><div className="citizen-peak"><b>Peak {maxTemperature.toFixed(1)}°C in the next 10 hours</b><span>Live Open-Meteo forecast</span></div></div><div className="citizen-days">{weather.daily.time.slice(0, 5).map((day, index) => <div key={day}><span>{index === 0 ? 'Today' : new Date(day).toLocaleDateString('en-IN', { weekday: 'short' })}</span><Sun size={18} className="forecast-high" /><strong>{Math.round(weather.daily.temperature_max_c[index])}°</strong><small>Low {Math.round(weather.daily.temperature_min_c[index])}°</small></div>)}</div></section>;
}
