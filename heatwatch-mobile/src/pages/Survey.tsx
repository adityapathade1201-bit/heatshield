import { useState } from 'react';
import { LayoutList, Search, Clock, ArrowRight, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { useNavigate } from 'react-router-dom';

const surveys = [
  {
    id: 's1',
    title: 'Citizen Heat Impact Survey',
    description: 'Help the city administration assess how rising temperatures affect your daily routine, commute, and hydration access.',
    duration: '3 mins',
    category: 'Civic Policy',
    active: true,
  },
  {
    id: 's2',
    title: 'Cooling Center Feedback',
    description: 'Share your feedback on municipal shaded waiting areas, misting stations, and public water points in your ward.',
    duration: '2 mins',
    category: 'Infrastructure',
    active: false,
  },
];

export function Survey() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [modal, setModal] = useState<'survey' | 'feedback' | 'action' | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [rating, setRating] = useState(0);
  const [step, setStep] = useState(1);
  const [answer, setAnswer] = useState('');
  const [surveyError, setSurveyError] = useState('');

  const filtered = surveys.filter(
    (s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      <header className="space-y-4 px-1">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Surveys</h1>
          <p className="text-slate-500 text-xs font-medium">Your feedback shapes city heat policy</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search active civic surveys..."
            className="w-full bg-white border border-slate-200/80 rounded-xl py-3 pl-10 pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
          />
        </div>
      </header>

      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Surveys</h2>
          <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
            1 Available
          </span>
        </div>

        <div className="space-y-3">
          {filtered.map((survey) => (
            <motion.div
              key={survey.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={clsx(
                "bg-white rounded-2xl p-5 border shadow-sm transition-all",
                survey.active 
                  ? "border-slate-200/80 hover:border-blue-200" 
                  : "border-slate-200/50 bg-slate-50/50 opacity-75"
              )}
            >
              <div className="flex justify-between items-start gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className={clsx(
                    "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                    survey.active ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-400"
                  )}>
                    <LayoutList size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {survey.category}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-slate-400 bg-slate-50 px-2 py-1 rounded-lg text-xs font-medium">
                  <Clock size={12} />
                  <span>{survey.duration}</span>
                </div>
              </div>

              <div className="space-y-1.5 mb-4">
                <h3 className="text-base font-bold text-slate-900 leading-snug">{survey.title}</h3>
                <p className="text-slate-500 text-xs leading-relaxed">{survey.description}</p>
              </div>

              <button
                  onClick={() => { if (survey.active) { setModal('survey'); setStep(1); setAnswer(''); setSurveyError(''); } }}
                disabled={!survey.active}
                className={clsx(
                  "w-full py-2.5 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors",
                  survey.active
                    ? "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-sm"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                )}
              >
                {survey.active ? (
                  <>
                    <span>Start Survey</span>
                    <ArrowRight size={16} />
                  </>
                ) : (
                  <span>Coming Soon</span>
                )}
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="space-y-3 pt-2">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Civic Impact</h2>
        <button onClick={() => setModal('action')} className="w-full text-left bg-white border border-slate-200/80 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Building2 size={20} />
          </div>
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-slate-900">Direct Municipal Action</p>
            <p className="text-[11px] text-slate-500 leading-tight">
              Survey insights help ward officers deploy hydration and emergency shade zones.
            </p>
          </div>
        </button>
        <button onClick={() => setModal('feedback')} className="w-full text-left bg-white border border-slate-200/80 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm"><div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">★</div><div><p className="text-xs font-bold text-slate-900">Cooling Center Feedback</p><p className="text-[11px] text-slate-500">Rate your latest municipal cooling center visit.</p></div><ArrowRight size={16} className="ml-auto text-blue-500" /></button>
      </section>
      {modal && <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-5"><div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-5"><div className="flex justify-between items-center"><h2 className="text-lg font-black text-slate-900">{modal === 'survey' ? 'Citizen Heat Impact Survey' : modal === 'feedback' ? 'Cooling Center Feedback' : 'Direct Municipal Action'}</h2><button onClick={() => setModal(null)} className="text-slate-400 text-xl">×</button></div>{submitted ? <motion.div initial={{ scale: .9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-6 space-y-4"><motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ repeat: Infinity, duration: 1.6 }} className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl">✓</motion.div><p className="font-black text-slate-900 text-lg">Survey Submitted Successfully!</p><p className="text-sm text-slate-500">Thank you for contributing your observations. Your response has been recorded for the Pune Heat Action Plan.</p><button onClick={() => { setSubmitted(false); setModal(null); setStep(1); setAnswer(''); navigate('/'); }} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold">Back to Home</button><button onClick={() => { setSubmitted(false); setModal(null); setStep(1); setAnswer(''); navigate('/alerts'); }} className="w-full py-3 text-blue-600 font-bold">View Live Alerts</button></motion.div> : modal === 'action' ? <div className="space-y-3 text-sm text-slate-600"><p>PMC Disaster Management combines anonymized survey responses with ward heat readings to prioritize water tanker deployment, emergency shade awnings, and cooling center staffing.</p><p>IMD uses aggregated exposure reports to validate heat warnings and improve local forecasts. No individual response is shared publicly.</p><button onClick={() => setModal(null)} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold">Close</button></div> : modal === 'feedback' ? <div className="space-y-4"><label className="block text-xs font-bold text-slate-600">Rate your visit<div className="flex gap-2 pt-2">{[1, 2, 3, 4, 5].map(value => <button type="button" key={value} onClick={() => setRating(value)} className={`text-3xl ${value <= rating ? 'text-amber-400' : 'text-slate-200'}`}>★</button>)}</div></label><select className="w-full border border-slate-200 rounded-xl p-3 text-sm"><option>Select ward</option><option>Shivajinagar</option><option>Hadapsar</option><option>Kothrud</option><option>Baner</option></select><textarea placeholder="Tell us what could improve" className="w-full border border-slate-200 rounded-xl p-3 text-sm min-h-24" /><button onClick={() => setSubmitted(true)} disabled={!rating} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold disabled:opacity-50">Submit Feedback</button></div> : <div className="space-y-4"><div className="text-xs font-bold text-slate-500">STEP {step} OF 4</div><label className="block text-sm font-semibold text-slate-700">{['How many hours are you in direct sun daily?', 'Is drinking water available during your commute?', 'Are you aware of cooling centers in your ward?', 'What one change would make hot days safer?'][step - 1]}{step < 4 ? <select value={answer} onChange={(event) => setAnswer(event.target.value)} className="mt-2 w-full border border-slate-200 rounded-xl p-3"><option value="">Select an answer</option><option>Yes / Always</option><option>Sometimes</option><option>No / Not sure</option></select> : <textarea value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="Share your observation" className="mt-2 w-full border border-slate-200 rounded-xl p-3 min-h-24" />}</label>{surveyError && <p className="text-sm text-red-500">{surveyError}</p>}<button onClick={() => { if (!answer.trim()) { setSurveyError('Please select or enter an answer.'); return; } setSurveyError(''); if (step === 4) setSubmitted(true); else { setStep(step + 1); setAnswer(''); } }} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold">{step === 4 ? 'Submit Survey' : 'Next Question'}</button></div>}</div></div>}
    </div>
  );
}