import { useState, useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'
import {
  Home,
  Activity,
  ClipboardCheck,
  Bell,
  User
} from 'lucide-react'
import {
  MobileHome,
  MobileHeatCheck,
  MobileSurvey,
  MobileAlerts,
  MobileProfile
} from '../pages/Pages'

type MobilePageId = 'home' | 'heatcheck' | 'survey' | 'alerts' | 'profile'

export const MobileApp = () => {
  const [activeTab, setActiveTab] = useState<MobilePageId>('home')

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      StatusBar.setStyle({ style: Style.Light })
      StatusBar.setBackgroundColor({ color: '#f8fafc' }) // slate-50
    }
  }, [])

  const renderPage = () => {
    switch (activeTab) {
      case 'home': return <MobileHome onNavigate={(p: any) => setActiveTab(p as MobilePageId)} />
      case 'heatcheck': return <MobileHeatCheck />
      case 'survey': return <MobileSurvey />
      case 'alerts': return <MobileAlerts />
      case 'profile': return <MobileProfile />
      default: return <MobileHome onNavigate={(p: any) => setActiveTab(p as MobilePageId)} />
    }
  }

  const tabs: { id: MobilePageId; label: string; icon: any }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'heatcheck', label: 'Check', icon: Activity },
    { id: 'survey', label: 'Survey', icon: ClipboardCheck },
    { id: 'alerts', label: 'Alerts', icon: Bell },
    { id: 'profile', label: 'Profile', icon: User },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* Content Area */}
      <main className="flex-1 px-4 pt-4 pb-24 overflow-y-auto scroll-smooth">
        <div className="max-w-md mx-auto">
          {renderPage()}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-slate-100 flex justify-around items-center h-20 pb-6 px-4 shadow-[0_-8px_30px_rgba(0,0,0,0.04)] z-50">
        {tabs.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1.5 flex-1 transition-all duration-300 ${
                isActive ? 'text-brand scale-110' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all duration-300 ${isActive ? 'bg-brand/10' : 'bg-transparent'}`}>
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[3px]' : 'stroke-[2px]'}`} />
              </div>
              <span className={`text-[9px] font-black uppercase tracking-widest ${isActive ? 'opacity-100' : 'opacity-40'}`}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}

