import type { Action, ForecastDay, MapLocation, Metric, MunicipalResponseSummary, PageId, RiskDriverData, RiskLevel, TrendsResponse, WeatherConditions } from '../types'

const riskStyles: Record<RiskLevel, string> = { Low: 'bg-emerald-50 text-emerald-700 ring-emerald-200', Moderate: 'bg-amber-50 text-amber-700 ring-amber-200', High: 'bg-orange-50 text-orange-700 ring-orange-200', Severe: 'bg-red-50 text-red-700 ring-red-200' }
const dotStyles: Record<RiskLevel, string> = { Low: 'bg-emerald-500', Moderate: 'bg-amber-500', High: 'bg-orange-500', Severe: 'bg-red-500' }

export function RiskBadge({ risk }: { risk: RiskLevel }) { return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${riskStyles[risk]}`}><span className={`size-1.5 rounded-full ${dotStyles[risk]}`} />{risk}</span> }
export function MetricCard({ metric }: { metric: Metric }) { return <article className="rounded-xl border border-line bg-surface p-5 shadow-sm"><div className="mb-4 flex size-9 items-center justify-center rounded-lg bg-brand-light text-brand"><Icon name={metric.icon} /></div><p className="text-sm text-muted">{metric.label}</p><p className="mt-1 text-2xl font-bold tracking-tight text-ink">{metric.value}</p><p className="mt-1 text-xs text-muted">{metric.detail}</p></article> }
export function RiskScore({ score, risk }: { score: number; risk: RiskLevel }) { return <div className="rounded-xl border border-line bg-surface p-5"><div className="flex items-start justify-between"><div><p className="text-sm text-muted">Heat risk score</p><p className="mt-1 text-4xl font-bold tracking-tight">{score}<span className="text-lg font-medium text-muted">/100</span></p></div><RiskBadge risk={risk} /></div><div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-red-500" style={{ width: `${score}%` }} /></div><p className="mt-3 text-xs text-muted">A summary of current heat conditions and local exposure.</p></div> }
function displayValue(value: number | null, suffix = '') { return value === null ? 'Unavailable' : `${value}${suffix}` }
export function WeatherCard({ conditions }: { conditions: WeatherConditions }) { return <article className="rounded-xl bg-brand p-6 text-white"><p className="text-sm font-medium text-sky-100">Current conditions</p><div className="mt-3 flex items-end justify-between"><div><p className="text-5xl font-bold tracking-tight">{displayValue(conditions.temperature_c, '°')}</p><p className="mt-1 text-sm text-sky-100">Feels like {displayValue(conditions.apparent_temperature_c, '°C')}</p></div><div className="text-right"><Icon name="sun" /><p className="mt-2 text-sm">{conditions.condition}</p></div></div><div className="mt-6 grid grid-cols-3 border-t border-white/20 pt-4 text-sm"><span><b className="block">{displayValue(conditions.humidity_percent, '%')}</b><i className="not-italic text-sky-100">Humidity</i></span><span><b className="block">{displayValue(conditions.wind_speed_kph, ' km/h')}</b><i className="not-italic text-sky-100">Wind</i></span><span><b className="block">{displayValue(conditions.uv_index, '')}</b><i className="not-italic text-sky-100">UV index</i></span></div></article> }
export function ForecastCard({ day }: { day: ForecastDay }) { return <article className="rounded-xl border border-line bg-surface p-4"><div className="flex items-start justify-between"><div><p className="font-semibold">{day.day}</p><p className="text-xs text-muted">{day.date}</p></div><Icon name="sun" /></div><p className="mt-4 text-sm text-muted">{day.condition}</p><p className="mt-1 text-xl font-bold">{day.high}° <span className="font-medium text-muted">{day.low}°</span></p><div className="mt-3 flex items-center justify-between gap-2">{day.risk ? <RiskBadge risk={day.risk} /> : <span className="text-xs text-muted">Risk unavailable</span>}{day.score !== undefined && <span className="text-xs font-semibold text-muted">{day.score}/100</span>}</div>{day.peak_time_local && <p className="mt-2 text-xs text-muted">Peak: {day.peak_time_local}</p>}</article> }

export function RiskDriver({ driver }: { driver: RiskDriverData }) { return <article className="flex gap-4 rounded-xl border border-line bg-surface p-4"><span className={`mt-1 size-2 shrink-0 rounded-full ${driver.impact === 'High' ? 'bg-orange-500' : driver.impact === 'Medium' ? 'bg-amber-400' : 'bg-slate-300'}`} /><div className="min-w-0 flex-1"><div className="flex justify-between gap-4"><h3 className="font-semibold">{driver.label}</h3><span className="font-semibold text-brand">{driver.value}</span></div><p className="mt-1 text-sm leading-6 text-muted">{driver.description}</p></div></article> }

import { useState } from 'react'
import { ActionExplanationModal } from './AIComponents'

export function ActionCard({ action, onStatusChange }: { action: Action; onStatusChange?: (status: 'pending' | 'in_progress' | 'completed') => void }) {
  const currentStatus = action.status || 'pending'
  const [showExplanation, setShowExplanation] = useState(false)

  return (
    <article className="rounded-xl border border-line bg-surface p-5 shadow-sm space-y-3">
      <div className="flex justify-between gap-3">
        <span className="flex size-10 items-center justify-center rounded-lg bg-brand-light text-brand"><Icon name={action.icon} /></span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowExplanation(true)}
            className="rounded-md bg-blue-50 px-2 py-1 text-[11px] font-semibold text-brand border border-blue-200 hover:bg-blue-100 transition-colors"
          >
            Why this action?
          </button>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{action.priority}</span>
        </div>
      </div>
      <h3 className="font-semibold">{action.title}</h3>
      <p className="text-sm leading-6 text-muted">{action.description}</p>
      <div className="flex items-center justify-between border-t border-line/60 pt-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand">{action.audience}</p>

        {onStatusChange ? (
          <div className="flex rounded-md bg-slate-100 p-0.5 text-[11px] font-medium">
            <button
              type="button"
              onClick={() => onStatusChange('pending')}
              className={`rounded px-2 py-0.5 ${currentStatus === 'pending' ? 'bg-amber-500 text-white font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Pending
            </button>
            <button
              type="button"
              onClick={() => onStatusChange('in_progress')}
              className={`rounded px-2 py-0.5 ${currentStatus === 'in_progress' ? 'bg-brand text-white font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              In Progress
            </button>
            <button
              type="button"
              onClick={() => onStatusChange('completed')}
              className={`rounded px-2 py-0.5 ${currentStatus === 'completed' ? 'bg-emerald-600 text-white font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Completed
            </button>
          </div>
        ) : (
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${currentStatus === 'completed' ? 'bg-emerald-100 text-emerald-800' : currentStatus === 'in_progress' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}`}>
            {currentStatus === 'completed' ? 'Completed' : currentStatus === 'in_progress' ? 'In Progress' : 'Pending'}
          </span>
        )}
      </div>

      {showExplanation && action.id && (
        <ActionExplanationModal actionId={action.id} onClose={() => setShowExplanation(false)} />
      )}
    </article>
  )
}


import L from 'leaflet'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'

function createRiskMarkerIcon(name: string, risk: RiskLevel, isSelected: boolean) {
  const bgColors: Record<RiskLevel, string> = {
    Low: '#10b981',
    Moderate: '#f59e0b',
    High: '#f97316',
    Severe: '#ef4444',
  }
  const color = bgColors[risk] || '#10b981'

  const html = `
    <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer; transform: translate(-50%, -50%);">
      <div style="width: 22px; height: 22px; border-radius: 50%; background-color: ${color}; border: 3px solid #ffffff; box-shadow: 0 2px 5px rgba(0,0,0,0.3); ${isSelected ? 'box-shadow: 0 0 0 4px rgba(18,63,114,0.4);' : ''}"></div>
      <div style="margin-top: 3px; background-color: #ffffff; color: #172033; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 700; box-shadow: 0 1px 3px rgba(0,0,0,0.25); white-space: nowrap;">${name}</div>
    </div>
  `

  return L.divIcon({
    html,
    className: 'custom-risk-marker',
    iconSize: [80, 40],
    iconAnchor: [40, 20],
  })
}

export function RiskMap({ locations, selected, onSelect }: { locations: MapLocation[]; selected: string; onSelect: (name: string) => void }) {
  const defaultCenter: [number, number] = [18.5204, 73.8567]

  return (
    <div className="relative min-h-[420px] w-full overflow-hidden rounded-xl border border-line bg-canvas shadow-sm">
      <MapContainer center={defaultCenter} zoom={12} scrollWheelZoom={false} style={{ height: '420px', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {locations.map((loc) => {
          const isSelected = selected === loc.name
          const icon = createRiskMarkerIcon(loc.name, loc.risk, isSelected)
          return (
            <Marker
              key={loc.name}
              position={[loc.latitude, loc.longitude]}
              icon={icon}
              eventHandlers={{
                click: () => onSelect(loc.name),
              }}
            >
              <Popup>
                <div className="p-1 text-center font-sans">
                  <p className="font-bold text-ink">{loc.name}</p>
                  <p className="text-xs text-muted">{loc.ward}</p>
                  <p className="mt-1 text-xs font-semibold text-brand">
                    {loc.score}/100 {loc.risk} Risk
                  </p>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
      <div className="bg-surface px-3 py-2 text-xs text-muted border-t border-line flex items-center justify-between">
        <span>Ward-level municipal heat monitoring map (Pune coordinates)</span>
        <span className="font-semibold text-brand">Zoom & Pan active</span>
      </div>
    </div>
  )
}

export function HeatTrendChart({ trends, title = "24-Hour Heat Trend", description = "Calculated hourly risk score and temperature curve from Open-Meteo backend data." }: { trends: TrendsResponse; title?: string; description?: string }) {
  const points = trends.points || []
  if (points.length === 0) {
    return (
      <div className="rounded-xl border border-line bg-surface p-5">
        <h3 className="font-bold text-ink">{title}</h3>
        <p className="mt-2 text-sm text-muted">No hourly trend observations available.</p>
      </div>
    )
  }

  const peakPoint = trends.peak_point || points.reduce((max, p) => (p.risk_score > max.risk_score ? p : max), points[0])

  const chartHeight = 140
  const chartWidth = 600

  const maxScore = 100
  const coords = points.map((p, idx) => {
    const x = (idx / (points.length - 1)) * (chartWidth - 40) + 20
    const y = chartHeight - (p.risk_score / maxScore) * (chartHeight - 30) - 15
    return { x, y, point: p }
  })

  const pathD = coords.reduce((acc, c, idx) => (idx === 0 ? `M ${c.x} ${c.y}` : `${acc} L ${c.x} ${c.y}`), '')
  const areaD = `${pathD} L ${coords[coords.length - 1].x} ${chartHeight} L ${coords[0].x} ${chartHeight} Z`

  const peakCoord = coords.find((c) => c.point.formatted_time === peakPoint.formatted_time) || coords[0]

  return (
    <div className="rounded-xl border border-line bg-surface p-5 shadow-sm space-y-4">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-brand">Hourly Intelligence</p>
          <h3 className="text-xl font-bold text-ink">{title}</h3>
          <p className="text-xs text-muted">{description}</p>
        </div>
        {peakPoint && (
          <div className="rounded-lg bg-orange-50 border border-orange-200 px-3 py-1.5 text-xs text-orange-950">
            <span className="font-semibold">Calculated Peak:</span> {peakPoint.formatted_time} — <span className="font-bold">{peakPoint.risk_score}/100 {peakPoint.risk_level[0].toUpperCase() + peakPoint.risk_level.slice(1)}</span> ({peakPoint.temperature_c}°C)
          </div>
        )}
      </div>

      <div className="relative overflow-x-auto pt-2">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight + 30}`} className="w-full h-44 overflow-visible">
          {/* Grid lines */}
          <line x1="0" y1="20" x2={chartWidth} y2="20" stroke="#e2e8f0" strokeDasharray="3 3" />
          <line x1="0" y1="70" x2={chartWidth} y2="70" stroke="#e2e8f0" strokeDasharray="3 3" />
          <line x1="0" y1="120" x2={chartWidth} y2="120" stroke="#e2e8f0" strokeDasharray="3 3" />

          {/* Area fill */}
          <path d={areaD} fill="rgba(249, 115, 22, 0.08)" />

          {/* Line path */}
          <path d={pathD} fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Data points */}
          {coords.map((c, i) => (
            <g key={i}>
              <circle
                cx={c.x}
                cy={c.y}
                r={c.point.is_peak ? "6" : "3.5"}
                fill={c.point.is_peak ? "#ef4444" : "#f97316"}
                stroke="#ffffff"
                strokeWidth="1.5"
              />
              {/* Show label every 3 hours */}
              {i % 3 === 0 && (
                <text x={c.x} y={chartHeight + 20} textAnchor="middle" className="text-[10px] fill-slate-500 font-medium">
                  {c.point.formatted_time.replace(':00 ', ' ')}
                </text>
              )}
            </g>
          ))}

          {/* Highlight Peak Dot Callout */}
          {peakCoord && (
            <g transform={`translate(${Math.min(peakCoord.x, chartWidth - 80)}, ${Math.max(peakCoord.y - 12, 18)})`}>
              <rect x="-35" y="-18" width="70" height="18" rx="4" fill="#1e293b" />
              <text x="0" y="-6" textAnchor="middle" fill="#ffffff" className="text-[10px] font-bold">
                Peak {peakPoint.risk_score}/100
              </text>
            </g>
          )}
        </svg>
      </div>

      <div className="flex flex-wrap items-center justify-between text-xs text-muted border-t border-line/60 pt-3">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-orange-500" />Risk Score (0-100)</span>
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-red-500" />Peak Hour Callout</span>
        </div>
        <span>Data source: Open-Meteo hourly observations</span>
      </div>
    </div>
  )
}

