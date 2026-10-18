export type TrackerStatus =
  | 'Interested'
  | 'Preparing'
  | 'Applied'
  | 'Assessment / Interview'
  | 'Offer'
  | 'Rejected'
  | 'Withdrawn';

export interface StudentProfile {
  name: string;
  education_level: string;
  field_of_study: string;
  college_or_institution?: string;
  graduation_year: number | null;
  skills: string[];
  interests: string[];
  opportunity_types: string[];
  location_preference: string;
  accessibility_preferences: string;
}

export interface EligibilityRules {
  education_levels?: string[];
  graduation_year_min?: number;
  graduation_year_max?: number;
  locations?: string[];
  [key: string]: any;
}

export interface Opportunity {
  id: string;
  title: string;
  organization: string;
  category: string;
  description: string;
  eligibility: EligibilityRules;
  required_skills: string[];
  location: string;
  deadline: string;
  source_url: string;
  last_verified: string;
  benefits_or_rewards?: string;
  data_source?: string;
  verification_status?: string;
}

export interface RuleResult {
  status: string;
  reasons: string[];
  missing_information: string[];
}

export interface RelevanceResult {
  score: number;
  components: {
    "Skills overlap": number;
    "Interest/category": number;
    "Education alignment": number;
    "Location fit": number;
    "Deadline suitability": number;
    [key: string]: number;
  };
  explanation: string[];
}

export interface FitReport {
  why_match: string[];
  eligibility_summary: string;
  strengths: string[];
  gaps: string[];
  next_steps: string[];
  before_applying: string[];
  source: string;
}

export interface SavedRecord {
  status: TrackerStatus;
  tasks: string[];
  completedTasks?: string[];
  notes?: string;
  applied_date?: string;
  saved_at: string;
  origin: 'user' | 'demo';
}

export interface ProviderConfig {
  name: string;
  enabled: boolean;
  model: string;
  api_key: string;
  endpoint: string;
  timeout_seconds: number;
}

export interface AISettings {
  priority: string[];
  providers: Record<string, ProviderConfig>;
  external_enabled: boolean;
  max_attempts: number;
}
