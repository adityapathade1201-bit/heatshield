export type RiskLevel = 'Low' | 'Moderate' | 'High' | 'Severe'
export type PageId = 'dashboard' | 'map' | 'location' | 'forecast' | 'explanation' | 'actions' | 'alerts' | 'ai-intelligence'


export interface Metric { label: string; value: string; detail: string; icon: string }
export interface ForecastDay { day: string; date: string; condition: string; high: number; low: number; risk?: RiskLevel; score?: number; peak_time_local?: string }

export interface RiskDriverData { label: string; value: string; description: string; impact?: 'High' | 'Medium' | 'Low' }
export interface Action { id?: string; title: string; description: string; audience: string; priority: 'Immediate' | 'Today' | 'Plan ahead'; icon: string; status?: 'pending' | 'in_progress' | 'completed' }
export interface MapLocation { name: string; ward: string; risk: RiskLevel; score: number; latitude: number; longitude: number; x: number; y: number }
export interface OperationalStage { stage: 'BEFORE PEAK' | 'DURING PEAK' | 'AFTER PEAK'; title: string; subtitle: string; actions: Action[] }

export interface HourlyHeatPoint {
	time: string
	formatted_time: string
	temperature_c: number
	apparent_temperature_c: number | null
	humidity_percent: number | null
	heat_index_c: number | null
	estimated_wbgt_c: number | null
	uv_index: number | null
	risk_score: number
	risk_level: 'low' | 'moderate' | 'high' | 'severe'
	is_peak: boolean
}

export interface TrendsResponse {
	location: string
	latitude: number
	longitude: number
	generated_at: string
	points: HourlyHeatPoint[]
	peak_point: HourlyHeatPoint | null
}

export interface HeatAlert {
	id: string
	alert_type: 'forecast_warning' | 'current_alert' | 'early_warning'
	severity: 'low' | 'moderate' | 'high' | 'severe'
	ward: string
	ward_id: string
	risk_score: number
	current_risk_score?: number
	expected_peak_score?: number
	expected_peak_time: string
	created_at: string
	status: 'active' | 'acknowledged' | 'resolved'
	recommended_response: string
}

export interface DataQualityStatus {
	overall_status: 'Optimal' | 'Degraded' | 'Offline'
	weather_api: boolean
	forecast_api: boolean
	thermal_model: boolean
	ward_coordinates: boolean
	last_sync: string
}

export interface WardAIAnalysisResponse {
	ward: string
	ward_id: string
	current_risk_score: number
	current_risk_level: 'low' | 'moderate' | 'high' | 'severe'
	heat_index_c: number
	relative_humidity: number
	solar_radiation_w_m2: number
	uv_index: number
	wbgt_c: number
	forecast_peak_score: number
	forecast_peak_level: 'low' | 'moderate' | 'high' | 'severe'
	forecast_peak_time: string
	interpretation: string
	primary_driver: string
	supporting_factors: Array<{ label: string; value: string }>
}

export interface PriorityWardItem {
	rank: number
	ward: string
	ward_id: string
	priority_level: 'High' | 'Medium' | 'Standard'
	current_score: number
	peak_score: number
	peak_time: string
	trend: 'Increasing' | 'Stable' | 'Decreasing'
	reason: string
}

export interface WardComparisonRow {
	ward: string
	ward_id: string
	current_score: number
	current_level: string
	peak_score: number
	peak_time: string
	trend: 'Increasing' | 'Stable' | 'Decreasing'
	priority: 'High' | 'Medium' | 'Standard'
}

export interface MunicipalBriefResponse {
	situation: string
	highest_concern_ward: string
	current_risk_score: number
	current_risk_level: 'low' | 'moderate' | 'high' | 'severe'
	forecast_peak_score: number
	forecast_peak_level: 'low' | 'moderate' | 'high' | 'severe'
	forecast_peak_time: string
	priority_action: string
	recommended_preparation: string
	watch_window: string
	brief_text: string
	word_count: number
	generated_at: string
	disclaimer: string
}

