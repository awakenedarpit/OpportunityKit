import React from 'react';
import { Opportunity, StudentProfile, SavedRecord } from '../types';
import { calculateRelevance } from '../lib/matching';
import { checkEligibility } from '../lib/eligibility';
import { NavItem, getDeadlineInfo } from '../lib/opportunities';

interface OverviewViewProps {
  profile: StudentProfile;
  opportunities: Opportunity[];
  savedRecords: Record<string, SavedRecord>;
  onNavigate: (page: NavItem, opportunityId?: string) => void;
  onSearch: (query: string) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  profile,
  opportunities,
  savedRecords,
  onNavigate,
  onSearch,
}) => {
  const [searchInput, setSearchInput] = React.useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSearch(searchInput.trim());
      onNavigate('Discover');
    }
  };

  const greeting = profile.name
    ? `Welcome back, ${profile.name}.`
    : 'Make your next opportunity easier to find.';

  const isProfileIncomplete = !profile.education_level || (profile.skills || []).length === 0;

  let now = new Date();
  if (now.getFullYear() < 2026 || now.getFullYear() > 2027) {
    now = new Date(2026, 9, 18);
  }
  const todayStr = now.toISOString().split('T')[0];

  const totalCount = opportunities.length;

  const matchingOpportunities = React.useMemo(() => {
    return opportunities.filter(
      (opp) => checkEligibility(profile, opp).status.startsWith('Eligible')
    );
  }, [profile, opportunities]);

  const savedCount = Object.keys(savedRecords).length;

  const inProgressRecords = Object.values(savedRecords).filter(
    (item) => item.status === 'Preparing' || item.status === 'Applied' || item.status === 'Assessment / Interview'
  );

  const upcomingOpportunities = opportunities
    .filter((o) => o.deadline && o.deadline >= todayStr)
    .sort((a, b) => a.deadline.localeCompare(b.deadline))
    .slice(0, 3);

  const recentlyVerifiedOpportunities = [...opportunities]
    .sort((a, b) => b.last_verified.localeCompare(a.last_verified))
    .slice(0, 3);

  const rankedOpportunities = React.useMemo(() => {
    return [...opportunities]
      .map((opp) => ({
        opp,
        relevance: calculateRelevance(profile, opp),
        eligibility: checkEligibility(profile, opp),
      }))
      .sort((a, b) => b.relevance.score - a.relevance.score)
      .slice(0, 3);
  }, [profile, opportunities]);

  const hasSkillsOrInterests =
    (profile.skills || []).length > 0 || (profile.interests || []).length > 0;

  return (
    <div className="flex flex-col gap-8 max-w-[1180px] mx-auto">
      {/* Hero card */}
      <div className="hero-gradient bg-[#10182B] text-white rounded-2xl p-7 md:p-10 shadow-md border border-[#1E2A44]">
        <div className="text-[#C5A45D] dark:text-[#D6B779] uppercase tracking-widest text-xs font-extrabold mb-2">
          Discover your next opportunity
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2 font-brand">
          {greeting}
        </h1>
        <p className="text-[#BAC5DC] text-sm md:text-base max-w-2xl leading-relaxed mb-6">
          Find internships, scholarships, hackathons, and research programs. Check fit with deterministic rules, explore grounded Fit Reports, and track every application milestone.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <span className="bg-[#75E6C4] text-[#0B1933] px-3 py-1 rounded-md text-xs font-extrabold tracking-wide">
            Local-first
          </span>
          <span className="text-[#BAC5DC] text-xs font-medium">
            Rules you can inspect. AI that stays grounded. Verified sources.
          </span>
        </div>
      </div>

      {/* Quick Search */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by skill, program category, or organization..."
          className="w-full bg-[#FFFFFF] dark:bg-[#202B3D] border border-[#E3E7F0] dark:border-[#344158] rounded-xl px-4 py-3.5 text-xs md:text-sm focus:outline-none focus:border-[#6254E8] dark:focus:border-[#9387FF] text-[#17213A] dark:text-[#F7F8FC] placeholder-[#596780] dark:placeholder-[#B8C2D9] shadow-xs"
        />
        <button
          type="submit"
          className="absolute right-2 top-2 bottom-2 px-5 bg-[#6254E8] hover:bg-[#4F43CC] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
        >
          Search Catalogue
        </button>
      </form>

      {/* Feature Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigate('Discover')}
          className="bg-[#FFFFFF] dark:bg-[#182235] border border-[#E3E7F0] dark:border-[#344158] rounded-xl p-4 flex flex-col justify-between hover:border-[#6254E8] dark:hover:border-[#9387FF] transition-all cursor-pointer shadow-xs"
        >
          <div className="text-xl font-black text-[#6254E8] dark:text-[#9387FF]">⌕</div>
          <div>
            <h3 className="font-bold text-sm text-[#17213A] dark:text-[#F7F8FC] mt-2 mb-1">
              Discover clearly
            </h3>
            <p className="text-xs text-[#596780] dark:text-[#B8C2D9] leading-relaxed">
              Explore curated Indian and remote student opportunities with transparent relevance scores.
            </p>
          </div>
        </div>

        <div
          onClick={() => onNavigate('Discover')}
          className="bg-[#FFFFFF] dark:bg-[#182235] border border-[#E3E7F0] dark:border-[#344158] rounded-xl p-4 flex flex-col justify-between hover:border-[#6254E8] dark:hover:border-[#9387FF] transition-all cursor-pointer shadow-xs"
        >
          <div className="text-xl font-black text-[#6254E8] dark:text-[#9387FF]">✓</div>
          <div>
            <h3 className="font-bold text-sm text-[#17213A] dark:text-[#F7F8FC] mt-2 mb-1">
              Know your fit
            </h3>
            <p className="text-xs text-[#596780] dark:text-[#B8C2D9] leading-relaxed">
              Deterministic Python/TypeScript rules explain eligible, unknown, and conflicting requirements.
            </p>
          </div>
        </div>

        <div
          onClick={() => onNavigate('Application tracker')}
          className="bg-[#FFFFFF] dark:bg-[#182235] border border-[#E3E7F0] dark:border-[#344158] rounded-xl p-4 flex flex-col justify-between hover:border-[#6254E8] dark:hover:border-[#9387FF] transition-all cursor-pointer shadow-xs"
        >
          <div className="text-xl font-black text-[#6254E8] dark:text-[#9387FF]">↗</div>
          <div>
            <h3 className="font-bold text-sm text-[#17213A] dark:text-[#F7F8FC] mt-2 mb-1">
              Move forward
            </h3>
            <p className="text-xs text-[#596780] dark:text-[#B8C2D9] leading-relaxed">
              Save ideas, check milestones, manage application notes, and track your active progress.
            </p>
          </div>
        </div>

        <div
          onClick={() => onNavigate('Fit Report')}
          className="bg-[#FFFFFF] dark:bg-[#182235] border border-[#E3E7F0] dark:border-[#344158] rounded-xl p-4 flex flex-col justify-between hover:border-[#6254E8] dark:hover:border-[#9387FF] transition-all cursor-pointer shadow-xs"
        >
          <div className="text-xl font-black text-[#6254E8] dark:text-[#9387FF]">✦</div>
          <div>
            <h3 className="font-bold text-sm text-[#17213A] dark:text-[#F7F8FC] mt-2 mb-1">
              Get context
            </h3>
            <p className="text-xs text-[#596780] dark:text-[#B8C2D9] leading-relaxed">
              Use local Gemma or multi-provider models for evidence-based Fit Reports with honest fallbacks.
            </p>
          </div>
        </div>
      </div>

      {/* Incomplete profile prompt */}
      {isProfileIncomplete && (
        <div className="bg-[#FFFFFF] dark:bg-[#182235] border border-[#E3E7F0] dark:border-[#344158] rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div>
            <div className="text-[10px] font-bold tracking-wider uppercase text-[#6254E8] dark:text-[#9387FF] mb-1">
              START HERE
            </div>
            <h2 className="text-base md:text-lg font-bold text-[#17213A] dark:text-[#F7F8FC] mb-1 font-brand">
              Complete your student profile to unlock accurate matches
            </h2>
            <p className="text-xs text-[#596780] dark:text-[#B8C2D9] max-w-xl">
              Add your education level, graduation year, skills, and areas of interest. OpportunityKit uses them to check eligibility rules and calculate 100-point relevance scores.
            </p>
          </div>
          <button
            onClick={() => onNavigate('Student profile')}
            className="px-5 py-2.5 bg-[#6254E8] hover:bg-[#4F43CC] text-white text-xs font-bold rounded-lg transition-colors shrink-0 cursor-pointer shadow-xs"
          >
            Build my profile
          </button>
        </div>
      )}

      {/* Real Workspace Activity Metrics */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-[#17213A] dark:text-[#F7F8FC]">
            Live Workspace Activity
          </h2>
          <span className="text-xs text-[#596780] dark:text-[#B8C2D9]">
            Derived directly from local records
          </span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => onNavigate('Discover')}
            className="bg-[#FFFFFF] dark:bg-[#182235] border border-[#E3E7F0] dark:border-[#344158] rounded-xl p-4 hover:border-[#6254E8] transition-colors cursor-pointer shadow-xs"
          >
            <div className="text-xs font-semibold text-[#596780] dark:text-[#B8C2D9]">
              Total Catalogue
            </div>
            <div className="text-3xl font-extrabold text-[#17213A] dark:text-[#F7F8FC] mt-1 font-brand">
              {totalCount}
            </div>
            <div className="text-[11px] text-[#596780] dark:text-[#B8C2D9] mt-1">
              Active listings available
            </div>
          </div>

          <div
            onClick={() => onNavigate('Discover')}
            className="bg-[#FFFFFF] dark:bg-[#182235] border border-[#E3E7F0] dark:border-[#344158] rounded-xl p-4 hover:border-[#6254E8] transition-colors cursor-pointer shadow-xs"
          >
            <div className="text-xs font-semibold text-[#596780] dark:text-[#B8C2D9]">
              Matching Profile
            </div>
            <div className="text-3xl font-extrabold text-[#16866A] dark:text-[#2DD4BF] mt-1 font-brand">
              {matchingOpportunities.length}
            </div>
            <div className="text-[11px] text-[#596780] dark:text-[#B8C2D9] mt-1">
              Eligible based on rules
            </div>
          </div>

          <div
            onClick={() => onNavigate('Saved opportunities')}
            className="bg-[#FFFFFF] dark:bg-[#182235] border border-[#E3E7F0] dark:border-[#344158] rounded-xl p-4 hover:border-[#6254E8] transition-colors cursor-pointer shadow-xs"
          >
            <div className="text-xs font-semibold text-[#596780] dark:text-[#B8C2D9]">
              Saved
            </div>
            <div className="text-3xl font-extrabold text-[#17213A] dark:text-[#F7F8FC] mt-1 font-brand">
              {savedCount}
            </div>
            <div className="text-[11px] text-[#596780] dark:text-[#B8C2D9] mt-1">
              Saved for review
            </div>
          </div>

          <div
            onClick={() => onNavigate('Application tracker')}
            className="bg-[#FFFFFF] dark:bg-[#182235] border border-[#E3E7F0] dark:border-[#344158] rounded-xl p-4 hover:border-[#6254E8] transition-colors cursor-pointer shadow-xs"
          >
            <div className="text-xs font-semibold text-[#596780] dark:text-[#B8C2D9]">
              In Progress
            </div>
            <div className="text-3xl font-extrabold text-[#6254E8] dark:text-[#9387FF] mt-1 font-brand">
              {inProgressRecords.length}
            </div>
            <div className="text-[11px] text-[#596780] dark:text-[#B8C2D9] mt-1">
              Preparing or applied
            </div>
          </div>
        </div>
      </div>

      {/* Recommended For You */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-[#17213A] dark:text-[#F7F8FC]">
            Recommended for you
          </h2>
          <span className="text-xs text-[#596780] dark:text-[#B8C2D9]">
            Transparent relevance, not a selection guarantee
          </span>
        </div>

        {!hasSkillsOrInterests ? (
          <div className="bg-[#FFFFFF] dark:bg-[#182235] border border-dashed border-[#CFD5E2] dark:border-[#344158] rounded-2xl p-8 text-center shadow-xs">
            <h3 className="font-bold text-sm text-[#17213A] dark:text-[#F7F8FC] mb-1">
              Your recommendations start with your profile
            </h3>
            <p className="text-xs text-[#596780] dark:text-[#B8C2D9] mb-4">
              Add your skills and interests to see personalised rankings here.
            </p>
            <button
              onClick={() => onNavigate('Student profile')}
              className="px-4 py-2 bg-[#6254E8] text-white text-xs font-bold rounded-lg cursor-pointer"
            >
              Complete Profile
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {rankedOpportunities.map(({ opp, relevance, eligibility }) => {
              const isEligible = eligibility.status.startsWith('Eligible');
              const isNotEligible = eligibility.status.startsWith('Not');

              return (
                <div
                  key={opp.id}
                  className="bg-[#FFFFFF] dark:bg-[#182235] border border-[#E3E7F0] dark:border-[#344158] rounded-xl p-4 flex flex-col justify-between shadow-xs hover:border-[#6254E8] transition-colors"
                >
                  <div>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      <span className="bg-[#EEEAFE] dark:bg-[#302C50] text-[#4F43CC] dark:text-[#9387FF] text-[10px] font-extrabold px-2 py-0.5 rounded">
                        {opp.category}
                      </span>
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                          isEligible
                            ? 'bg-[#E5F5EF] dark:bg-[#17382F] text-[#16866A] dark:text-[#2DD4BF]'
                            : isNotEligible
                            ? 'bg-[#FDEBED] dark:bg-[#49222D] text-[#C43D52] dark:text-[#F87171]'
                            : 'bg-[#FFF4DF] dark:bg-[#493719] text-[#A86B16] dark:text-[#FBBF24]'
                        }`}
                      >
                        {isEligible ? 'Eligible' : isNotEligible ? 'Conflict' : 'Verify'}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-[#17213A] dark:text-[#F7F8FC] line-clamp-2 min-h-[40px] mb-2 font-brand">
                      {opp.title}
                    </h3>
                    <p className="text-xs text-[#596780] dark:text-[#B8C2D9] mb-1">
                      <b className="text-[#17213A] dark:text-[#F7F8FC]">{opp.organization}</b> · {opp.location}
                    </p>
                    <p className="text-xs text-[#596780] dark:text-[#B8C2D9]">
                      Deadline <b className="text-[#17213A] dark:text-[#F7F8FC]">{opp.deadline}</b>
                    </p>
                  </div>

                  <div className="border-t border-[#E3E7F0] dark:border-[#344158] mt-4 pt-3 flex items-center justify-between">
                    <div>
                      <span className="font-brand font-extrabold text-sm text-[#4F43CC] dark:text-[#9387FF]">
                        {relevance.score}/100
                      </span>
                      <span className="text-[11px] text-[#596780] dark:text-[#B8C2D9] ml-1.5">
                        fit score
                      </span>
                    </div>
                    <button
                      onClick={() => onNavigate('Opportunity details', opp.id)}
                      className="px-3 py-1.5 border border-[#E3E7F0] dark:border-[#344158] hover:border-[#6254E8] dark:hover:border-[#9387FF] text-xs font-semibold rounded-lg text-[#17213A] dark:text-[#F7F8FC] transition-colors cursor-pointer"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Two columns: Upcoming Deadlines & Recently Verified */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upcoming Deadlines */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-[#17213A] dark:text-[#F7F8FC] uppercase tracking-wider">
              Upcoming deadlines
            </h2>
            <span className="text-xs text-[#596780] dark:text-[#B8C2D9]">
              Nearest first
            </span>
          </div>
          <div className="flex flex-col gap-2.5">
            {upcomingOpportunities.map((opp) => {
              const deadlineInfo = getDeadlineInfo(opp.deadline);
              return (
                <div
                  key={opp.id}
                  className={`bg-[#FFFFFF] dark:bg-[#182235] border rounded-xl p-3.5 flex items-center justify-between gap-3 shadow-xs transition-colors ${
                    deadlineInfo.isClosingSoon
                      ? 'border-[#C5A45D] dark:border-[#D6B779] bg-[#FFFDF7] dark:bg-[#1C263A]'
                      : 'border-[#E3E7F0] dark:border-[#344158]'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      {deadlineInfo.isClosingSoon && (
                        <span className="bg-[#FFF4DF] dark:bg-[#493719] text-[#A86B16] dark:text-[#FBBF24] border border-[#F3DFAB] dark:border-[#80602B] text-[9px] font-extrabold px-1.5 py-0.2 rounded">
                          ⏰ {deadlineInfo.label}
                        </span>
                      )}
                      <span className="text-[10px] font-bold text-[#6254E8] dark:text-[#9387FF]">
                        {opp.category}
                      </span>
                    </div>
                    <h4 className="font-bold text-xs md:text-sm text-[#17213A] dark:text-[#F7F8FC]">
                      {opp.title}
                    </h4>
                    <div className="text-[11px] text-[#596780] dark:text-[#B8C2D9] mt-0.5">
                      {opp.organization}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right text-[11px] text-[#596780] dark:text-[#B8C2D9]">
                      <span className={`font-bold block ${deadlineInfo.isClosingSoon ? 'text-[#A86B16] dark:text-[#FBBF24]' : 'text-[#C5A45D] dark:text-[#D6B779]'}`}>
                        {opp.deadline}
                      </span>
                    </div>
                    <button
                      onClick={() => onNavigate('Opportunity details', opp.id)}
                      className="px-2.5 py-1 border border-[#E3E7F0] dark:border-[#344158] hover:border-[#6254E8] text-xs font-semibold rounded-lg text-[#17213A] dark:text-[#F7F8FC] cursor-pointer"
                    >
                      View
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recently Verified */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-[#17213A] dark:text-[#F7F8FC] uppercase tracking-wider">
              Recently Verified
            </h2>
            <span className="text-xs text-[#596780] dark:text-[#B8C2D9]">
              Confirmed records
            </span>
          </div>
          <div className="flex flex-col gap-2.5">
            {recentlyVerifiedOpportunities.map((opp) => (
              <div
                key={opp.id}
                className="bg-[#FFFFFF] dark:bg-[#182235] border border-[#E3E7F0] dark:border-[#344158] rounded-xl p-3.5 flex items-center justify-between gap-3 shadow-xs"
              >
                <div>
                  <h4 className="font-bold text-xs md:text-sm text-[#17213A] dark:text-[#F7F8FC]">
                    {opp.title}
                  </h4>
                  <div className="text-[11px] text-[#596780] dark:text-[#B8C2D9] mt-0.5">
                    {opp.organization} · {opp.category}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right text-[11px] text-[#596780] dark:text-[#B8C2D9]">
                    <span>Verified {opp.last_verified}</span>
                  </div>
                  <button
                    onClick={() => onNavigate('Opportunity details', opp.id)}
                    className="px-2.5 py-1 border border-[#E3E7F0] dark:border-[#344158] hover:border-[#6254E8] text-xs font-semibold rounded-lg text-[#17213A] dark:text-[#F7F8FC] cursor-pointer"
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer disclaimer */}
      <div className="border-t border-[#E3E7F0] dark:border-[#344158] pt-4 text-xs text-[#596780] dark:text-[#B8C2D9]">
        OpportunityKit is a local-first companion. Listings are synthetic demonstration data; always confirm deadlines, eligibility requirements, and official portals at the authoritative source.
      </div>
    </div>
  );
};
