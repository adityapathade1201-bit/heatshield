import React, { useState } from 'react'
import type {
  ActionExplanationResponse,
  DataQualityStatus,
  MunicipalBriefResponse,
  RiskLevel,
  WardAIAnalysisResponse,
  WardComparisonRow,
} from '../types'


import { getAIActionExplanation } from '../services/api'

function capitalize(str: string): RiskLevel {
  if (!str) return 'Low'
  const lower = str.toLowerCase()
  if (lower === 'moderate') return 'Moderate'
  if (lower === 'high') return 'High'
  if (lower === 'severe') return 'Severe'
  return 'Low'
}

export function RiskBadge({ risk }: { risk: RiskLevel }) {
  const riskStyles: Record<RiskLevel, string> = {
    Low: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    Moderate: 'bg-amber-50 text-amber-700 ring-amber-200',
    High: 'bg-orange-50 text-orange-700 ring-orange-200',
    Severe: 'bg-red-50 text-red-700 ring-red-200',
  }
  const dotStyles: Record<RiskLevel, string> = {
    Low: 'bg-emerald-500',
    Moderate: 'bg-amber-500',
    High: 'bg-orange-500',
    Severe: 'bg-red-500',
  }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${riskStyles[risk]}`}>
      <span className={`size-1.5 rounded-full ${dotStyles[risk]}`} />
      {risk}
    </span>
  )
}

export function DataQualityCard({ dataQuality }: { dataQuality: DataQualityStatus }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between border-b border-line/60 pb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-brand">DATA INTEGRITY & QUALITY</span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          {dataQuality.overall_status}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
        <div className="rounded-lg bg-canvas p-2.5 border border-line/60">
          <span className="text-muted block">Live Weather API</span>
          <span className="font-semibold text-emerald-600">Connected</span>
        </div>
        <div className="rounded-lg bg-canvas p-2.5 border border-line/60">
          <span className="text-muted block">Forecast Model</span>
          <span className="font-semibold text-emerald-600">Active (Hourly)</span>
        </div>
        <div className="rounded-lg bg-canvas p-2.5 border border-line/60">
          <span className="text-muted block">Thermal Models</span>
          <span className="font-semibold text-emerald-600">WBGT & Globe Temp</span>
        </div>
        <div className="rounded-lg bg-canvas p-2.5 border border-line/60">
          <span className="text-muted block">Ward Coordinates</span>
          <span className="font-semibold text-emerald-600">4 Monitored Wards</span>
        </div>
      </div>
    </div>
  )
}

export function WardAIAnalysisCard({
  analysis,
  selectedWard,
  onSelectWard,
}: {
  analysis: WardAIAnalysisResponse | null
  selectedWard: string
  onSelectWard: (ward: string) => void
}) {
  const wards = ['Shivajinagar', 'Yerawada', 'Kothrud', 'Hadapsar']

  return (
    <div className="rounded-xl border border-line bg-surface p-5 shadow-sm space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand">EXPLAINABLE AI WARD ANALYSIS</span>
          <h3 className="text-xl font-bold text-ink">Ward Microclimate & Risk Synthesis</h3>
        </div>
        <div className="flex gap-1 rounded-lg bg-canvas p-1 border border-line/80">
          {wards.map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => onSelectWard(w)}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${selectedWard === w ? 'bg-brand text-white shadow-xs' : 'text-muted hover:text-ink'}`}
            >
              {w}
            </button>
          ))}
        </div>
      </div>

      {analysis ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center border-t border-line/60 pt-3">
            <div className="rounded-lg bg-canvas p-3 border border-line/60">
              <span className="text-xs text-muted block">Current Risk Score</span>
              <span className="text-2xl font-bold text-ink">{analysis.current_risk_score}/100</span>
              <div className="mt-1 flex justify-center">
                <RiskBadge risk={capitalize(analysis.current_risk_level)} />
              </div>
            </div>
            <div className="rounded-lg bg-canvas p-3 border border-line/60">
              <span className="text-xs text-muted block">Expected Peak Risk</span>
              <span className="text-2xl font-bold text-ink">{analysis.forecast_peak_score}/100</span>
              <div className="mt-1 flex justify-center">
                <RiskBadge risk={capitalize(analysis.forecast_peak_level)} />
              </div>
            </div>
            <div className="rounded-lg bg-canvas p-3 border border-line/60">
              <span className="text-xs text-muted block">Expected Peak Time</span>
              <span className="text-lg font-bold text-brand">{analysis.forecast_peak_time}</span>
              <span className="text-[11px] text-muted block">Today</span>
            </div>
            <div className="rounded-lg bg-canvas p-3 border border-line/60">
              <span className="text-xs text-muted block">Primary Driver</span>
              <span className="text-sm font-bold text-ink mt-1 block truncate">{analysis.primary_driver}</span>
            </div>
          </div>

          <div className="rounded-lg bg-blue-50/70 p-4 border border-blue-200/70 text-slate-900">
            <p className="text-xs font-bold text-brand uppercase tracking-wider mb-1">AI Analytical Rationale</p>
            <p className="text-sm leading-relaxed">{analysis.interpretation}</p>
          </div>

          <div>
            <p className="text-xs font-bold text-muted uppercase tracking-wider mb-2">Live Weather & Thermal Load Indicators</p>
            <div className="flex flex-wrap gap-2">
              {analysis.supporting_factors.map((factor, idx) => (
                <span key={idx} className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-3 py-1 text-xs font-medium text-slate-800 border border-slate-200">
                  <span className="text-muted">{factor.label}:</span>
                  <span className="font-bold text-brand">{factor.value}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="py-8 text-center text-sm text-muted">Loading AI ward analysis...</div>
      )}
    </div>
  )
}

