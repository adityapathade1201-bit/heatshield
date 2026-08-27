import { useState, type ComponentType, type CSSProperties, type ReactNode } from 'react';
import {
  Activity,
  AlertTriangle,
  Bell,
  Check,
  ChevronRight,
  CloudSun,
  Droplets,
  FileText,
  Flame,
  Gauge,
  HeartPulse,
  Hospital,
  Map,
  MapPin,
  Menu,
  Radio,
  ShieldCheck,
  SlidersHorizontal,
  Thermometer,
  TrendingUp,
  Users,
  Wind,
} from 'lucide-react';

interface DesktopCommandCenterProps {
  onSignOut: () => void;
}

type View = 'overview' | 'map' | 'location' | 'forecast' | 'explanation' | 'actions';
type IconComponent = ComponentType<{ size?: number; style?: CSSProperties }>;

const navigation: Array<{ id: View; label: string; icon: IconComponent }> = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'map', label: 'Heat Risk Map', icon: Map },
  { id: 'location', label: 'Location Detail', icon: MapPin },
  { id: 'forecast', label: '5-Day Forecast', icon: CloudSun },
  { id: 'explanation', label: 'Risk Explanation', icon: FileText },
  { id: 'actions', label: 'Recommended Actions', icon: ShieldCheck },
];

const locations: Array<[string, string, number, string]> = [
  ['Hadapsar', 'P-01', 91, 'Extreme'], ['Yerawada', 'P-02', 87, 'Very High'],
  ['Dhanori', 'P-03', 83, 'Very High'], ['Vishrantwadi', 'P-04', 78, 'High'],
  ['Khadki', 'P-05', 73, 'High'], ['Bibwewadi', 'P-06', 68, 'Moderate'], ['Katraj', 'P-07', 63, 'Moderate'],
];
const riskColors: Record<string, string> = { Extreme: '#ef4444', 'Very High': '#f97316', High: '#f59e0b', Moderate: '#10b981', Low: '#3b82f6' };
const forecast: Array<[string, number]> = [['Today', 84], ['Tomorrow', 89], ['Thu', 86], ['Fri', 77], ['Sat', 68]];
const riskFactors: Array<[string, number, string]> = [['Temperature', 34, '#ef4444'], ['Humidity', 28, '#f97316'], ['Vulnerable Pop', 22, '#f59e0b'], ['UHI', 10, '#10b981'], ['Wind', 6, '#3b82f6']];

function Panel({ title, action, children, className = '' }: { title: string; action?: string; children: ReactNode; className?: string }) {
  return <section className={`cc-panel ${className}`}><div className="cc-panel-header"><h2>{title}</h2>{action && <button>{action}<ChevronRight size={14} /></button>}</div>{children}</section>;
}

function Metric({ label, value, detail, icon: Icon, tone = 'blue' }: { label: string; value: string; detail: string; icon: IconComponent; tone?: string }) {
  return <div className="cc-metric"><div className={`cc-metric-icon ${tone}`}><Icon size={18} /></div><div><p>{label}</p><strong>{value}</strong><span>{detail}</span></div></div>;
}

function RiskBadge({ level }: { level: string }) {
  return <span className="cc-risk" style={{ color: riskColors[level], backgroundColor: `${riskColors[level]}1a` }}>{level}</span>;
}

