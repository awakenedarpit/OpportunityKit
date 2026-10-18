import { Opportunity, RuleResult, StudentProfile } from '../types';

function norm(value: string): string {
  return (value || '').trim().toLowerCase();
}

function tokens(values: string[]): Set<string> {
  const result = new Set<string>();
  for (const v of values || []) {
    if (v && v.trim()) {
      result.add(norm(v));
    }
  }
  return result;
}

export function checkEligibility(profile: StudentProfile, opportunity: Opportunity): RuleResult {
  const reasons: string[] = [];
  const missing: string[] = [];
  const conflicts: string[] = [];
  const rules = opportunity.eligibility || {};

  if (rules.education_levels && Array.isArray(rules.education_levels) && rules.education_levels.length > 0) {
    const allowed = new Set(rules.education_levels.map(norm));
    if (!profile.education_level) {
      missing.push('education level');
    } else if (!allowed.has(norm(profile.education_level))) {
      conflicts.push(`Education level must be one of: ${rules.education_levels.join(', ')}.`);
    } else {
      reasons.push('Your education level matches the stated requirement.');
    }
  }

  if (rules.graduation_year_min !== undefined || rules.graduation_year_max !== undefined) {
    if (profile.graduation_year === null || profile.graduation_year === undefined) {
      missing.push('graduation year');
    } else {
      const low = rules.graduation_year_min;
      const high = rules.graduation_year_max;
      if (low !== undefined && profile.graduation_year < low) {
        conflicts.push(`Graduation year must be ${low} or later.`);
      } else if (high !== undefined && profile.graduation_year > high) {
        conflicts.push(`Graduation year must be ${high} or earlier.`);
      } else {
        reasons.push('Your graduation year fits the stated range.');
      }
    }
  }

  const required = tokens(opportunity.required_skills || []);
  const have = tokens(profile.skills || []);
  if (required.size > 0) {
    const missingSkills: string[] = [];
    for (const r of required) {
      if (!have.has(r)) {
        // find original casing if possible
        const orig = (opportunity.required_skills || []).find(s => norm(s) === r) || r;
        missingSkills.push(orig);
      }
    }
    missingSkills.sort((a, b) => a.localeCompare(b));
    if (missingSkills.length > 0) {
      missing.push(`skills: ${missingSkills.join(', ')}`);
    } else {
      reasons.push('You list all required skills in your profile.');
    }
  }

  const locations = (rules.locations || []).map(norm);
  if (locations.length > 0) {
    const preference = norm(profile.location_preference);
    const opportunityLocation = norm(opportunity.location);
    if (opportunityLocation.includes('remote') || preference.includes('remote') || preference === 'any' || preference === 'anywhere') {
      reasons.push('Your location preference does not conflict with this listing.');
    } else if (preference && !locations.some(loc => opportunityLocation.includes(loc)) && !locations.includes(preference)) {
      conflicts.push(`This opportunity is limited to: ${(rules.locations || []).join(', ')}.`);
    } else if (!preference) {
      missing.push('location preference');
    }
  }

  if (conflicts.length > 0) {
    return {
      status: 'Not eligible based on known conflict',
      reasons: conflicts,
      missing_information: missing,
    };
  }

  if (missing.length > 0) {
    return {
      status: 'Possibly eligible / needs verification',
      reasons,
      missing_information: missing,
    };
  }

  return {
    status: 'Eligible based on available information',
    reasons,
    missing_information: [],
  };
}