export interface ActionExplanationResponse {
	action_id: string
	title: string
	primary_factor: string
	supporting_factors: Array<{ label: string; value: string }>
	data_driven_reason: string
}

export interface AIOverviewResponse {
	city_risk_score: number
	city_risk_level: 'low' | 'moderate' | 'high' | 'severe'
	highest_risk_ward: string
	expected_peak_time: string
	expected_peak_score: number
	trend: 'Increasing' | 'Stable' | 'Decreasing'
	active_warnings_count: number
	ward_comparisons: WardComparisonRow[]
	priority_recommendations: PriorityWardItem[]
	data_quality: DataQualityStatus
	system_note: string
}


export interface AlertsResponse {
	alerts: HeatAlert[]
	active_count: number
}

export interface ResponseActionItem {
	id: string
	title: string
	description: string
	audience: string
	stage: 'BEFORE PEAK' | 'DURING PEAK' | 'AFTER PEAK'
	priority: 'Plan ahead' | 'Today' | 'Immediate'
	status: 'pending' | 'in_progress' | 'completed'
}

export interface ResponseActionsResponse {
	actions: ResponseActionItem[]
	pending_count: number
	completed_count: number
}

export interface MunicipalResponseSummary {
	active_alerts: number
	high_risk_wards: number
	actions_pending: number
	actions_completed: number
}


export interface WeatherConditions {
	temperature_c: number | null
	apparent_temperature_c: number | null
	humidity_percent: number | null
	wind_speed_kph: number | null
	surface_pressure_hpa: number | null
	dew_point_c: number | null
	wet_bulb_temperature_c: number | null
	solar_radiation_w_m2: number | null
	direct_radiation_w_m2: number | null
	diffuse_radiation_w_m2: number | null
	cloud_cover_percent: number | null
	uv_index: number | null
	weather_code: number | null
	condition: string
}

export interface ForecastPeakConditions {
	temperature_c?: number | null
	apparent_temperature_c?: number | null
	humidity_percent?: number | null
	wind_speed_kph?: number | null
	solar_radiation_w_m2?: number | null
	uv_index?: number | null
	heat_index_c?: number | null
	estimated_wbgt_c?: number | null
}

export interface WeatherResponse { location: string; observed_at: string; conditions: WeatherConditions; source: string }
export interface ForecastResponse { location: string; generated_at: string; days: ApiForecastDay[]; source: string }
export interface ApiForecastDay {
	date: string
	condition: string
	weather_code: number
	high_c: number
	low_c: number
	risk_level?: 'low' | 'moderate' | 'high' | 'severe'
	risk_score?: number
	peak_time?: string
	peak_time_local?: string
	peak_conditions?: ForecastPeakConditions
}


export interface ApiRiskDriver { name: string; value: string; description: string }
export interface ApiPeakHeatWindow {
	time: string
	formatted_time: string
	risk_score: number
	risk_level: 'low' | 'moderate' | 'high' | 'severe'
	temperature_c?: number | null
	apparent_temperature_c?: number | null
	humidity_percent?: number | null
	uv_index?: number | null
	estimated_wbgt_c?: number | null
}
export interface RiskResponse { location: string; assessed_at: string; level: 'low' | 'moderate' | 'high' | 'severe'; score: number; drivers: ApiRiskDriver[]; source: string; peak_window?: ApiPeakHeatWindow | null }

export interface ThermalResponse { estimated_wbgt_c: number; estimated_globe_temperature_c: number; natural_wet_bulb_temperature_c: number; heat_index_c: number; methodology: { wbgt: string; limitations: string[] } }
export interface ApiLocation { id: string; name: string; ward: string; latitude: number; longitude: number; risk_level: 'low' | 'moderate' | 'high' | 'severe'; risk_score: number }
export interface LocationsResponse { locations: ApiLocation[]; source: string }

