import { Opportunity, RelevanceResult, StudentProfile } from '../types';

function norm(value: string): string {
  return (value || '').trim().toLowerCase();
}

export function calculateRelevance(
  profile: StudentProfile,
  opportunity: Opportunity,
  today?: Date
): RelevanceResult {
  const skills = new Set((profile.skills || []).map(norm));
  const required = (opportunity.required_skills || []).map(norm);
  const interests = (profile.interests || []).map(norm);
  const category = norm(opportunity.category);

  let overlap = 0;
  for (const r of required) {
    if (skills.has(r)) {
      overlap += 1;
    }
  }

  const skillScore = required.length > 0 ? Math.round((45 * overlap) / required.length) : 0;

  const interestScore =
    interests.includes(category) || interests.some((interest) => interest.includes(category)) ? 20 : 0;

  const eduLevels = opportunity.eligibility?.education_levels || [];
  const eduStr = eduLevels.map(String).join(' ').toLowerCase();
  const educationScore =
    profile.education_level && eduStr.includes(profile.education_level.toLowerCase()) ? 15 : 0;

  const locPref = profile.location_preference || '';
  const oppLoc = (opportunity.location || '').toLowerCase();
  const locationScore =
    locPref === '' || locPref === 'Any' || oppLoc.includes('remote') || oppLoc.includes(norm(locPref))
      ? 10
      : 0;

  const ref = today || new Date();
  // Calculate day difference ignoring time
  let deadlineScore = 0;
  if (opportunity.deadline) {
    try {
      const parts = opportunity.deadline.split('-');
      if (parts.length === 3) {
        const deadlineDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        const todayZero = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
        const diffMs = deadlineDate.getTime() - todayZero.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays >= 0) {
          deadlineScore = 10;
        }
      }
    } catch {
      deadlineScore = 0;
    }
  }

  const components = {
    'Skills overlap': skillScore,
    'Interest/category': interestScore,
    'Education alignment': educationScore,
    'Location fit': locationScore,
    'Deadline suitability': deadlineScore,
  };

  const score = Math.min(
    100,
    skillScore + interestScore + educationScore + locationScore + deadlineScore
  );

  const maxScores: Record<string, number> = {
    'Skills overlap': 45,
    'Interest/category': 20,
    'Education alignment': 15,
    'Location fit': 10,
    'Deadline suitability': 10,
  };

  const explanation = Object.entries(components).map(
    ([name, value]) => `${name}: ${value}/${maxScores[name] || 10}`
  );

  return {
    score,
    components,
    explanation,
  };
}
