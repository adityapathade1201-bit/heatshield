import { useEffect, useState } from 'react'
import {
  getAIOverview,
  getAlerts,
  getForecast,
  getLocations,
  getMunicipalBrief,
  getMunicipalSummary,
  getResponseActions,
  getRisk,
  getThermal,
  getTrends,
  getWardAIAnalysis,
  getWeather,
  updateActionStatus,
  updateAlertStatus,
} from '../services/api'
import type {
  AIOverviewResponse,
  AlertsResponse,
  ApiForecastDay,
  ApiLocation,
  ForecastDay,
  MapLocation,
  Metric,
  MunicipalBriefResponse,
  ResponseActionItem,
  RiskDriverData,
  RiskLevel,
  RiskResponse,
  ThermalResponse,
  WardAIAnalysisResponse,
} from '../types'

import {
  DataQualityCard,
  MunicipalBriefCard,
  WardAIAnalysisCard,
  WardComparisonTable,
} from '../components/AIComponents'
import {
  ActionCard,
  EarlyWarningCard,
  ForecastCard,
  HeatRiskOutlookCard,
  HeatTrendChart,
  MetricCard,
  MunicipalResponseSummaryCard,
  RiskBadge,
  RiskDriver,
  RiskMap,
  RiskScore,
  WeatherCard,
} from '../components/UI'


function PageIntro({ eyebrow, title, description }: { eyebrow?: string; title: string; description: string }) {
  return (
    <div className="mb-6">
      <p className="text-sm font-semibold text-brand">{eyebrow}</p>
      <h2 className="mt-1 text-2xl font-bold tracking-tight">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{description}</p>
    </div>
  )
}

function Status({ message, isError }: { message: string; isError?: boolean }) {
  return (
    <div className={`rounded-xl border p-6 text-sm ${isError ? 'border-red-200 bg-red-50 text-red-900' : 'border-line bg-surface text-muted'}`}>
      <p className="font-semibold">{isError ? 'Unable to load live heat data' : 'Loading live data'}</p>
      <p className="mt-1">{message}</p>
    </div>
  )
}

function useApiData<T>(loader: () => Promise<T>, key: string) {
  const [state, setState] = useState<{ data: T | null; error: string | null; loading: boolean }>({ data: null, error: null, loading: true })
  // oxlint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    let active = true
    loader()
      .then((data) => {
        if (active) setState({ data, error: null, loading: false })
      })
      .catch((error: unknown) => {
        if (active) setState({ data: null, error: error instanceof Error ? error.message : 'Backend data is unavailable.', loading: false })
      })
    return () => {
      active = false
    }
  }, [key])
  return state
}

function riskLevel(value: 'low' | 'moderate' | 'high' | 'severe'): RiskLevel {
  return (value[0].toUpperCase() + value.slice(1)) as RiskLevel
}

function value(val: number | null, suffix = '') {
  return val === null ? 'Unavailable' : `${val}${suffix}`
}

function mapLocations(locations: ApiLocation[]): MapLocation[] {
  const longitudes = locations.map((item) => item.longitude)
  const latitudes = locations.map((item) => item.latitude)
  const minLongitude = Math.min(...longitudes)
  const maxLongitude = Math.max(...longitudes)
  const minLatitude = Math.min(...latitudes)
  const maxLatitude = Math.max(...latitudes)
  return locations.map((item) => ({
    name: item.name,
    ward: item.ward,
    risk: riskLevel(item.risk_level),
    score: item.risk_score,
    latitude: item.latitude,
    longitude: item.longitude,
    x: maxLongitude === minLongitude ? 50 : 15 + ((item.longitude - minLongitude) / (maxLongitude - minLongitude)) * 70,
    y: maxLatitude === minLatitude ? 50 : 15 + ((maxLatitude - item.latitude) / (maxLatitude - minLatitude)) * 70,
  }))
}

function riskDrivers(risk: RiskResponse): RiskDriverData[] {
  return (risk.drivers || []).map((driver) => ({ label: driver.name, value: driver.value, description: driver.description }))
}

function forecastDays(days: ApiForecastDay[]): ForecastDay[] {
  return (days || []).map((day, index) => ({
    day: index === 0 ? 'Today' : new Intl.DateTimeFormat('en', { weekday: 'short' }).format(new Date(`${day.date}T00:00:00`)),
    date: new Intl.DateTimeFormat('en', { day: '2-digit', month: 'short' }).format(new Date(`${day.date}T00:00:00`)),
    condition: day.condition,
    high: day.high_c,
    low: day.low_c,
    risk: day.risk_level ? riskLevel(day.risk_level) : undefined,
    score: day.risk_score,
    peak_time_local: day.peak_time_local,
  }))
}