export function HeatRiskOutlookCard({
  currentScore,
  currentLevel,
  todayPeakTime,
  todayPeakScore,
  todayPeakLevel,
  tomorrowPeakTime,
  tomorrowPeakScore,
  tomorrowPeakLevel,
}: {
  currentScore: number
  currentLevel: RiskLevel
  todayPeakTime: string
  todayPeakScore: number
  todayPeakLevel: RiskLevel
  tomorrowPeakTime: string
  tomorrowPeakScore: number
  tomorrowPeakLevel: RiskLevel
}) {
  return (
    <div className="rounded-xl border border-line bg-surface p-5 shadow-sm space-y-3">
      <p className="text-xs font-bold uppercase tracking-wider text-brand">HEAT RISK OUTLOOK</p>
      <div className="grid grid-cols-3 gap-3 divide-x divide-line text-center">
        <div className="px-2">
          <span className="text-xs text-muted block">Current</span>
          <p className="mt-1 text-2xl font-bold text-ink">{currentScore}/100</p>
          <div className="mt-1 flex justify-center"><RiskBadge risk={currentLevel} /></div>
        </div>
        <div className="px-2">
          <span className="text-xs text-muted block">Today's Peak</span>
          <p className="mt-1 text-2xl font-bold text-ink">{todayPeakScore}/100</p>
          <div className="mt-1 flex justify-center"><RiskBadge risk={todayPeakLevel} /></div>
          <span className="mt-1 block text-[11px] font-medium text-brand">{todayPeakTime}</span>
        </div>
        <div className="px-2">
          <span className="text-xs text-muted block">Tomorrow Peak</span>
          <p className="mt-1 text-2xl font-bold text-ink">{tomorrowPeakScore}/100</p>
          <div className="mt-1 flex justify-center"><RiskBadge risk={tomorrowPeakLevel} /></div>
          <span className="mt-1 block text-[11px] font-medium text-brand">{tomorrowPeakTime}</span>
        </div>
      </div>
    </div>
  )
}