export function WardComparisonTable({ rows }: { rows: WardComparisonRow[] }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-5 shadow-sm space-y-3">
      <div className="flex justify-between items-center">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand">COMPARATIVE WARD MATRIX</span>
          <h3 className="text-lg font-bold text-ink">Monitored Municipal Wards Comparison</h3>
        </div>
        <span className="text-xs text-muted">4 Monitored Wards</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-canvas text-xs font-semibold uppercase text-muted">
            <tr>
              <th className="py-2.5 px-3">Ward</th>
              <th className="py-2.5 px-3">Current Risk</th>
              <th className="py-2.5 px-3">Current Level</th>
              <th className="py-2.5 px-3">Forecast Peak</th>
              <th className="py-2.5 px-3">Peak Time</th>
              <th className="py-2.5 px-3">Trend</th>
              <th className="py-2.5 px-3">Priority</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/60">
            {rows.map((row) => (
              <tr key={row.ward} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3 px-3 font-semibold text-ink">{row.ward}</td>
                <td className="py-3 px-3 font-bold">{row.current_score}/100</td>
                <td className="py-3 px-3">
                  <RiskBadge risk={capitalize(row.current_level)} />
                </td>
                <td className="py-3 px-3 font-bold text-brand">{row.peak_score}/100</td>
                <td className="py-3 px-3 font-medium text-slate-700">{row.peak_time}</td>
                <td className="py-3 px-3">
                  <span className={`inline-flex items-center text-xs font-semibold ${row.trend === 'Increasing' ? 'text-orange-600' : 'text-slate-600'}`}>
                    {row.trend === 'Increasing' ? '↑ ' : ''}{row.trend}
                  </span>
                </td>
                <td className="py-3 px-3">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${row.priority === 'High' ? 'bg-orange-100 text-orange-800' : row.priority === 'Medium' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'}`}>
                    {row.priority}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function MunicipalBriefCard({
  brief,
  onGenerate,
  loading,
}: {
  brief: MunicipalBriefResponse | null
  onGenerate: () => void
  loading?: boolean
}) {
  return (
    <div className="rounded-xl border border-line bg-surface p-5 shadow-sm space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand">EXECUTIVE AI BRIEFING</span>
          <h3 className="text-xl font-bold text-ink">Municipal Operational Brief</h3>
        </div>
        <button
          type="button"
          onClick={onGenerate}
          disabled={loading}
          className="inline-flex items-center justify-center rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-dark disabled:opacity-50 transition-colors"
        >
          {loading ? 'Synthesizing Brief...' : 'Generate Municipal Brief'}
        </button>
      </div>

      {brief ? (
        <div className="space-y-3 rounded-xl border border-brand/20 bg-brand-light/30 p-4">
          <div className="flex items-center justify-between text-xs text-muted border-b border-brand/10 pb-2">
            <span className="font-semibold text-brand">Length: {brief.word_count} words (Advisory standard &lt;120 words)</span>
            <span>Generated: {new Date(brief.generated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>

          <p className="text-sm font-medium leading-relaxed text-ink font-mono bg-surface p-3.5 rounded-lg border border-line/60">
            {brief.brief_text}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
            <div className="rounded-lg bg-surface p-2.5 border border-line/60">
              <span className="text-muted block font-semibold">Priority Action</span>
              <span className="text-ink">{brief.priority_action}</span>
            </div>
            <div className="rounded-lg bg-surface p-2.5 border border-line/60">
              <span className="text-muted block font-semibold">Watch Window</span>
              <span className="text-brand font-bold">{brief.watch_window}</span>
            </div>
          </div>
          <p className="text-[11px] text-muted italic pt-1">{brief.disclaimer}</p>
        </div>
      ) : (
        <div className="py-6 text-center text-xs text-muted border border-dashed border-line rounded-lg">
          Click "Generate Municipal Brief" to synthesize an operational summary under 120 words.
        </div>
      )}
    </div>
  )
}

export function ActionExplanationModal({
  actionId,
  onClose,
}: {
  actionId: string
  onClose: () => void
}) {
  const [explanation, setExplanation] = useState<ActionExplanationResponse | null>(null)
  const [loading, setLoading] = useState(true)

  React.useEffect(() => {
    getAIActionExplanation(actionId)
      .then((res) => {
        setExplanation(res)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [actionId])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl border border-line space-y-4">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand">DATA-BACKED RATIONALE</span>
            <h4 className="font-bold text-ink text-base">{explanation?.title || 'Action Explainability'}</h4>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-muted hover:bg-slate-100 hover:text-ink">
            ✕
          </button>
        </div>

        {loading ? (
          <p className="py-4 text-center text-xs text-muted">Retrieving data-backed rationale...</p>
        ) : explanation ? (
          <div className="space-y-3">
            <div>
              <span className="text-xs text-muted block">Primary Model Factor</span>
              <span className="text-sm font-bold text-brand">{explanation.primary_factor}</span>
            </div>
            <div className="rounded-lg bg-canvas p-3 border border-line/60">
              <span className="text-xs text-muted block font-semibold mb-1">Data-Driven Rationale</span>
              <p className="text-xs leading-relaxed text-ink">{explanation.data_driven_reason}</p>
            </div>
            <div>
              <span className="text-xs text-muted block mb-1.5 font-semibold">Supporting Environmental Measurements</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {explanation.supporting_factors.map((f, i) => (
                  <div key={i} className="rounded bg-slate-100 p-2 border border-slate-200">
                    <span className="text-muted block text-[10px]">{f.label}</span>
                    <span className="font-bold text-ink">{f.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <p className="py-4 text-center text-xs text-muted">Explanation unavailable.</p>
        )}
      </div>
    </div>
  )
}
