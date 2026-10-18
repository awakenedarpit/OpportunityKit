import { StudentProfile, TrackerStatus } from '../types';

export const DEMO_PROFILE: StudentProfile = {
  name: 'Aarav Mehta',
  education_level: 'Undergraduate',
  field_of_study: 'B.Tech in Computer Science',
  college_or_institution: 'Indian Institute of Technology (IIT)',
  graduation_year: 2028,
  skills: ['Python', 'SQL', 'Git', 'Streamlit', 'Basic machine learning'],
  interests: ['AI/ML', 'Hackathons', 'Software development', 'Research', 'Internships'],
  opportunity_types: ['Internship', 'Scholarship', 'Hackathon', 'Competition', 'Fellowship'],
  location_preference: 'India',
  accessibility_preferences: '',
};

export const DEMO_SAVED_RECORDS: Record<string, TrackerStatus> = {
  'demo-python-internship': 'Preparing',
  'demo-ai-research': 'Applied',
  'demo-innovation-challenge': 'Interested',
};

export const DEMO_OPPORTUNITY_IDS = new Set([
  'demo-python-internship',
  'demo-ai-research',
  'demo-innovation-challenge',
  'demo-open-source',
  'demo-ml-hackathon',
  'demo-data-internship',
  'demo-research-assistant',
  'demo-developer-scholarship',
]);