export function EarlyWarningCard({
  currentScore,
  todayPeakScore,
  todayPeakTime,
  todayPeakLevel,
}: {
  currentScore: number
  todayPeakScore: number
  todayPeakTime: string
  todayPeakLevel: RiskLevel
}) {
  const isEscalating = todayPeakScore > currentScore + 10 || todayPeakLevel !== 'Low'

  return (
    <div className={`rounded-xl border p-5 shadow-sm ${isEscalating ? 'border-orange-200 bg-orange-50/80 text-orange-950' : 'border-line bg-surface text-ink'}`}>
      <div className="flex items-center gap-2">
        <span className={`size-2.5 rounded-full ${isEscalating ? 'bg-orange-500 animate-pulse' : 'bg-emerald-500'}`} />
        <p className="text-xs font-bold uppercase tracking-wider text-brand">EARLY WARNING SYSTEM</p>
      </div>

      {isEscalating ? (
        <div className="mt-3 space-y-2">
          <h4 className="text-lg font-bold text-orange-950">"Heat risk expected to increase"</h4>
          <div className="grid grid-cols-2 gap-3 text-sm border-t border-orange-200/80 pt-2">
            <div>
              <span className="text-xs text-orange-800 block">Expected Peak Time</span>
              <span className="font-bold text-orange-950">{todayPeakTime}</span>
            </div>
            <div>
              <span className="text-xs text-orange-800 block">Expected Peak Risk</span>
              <span className="font-bold text-orange-950">{todayPeakScore}/100 ({todayPeakLevel})</span>
            </div>
          </div>
          <p className="text-xs font-semibold text-orange-900 pt-1">
            Preparation Advice: Complete municipal hydration and cooling readiness before {todayPeakTime}.
          </p>
        </div>
      ) : (
        <div className="mt-2">
          <h4 className="text-base font-bold text-ink">"No significant heat-risk escalation expected."</h4>
          <p className="mt-1 text-xs text-muted">Current heat risk levels are expected to remain steady within low thermal thresholds today.</p>
        </div>
      )}
    </div>
  )
}

