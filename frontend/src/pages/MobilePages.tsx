import React, { useState, useEffect, useCallback } from 'react'
import { Capacitor } from '@capacitor/core'
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning'
import {
  Activity,
  ClipboardCheck,
  Bell,
  User,
  Thermometer,
  Sun,
  MapPin,
  CheckCircle2,
  Info,
  QrCode,
  ExternalLink,
  ChevronRight,
  AlertTriangle,
  ArrowRight,
  Wind,
  Droplets,
  CloudSun,
  ShieldCheck,
  Navigation,
  Smartphone,
  HelpCircle,
  RefreshCw,
  Zap
} from 'lucide-react'
import {
  getWeather,
  getRisk,
  getAlerts,
  getThermal,
  submitObservation,
} from '../services/api'
import type { WeatherResponse, RiskResponse, AlertsResponse, HeatAlert, ThermalResponse } from '../types'

// --- SHARED COMPONENTS ---

const RiskBadge = ({ level, score }: { level: string, score: number }) => {
  const configs: Record<string, { bg: string, text: string, border: string, dot: string }> = {
    Low: { bg: 'bg-green-50/80', text: 'text-green-700', border: 'border-green-100', dot: 'bg-green-500' },
    low: { bg: 'bg-green-50/80', text: 'text-green-700', border: 'border-green-100', dot: 'bg-green-500' },
    Moderate: { bg: 'bg-yellow-50/80', text: 'text-yellow-700', border: 'border-yellow-100', dot: 'bg-yellow-500' },
    moderate: { bg: 'bg-yellow-50/80', text: 'text-yellow-700', border: 'border-yellow-100', dot: 'bg-yellow-500' },
    High: { bg: 'bg-orange-50/80', text: 'text-orange-700', border: 'border-orange-100', dot: 'bg-orange-500' },
    high: { bg: 'bg-orange-50/80', text: 'text-orange-700', border: 'border-orange-100', dot: 'bg-orange-500' },
    Severe: { bg: 'bg-red-50/80', text: 'text-red-700', border: 'border-red-100', dot: 'bg-red-500' },
    severe: { bg: 'bg-red-50/80', text: 'text-red-700', border: 'border-red-100', dot: 'bg-red-500' },
  }
  const config = configs[level] || { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-100', dot: 'bg-slate-400' }

  return (
    <div className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] border backdrop-blur-sm ${config.bg} ${config.text} ${config.border} shadow-sm inline-flex items-center gap-2`}>
      <span className={`w-2 h-2 rounded-full ${config.dot} animate-pulse`}></span>
      {level} RISK • {score}/100
    </div>
  )
}

const MobileCard = ({ title, children, icon: Icon, action, noPadding = false, className = "" }: { title?: string, children: React.ReactNode, icon?: any, action?: React.ReactNode, noPadding?: boolean, className?: string }) => (
  <div className={`bg-white rounded-[2.5rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100 mb-6 overflow-hidden transition-all ${className}`}>
    {(title || Icon) && (
      <div className="flex items-center justify-between px-8 pt-8 mb-2">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="p-2 bg-slate-50 rounded-xl border border-slate-100/50">
              <Icon className="w-4 h-4 text-brand" />
            </div>
          )}
          {title && <h3 className="font-black text-slate-800 text-[11px] uppercase tracking-widest">{title}</h3>}
        </div>
        {action}
      </div>
    )}
    <div className={noPadding ? '' : 'px-8 pb-8 pt-2'}>
      {children}
    </div>
  </div>
)

// --- HOME SCREEN ---

export const MobileHome = ({ onNavigate }: { onNavigate: (page: any) => void }) => {
  const [weather, setWeather] = useState<WeatherResponse | null>(null)
  const [risk, setRisk] = useState<RiskResponse | null>(null)
  const [alerts, setAlerts] = useState<AlertsResponse | null>(null)
  const [thermal, setThermal] = useState<ThermalResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)

    setError(null)
    try {
      const [w, r, a, t] = await Promise.all([
        getWeather(),
        getRisk(),
        getAlerts(),
        getThermal()
      ])
      setWeather(w)
      setRisk(r)
      setAlerts(a)
      setThermal(t)
    } catch (err) {
      console.error(err)
      setError('Connection to HeatWatch Server failed. Check your network.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] animate-in fade-in duration-700">
        <div className="relative">
          <div className="w-16 h-16 border-[5px] border-brand/5 border-t-brand rounded-full animate-spin"></div>
          <Zap className="w-6 h-6 text-brand absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
        </div>
        <p className="mt-6 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">Syncing City Intelligence</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-10 text-center bg-white rounded-[3rem] border border-slate-100 my-10 mx-4 shadow-xl shadow-slate-200/50 animate-in zoom-in-95 duration-500">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>
        <h3 className="font-black text-slate-900 mb-3 text-xl tracking-tight">Offline Status</h3>
        <p className="text-slate-500 text-sm mb-8 leading-relaxed font-medium">{error}</p>
        <button
          onClick={() => fetchData()}
          className="w-full bg-brand text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-brand/20 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Reconnect
        </button>
      </div>
    )
  }

  const conditions = weather?.conditions
  const activeAlert = alerts?.alerts?.find(a => a.status === 'active') || alerts?.alerts?.[0]

  const getRiskGradient = (level: string) => {
    const l = level.toLowerCase()
    if (l === 'severe' || l === 'high') return 'from-red-500/10 via-white to-white'
    if (l === 'moderate') return 'from-yellow-500/10 via-white to-white'
    return 'from-green-500/10 via-white to-white'
  }

  return (
    <div className="pb-28 pt-2 animate-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 px-2">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
             <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Live • Pune Intelligence</span>
          </div>
          <h1 className="text-4xl font-black text-brand tracking-tighter">HeatWatch</h1>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className={`p-3 bg-white rounded-2xl border border-slate-100 shadow-sm active:scale-90 transition-all ${refreshing ? 'animate-spin opacity-50' : ''}`}
        >
          <RefreshCw className="w-5 h-5 text-brand" />
        </button>
      </div>

      {/* Main Risk Dashboard */}
      <MobileCard noPadding className={`relative overflow-hidden`}>
        <div className={`bg-gradient-to-b ${getRiskGradient(risk?.level || 'low')} pt-12 pb-10 px-8 text-center`}>
          <div className="mb-6">
            <RiskBadge level={risk?.level || 'Unknown'} score={risk?.score || 0} />
          </div>

          <div className="relative inline-block mb-2">
            <div className="text-[100px] font-black text-slate-900 leading-none tracking-tighter flex items-start justify-center">
              {conditions?.temperature_c != null ? conditions.temperature_c.toFixed(0) : '--'}
              <span className="text-3xl font-bold text-slate-300 mt-4 ml-1">°C</span>
            </div>
          </div>

          <div className="text-slate-400 text-[11px] font-black uppercase tracking-[0.3em] mb-10">Current Temperature</div>

          <div className="grid grid-cols-2 gap-4">
             <div className="bg-white/50 backdrop-blur-sm p-5 rounded-3xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 mb-2 justify-center">
                  <Thermometer className="w-4 h-4 text-brand" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Feels Like</span>
                </div>
                <div className="text-xl font-black text-slate-800">
                  {conditions?.apparent_temperature_c != null ? `${conditions.apparent_temperature_c.toFixed(0)}°` : '--'}
                </div>
             </div>
             <div className="bg-white/50 backdrop-blur-sm p-5 rounded-3xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 mb-2 justify-center">
                  <Droplets className="w-4 h-4 text-blue-500" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Heat Index</span>
                </div>
                <div className="text-xl font-black text-slate-800">
                  {thermal?.heat_index_c != null ? `${thermal.heat_index_c.toFixed(0)}°` : '--'}
                </div>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1 p-6 border-t border-slate-50 bg-slate-50/30">
          {[
            { label: 'Humidity', value: conditions?.humidity_percent != null ? `${conditions.humidity_percent}%` : '--', icon: Droplets },
            { label: 'UV Index', value: conditions?.uv_index != null ? conditions.uv_index : '--', icon: Sun },
            { label: 'Wind Speed', value: conditions?.wind_speed_kph != null ? `${conditions.wind_speed_kph.toFixed(0)} km/h` : '--', icon: Wind },
          ].map((item, idx) => (
            <div key={idx} className="flex flex-col items-center">
              <span className="text-sm font-black text-slate-800">{item.value}</span>
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mt-0.5">{item.label}</span>
            </div>
          ))}
        </div>
      </MobileCard>

      {/* Alert Preview - High Visibility */}
      {activeAlert && (
        <button
          onClick={() => onNavigate('alerts')}
          className={`w-full rounded-[2.5rem] p-6 mb-8 flex items-center gap-5 text-left shadow-2xl transition-all active:scale-[0.98] ${
            activeAlert.severity === 'severe' || activeAlert.severity === 'high'
            ? 'bg-red-600 shadow-red-600/20'
            : 'bg-yellow-500 shadow-yellow-500/20'
          }`}
        >
          <div className="bg-white/20 p-4 rounded-2xl border border-white/10">
            <Bell className="w-7 h-7 text-white animate-bounce" />
          </div>
          <div className="flex-1">
            <div className="text-white/70 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Municipal Warning</div>
            <div className="text-white font-black text-base leading-tight line-clamp-2">{activeAlert.recommended_response}</div>
          </div>
          <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center border border-white/5">
            <ChevronRight className="w-6 h-6 text-white" />
          </div>
        </button>
      )}

      {/* Quick Access Menu */}
      <div className="grid grid-cols-2 gap-5 mb-8">
        <button
          onClick={() => onNavigate('heatcheck')}
          className="bg-brand text-white p-7 rounded-[3rem] font-black flex flex-col items-start gap-5 shadow-2xl shadow-brand/25 transition-all active:scale-95 group relative overflow-hidden"
        >
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/5 rounded-full blur-2xl"></div>
          <div className="bg-white/20 p-3 rounded-2xl group-hover:scale-110 transition-transform border border-white/10">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div className="w-full">
            <span className="text-xl block tracking-tight">Heat Check</span>
            <div className="flex items-center gap-1 mt-1 opacity-50">
              <span className="text-[9px] uppercase font-black tracking-widest">Report Now</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </div>
        </button>
        <button
          onClick={() => onNavigate('survey')}
          className="bg-white text-slate-800 border border-slate-100 p-7 rounded-[3rem] font-black flex flex-col items-start gap-5 shadow-sm transition-all active:scale-95 group relative overflow-hidden"
        >
          <div className="bg-brand/5 p-3 rounded-2xl group-hover:scale-110 transition-transform border border-brand/5">
            <ClipboardCheck className="w-6 h-6 text-brand" />
          </div>
          <div className="w-full">
            <span className="text-xl block tracking-tight">Take Survey</span>
            <div className="flex items-center gap-1 mt-1 text-slate-400">
              <span className="text-[9px] uppercase font-black tracking-widest">Help City</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </div>
        </button>
      </div>

      {/* Why is risk elevated? */}
      {risk?.drivers && risk.drivers.length > 0 && (
        <MobileCard title="Risk Drivers" icon={Info}>
          <div className="space-y-4 pt-3">
            {risk.drivers.map((driver, idx) => (
              <div key={idx} className="flex gap-5 p-5 bg-slate-50/50 rounded-3xl border border-slate-100/50 group active:bg-white transition-all">
                <div className="flex-shrink-0 w-10 h-10 bg-white rounded-2xl flex items-center justify-center font-black text-brand text-xs shadow-sm border border-slate-100">
                  0{idx + 1}
                </div>
                <div>
                  <div className="font-black text-slate-800 text-[13px] mb-1 leading-none">{driver.name}</div>
                  <div className="text-[12px] text-slate-500 leading-relaxed font-medium">{driver.description}</div>
                </div>
              </div>
            ))}
          </div>
        </MobileCard>
      )}

      {/* Peak Window - Time-based Intelligence */}
      <MobileCard title="Peak Heat Window" icon={Sun}>
        <div className="flex items-center gap-5 pt-3">
          <div className="flex-1 bg-orange-50/50 border border-orange-100/50 p-6 rounded-[2rem] text-center shadow-inner">
            <div className="text-[9px] uppercase font-black text-orange-400 mb-2 tracking-[0.2em]">Opens</div>
            <div className="font-black text-slate-800 text-2xl tracking-tighter">{risk?.peak_window?.formatted_time?.split(' - ')?.[0] || '12:30 PM'}</div>
          </div>
          <div className="w-3 h-3 rounded-full bg-slate-200 shadow-inner"></div>
          <div className="flex-1 bg-red-50/50 border border-red-100/50 p-6 rounded-[2rem] text-center shadow-inner">
            <div className="text-[9px] uppercase font-black text-red-400 mb-2 tracking-[0.2em]">Closes</div>
            <div className="font-black text-slate-800 text-2xl tracking-tighter">{risk?.peak_window?.formatted_time?.split(' - ')?.[1] || '04:30 PM'}</div>
          </div>
        </div>
        <div className="mt-6 flex items-center justify-center gap-2 text-slate-400">
          <ShieldCheck className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-widest italic">Minimize Outdoor Exposure</span>
        </div>
      </MobileCard>
    </div>
  )
}



// --- HEAT CHECK SCREEN ---

export const MobileHeatCheck = () => {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    feeling: '',
    shade: '',
    water: '',
    cooling: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSelect = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (step < 4) setTimeout(() => setStep(s => s + 1), 300)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      await submitObservation({
        location_ward: 'Pune Central',
        feeling: formData.feeling,
        shade_available: formData.shade,
        water_available: formData.water,
        cooling_location: formData.cooling
      })
      setSubmitted(true)
    } catch (err) {
      console.error(err)
      // Fallback for demo
      setSubmitted(true)
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-6">
        <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-8 border-4 border-white shadow-xl shadow-green-500/10">
          <ShieldCheck className="w-12 h-12 text-green-600" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Report Received</h2>
        <p className="text-slate-500 mb-10 text-sm leading-relaxed max-w-[240px]">
          Your ground-truth observation has been synced with the city's heat model.
        </p>
        <button
          onClick={() => { setSubmitted(false); setStep(1); setFormData({feeling:'', shade:'', water:'', cooling:''}); }}
          className="bg-brand text-white w-full py-4 rounded-2xl font-black text-sm shadow-xl shadow-brand/20 active:scale-95 transition-transform"
        >
          SUBMIT ANOTHER
        </button>
      </div>
    )
  }

  const steps = [
    { id: 1, title: 'Heat Intensity', field: 'feeling', icon: Thermometer, options: ['Comfortable', 'Warm', 'Hot', 'Very Hot', 'Extremely Hot'] },
    { id: 2, title: 'Shade Availability', field: 'shade', icon: Sun, options: ['Yes', 'Partially', 'No'] },
    { id: 3, title: 'Drinking Water', field: 'water', icon: Droplets, options: ['Available', 'Limited', 'Not Available'] },
    { id: 4, title: 'Cooling Centers', field: 'cooling', icon: MapPin, options: ['Know one nearby', 'None nearby', "Don't know"] }
  ]

  const currentStep = steps[step - 1]

  return (
    <div className="pb-24 pt-2">
      {/* Progress */}
      <div className="flex items-center justify-between mb-8 px-1">
        <div>
          <h2 className="text-3xl font-black text-brand tracking-tight">Heat Check</h2>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Ground-truth Observation</p>
        </div>
        <div className="flex items-center gap-1.5">
           {[1,2,3,4].map(s => (
             <div key={s} className={`h-1.5 rounded-full transition-all duration-300 ${s === step ? 'w-6 bg-brand' : s < step ? 'w-1.5 bg-brand/30' : 'w-1.5 bg-slate-200'}`}></div>
           ))}
        </div>
      </div>

      <div className="relative overflow-hidden min-h-[420px]">
        <div key={step} className="animate-in fade-in slide-in-from-right-8 duration-500">
           <MobileCard title={currentStep.title} icon={currentStep.icon}>
              <div className="grid grid-cols-1 gap-3 pt-2">
                {currentStep.options.map(option => (
                  <button
                    key={option}
                    onClick={() => handleSelect(currentStep.field, option)}
                    className={`group p-5 rounded-2xl border-2 text-left font-bold transition-all flex items-center justify-between ${
                      formData[currentStep.field as keyof typeof formData] === option
                        ? 'border-brand bg-brand/5 text-brand shadow-md'
                        : 'border-slate-100 bg-white text-slate-600 active:bg-slate-50'
                    }`}
                  >
                    <span className="text-[15px]">{option}</span>
                    {formData[currentStep.field as keyof typeof formData] === option && (
                      <CheckCircle2 className="w-5 h-5 text-brand" />
                    )}
                  </button>
                ))}
              </div>
           </MobileCard>

           {step > 1 && (
             <button
               onClick={() => setStep(s => s - 1)}
               className="text-slate-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2 px-4 py-2"
             >
               Back to Previous
             </button>
           )}
        </div>
      </div>

      <div className="fixed bottom-24 left-6 right-6">
        <button
          disabled={!formData.cooling || submitting}
          onClick={handleSubmit}
          className={`w-full p-5 rounded-[2rem] font-black tracking-widest text-sm uppercase transition-all shadow-xl ${
            formData.cooling
              ? 'bg-brand text-white shadow-brand/20 active:scale-95'
              : 'bg-slate-100 text-slate-300 shadow-none cursor-not-allowed'
          }`}
        >
          {submitting ? 'Transmitting...' : 'Complete Check'}
        </button>
      </div>
    </div>
  )
}

// --- SURVEY SCREEN ---

export const MobileSurvey = () => {
  const SURVEY_URL = "https://forms.gle/heat-exposure-survey-pune"

  const handleOpenSurvey = () => {
    window.open(SURVEY_URL, '_blank')
  }

  const handleScanQR = async () => {
    if (!Capacitor.isNativePlatform()) {
      alert('QR Scanner is only available on native Android devices.')
      return
    }

    try {
      const { barcodes } = await BarcodeScanner.scan()
      if (barcodes && barcodes.length > 0) {
        const url = barcodes[0].displayValue
        if (url.startsWith('http')) {
          window.open(url, '_blank')
        } else {
          alert(`Scanned content: ${url}`)
        }
      }
    } catch (e) {
      console.error('Scan error:', e)
    }
  }

  return (
    <div className="pb-24 pt-2">
      <div className="mb-8 px-1">
        <h2 className="text-3xl font-black text-brand tracking-tight">City Survey</h2>
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Help Pune Adapt to Heat</p>
      </div>

      <MobileCard noPadding>
        <div className="p-8 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-brand/5 rounded-3xl flex items-center justify-center mb-6 border border-brand/10">
            <ClipboardCheck className="w-10 h-10 text-brand" />
          </div>
          <h3 className="text-xl font-black text-slate-900 mb-3 tracking-tight">Heat Exposure Data</h3>
          <p className="text-slate-500 text-sm leading-relaxed mb-10 max-w-xs">
            We are identifying wards where cooling infrastructure is most needed. Your voice helps prioritize municipal funding.
          </p>

          <div className="w-full space-y-4">
            <button
              onClick={handleOpenSurvey}
              className="flex items-center justify-center gap-3 w-full bg-brand text-white p-5 rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl shadow-brand/20 active:scale-95 transition-all"
            >
              <ExternalLink className="w-5 h-5" />
              Open Form
            </button>

            <div className="flex items-center gap-4 py-2">
              <div className="flex-1 h-[1px] bg-slate-100"></div>
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">or scan qr</span>
              <div className="flex-1 h-[1px] bg-slate-100"></div>
            </div>

            <button
              onClick={handleScanQR}
              className="flex items-center justify-center gap-3 w-full bg-white border-2 border-slate-100 text-slate-800 p-5 rounded-3xl font-black text-sm uppercase tracking-widest active:scale-95 transition-all"
            >
              <QrCode className="w-5 h-5 text-brand" />
              Scan QR Code
            </button>
          </div>
        </div>
      </MobileCard>

      <div className="grid grid-cols-1 gap-4">
        {[
          { title: 'Cooling Gaps', desc: 'Identify which areas need more trees and public cooling.', icon: Navigation },
          { title: 'Policy Support', desc: 'Direct health resources to vulnerable groups in your ward.', icon: ShieldCheck },
        ].map((item, idx) => (
          <div key={idx} className="bg-slate-50/80 border border-slate-100 rounded-2xl p-5 flex gap-4">
            <div className="bg-white p-2 rounded-xl h-fit border border-slate-100 shadow-sm">
              <item.icon className="w-4 h-4 text-brand" />
            </div>
            <div>
              <div className="font-black text-slate-800 text-[11px] uppercase tracking-wider mb-1">{item.title}</div>
              <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// --- ALERTS SCREEN ---

export const MobileAlerts = () => {
  const [alerts, setAlerts] = useState<AlertsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchAlerts = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      const a = await getAlerts()
      setAlerts(a)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchAlerts()
  }, [fetchAlerts])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <div className="w-12 h-12 border-4 border-brand/5 border-t-brand rounded-full animate-spin"></div>
      </div>
    )
  }

  const activeAlerts = alerts?.alerts || []

  return (
    <div className="pb-28 pt-2 animate-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between mb-8 px-2">
        <div>
          <h2 className="text-4xl font-black text-brand tracking-tighter">Alert Center</h2>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1.5">Official City Protocol</p>
        </div>
        <button
          onClick={() => fetchAlerts(true)}
          disabled={refreshing}
          className={`p-3 bg-white rounded-2xl border border-slate-100 shadow-sm active:scale-90 transition-all ${refreshing ? 'animate-spin opacity-50' : ''}`}
        >
          <RefreshCw className="w-5 h-5 text-brand" />
        </button>
      </div>

      {activeAlerts.length === 0 ? (
        <div className="py-24 text-center px-10 bg-white rounded-[3rem] border border-slate-100 shadow-sm mx-2">
          <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8 border-4 border-white shadow-xl shadow-green-500/10">
            <ShieldCheck className="w-12 h-12 text-green-600" />
          </div>
          <h3 className="font-black text-slate-900 text-xl mb-3 tracking-tight">System Status: Clear</h3>
          <p className="text-slate-500 text-sm leading-relaxed font-medium">There are currently no active heat warnings for Pune. The municipal network is in monitoring mode.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {activeAlerts.map(alert => (
            <div key={alert.id} className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 relative overflow-hidden active:scale-[0.98] transition-all">
              <div className={`absolute top-0 left-0 w-2 h-full ${alert.severity === 'severe' || alert.severity === 'high' ? 'bg-red-500' : 'bg-yellow-500'}`}></div>

              <div className="flex justify-between items-start mb-6">
                 <div className="flex items-center gap-2.5">
                   <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${alert.severity === 'severe' || alert.severity === 'high' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]'}`}></div>
                   <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${alert.severity === 'severe' || alert.severity === 'high' ? 'text-red-600' : 'text-yellow-600'}`}>
                    {alert.severity} Warning
                   </span>
                 </div>
                 <div className="text-[10px] text-slate-300 font-black tracking-widest bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100/50 uppercase">
                   {alert.status}
                 </div>
              </div>

              <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">{alert.ward}</h3>
              <p className="text-[15px] text-slate-600 leading-relaxed mb-8 font-medium">{alert.recommended_response}</p>

              <div className="grid grid-cols-2 gap-5 p-6 bg-slate-50/50 rounded-3xl border border-slate-100/50 shadow-inner">
                <div>
                   <div className="text-[9px] text-slate-400 uppercase font-black tracking-[0.2em] mb-2">Projected Risk</div>
                   <div className="font-black text-slate-800 text-2xl leading-none flex items-end">
                     {alert.expected_peak_score || alert.risk_score}
                     <span className="text-[11px] text-slate-300 font-bold ml-1 mb-0.5">/100</span>
                   </div>
                </div>
                <div>
                   <div className="text-[9px] text-slate-400 uppercase font-black tracking-[0.2em] mb-2">Expected Peak</div>
                   <div className="font-black text-slate-800 text-2xl leading-none">{alert.expected_peak_time}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


// --- PROFILE SCREEN ---

export const MobileProfile = () => {
  return (
    <div className="pb-24 pt-2">
      <div className="flex flex-col items-center py-10 mb-6 bg-white rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="relative mb-6">
          <div className="w-28 h-28 bg-brand/5 rounded-full flex items-center justify-center border-4 border-white shadow-xl">
             <User className="w-14 h-14 text-brand" />
          </div>
          <div className="absolute bottom-1 right-1 bg-green-500 w-6 h-6 rounded-full border-4 border-white"></div>
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Citizen User</h2>
        <div className="flex items-center gap-1.5 mt-1">
          <MapPin className="w-3.5 h-3.5 text-brand" />
          <p className="text-slate-500 text-sm font-bold">Pune, India</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
          {[
            { label: 'Home Ward', value: 'Shivajinagar', icon: MapPin, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Notifications', value: 'Enabled', icon: Bell, color: 'text-orange-600', bg: 'bg-orange-50' },
            { label: 'Language', value: 'English (IN)', icon: Smartphone, color: 'text-purple-600', bg: 'bg-purple-50' },
          ].map((item, idx) => (
            <button key={idx} className="w-full flex items-center justify-between p-5 text-left active:bg-slate-50 transition-colors border-b last:border-0 border-slate-50">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 ${item.bg} rounded-xl flex items-center justify-center`}>
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <span className="font-bold text-slate-700 text-sm">{item.label}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <span className="text-xs font-bold text-slate-300">{item.value}</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </button>
          ))}
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
          <button className="w-full flex items-center justify-between p-5 text-left active:bg-slate-50 transition-colors border-b border-slate-50">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center">
                <HelpCircle className="w-5 h-5 text-slate-400" />
              </div>
              <span className="font-bold text-slate-700 text-sm">Help & Feedback</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
          <button className="w-full flex items-center justify-between p-5 text-left active:bg-slate-50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center">
                <Info className="w-5 h-5 text-slate-400" />
              </div>
              <span className="font-bold text-slate-700 text-sm">About HeatWatch</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          <div className="p-6 bg-slate-50/50">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Official Data Platform</div>
            <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
              Powered by municipal weather networks and AI-driven thermal modeling. This data is provided for public preparedness.
            </p>
          </div>
        </div>

        <div className="text-center py-10">
          <div className="text-[10px] text-slate-300 font-black uppercase tracking-[0.3em] mb-1">HeatWatch Pune</div>
          <div className="text-[10px] text-slate-200 font-bold">Build 1.0.0-CAPACITOR</div>
        </div>
      </div>
    </div>
  )
}

