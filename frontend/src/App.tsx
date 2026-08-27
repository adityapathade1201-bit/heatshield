import { useState, useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { Header, Navigation } from './components/UI'
import { MobileApp } from './components/MobileApp'
import {
  ActionsPage,
  AIIntelligencePage,
  AlertCenterPage,
  DashboardPage,
  ForecastPage,
  HeatRiskMapPage,
  LocationDetailPage,
  RiskExplanationPage,
} from './pages/Pages'
import type { PageId } from './types'

const pageMeta: Record<PageId, { title: string; subtitle: string }> = {
  dashboard: { title: 'Good morning, Pune', subtitle: 'A city-wide snapshot for heat-health preparedness.' },
  map: { title: 'Heat Risk Map', subtitle: 'Hyperlocal view of ward-level heat conditions.' },
  location: { title: 'Location Detail', subtitle: 'Focused heat-risk information for a selected ward.' },
  forecast: { title: '5-Day Forecast', subtitle: 'Plan ahead for changing heat conditions.' },
  explanation: { title: 'Risk Explanation', subtitle: 'The main conditions contributing to heat risk.' },
  actions: { title: 'Recommended Actions', subtitle: 'Practical steps for municipal heat response.' },
  alerts: { title: 'Alert Center', subtitle: 'Active and historical municipal heat warnings.' },
  'ai-intelligence': { title: 'AI Heat Intelligence', subtitle: 'Explainable AI-assisted municipal heat-risk analysis.' },
}
function App() {
  const [page, setPage] = useState<PageId>('dashboard')
  const [selectedLocationName, setSelectedLocationName] = useState('')
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768 || Capacitor.isNativePlatform())

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768 || Capacitor.isNativePlatform())
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleLocationSelect = (name: string, shouldNavigate = false) => {
    setSelectedLocationName(name)
    if (shouldNavigate) setPage('location')
  }

  if (isMobileView) {
    return <MobileApp />
  }

  const content = {
    dashboard: <DashboardPage onLocationSelect={(name) => handleLocationSelect(name, true)} />,
    map: <HeatRiskMapPage onLocationSelect={(name) => handleLocationSelect(name, false)} onNavigateToDetail={() => setPage('location')} />,
    location: <LocationDetailPage selectedLocationName={selectedLocationName} onLocationSelect={(name) => handleLocationSelect(name, false)} />,
    forecast: <ForecastPage />,
    explanation: <RiskExplanationPage />,
    actions: <ActionsPage />,
    alerts: <AlertCenterPage />,
    'ai-intelligence': <AIIntelligencePage />,
  }[page]



  return (
    <div className="min-h-screen bg-canvas lg:flex">
      <Navigation page={page} onNavigate={setPage} />
      <div className="min-w-0 flex-1">
        <Header {...pageMeta[page]} />
        <main className="mx-auto max-w-7xl p-5 sm:p-7 lg:p-8">{content}</main>
      </div>
    </div>
  )
}

export default App