export function MunicipalResponseSummaryCard({ summary }: { summary: MunicipalResponseSummary }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-5 shadow-sm space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-xs font-bold uppercase tracking-wider text-brand">MUNICIPAL RESPONSE STATUS</p>
        <span className="text-xs text-muted">Live Tracking</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center pt-1">
        <div className="rounded-lg bg-canvas p-3 border border-line/60">
          <span className="text-xs text-muted block">Active Alerts</span>
          <span className="text-2xl font-bold text-ink">{summary.active_alerts}</span>
        </div>
        <div className="rounded-lg bg-canvas p-3 border border-line/60">
          <span className="text-xs text-muted block">High-Risk Wards</span>
          <span className="text-2xl font-bold text-ink">{summary.high_risk_wards}</span>
        </div>
        <div className="rounded-lg bg-canvas p-3 border border-line/60">
          <span className="text-xs text-muted block">Actions Pending</span>
          <span className="text-2xl font-bold text-amber-600">{summary.actions_pending}</span>
        </div>
        <div className="rounded-lg bg-canvas p-3 border border-line/60">
          <span className="text-xs text-muted block">Actions Completed</span>
          <span className="text-2xl font-bold text-emerald-600">{summary.actions_completed}</span>
        </div>
      </div>
    </div>
  )
}

