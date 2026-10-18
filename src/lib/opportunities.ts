import opportunitiesData from '../../data/opportunities.json';
import { Opportunity, TrackerStatus } from '../types';

export const OPPORTUNITIES: Opportunity[] = (opportunitiesData as Opportunity[]).map((opp) => ({
  ...opp,
  // Add sample benefits / reward notes if present in description or synthesized for demo
  benefits_or_rewards:
    opp.category === 'Scholarship'
      ? 'Financial scholarship & learning grant'
      : opp.category === 'Internship'
      ? 'Hands-on mentorship & stipend'
      : opp.category === 'Hackathon'
      ? 'Prizes, incubation & community perks'
      : opp.category === 'Fellowship'
      ? 'Stipend & global cohort access'
      : 'Competition award & certificate',
}));

export const CATEGORIES = [
  'Internship',
  'Scholarship',
  'Hackathon',
  'Competition',
  'Fellowship',
] as const;

export const TRACKER_STATUSES: TrackerStatus[] = [
  'Interested',
  'Preparing',
  'Applied',
  'Assessment / Interview',
  'Offer',
  'Rejected',
  'Withdrawn',
];

export const NAV_ITEMS = [
  'Overview',
  'Discover',
  'Saved opportunities',
  'Application tracker',
  'Student profile',
  'About',
] as const;

export type NavItem = (typeof NAV_ITEMS)[number] | 'Opportunity details' | 'Fit Report';

export function getDeadlineInfo(deadline: string, refDate?: Date): {
  days: number;
  isClosingSoon: boolean;
  label: string;
} {
  if (!deadline) {
    return { days: Infinity, isClosingSoon: false, label: '' };
  }
  let now = refDate || new Date();
  if (now.getFullYear() < 2026 || now.getFullYear() > 2027) {
    now = new Date(2026, 9, 18); // Oct 18, 2026 anchor
  }
  const todayZero = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const parts = deadline.split('-');
  if (parts.length !== 3) {
    return { days: Infinity, isClosingSoon: false, label: '' };
  }
  const deadlineDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  const diffMs = deadlineDate.getTime() - todayZero.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  const isClosingSoon = diffDays >= 0 && diffDays <= 7;
  let label = '';
  if (diffDays < 0) {
    label = 'Passed deadline';
  } else if (diffDays === 0) {
    label = 'Closes today!';
  } else if (diffDays === 1) {
    label = 'Closes tomorrow!';
  } else if (diffDays <= 7) {
    label = `Closes in ${diffDays} days`;
  }

  return { days: diffDays, isClosingSoon, label };
}