function Overview() {
  return <div className="cc-content"><div className="cc-metrics">
    <Metric label="Temperature" value="42.3°C" detail="Feels 51.2°C" icon={Thermometer} tone="red" />
    <Metric label="Humidity" value="68%" detail="+4% vs avg" icon={Droplets} tone="blue" />
    <Metric label="Wind" value="7.4 km/h" detail="NW direction" icon={Wind} tone="cyan" />
    <Metric label="WBGT" value="34.6°C" detail="Very High stress" icon={Gauge} tone="orange" />
    <Metric label="Heat Index" value="51.2°C" detail="Extreme danger" icon={Flame} tone="red" />
    <Metric label="UV Index" value="11" detail="Extreme exposure" icon={SunIcon} tone="orange" />
  </div><div className="cc-overview-grid">
    <Panel title="Heat Risk Map" action="Open full map" className="cc-map-panel"><div className="cc-map"><div className="cc-map-grid" />{locations.concat([['Wakad', 'P-08', 58, 'Low'], ['Kothrud', 'P-09', 49, 'Low'], ['Viman Nagar', 'P-10', 72, 'High']]).map(([name, , score, level], index) => <div key={name} className="cc-map-dot" title={`${name}: ${score}`} style={{ left: `${16 + (index * 23) % 70}%`, top: `${24 + (index * 31) % 55}%`, backgroundColor: riskColors[level] }} />)}<span className="cc-map-label">PUNE MUNICIPAL LIMITS</span></div><div className="cc-legend">{Object.keys(riskColors).map(level => <span key={level}><i style={{ backgroundColor: riskColors[level] }} />{level}</span>)}</div></Panel>
    <Panel title="City Risk Score"><div className="cc-gauge"><div className="cc-gauge-ring"><strong>84</strong><span>/ 100</span></div><div><RiskBadge level="Extreme" /><p>City-wide heat risk</p><small>Updated 14:32 IST</small></div></div><div className="cc-gauge-foot"><TrendingUp size={15} /> +8 points since 12:00</div></Panel>
  </div><div className="cc-three-grid">
    <Panel title="Hourly WBGT" action="Next 24 hours"><div className="cc-bars">{[62, 70, 78, 88, 96, 100, 94, 84, 72, 60, 49, 43].map((height, index) => <div key={index} className="cc-bar-wrap"><span>{index + 9}:00</span><i style={{ height: `${height}%`, backgroundColor: height > 90 ? '#ef4444' : height > 75 ? '#f97316' : '#f59e0b' }} /></div>)}</div><div className="cc-chart-caption"><b>Peak 35.3°C</b><span>WBGT threshold: 28°C</span></div></Panel>
    <Panel title="Risk Factors"><div className="cc-factors">{riskFactors.map(([label, value, color]) => <div key={label}><div><span>{label}</span><b>{value}%</b></div><em><i style={{ width: `${value}%`, backgroundColor: color }} /></em></div>)}</div></Panel>
    <Panel title="Immediate Response"><div className="cc-checklist">{['Activate cooling centers', 'Notify health departments', 'Deploy water tankers', 'Review outdoor work limits'].map((task, index) => <label key={task}><input type="checkbox" defaultChecked={index === 0} /><span><Check size={13} /></span>{task}<small>{index < 2 ? 'In progress' : 'Pending'}</small></label>)}</div></Panel>
  </div><Panel title="Top High-Risk Locations" action="View all locations"><LocationTable /></Panel></div>;
}

function LocationTable() { return <div className="cc-table"><div className="cc-table-head"><span>LOCATION</span><span>WARD</span><span>RISK SCORE</span><span>STATUS</span></div>{locations.map(([name, ward, score, level]) => <div className="cc-table-row" key={name}><strong><MapPin size={14} />{name}</strong><span>{ward}</span><b style={{ color: riskColors[level] }}>{score}</b><RiskBadge level={level} /></div>)}</div>; }
function SunIcon({ size = 18 }: { size?: number }) { return <span style={{ fontSize: size }}>☼</span>; }