export function Navigation({ page, onNavigate }: { page: PageId; onNavigate: (page: PageId) => void }) {
  const items: { id: PageId; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'grid' },
    { id: 'map', label: 'Heat Risk Map', icon: 'map' },
    { id: 'location', label: 'Location Detail', icon: 'location' },
    { id: 'forecast', label: '5-Day Forecast', icon: 'calendar' },
    { id: 'explanation', label: 'Risk Explanation', icon: 'info' },
    { id: 'actions', label: 'Recommended Actions', icon: 'check' },
    { id: 'alerts', label: 'Alert Center', icon: 'bell' },
    { id: 'ai-intelligence', label: 'AI Heat Intelligence', icon: 'cpu' },
  ]
  return (
    <nav aria-label="Primary navigation" className="border-b border-line bg-surface px-4 lg:min-h-screen lg:w-64 lg:border-b-0 lg:border-r lg:px-5">
      <div className="flex h-18 items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-brand text-lg font-bold text-white">H</span>
        <div>
          <p className="font-bold tracking-tight">HeatWatch</p>
          <p className="text-xs text-muted">Municipal heat intelligence</p>
        </div>
      </div>
      <div className="flex gap-1 overflow-x-auto pb-3 lg:block lg:space-y-1">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onNavigate(item.id)}
            className={`flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium lg:w-full ${page === item.id ? 'bg-brand text-white' : 'text-muted hover:bg-slate-100 hover:text-ink'}`}
          >
            <Icon name={item.icon} />
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  )
}

