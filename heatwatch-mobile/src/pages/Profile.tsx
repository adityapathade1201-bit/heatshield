import { Bell, Shield, Info, MapPin, Moon, ChevronRight, LogOut, HelpCircle, FileText, X, Sun } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext.tsx';
import { useState, type ReactNode } from 'react';
import { clsx } from 'clsx';

export function Profile() {
  const { signOut } = useAuth();
  const [modal, setModal] = useState<string | null>(null);
  const [ward, setWard] = useState(() => localStorage.getItem('hw_ward') || 'Shivajinagar');
  const [notifications, setNotifications] = useState(() => localStorage.getItem('hw_notifications') !== 'false');
  const [theme, setTheme] = useState(() => localStorage.getItem('hw_theme') || 'Light');
  const wards = ['Shivajinagar', 'Hadapsar', 'Kothrud', 'Baner', 'Katraj', 'Bibwewadi', 'Yerawada', 'Dhanori', 'Khadki'];

  const handleSignOut = () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      signOut();
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col items-center text-center space-y-4 pt-4 px-1">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-28 h-28 rounded-[40px] bg-white shadow-2xl shadow-blue-900/5 flex items-center justify-center relative border border-slate-50"
        >
          <div className="absolute inset-0 m-2 rounded-[40px] bg-gradient-to-br from-blue-500 via-indigo-500 to-amber-400 opacity-90 shadow-inner shadow-white/30" />
          <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-[28px] bg-white/20 text-white shadow-lg backdrop-blur-sm">
            <Shield size={42} strokeWidth={1.7} />
            <Sun size={17} className="absolute right-3 top-3 text-amber-200" strokeWidth={2.4} />
          </div>
          <div className="absolute bottom-0 right-0 w-8 h-8 bg-green-500 border-4 border-white rounded-full z-20 shadow-sm" />
        </motion.div>
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Citizen User</h1>
          <div className="flex items-center justify-center gap-1.5">
             <MapPin size={12} className="text-blue-500" />
             <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Shivajinagar, Pune</p>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h3 className="text-slate-900 text-xs font-black uppercase tracking-widest px-4">Account Settings</h3>
          <div className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-slate-50">
            <ProfileRow icon={MapPin} label="Home Ward" value={ward} onClick={() => setModal('ward')} />
            <ProfileRow icon={Bell} label="Heat Notifications" value={notifications ? 'Enabled' : 'Disabled'} onClick={() => { const next = !notifications; setNotifications(next); localStorage.setItem('hw_notifications', String(next)); }} />
            <ProfileRow icon={Moon} label="App Theme" value={theme} onClick={() => setModal('theme')} last />
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-slate-900 text-xs font-black uppercase tracking-widest px-4">Support & About</h3>
          <div className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-slate-50">
            <ProfileRow icon={Shield} label="Data Privacy" onClick={() => setModal('privacy')} />
            <ProfileRow icon={HelpCircle} label="Help Center" onClick={() => setModal('help')} />
            <ProfileRow icon={FileText} label="Terms of Service" onClick={() => setModal('terms')} />
            <ProfileRow icon={Info} label="App Version" value="v1.0.5 · Up to date" onClick={() => setModal('version')} last />
          </div>
        </div>

        <button
           onClick={handleSignOut}
           className="w-full bg-white border border-red-50 rounded-[24px] p-5 flex items-center justify-center gap-3 text-red-500 font-black text-lg shadow-sm active:bg-red-50 active:scale-[0.98] transition-all"
        >
          <LogOut size={22} />
          Sign Out
        </button>
      </section>

      <footer className="text-center py-4">
        <p className="text-[10px] text-slate-300 font-black uppercase tracking-[5px]">Municipal Heat Support System</p>
      </footer>
      {modal && <ProfileModal modal={modal} wards={wards} ward={ward} setWard={(value) => { setWard(value); localStorage.setItem('hw_ward', value); }} theme={theme} setTheme={(value) => { setTheme(value); localStorage.setItem('hw_theme', value); }} close={() => setModal(null)} />}
    </div>
  );
}

interface ProfileRowProps {
  icon: any;
  label: string;
  value?: string;
  last?: boolean;
  onClick?: () => void;
}

function ProfileRow({ icon: Icon, label, value, last, onClick }: ProfileRowProps) {
  return (
    <button onClick={onClick} className={clsx(
      "w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-all group",
      !last && "border-b border-slate-50"
    )}>
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-white transition-colors">
          <Icon size={20} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
        </div>
        <span className="text-slate-700 font-bold tracking-tight">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        {value && <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">{value}</span>}
        <ChevronRight size={18} className="text-slate-200" />
      </div>
    </button>
  );
}

function ProfileModal({ modal, wards, ward, setWard, theme, setTheme, close }: { modal: string; wards: string[]; ward: string; setWard: (value: string) => void; theme: string; setTheme: (value: string) => void; close: () => void }) {
  const content: Record<string, { title: string; body: ReactNode }> = {
    privacy: { title: 'Pune Smart City Heat Data Privacy Policy', body: <p>Anonymized GPS reports and heat observations help improve city safety. HeatWatch does not use personal tracking or sell individual data.</p> },
    help: { title: 'Help Center', body: <div className="space-y-2"><p>PMC Disaster Management: <b>020-25501269 / 020-25506800</b></p><p>Emergency / Ambulance: <b>108 / 112</b></p><p>Heat Stroke Emergency Unit (Sassoon Hospital): <b>020-26128000</b></p></div> },
    terms: { title: 'Pune Heat Action Plan Terms', body: <p>HeatWatch advisories support, but do not replace, official medical or emergency guidance. Follow Pune Heat Action Plan instructions and contact emergency services when needed.</p> },
    version: { title: 'App Version', body: <p>HeatWatch v1.0.5 (Build 2026.08) - System Up to Date</p> },
    ward: { title: 'Select Home Ward', body: <div className="grid grid-cols-2 gap-2">{wards.map(option => <button key={option} onClick={() => { setWard(option); close(); }} className={`p-3 rounded-xl text-left text-sm font-bold ${option === ward ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-700'}`}>{option}</button>)}</div> },
    theme: { title: 'App Theme', body: <div className="flex gap-3"><button onClick={() => { setTheme('Light'); close(); }} className={`flex-1 p-3 rounded-xl font-bold ${theme === 'Light' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50'}`}>Light</button><button onClick={() => { setTheme('Dark'); close(); }} className={`flex-1 p-3 rounded-xl font-bold ${theme === 'Dark' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'}`}>Dark</button></div> },
  };
  const selected = content[modal];
  return <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-5"><div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 text-slate-600"><div className="flex items-center justify-between"><h2 className="text-lg font-black text-slate-900">{selected.title}</h2><button onClick={close}><X size={18} /></button></div><div className="text-sm leading-relaxed">{selected.body}</div>{!['ward', 'theme'].includes(modal) && <button onClick={close} className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold">Close</button>}</div></div>;
}