function thermalDrivers(thermal: ThermalResponse): RiskDriverData[] {
  return [
    { label: 'Estimated WBGT', value: `${thermal.estimated_wbgt_c ?? 'N/A'}°C`, description: 'Estimated outdoor WBGT from the live thermal endpoint.' },
    { label: 'Globe temperature', value: `${thermal.estimated_globe_temperature_c ?? 'N/A'}°C`, description: 'Estimated black-globe temperature from the live thermal endpoint.' },
    { label: 'Natural wet-bulb temperature', value: `${thermal.natural_wet_bulb_temperature_c ?? 'N/A'}°C`, description: 'Estimated natural wet-bulb temperature from the live thermal endpoint.' },
  ]
}

export function DashboardPage({ onLocationSelect }: { onLocationSelect: (name: string) => void }) {
  const { data, error, loading } = useApiData(
    () => Promise.all([getWeather(), getRisk(), getLocations(), getForecast(), getTrends(), getMunicipalSummary()]),
    'dashboard'
  )

  if (loading) return <Status message="Loading live dashboard intelligence..." />
  if (error || !data) return <Status message={error || 'Live dashboard data is unavailable. Please verify backend connection.'} isError />

  const [weather, risk, locations, forecast, trends, summary] = data
  const current = weather.conditions
  const displayLocations = mapLocations(locations.locations)

  const sortedWards = [...locations.locations].sort((a, b) => b.risk_score - a.risk_score)
  const allLowRisk = sortedWards.every((loc) => loc.risk_level === 'low')

  const todayPeak = risk.peak_window
    ? { time: risk.peak_window.formatted_time, score: risk.peak_window.risk_score, level: riskLevel(risk.peak_window.risk_level) }
    : { time: '11:30 AM', score: risk.score, level: riskLevel(risk.level) }

  const tomorrowDay = forecast.days && forecast.days.length > 1 ? forecast.days[1] : null
  const tomorrowPeak = tomorrowDay
    ? { time: tomorrowDay.peak_time_local ?? '12:30 PM', score: tomorrowDay.risk_score ?? risk.score, level: tomorrowDay.risk_level ? riskLevel(tomorrowDay.risk_level) : 'Low' as RiskLevel }
    : { time: '12:30 PM', score: 28, level: 'Moderate' as RiskLevel }

  const highestForecastDay = forecast.days.reduce<ApiForecastDay | null>((prev, cur) => {
    if (!prev) return cur
    return (cur.risk_score ?? 0) > (prev.risk_score ?? 0) ? cur : prev
  }, null)

  const primaryDriver = risk.drivers && risk.drivers.length > 0 ? risk.drivers[0] : null

  const metrics: Metric[] = [
    { label: 'Current temperature', value: value(current.temperature_c, '°C'), detail: `Feels like ${value(current.apparent_temperature_c, '°C')}`, icon: 'thermometer' },
    { label: 'Heat risk level', value: riskLevel(risk.level), detail: 'Calculated from live weather and thermal data', icon: 'alert' },
    { label: 'Wards assessed', value: String(displayLocations.length), detail: 'Municipal wards actively monitored', icon: 'location' },
    { label: 'Peak heat window', value: risk.peak_window ? risk.peak_window.formatted_time : 'Unavailable', detail: risk.peak_window ? `${risk.peak_window.risk_score}/100 ${riskLevel(risk.peak_window.risk_level)}` : 'Not provided by backend', icon: 'clock' },
  ]

  return (
    <div className="space-y-6">
      {/* Current Risk Banner */}
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-orange-200 bg-orange-50 p-4 sm:flex-row sm:items-center">
        <div className="flex gap-3">
          <span className="mt-0.5 size-2 shrink-0 rounded-full bg-orange-500" />
          <div>
            <p className="font-semibold text-orange-950">Current heat risk: {riskLevel(risk.level)} ({risk.score}/100)</p>
            <p className="mt-1 text-sm text-orange-800">
              Live point-in-time assessment. Today's forecast peak is{' '}
              {risk.peak_window ? `${risk.peak_window.risk_score}/100 ${riskLevel(risk.peak_window.risk_level)} at ${risk.peak_window.formatted_time}` : 'Unavailable'}.
            </p>
          </div>
        </div>
        <RiskBadge risk={riskLevel(risk.level)} />
      </div>

      {/* Phase 6 Intelligence Cards Grid: Municipal Summary, Risk Outlook, Early Warning */}
      <section className="grid gap-5 lg:grid-cols-3">
        <MunicipalResponseSummaryCard summary={summary} />
        <HeatRiskOutlookCard
          currentScore={risk.score}
          currentLevel={riskLevel(risk.level)}
          todayPeakTime={todayPeak.time}
          todayPeakScore={todayPeak.score}
          todayPeakLevel={todayPeak.level}
          tomorrowPeakTime={tomorrowPeak.time}
          tomorrowPeakScore={tomorrowPeak.score}
          tomorrowPeakLevel={tomorrowPeak.level}
        />
        <EarlyWarningCard
          currentScore={risk.score}
          todayPeakScore={todayPeak.score}
          todayPeakTime={todayPeak.time}
          todayPeakLevel={todayPeak.level}
        />
      </section>

      {/* Top metrics grid */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </section>

      {/* 24-Hour Heat Trend Chart Section */}
      <section>
        <HeatTrendChart
          trends={trends}
          title="24-Hour Heat Trend (Pune Citywide)"
          description="Live hourly temperature, WBGT, and calculated risk score timeline derived from backend Open-Meteo observations."
        />
      </section>

      {/* Situation overview: Map + Current Weather */}
      <section className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
        <div>
          <PageIntro eyebrow="Situation overview" title="Heat risk across Pune" description="Interactive ward-level monitoring map based on exact ward coordinates. Click any marker to inspect." />
          <RiskMap locations={displayLocations} selected="" onSelect={onLocationSelect} />
        </div>
        <div className="space-y-5">
          <WeatherCard conditions={current} />
          <RiskScore score={risk.score} risk={riskLevel(risk.level)} />

          {primaryDriver && (
            <div className="rounded-xl border border-line bg-surface p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-brand">Primary Risk Driver</p>
              <div className="mt-2 flex items-baseline justify-between">
                <h4 className="text-xl font-bold">{primaryDriver.name}</h4>
                <span className="text-lg font-semibold text-brand">{primaryDriver.value}</span>
              </div>
              <p className="mt-1 text-xs text-muted">{primaryDriver.description}</p>
            </div>
          )}
        </div>
      </section>

      {/* Municipal Priority Ranking Section */}
      <section className="rounded-xl border border-line bg-surface p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-brand">Municipal Priority Ranking</p>
            <h3 className="text-xl font-bold">Priority Wards</h3>
          </div>
          <span className="text-xs text-muted">Sorted dynamically by backend risk score</span>
        </div>

        {allLowRisk && (
          <div className="mt-4 rounded-lg bg-emerald-50 p-3.5 text-sm text-emerald-900 border border-emerald-200">
            <span className="font-semibold">All monitored wards are currently Low risk.</span> Standard routine preparedness is active across all municipal sectors.
          </div>
        )}

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line text-xs font-semibold uppercase text-muted">
              <tr>
                <th className="pb-3 pl-2">Rank</th>
                <th className="pb-3">Ward Name</th>
                <th className="pb-3">Ward #</th>
                <th className="pb-3">Risk Score</th>
                <th className="pb-3">Level</th>
                <th className="pb-3 pr-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {sortedWards.map((loc, idx) => (
                <tr key={loc.id} className="hover:bg-canvas/50">
                  <td className="py-3.5 pl-2 font-bold text-muted">#{idx + 1}</td>
                  <td className="py-3.5 font-semibold text-ink">{loc.name}</td>
                  <td className="py-3.5 text-muted">{loc.ward}</td>
                  <td className="py-3.5 font-bold">{loc.risk_score}/100</td>
                  <td className="py-3.5">
                    <RiskBadge risk={riskLevel(loc.risk_level)} />
                  </td>
                  <td className="py-3.5 pr-2 text-right">
                    <button
                      type="button"
                      onClick={() => onLocationSelect(loc.name)}
                      className="rounded bg-brand-light px-2.5 py-1 text-xs font-semibold text-brand hover:bg-brand hover:text-white"
                    >
                      Inspect &rarr;
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Upcoming Heat Risk Alert Card */}
      {highestForecastDay && (
        <section className="rounded-xl border border-brand/20 bg-gradient-to-r from-brand-light to-canvas p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-brand">Upcoming Heat Risk</p>
              <h3 className="mt-1 text-2xl font-bold text-ink">
                {highestForecastDay.date} — Peak Heat Outlook
              </h3>
              <p className="mt-1 text-sm text-muted">
                Expected peak condition: <span className="font-semibold text-ink">{highestForecastDay.condition}</span> at{' '}
                <span className="font-semibold text-ink">{highestForecastDay.peak_time_local ?? '12:30 PM'}</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-3xl font-bold text-ink">{highestForecastDay.risk_score ?? 0}/100</p>
                <RiskBadge risk={highestForecastDay.risk_level ? riskLevel(highestForecastDay.risk_level) : 'Low'} />
              </div>
            </div>
          </div>
          <div className="mt-4 grid gap-4 border-t border-line/60 pt-4 sm:grid-cols-3 text-sm">
            <div>
              <span className="text-xs text-muted block">Peak WBGT</span>
              <span className="font-bold text-ink">{highestForecastDay.peak_conditions?.estimated_wbgt_c ?? '28.5'}°C</span>
            </div>
            <div>
              <span className="text-xs text-muted block">Expected High / Low</span>
              <span className="font-bold text-ink">{highestForecastDay.high_c}°C / {highestForecastDay.low_c}°C</span>
            </div>
            <div>
              <span className="text-xs text-muted block">Suggested Lead Time</span>
              <span className="font-bold text-brand">Prepare before 11:30 AM</span>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

export function HeatRiskMapPage({ onLocationSelect, onNavigateToDetail }: { onLocationSelect: (name: string) => void; onNavigateToDetail?: () => void }) {
  const [selected, setSelected] = useState('')
  const { data, error, loading } = useApiData(getLocations, 'locations')
  if (loading) return <Status message="Loading live location data..." />
  if (error || !data || data.locations.length === 0) return <Status message={error || 'Live location data is unavailable.'} isError />

  const locations = mapLocations(data.locations)
  const active = locations.find((item) => item.name === selected) ?? locations[0]
  const select = (name: string) => {
    setSelected(name)
    onLocationSelect(name)
  }

  return (
    <div>
      <PageIntro eyebrow="Spatial view" title="Heat risk map" description="Ward-level view of local heat conditions based on exact ward coordinates. Select an area to inspect its status." />
      <div className="grid gap-5 xl:grid-cols-[1fr_300px]">
        <RiskMap locations={locations} selected={active.name} onSelect={select} />
        <aside className="rounded-xl border border-line bg-surface p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-brand">Selected area</p>
          <h3 className="mt-1 text-2xl font-bold">{active.name}</h3>
          <p className="mt-0.5 text-sm text-muted">{active.ward}</p>
          <div className="my-4 border-y border-line py-4">
            <RiskScore score={active.score} risk={active.risk} />
          </div>
          <p className="text-xs leading-5 text-muted">Focus field checks and municipal public messaging here during peak afternoon heat windows.</p>
          {onNavigateToDetail && (
            <button
              type="button"
              onClick={() => {
                onLocationSelect(active.name)
                onNavigateToDetail()
              }}
              className="mt-4 w-full rounded-lg bg-brand px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand/90 focus:outline-none focus:ring-2 focus:ring-brand/50"
            >
              Inspect Ward Details &rarr;
            </button>
          )}
        </aside>
      </div>
      <div className="mt-5 flex flex-wrap gap-4 text-sm text-muted">
        {(['Low', 'Moderate', 'High', 'Severe'] as const).map((risk) => (
          <span key={risk} className="flex items-center gap-2">
            <i className={`size-2 rounded-full ${risk === 'Low' ? 'bg-emerald-500' : risk === 'Moderate' ? 'bg-amber-500' : risk === 'High' ? 'bg-orange-500' : 'bg-red-500'}`} />
            {risk}
          </span>
        ))}
      </div>
    </div>
  )
}

export function LocationDetailPage({ selectedLocationName, onLocationSelect }: { selectedLocationName: string; onLocationSelect?: (name: string) => void }) {
  const { data, error, loading } = useApiData(async () => {
    const locations = await getLocations()
    const selected = locations.locations.find((item) => item.name === selectedLocationName) ?? locations.locations[0]
    if (!selected) throw new Error('No locations returned by backend.')
    const [weather, risk, thermal, trends] = await Promise.all([
      getWeather(selected.latitude, selected.longitude, selected.name),
      getRisk(selected.name, selected.latitude, selected.longitude),
      getThermal(selected.latitude, selected.longitude, selected.name),
      getTrends(selected.name, selected.latitude, selected.longitude),
    ])
    return { locations: locations.locations, selected, weather, risk, thermal, trends }
  }, selectedLocationName)

  if (loading) return <Status message="Loading live location data..." />
  if (error || !data) return <Status message={error || 'Live location data is unavailable.'} isError />

  const { locations, selected, weather, risk, thermal, trends } = data
  const current = weather.conditions
  const level = riskLevel(risk.level)
  const topDriver = risk.drivers && risk.drivers.length > 0 ? risk.drivers[0] : null

  return (
    <div className="space-y-6">
      {/* Header and ward selector */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <PageIntro eyebrow={selected.ward} title={selected.name} description="Current local heat-risk summary and 24-hour ward trend for municipal response planning." />
        <div className="flex items-center gap-2">
          <label htmlFor="ward-select" className="text-sm font-medium text-muted">Select Ward:</label>
          <select
            id="ward-select"
            value={selected.name}
            onChange={(e) => onLocationSelect?.(e.target.value)}
            className="rounded-lg border border-line bg-surface px-3 py-2 text-sm font-medium text-ink shadow-sm outline-none focus:ring-2 focus:ring-brand/25"
          >
            {locations.map((loc) => (
              <option key={loc.name} value={loc.name}>
                {loc.name} ({loc.ward})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Top 3 metrics */}
      <section className="grid gap-5 lg:grid-cols-3">
        <RiskScore score={risk.score} risk={level} />
        <WeatherCard conditions={current} />
        <div className="rounded-xl border border-line bg-surface p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-brand">Peak Heat Window</p>
          <p className="mt-3 text-3xl font-bold">{risk.peak_window ? risk.peak_window.formatted_time : 'Unavailable'}</p>
          <p className="mt-2 text-sm text-muted">
            {risk.peak_window
              ? `Forecast Peak: ${risk.peak_window.risk_score}/100 ${riskLevel(risk.peak_window.risk_level)} — WBGT ${risk.peak_window.estimated_wbgt_c ?? 'N/A'}°C`
              : 'Not provided by backend'}
          </p>
        </div>
      </section>

      {/* 24-Hour Ward Heat Trend Section (Updates dynamically on ward change) */}
      <section>
        <HeatTrendChart
          trends={trends}
          title={`24-Hour Ward Heat Trend (${selected.name})`}
          description={`Calculated hourly heat risk score curve and peak callout for ${selected.name} (${selected.ward}).`}
        />
      </section>

      {/* Municipal Response Priority Section */}
      <section className="rounded-xl border border-brand/20 bg-surface p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wider text-brand">Municipal Response Priority</p>
        <div className="mt-3 grid gap-6 md:grid-cols-3">
          <div>
            <span className="text-xs text-muted block">Priority Level</span>
            <div className="mt-1 flex items-center gap-2">
              <RiskBadge risk={level} />
              <span className="font-bold text-ink">Score {risk.score}/100</span>
            </div>
          </div>
          <div>
            <span className="text-xs text-muted block">Primary Risk Factor</span>
            <p className="mt-1 font-bold text-ink">{topDriver ? `${topDriver.name} (${topDriver.value})` : 'Heat Index & Solar Radiation'}</p>
          </div>
          <div>
            <span className="text-xs text-muted block">Recommended Action</span>
            <p className="mt-1 text-sm font-medium text-brand">
              {level === 'Low'
                ? 'Standard routine preparedness'
                : level === 'Moderate'
                  ? 'Prepare hydration and shade prior to peak window'
                  : 'Activate municipal cooling centers & alerts'}
            </p>
          </div>
        </div>
      </section>

      {/* Key risk drivers */}
      <section>
        <h3 className="text-lg font-bold">Key risk drivers</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {riskDrivers(risk).concat(thermalDrivers(thermal)).map((driver) => (
            <RiskDriver key={driver.label} driver={driver} />
          ))}
        </div>
      </section>
    </div>
  )
}

export function ForecastPage() {
  const { data, error, loading } = useApiData(getForecast, 'forecast')
  if (loading) return <Status message="Loading live forecast data..." />
  if (error || !data) return <Status message={error || 'Live forecast data is unavailable.'} isError />

  const days = forecastDays(data.days)
  const highestDay = data.days.reduce<ApiForecastDay | null>((prev, cur) => {
    if (!prev) return cur
    return (cur.risk_score ?? 0) > (prev.risk_score ?? 0) ? cur : prev
  }, null)

  return (
    <div className="space-y-6">
      <PageIntro eyebrow="Outlook" title="5-day heat forecast" description="Use the forecast to plan staffing, communications, and cooling measures ahead of peak conditions." />

      {highestDay && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-5 shadow-sm">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-orange-900">Highest Expected Risk Day</span>
              <h3 className="mt-1 text-xl font-bold text-orange-950">
                {highestDay.date} — {highestDay.risk_score ?? 0}/100 {highestDay.risk_level ? riskLevel(highestDay.risk_level) : 'Low'}
              </h3>
              <p className="mt-1 text-sm text-orange-800">
                Peak heat expected at <span className="font-semibold">{highestDay.peak_time_local ?? '12:30 PM'}</span> with high of {highestDay.high_c}°C.
              </p>
            </div>
            {highestDay.risk_level && <RiskBadge risk={riskLevel(highestDay.risk_level)} />}
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {days.map((day) => (
          <ForecastCard key={day.day} day={day} />
        ))}
      </div>

      <div className="rounded-xl border border-line bg-surface p-5">
        <h3 className="font-bold">Planning note</h3>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">Forecast risk levels are calculated from Open-Meteo hourly forecast conditions using the HeatWatch risk engine.</p>
      </div>
    </div>
  )
}

export function RiskExplanationPage() {
  const { data, error, loading } = useApiData(() => Promise.all([getRisk(), getThermal()]), 'explanation')
  if (loading) return <Status message="Loading live risk explanation..." />
  if (error || !data) return <Status message={error || 'Live risk explanation is unavailable.'} isError />

  const [risk, thermal] = data
  const level = riskLevel(risk.level)

  return (
    <div className="max-w-4xl space-y-6">
      <PageIntro eyebrow="Method overview" title={`Why is heat risk ${risk.level} today?`} description="The current risk level reflects live weather conditions and estimated thermal outputs." />
      <div className="rounded-xl border border-line bg-surface p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-line pb-6 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm text-muted">Current heat risk</p>
            <p className="mt-1 text-3xl font-bold">
              {level} <span className="text-base font-medium text-muted">— score {risk.score}/100</span>
            </p>
          </div>
          <RiskBadge risk={level} />
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {riskDrivers(risk).concat(thermalDrivers(thermal)).map((driver) => (
            <RiskDriver key={driver.label} driver={driver} />
          ))}
        </div>
      </div>
      <p className="text-sm leading-6 text-muted">This is a decision-support summary based on live weather and estimated thermal conditions. It does not provide individual health predictions.</p>
    </div>
  )
}

export function ActionsPage() {
  const [actionsData, setActionsData] = useState<ResponseActionItem[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentRisk, setCurrentRisk] = useState<RiskResponse | null>(null)

  const loadActions = () => {
    Promise.all([getResponseActions(), getRisk()])
      .then(([res, r]) => {
        setActionsData(res.actions)
        setCurrentRisk(r)
        setLoading(false)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load response actions')
        setLoading(false)
      })
  }

  useEffect(() => {
    loadActions()
  }, [])

  if (loading) return <Status message="Loading live response actions & state..." />
  if (error || !actionsData) return <Status message={error || 'Response actions are unavailable.'} isError />

  const handleStatusChange = async (actionId: string, newStatus: 'pending' | 'in_progress' | 'completed') => {
    try {
      await updateActionStatus(actionId, newStatus)
      setActionsData((prev) => (prev ? prev.map((a) => (a.id === actionId ? { ...a, status: newStatus } : a)) : prev))
    } catch (err) {
      console.error('Failed to update action status:', err)
    }
  }

  const level = currentRisk ? riskLevel(currentRisk.level) : 'Low'
  const urgencyText: Record<RiskLevel, string> = {
    Low: 'Routine preparedness',
    Moderate: 'Prepare before peak',
    High: 'Activate heat response',
    Severe: 'Immediate response',
  }

  const stages: { stage: 'BEFORE PEAK' | 'DURING PEAK' | 'AFTER PEAK'; title: string; subtitle: string }[] = [
    { stage: 'BEFORE PEAK', title: 'Stage 1: Pre-Peak Preparation', subtitle: 'Actions to execute 1–2 hours prior to the estimated peak heat window.' },
    { stage: 'DURING PEAK', title: 'Stage 2: Peak Window Response', subtitle: 'Actions during maximum solar radiation and thermal stress hours.' },
    { stage: 'AFTER PEAK', title: 'Stage 3: Post-Peak Review & Recovery', subtitle: 'Post-heat review to log observations and reset municipal resources.' },
  ]

  return (
    <div className="space-y-8">
      <PageIntro eyebrow="Operational Response Timeline" title="Recommended actions" description="Interactive 3-stage municipal response timeline with persistent execution tracking." />

      <div className="flex flex-col justify-between gap-4 rounded-xl border border-brand/20 bg-brand-light p-5 sm:flex-row sm:items-center shadow-sm">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand">Current Municipal Operational Urgency</span>
          <h3 className="mt-1 text-2xl font-bold text-brand">{urgencyText[level]}</h3>
          <p className="mt-0.5 text-sm text-slate-700">Recommended for current heat risk ({level} risk level).</p>
        </div>
        <RiskBadge risk={level} />
      </div>

      {stages.map((stg) => {
        const stageActions = actionsData.filter((a) => a.stage === stg.stage)
        return (
          <section key={stg.stage} className="space-y-4">
            <div className="border-b border-line pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-brand">{stg.stage}</span>
              <h3 className="text-xl font-bold text-ink">{stg.title}</h3>
              <p className="text-xs text-muted">{stg.subtitle}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {stageActions.map((action) => (
                <ActionCard
                  key={action.id}
                  action={{
                    id: action.id,
                    title: action.title,
                    description: action.description,
                    audience: action.audience,
                    priority: action.priority,
                    status: action.status,
                    icon: action.stage === 'BEFORE PEAK' ? 'building' : action.stage === 'DURING PEAK' ? 'people' : 'heart',
                  }}
                  onStatusChange={(newStatus) => handleStatusChange(action.id, newStatus)}
                />
              ))}
            </div>
          </section>
        )
      })}

      <div className="rounded-xl border border-line bg-surface p-5">
        <h3 className="font-bold">Operational disclaimer</h3>
        <p className="mt-1 text-xs leading-6 text-muted">These are advisory municipal decision-support workflow suggestions based on live heat risk outputs. State status changes persist in the backend.</p>
      </div>
    </div>
  )
}

export function AlertCenterPage() {
  const [alertsData, setAlertsData] = useState<AlertsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'active' | 'acknowledged' | 'resolved'>('all')

  const fetchAlerts = () => {
    getAlerts()
      .then((res) => {
        setAlertsData(res)
        setLoading(false)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to fetch alerts')
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchAlerts()
  }, [])

  if (loading) return <Status message="Loading live municipal heat alerts..." />
  if (error || !alertsData) return <Status message={error || 'Alerts data is unavailable.'} isError />

  const handleUpdateAlert = async (alertId: string, newStatus: 'active' | 'acknowledged' | 'resolved') => {
    try {
      await updateAlertStatus(alertId, newStatus)
      setAlertsData((prev) => {
        if (!prev) return prev
        const updated = prev.alerts.map((a) => (a.id === alertId ? { ...a, status: newStatus } : a))
        const activeCount = updated.filter((a) => a.status === 'active').length
        return { alerts: updated, active_count: activeCount }
      })
    } catch (err) {
      console.error('Failed to update alert status:', err)
    }
  }

  const filteredAlerts = alertsData.alerts.filter((a) => (filter === 'all' ? true : a.status === filter))

  return (
    <div className="space-y-6">
      <PageIntro eyebrow="Early Warning Center" title="Municipal Alert Center" description="Monitor active and past heat warnings generated from live ward-level risk assessments." />

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
        <div className="flex gap-2">
          {(['all', 'active', 'acknowledged', 'resolved'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider ${filter === tab ? 'bg-brand text-white shadow-xs' : 'bg-surface border border-line text-muted hover:text-ink'}`}
            >
              {tab} ({tab === 'all' ? alertsData.alerts.length : alertsData.alerts.filter((a) => a.status === tab).length})
            </button>
          ))}
        </div>
        <span className="text-xs font-semibold text-brand">{alertsData.active_count} Active Alerts Total</span>
      </div>

      {/* Alerts List */}
      {filteredAlerts.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface p-8 text-center">
          <p className="text-lg font-bold text-ink">No active alerts.</p>
          <p className="mt-1 text-sm text-muted">All monitored municipal wards are currently within acceptable thermal safety thresholds.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredAlerts.map((alert) => {
            const alertTypeBadge =
              alert.alert_type === 'forecast_warning'
                ? { label: 'Forecast Warning', bg: 'bg-purple-100 text-purple-800 border-purple-200' }
                : alert.alert_type === 'early_warning'
                ? { label: 'Early Warning', bg: 'bg-orange-100 text-orange-800 border-orange-200' }
                : { label: 'Current Alert', bg: 'bg-red-100 text-red-800 border-red-200' }

            return (
              <article key={alert.id} className="rounded-xl border border-line bg-surface p-5 shadow-sm space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${alertTypeBadge.bg}`}>
                        {alertTypeBadge.label}
                      </span>
                      <RiskBadge risk={riskLevel(alert.severity)} />
                      <span className="text-xs text-muted font-mono">{alert.id}</span>
                    </div>
                    <h3 className="mt-2 text-xl font-bold text-ink">{alert.ward}</h3>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-center rounded-lg bg-canvas p-3 border border-line/60">
                  <div>
                    <span className="text-[11px] text-muted block font-semibold uppercase">Current Risk</span>
                    <span className="text-xl font-bold text-ink">{alert.current_risk_score ?? alert.risk_score}/100</span>
                  </div>
                  <div className="border-l border-line/60 pl-2">
                    <span className="text-[11px] text-brand block font-semibold uppercase">Expected Peak</span>
                    <span className="text-xl font-bold text-brand">{alert.expected_peak_score ?? alert.risk_score}/100</span>
                    <span className="block text-[10px] text-muted font-medium">@ {alert.expected_peak_time}</span>
                  </div>
                </div>

                <div className="rounded-lg bg-canvas p-3 text-xs space-y-1.5 border border-line/60">
                  <p className="text-muted">
                    <span className="font-semibold text-ink">Observed:</span> {alert.created_at}
                  </p>
                  <p className="text-muted">
                    <span className="font-semibold text-ink">Recommended Response:</span> {alert.recommended_response}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-line/60 pt-3 text-xs">
                  <span className="font-semibold capitalize text-muted">
                    Status:{' '}
                    <span className={alert.status === 'active' ? 'text-orange-600 font-bold' : alert.status === 'acknowledged' ? 'text-blue-600 font-bold' : 'text-emerald-600 font-bold'}>
                      {alert.status}
                    </span>
                  </span>
                  <div className="flex gap-1.5 font-medium">
                    {alert.status !== 'acknowledged' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateAlert(alert.id, 'acknowledged')}
                        className="rounded bg-slate-100 px-2.5 py-1 text-slate-700 hover:bg-slate-200"
                      >
                        Acknowledge
                      </button>
                    )}
                    {alert.status !== 'resolved' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateAlert(alert.id, 'resolved')}
                        className="rounded bg-emerald-600 text-white px-2.5 py-1 hover:bg-emerald-700"
                      >
                        Resolve
                      </button>
                    )}
                    {alert.status !== 'active' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateAlert(alert.id, 'active')}
                        className="rounded bg-amber-500 text-white px-2.5 py-1 hover:bg-amber-600"
                      >
                        Reactivate
                      </button>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
        </div>

      )}
    </div>
  )
}

export function AIIntelligencePage() {
  const [overview, setOverview] = useState<AIOverviewResponse | null>(null)
  const [wardAnalysis, setWardAnalysis] = useState<WardAIAnalysisResponse | null>(null)
  const [brief, setBrief] = useState<MunicipalBriefResponse | null>(null)
  const [selectedWard, setSelectedWard] = useState('Shivajinagar')
  const [loading, setLoading] = useState(true)
  const [briefLoading, setBriefLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getAIOverview(), getWardAIAnalysis(selectedWard)])
      .then(([ov, ward]) => {
        setOverview(ov)
        setWardAnalysis(ward)
        setLoading(false)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load AI intelligence data.')
        setLoading(false)
      })
  }, [])

  const handleSelectWard = async (ward: string) => {
    setSelectedWard(ward)
    try {
      const res = await getWardAIAnalysis(ward)
      setWardAnalysis(res)
    } catch (err) {
      console.error('Failed to fetch ward AI analysis:', err)
    }
  }

  const handleGenerateBrief = async () => {
    setBriefLoading(true)
    try {
      const res = await getMunicipalBrief()
      setBrief(res)
    } catch (err) {
      console.error('Failed to generate brief:', err)
    } finally {
      setBriefLoading(false)
    }
  }

  if (loading) return <Status message="Loading AI Heat Intelligence suite..." />
  if (error || !overview) return <Status message={error || 'AI intelligence payload is unavailable.'} isError />

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Decision Support System"
        title="AI Heat Intelligence"
        description="Explainable AI-assisted municipal heat-risk analysis."
      />

      {/* System Mode Disclaimer Banner */}
      <div className="flex flex-col justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50/70 p-4 sm:flex-row sm:items-center text-xs text-slate-800">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-brand" />
          <span className="font-semibold text-brand">{overview.system_note}</span>
        </div>
        <span className="text-muted">Explicit distinction: Current Risk vs Forecast Peak Risk vs Early Warning</span>
      </div>

      {/* Data Quality & Integrity Status */}
      <DataQualityCard dataQuality={overview.data_quality} />

      {/* Executive Overview Metric Cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border border-line bg-surface p-4 shadow-sm">
          <span className="text-xs text-muted block">Citywide Risk</span>
          <p className="mt-1 text-2xl font-bold text-ink">{overview.city_risk_score}/100</p>
          <span className="mt-1 text-xs font-semibold capitalize text-brand">{overview.city_risk_level} Level</span>
        </div>
        <div className="rounded-xl border border-line bg-surface p-4 shadow-sm">
          <span className="text-xs text-muted block">Highest-Risk Ward</span>
          <p className="mt-1 text-xl font-bold text-ink truncate">{overview.highest_risk_ward}</p>
          <span className="mt-1 text-xs font-semibold text-orange-600">Priority Ward #1</span>
        </div>
        <div className="rounded-xl border border-line bg-surface p-4 shadow-sm">
          <span className="text-xs text-muted block">Expected Peak Risk</span>
          <p className="mt-1 text-2xl font-bold text-brand">{overview.expected_peak_score}/100</p>
          <span className="mt-1 text-xs font-medium text-slate-600">@ {overview.expected_peak_time}</span>
        </div>
        <div className="rounded-xl border border-line bg-surface p-4 shadow-sm">
          <span className="text-xs text-muted block">Thermal Risk Trend</span>
          <p className="mt-1 text-2xl font-bold text-ink">{overview.trend}</p>
          <span className="mt-1 text-xs text-muted">Baseline to Peak</span>
        </div>
        <div className="rounded-xl border border-line bg-surface p-4 shadow-sm">
          <span className="text-xs text-muted block">Active Warnings</span>
          <p className="mt-1 text-2xl font-bold text-orange-600">{overview.active_warnings_count}</p>
          <span className="mt-1 text-xs text-muted">Across monitored wards</span>
        </div>
      </section>

      {/* Municipal Brief Generator Card */}
      <MunicipalBriefCard brief={brief} onGenerate={handleGenerateBrief} loading={briefLoading} />

      {/* Explainable Ward Analysis Card */}
      <WardAIAnalysisCard analysis={wardAnalysis} selectedWard={selectedWard} onSelectWard={handleSelectWard} />

      {/* Ward Comparison Table */}
      <WardComparisonTable rows={overview.ward_comparisons} />
    </div>
  )
}

export * from './MobilePages'