export function Header({ title, subtitle }: { title: string; subtitle: string }) { return <header className="flex flex-col justify-between gap-4 border-b border-line bg-surface px-5 py-5 sm:flex-row sm:items-center lg:px-8"><div><h1 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h1><p className="mt-1 text-sm text-muted">{subtitle}</p></div><div className="inline-flex items-center gap-2 text-sm text-muted"><span className="size-2 rounded-full bg-emerald-500" />Live backend data</div></header> }
function Icon({ name }: { name: string }) { const paths: Record<string, string> = { thermometer: 'M12 3v10.5a4 4 0 1 1-4 0V3a4 4 0 0 1 4 0Z', alert: 'M12 3 2.8 20h18.4L12 3Zm0 6v4m0 3h.01', location: 'M12 21s7-5.3 7-12a7 7 0 1 0-14 0c0 6.7 7 12 7 12Zm0-9.5h.01', clock: 'M12 7v5l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z', sun: 'M12 3v2m0 14v2m9-9h-2M5 12H3m15.4-6.4-1.4 1.4M7 17l-1.4 1.4m12.8 0L17 17M7 7 5.6 5.6M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z', building: 'M4 21V5l8-3 8 3v16M8 21v-4h8v4M8 9h.01M8 13h.01m8-4h.01m-.01 4h.01', megaphone: 'm3 11 13-5v12L3 13v-2Zm13 1h3m-2.4-5.6L19 4m-2.4 13.6L19 20M6 14l1 6h3l-1-5', people: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m17-6a4 4 0 0 0-3-4m-7-2a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z', heart: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.9-8.6a5.5 5.5 0 0 0-.1-7.8Z', grid: 'M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z', map: 'm3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Zm6-3v15m6-12v15', calendar: 'M7 3v3m10-3v3M4 9h16M5 5h14v15H5V5Z', info: 'M12 17v-5m0-3h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z', check: 'm5 12 4 4L19 6', bell: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0', cpu: 'M6 4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6Zm3 5h6v6H9V9Z' }; return <svg aria-hidden="true" className="size-5 shrink-0 fill-none stroke-current stroke-[1.8]" viewBox="0 0 24 24"><path d={paths[name] ?? paths.info} strokeLinecap="round" strokeLinejoin="round" /></svg> }