function RiskMap() { const [filter, setFilter] = useState('All'); const all = locations.concat([['Wakad', 'P-08', 58, 'Low'], ['Kothrud', 'P-09', 49, 'Low'], ['Viman Nagar', 'P-10', 72, 'High']]); return <div className="cc-content"><div className="cc-page-heading"><div><p className="cc-eyebrow">REAL-TIME OVERLAY</p><h1>Heat Risk Map</h1><p>Ward-level heat intelligence across Pune municipal limits.</p></div><div className="cc-filters">{['All', 'Extreme', 'Very High', 'High', 'Moderate', 'Low'].map(level => <button className={filter === level ? 'active' : ''} key={level} onClick={() => setFilter(level)}>{level}</button>)}</div></div><div className="cc-map-layout"><div className="cc-map cc-map-large"><div className="cc-map-grid" />{all.filter(([, , , level]) => filter === 'All' || level === filter).map(([name, , , level], index) => <div className="cc-map-dot" key={name} title={name} style={{ left: `${10 + (index * 19) % 82}%`, top: `${16 + (index * 27) % 68}%`, backgroundColor: riskColors[level] }} />)}<span className="cc-map-label">10 MONITORED WARDS · LIVE</span></div><Panel title="City Summary"><div className="cc-summary-number">84<small>/100</small></div><RiskBadge level="Extreme" /><p className="cc-muted">3 active alerts · 10 locations monitored</p><div className="cc-mini-list">{all.slice(0, 5).map(([name, , score, level]) => <div key={name}><span>{name}</span><b style={{ color: riskColors[level] }}>{score}</b></div>)}</div></Panel></div></div>; }
function LocationDetail() { const facilities: Array<[string, string, IconComponent, string]> = [['Sassoon Hospital', 'Open · 2.4 km', Hospital, '#10b981'], ['Hadapsar Cooling Centers', '3 centers active', HeartPulse, '#10b981'], ['Ruby Hall', 'Open · 5.8 km', Hospital, '#f59e0b']]; return <div className="cc-content"><PageHeading eyebrow="SELECTED LOCATION" title="Hadapsar" subtitle="Ward P-01 · Last updated 14:32 IST" /><div className="cc-metrics"><Metric label="Temperature" value="43.8°C" detail="Feels 52.1°C" icon={Thermometer} tone="red" /><Metric label="Humidity" value="71%" detail="Above average" icon={Droplets} tone="blue" /><Metric label="WBGT" value="35.3°C" detail="Extreme stress" icon={Gauge} tone="orange" /><Metric label="Wind" value="6.1 km/h" detail="Light winds" icon={Wind} tone="cyan" /></div><div className="cc-two-grid"><Panel title="6-Day Risk Trend"><div className="cc-trend">{[63, 70, 76, 82, 91, 88].map((value, index) => <div key={index}><i style={{ height: `${value}%` }} /><span>{['Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed'][index]}</span></div>)}</div></Panel><Panel title="Vulnerability Profile"><div className="cc-vulnerability">{[['Total Pop', '10.08L'], ['Elderly', '1.82L'], ['Children', '94K'], ['Outdoor Workers', '2.41L'], ['Slum Households', '1.89L']].map(([label, value]) => <div key={label}><Users size={15} /><span>{label}</span><b>{value}</b></div>)}</div></Panel></div><Panel title="Nearest Facilities"><div className="cc-facilities">{facilities.map(([name, status, Icon, color]) => <div key={name}><Icon size={20} style={{ color }} /><span><b>{name}</b><small style={{ color }}>{status}</small></span><ChevronRight size={16} /></div>)}</div></Panel></div>; }
function PageHeading({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) { return <div className="cc-page-heading"><div><p className="cc-eyebrow">{eyebrow}</p><h1>{title}</h1><p>{subtitle}</p></div></div>; }
function ForecastView() { return <div className="cc-content"><PageHeading eyebrow="OUTLOOK" title="5-Day Forecast" subtitle="Risk trajectory based on IMD and local sensor data." /><div className="cc-forecast">{forecast.map(([day, score]) => <div key={day} className="cc-forecast-card"><span>{day}</span><div className="cc-small-gauge" style={{ borderColor: score > 85 ? '#ef4444' : score > 75 ? '#f97316' : '#f59e0b' }}>{score}</div><RiskBadge level={score > 85 ? 'Very High' : score > 75 ? 'High' : 'Moderate'} /></div>)}</div><Panel title="Detailed Forecast"><div className="cc-table"><div className="cc-table-head"><span>DAY</span><span>MAX TEMP</span><span>WBGT</span><span>RISK</span></div>{forecast.map(([day, score]) => <div className="cc-table-row" key={day}><strong>{day}</strong><span>{score === 84 ? '42.3°C' : `${38 + (score % 5)}.0°C`}</span><span>{score > 80 ? '34.6°C' : '31.8°C'}</span><RiskBadge level={score > 85 ? 'Very High' : score > 75 ? 'High' : 'Moderate'} /></div>)}</div></Panel></div>; }
function Explanation() { return <div className="cc-content"><PageHeading eyebrow="MODEL TRANSPARENCY" title="Risk Explanation" subtitle="How the HeatWatch composite risk score is calculated." /><Panel title="Composite Formula"><div className="cc-formula">HRS = <b>0.34</b> × W<sub>norm</sub> + <b>0.28</b> × HI<sub>norm</sub> + <b>0.22</b> × V<sub>idx</sub> + <b>0.10</b> × UHI<sub>factor</sub> + <b>0.06</b> × Wind<sub>inv</sub></div></Panel><div className="cc-two-grid"><Panel title="Factor Definitions"><div className="cc-definition-list">{[['W_norm', 'Normalized wet-bulb globe temperature'], ['HI_norm', 'Normalized heat index'], ['V_idx', 'Vulnerability index for exposed population'], ['UHI_factor', 'Urban heat island intensity'], ['Wind_inv', 'Inverse wind cooling factor']].map(([key, value]) => <div key={key}><b>{key}</b><span>{value}</span></div>)}</div></Panel><Panel title="AI Model Specifications"><div className="cc-specs"><div><span>Training data</span><b>IMD 1990–2025</b></div><div><span>Model RMSE</span><b>2.3</b></div><div><span>Refresh rate</span><b>Every 15 minutes</b></div><div><span>Confidence</span><b>94.1%</b></div></div></Panel></div></div>; }
function Actions() { const departments: Array<[string, string[]]> = [['Health Dept', ['Open cooling centers', 'Send heat-health advisory', 'Stage ambulances']], ['Municipal Admin', ['Deploy water tankers', 'Activate control room', 'Inspect public shelters']], ['Police', ['Manage crowd hotspots', 'Support vulnerable residents', 'Coordinate emergency response']], ['BEST / PMPML Transport', ['Monitor driver shifts', 'Provide onboard water', 'Adjust route alerts']], ['PMC Sensors', ['Validate ward sensors', 'Check Hadapsar station', 'Publish hourly readings']]]; return <div className="cc-content"><PageHeading eyebrow="COORDINATION" title="Recommended Actions" subtitle="Departmental response checklist for INC-2026-HW-084." /><div className="cc-action-grid">{departments.map(([department, tasks]) => <Panel key={department} title={department}><div className="cc-checklist">{tasks.map(task => <label key={task}><input type="checkbox" /><span><Check size={13} /></span>{task}<small>Assign</small></label>)}</div></Panel>)}</div></div>; }

export function DesktopCommandCenter({ onSignOut }: DesktopCommandCenterProps) {
  const [view, setView] = useState<View>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const active = navigation.find(item => item.id === view) ?? navigation[0];
  const ActiveIcon = active.icon;
  const content = view === 'overview' ? <Overview /> : view === 'map' ? <RiskMap /> : view === 'location' ? <LocationDetail /> : view === 'forecast' ? <ForecastView /> : view === 'explanation' ? <Explanation /> : <Actions />;
  return <div className="cc-app"><aside className={`cc-sidebar ${sidebarOpen ? '' : 'collapsed'}`}><div className="cc-brand"><div className="cc-brand-mark"><Flame size={20} /></div>{sidebarOpen && <div><strong>HEATWATCH</strong><span>Municipal AI Command Center</span></div>}</div><div className="cc-sidebar-label">COMMAND CENTER</div><nav>{navigation.map(({ id, label, icon: Icon }) => <button key={id} className={view === id ? 'active' : ''} onClick={() => setView(id)} title={label}><Icon size={18} />{sidebarOpen && <span>{label}</span>}{sidebarOpen && id === 'overview' && <i className="cc-live-dot" />}</button>)}</nav><div className="cc-sidebar-footer">{sidebarOpen && <><div className="cc-user"><div>AS</div><span><b>Admin Console</b><small>PMC Operations</small></span></div><button onClick={onSignOut}>Sign out</button></>}</div></aside><main className="cc-main"><div className="cc-topbar"><button className="cc-icon-button" onClick={() => setSidebarOpen(!sidebarOpen)}><Menu size={18} /></button><div className="cc-breadcrumb"><ActiveIcon size={16} /><span>{active.label}</span></div><div className="cc-top-status"><span className="cc-live"><Radio size={13} /> LIVE</span><span>· 14:32 IST</span><span className="cc-divider" /><span>Pune, MH</span><span className="cc-alert-count"><Bell size={13} /> 3 ALERTS</span></div></div><div className="cc-incident"><div><AlertTriangle size={18} /><span><b>EXTREME HEAT EVENT</b><small>INC-2026-HW-084 · Immediate response protocols active</small></span></div><span className="cc-incident-time">Started 12:00 IST <ChevronRight size={15} /></span></div><div className="cc-titlebar"><div><p className="cc-eyebrow">MUNICIPAL OPERATIONS · LIVE MONITORING</p><h1>{active.label}</h1><p>{view === 'overview' ? 'Real-time city intelligence and response coordination.' : 'Pune Municipal Corporation · HeatWatch Intelligence'}</p></div><div className="cc-title-actions"><span><span className="cc-pulse" /> Data streaming</span><button><SlidersHorizontal size={15} /> Filters</button></div></div>{content}</main></div>;
}
