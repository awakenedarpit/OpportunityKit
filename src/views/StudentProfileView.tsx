import React from 'react';
import { StudentProfile } from '../types';
import { CATEGORIES } from '../lib/opportunities';

interface StudentProfileViewProps {
  initialProfile: StudentProfile;
  onSaveProfile: (profile: StudentProfile) => void;
  onNavigateToDiscover?: () => void;
}

const EDUCATION_OPTIONS = ['', 'Undergraduate', 'Postgraduate', 'High school', 'Other'];
const LOCATION_OPTIONS = [
  'Any',
  'Remote',
  'India',
  'Bengaluru',
  'New Delhi',
  'Mumbai',
  'Pune',
  'Hyderabad',
];

const SKILL_SUGGESTIONS = [
  'Python',
  'SQL',
  'Git',
  'Machine Learning',
  'Data Analysis',
  'React',
  'Research',
  'Docker',
];

const INTEREST_SUGGESTIONS = [
  'AI/ML',
  'Hackathons',
  'Software development',
  'Research',
  'Internships',
  'Fellowships',
  'Climate',
];

export const StudentProfileView: React.FC<StudentProfileViewProps> = ({
  initialProfile,
  onSaveProfile,
  onNavigateToDiscover,
}) => {
  const [name, setName] = React.useState(initialProfile.name || '');
  const [educationLevel, setEducationLevel] = React.useState(initialProfile.education_level || '');
  const [fieldOfStudy, setFieldOfStudy] = React.useState(initialProfile.field_of_study || '');
  const [institution, setInstitution] = React.useState(initialProfile.college_or_institution || '');
  const [graduationYear, setGraduationYear] = React.useState<number>(
    initialProfile.graduation_year || 2028
  );
  const [accessibility, setAccessibility] = React.useState(
    initialProfile.accessibility_preferences || ''
  );
  const [skillsStr, setSkillsStr] = React.useState((initialProfile.skills || []).join(', '));
  const [interestsStr, setInterestsStr] = React.useState((initialProfile.interests || []).join(', '));
  const [oppTypes, setOppTypes] = React.useState<string[]>(initialProfile.opportunity_types || []);
  const [locationPref, setLocationPref] = React.useState(
    initialProfile.location_preference || 'Any'
  );

  const [errorMsg, setErrorMsg] = React.useState('');
  const [successMsg, setSuccessMsg] = React.useState('');

  const toggleOppType = (cat: string) => {
    setOppTypes((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const addSkillSuggestion = (skill: string) => {
    const current = skillsStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (!current.includes(skill)) {
      setSkillsStr([...current, skill].join(', '));
    }
  };

  const addInterestSuggestion = (interest: string) => {
    const current = interestsStr
      .split(',')
      .map((i) => i.trim())
      .filter(Boolean);
    if (!current.includes(interest)) {
      setInterestsStr([...current, interest].join(', '));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!educationLevel) {
      setErrorMsg('Choose an education level so deterministic eligibility checks can be transparent.');
      return;
    }

    const skills = skillsStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const interests = interestsStr
      .split(',')
      .map((i) => i.trim())
      .filter(Boolean);

    const updated: StudentProfile = {
      name: name.trim(),
      education_level: educationLevel,
      field_of_study: fieldOfStudy.trim(),
      college_or_institution: institution.trim(),
      graduation_year: Number(graduationYear) || null,
      skills,
      interests,
      opportunity_types: oppTypes,
      location_preference: locationPref,
      accessibility_preferences: accessibility.trim(),
    };

    onSaveProfile(updated);
    setSuccessMsg('Profile saved locally. Your eligibility and relevance scores have been updated.');
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1180px] mx-auto">
      {/* Intro */}
      <div>
        <div className="text-[10px] font-bold tracking-wider uppercase text-[#6254E8] dark:text-[#9387FF] mb-1">
          STUDENT PROFILE
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#17213A] dark:text-[#F7F8FC] mb-2 font-brand">
          Tell OpportunityKit what matters to you.
        </h1>
        <p className="text-xs md:text-sm text-[#596780] dark:text-[#B8C2D9] max-w-2xl leading-relaxed">
          Your profile stays local on this device and powers transparent rule-based eligibility checks and 100-point relevance explanations across the application.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Section 1: Identity and education */}
        <div className="bg-[#FFFFFF] dark:bg-[#182235] border border-[#E3E7F0] dark:border-[#344158] rounded-xl p-6 shadow-xs">
          <div className="text-[10px] font-bold tracking-wider uppercase text-[#6254E8] dark:text-[#9387FF] mb-1">
            ABOUT YOU
          </div>
          <h2 className="text-base font-bold text-[#17213A] dark:text-[#F7F8FC] mb-4 font-brand">
            Identity & Academic Background
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#17213A] dark:text-[#F7F8FC] mb-1">
                Name or nickname
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Aarav Mehta"
                className="w-full bg-[#F7F8FC] dark:bg-[#202B3D] border border-[#E3E7F0] dark:border-[#344158] rounded-lg px-3 py-2 text-xs text-[#17213A] dark:text-[#F7F8FC] focus:outline-none focus:border-[#6254E8]"
              />
              <span className="text-[11px] text-[#596780] dark:text-[#B8C2D9] mt-0.5 block">
                Optional — used only for your local greeting.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#17213A] dark:text-[#F7F8FC] mb-1">
                Education level *
              </label>
              <select
                value={educationLevel}
                onChange={(e) => setEducationLevel(e.target.value)}
                className="w-full bg-[#F7F8FC] dark:bg-[#202B3D] border border-[#E3E7F0] dark:border-[#344158] rounded-lg px-3 py-2 text-xs text-[#17213A] dark:text-[#F7F8FC] focus:outline-none focus:border-[#6254E8]"
              >
                {EDUCATION_OPTIONS.map((opt) => (
                  <option key={opt} value={opt} className="bg-white dark:bg-[#182235]">
                    {opt || 'Select education level...'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#17213A] dark:text-[#F7F8FC] mb-1">
                Degree or field of study
              </label>
              <input
                type="text"
                value={fieldOfStudy}
                onChange={(e) => setFieldOfStudy(e.target.value)}
                placeholder="e.g. B.Tech in Computer Science"
                className="w-full bg-[#F7F8FC] dark:bg-[#202B3D] border border-[#E3E7F0] dark:border-[#344158] rounded-lg px-3 py-2 text-xs text-[#17213A] dark:text-[#F7F8FC] focus:outline-none focus:border-[#6254E8]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#17213A] dark:text-[#F7F8FC] mb-1">
                College or institution
              </label>
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="e.g. Indian Institute of Technology (IIT)"
                className="w-full bg-[#F7F8FC] dark:bg-[#202B3D] border border-[#E3E7F0] dark:border-[#344158] rounded-lg px-3 py-2 text-xs text-[#17213A] dark:text-[#F7F8FC] focus:outline-none focus:border-[#6254E8]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#17213A] dark:text-[#F7F8FC] mb-1">
                Graduation year
              </label>
              <input
                type="number"
                min={2020}
                max={2040}
                value={graduationYear}
                onChange={(e) => setGraduationYear(Number(e.target.value))}
                className="w-full bg-[#F7F8FC] dark:bg-[#202B3D] border border-[#E3E7F0] dark:border-[#344158] rounded-lg px-3 py-2 text-xs text-[#17213A] dark:text-[#F7F8FC] focus:outline-none focus:border-[#6254E8]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#17213A] dark:text-[#F7F8FC] mb-1">
                Accessibility or other preferences
              </label>
              <input
                type="text"
                value={accessibility}
                onChange={(e) => setAccessibility(e.target.value)}
                placeholder="Optional. Add only what you need OpportunityKit to consider."
                className="w-full bg-[#F7F8FC] dark:bg-[#202B3D] border border-[#E3E7F0] dark:border-[#344158] rounded-lg px-3 py-2 text-xs text-[#17213A] dark:text-[#F7F8FC] focus:outline-none focus:border-[#6254E8]"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Skills and interests */}
        <div className="bg-[#FFFFFF] dark:bg-[#182235] border border-[#E3E7F0] dark:border-[#344158] rounded-xl p-6 shadow-xs">
          <div className="text-[10px] font-bold tracking-wider uppercase text-[#6254E8] dark:text-[#9387FF] mb-1">
            YOUR DIRECTION
          </div>
          <h2 className="text-base font-bold text-[#17213A] dark:text-[#F7F8FC] mb-4 font-brand">
            Skills & Interests
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-[#17213A] dark:text-[#F7F8FC] mb-1">
                Skills (comma-separated)
              </label>
              <input
                type="text"
                value={skillsStr}
                onChange={(e) => setSkillsStr(e.target.value)}
                placeholder="Python, SQL, Git, Streamlit..."
                className="w-full bg-[#F7F8FC] dark:bg-[#202B3D] border border-[#E3E7F0] dark:border-[#344158] rounded-lg px-3 py-2 text-xs text-[#17213A] dark:text-[#F7F8FC] focus:outline-none focus:border-[#6254E8]"
              />
              <div className="flex flex-wrap items-center gap-1 mt-2">
                <span className="text-[10px] text-[#596780] dark:text-[#B8C2D9] font-medium mr-1">
                  Quick add:
                </span>
                {SKILL_SUGGESTIONS.map((sk) => (
                  <button
                    type="button"
                    key={sk}
                    onClick={() => addSkillSuggestion(sk)}
                    className="text-[10px] bg-[#F7F8FC] dark:bg-[#202B3D] border border-[#E3E7F0] dark:border-[#344158] hover:border-[#6254E8] text-[#596780] dark:text-[#B8C2D9] px-1.5 py-0.5 rounded cursor-pointer"
                  >
                    + {sk}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#17213A] dark:text-[#F7F8FC] mb-1">
                Areas of interest (comma-separated)
              </label>
              <input
                type="text"
                value={interestsStr}
                onChange={(e) => setInterestsStr(e.target.value)}
                placeholder="AI/ML, Hackathons, Software development..."
                className="w-full bg-[#F7F8FC] dark:bg-[#202B3D] border border-[#E3E7F0] dark:border-[#344158] rounded-lg px-3 py-2 text-xs text-[#17213A] dark:text-[#F7F8FC] focus:outline-none focus:border-[#6254E8]"
              />
              <div className="flex flex-wrap items-center gap-1 mt-2">
                <span className="text-[10px] text-[#596780] dark:text-[#B8C2D9] font-medium mr-1">
                  Quick add:
                </span>
                {INTEREST_SUGGESTIONS.map((inte) => (
                  <button
                    type="button"
                    key={inte}
                    onClick={() => addInterestSuggestion(inte)}
                    className="text-[10px] bg-[#F7F8FC] dark:bg-[#202B3D] border border-[#E3E7F0] dark:border-[#344158] hover:border-[#6254E8] text-[#596780] dark:text-[#B8C2D9] px-1.5 py-0.5 rounded cursor-pointer"
                  >
                    + {inte}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Preferences */}
        <div className="bg-[#FFFFFF] dark:bg-[#182235] border border-[#E3E7F0] dark:border-[#344158] rounded-xl p-6 shadow-xs">
          <div className="text-[10px] font-bold tracking-wider uppercase text-[#6254E8] dark:text-[#9387FF] mb-1">
            PREFERENCES
          </div>
          <h2 className="text-base font-bold text-[#17213A] dark:text-[#F7F8FC] mb-4 font-brand">
            Where & How You Want to Explore
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#17213A] dark:text-[#F7F8FC] mb-2">
                Opportunity types
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => {
                  const active = oppTypes.includes(cat);
                  return (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => toggleOppType(cat)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#6254E8] text-white border-[#6254E8] shadow-xs'
                          : 'bg-[#F7F8FC] dark:bg-[#202B3D] text-[#596780] dark:text-[#B8C2D9] border-[#E3E7F0] dark:border-[#344158]'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#17213A] dark:text-[#F7F8FC] mb-2">
                Location preference
              </label>
              <select
                value={locationPref}
                onChange={(e) => setLocationPref(e.target.value)}
                className="w-full bg-[#F7F8FC] dark:bg-[#202B3D] border border-[#E3E7F0] dark:border-[#344158] rounded-lg px-3 py-2 text-xs text-[#17213A] dark:text-[#F7F8FC] focus:outline-none focus:border-[#6254E8]"
              >
                {LOCATION_OPTIONS.map((loc) => (
                  <option key={loc} value={loc} className="bg-white dark:bg-[#182235]">
                    {loc}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Feedback messages */}
        {errorMsg && (
          <div className="p-3.5 bg-[#FDEBED] dark:bg-[#49222D] border border-[#F4CBD0] dark:border-[#813B4A] text-[#C43D52] dark:text-[#F87171] text-xs font-semibold rounded-lg">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="p-3.5 bg-[#E5F5EF] dark:bg-[#17382F] border border-[#C9ECDF] dark:border-[#286B58] text-[#16866A] dark:text-[#2DD4BF] text-xs font-semibold rounded-lg flex items-center justify-between">
            <span>{successMsg}</span>
            {onNavigateToDiscover && (
              <button
                type="button"
                onClick={onNavigateToDiscover}
                className="underline font-bold cursor-pointer text-xs ml-3"
              >
                Discover Matching Opportunities →
              </button>
            )}
          </div>
        )}

        {/* Submit button */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="w-full sm:w-auto px-8 py-3 bg-[#6254E8] hover:bg-[#4F43CC] text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
          >
            Save profile
          </button>
        </div>
      </form>
    </div>
  );
};
