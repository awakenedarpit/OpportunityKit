import React from 'react';
import { Opportunity, SavedRecord, StudentProfile, TrackerStatus } from '../types';
import { checkEligibility } from '../lib/eligibility';
import { calculateRelevance } from '../lib/matching';
import { getDeadlineInfo, NavItem, TRACKER_STATUSES } from '../lib/opportunities';

interface OpportunityDetailViewProps {
  opportunity: Opportunity;
  profile: StudentProfile;
  savedRecords: Record<string, SavedRecord>;
  onToggleSave: (oppId: string) => void;
  onUpdateStatus: (oppId: string, status: TrackerStatus) => void;
  onNavigate: (page: NavItem, opportunityId?: string) => void;
}

export const OpportunityDetailView: React.FC<OpportunityDetailViewProps> = ({
  opportunity,
  profile,
  savedRecords,
  onToggleSave,
  onUpdateStatus,
  onNavigate,
}) => {
  const eligibility = checkEligibility(profile, opportunity);
  const relevance = calculateRelevance(profile, opportunity);
  const deadlineInfo = getDeadlineInfo(opportunity.deadline);
  const savedRecord = savedRecords[opportunity.id];
  const isSaved = Boolean(savedRecord);

  const [showEligibilityBreakdown, setShowEligibilityBreakdown] = React.useState(false);
  const [showTrackerModal, setShowTrackerModal] = React.useState(false);
  const [showUrlNoticeModal, setShowUrlNoticeModal] = React.useState(false);
  const [selectedTrackerStatus, setSelectedTrackerStatus] = React.useState<TrackerStatus>(
    savedRecord?.status || 'Interested'
  );

  const isEligible = eligibility.status.startsWith('Eligible');
  const isNotEligible = eligibility.status.startsWith('Not');

  const ruleBg = isEligible
    ? 'bg-[#E5F5EF] dark:bg-[#17382F] border-[#C9ECDF] dark:border-[#286B58]'
    : isNotEligible
    ? 'bg-[#FDEBED] dark:bg-[#49222D] border-[#F4CBD0] dark:border-[#813B4A]'
    : 'bg-[#FFF4DF] dark:bg-[#493719] border-[#F3DFAB] dark:border-[#80602B]';

  const handleOpenSourceUrl = () => {
    if (opportunity.source_url && !opportunity.source_url.includes('example.com')) {
      const a = document.createElement('a');
      a.href = opportunity.source_url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.click();
    } else {
      setShowUrlNoticeModal(true);
    }
  };

  const handleApplyTracker = () => {
    if (!isSaved) {
      onToggleSave(opportunity.id);
    }
    onUpdateStatus(opportunity.id, selectedTrackerStatus);
    setShowTrackerModal(false);
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1180px] mx-auto">
      {/* Top back bar & quick actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('Discover')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#E3E7F0] dark:border-[#344158] hover:border-[#6254E8] dark:hover:border-[#9387FF] text-[#17213A] dark:text-[#F7F8FC] bg-[#FFFFFF] dark:bg-[#182235] transition-colors cursor-pointer"
        >
          ← Back to discover
        </button>
        <div className="text-[11px] font-mono text-[#596780] dark:text-[#B8C2D9]">
          ID: {opportunity.id}
        </div>
      </div>

      {/* Detail Hero Banner */}
      <div className="bg-[#FFFFFF] dark:bg-[#182235] border border-[#E3E7F0] dark:border-[#344158] rounded-xl p-6 shadow-xs">
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="bg-[#EEEAFE] dark:bg-[#302C50] text-[#4F43CC] dark:text-[#9387FF] text-xs font-extrabold px-2.5 py-1 rounded">
            {opportunity.category}
          </span>
          {deadlineInfo.isClosingSoon && (
            <span className="bg-[#FFF4DF] dark:bg-[#493719] text-[#A86B16] dark:text-[#FBBF24] border border-[#F3DFAB] dark:border-[#80602B] text-xs font-extrabold px-2.5 py-1 rounded flex items-center gap-1.5 shadow-xs">
              <span>⏰</span>
              <span>{deadlineInfo.label}</span>
            </span>
          )}
          <span className="bg-[#F1F2F5] dark:bg-[#344158] text-[#657087] dark:text-[#D7DEEB] text-xs font-extrabold px-2.5 py-1 rounded">
            DEMO DATA · NOT A REAL OPPORTUNITY
          </span>
          {savedRecord && (
            <span className="bg-[#24204F] text-[#9387FF] text-xs font-bold px-2.5 py-1 rounded border border-[#6254E8]">
              Tracker: {savedRecord.status}
            </span>
          )}
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#17213A] dark:text-[#F7F8FC] mb-2 tracking-tight font-brand">
          {opportunity.title}
        </h1>
        <div className="text-xs md:text-sm text-[#596780] dark:text-[#B8C2D9] flex flex-wrap items-center gap-x-4 gap-y-1">
          <span><b>Organization:</b> {opportunity.organization}</span>
          <span><b>Location:</b> {opportunity.location}</span>
          <span>
            <b>Deadline:</b>{' '}
            <span className={`font-bold ${deadlineInfo.isClosingSoon ? 'text-[#A86B16] dark:text-[#FBBF24]' : 'text-[#C5A45D] dark:text-[#D6B779]'}`}>
              {opportunity.deadline}
            </span>
            {deadlineInfo.isClosingSoon && (
              <span className="ml-1 text-xs font-extrabold text-[#A86B16] dark:text-[#FBBF24]">
                ({deadlineInfo.label})
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (Overview, Skills, Requirements, Benefits) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Overview */}
          <div className="bg-[#FFFFFF] dark:bg-[#182235] border border-[#E3E7F0] dark:border-[#344158] rounded-xl p-6 shadow-xs">
            <div className="text-[10px] font-bold tracking-wider uppercase text-[#6254E8] dark:text-[#9387FF] mb-1">
              ABOUT THE OPPORTUNITY
            </div>
            <h2 className="text-lg font-bold text-[#17213A] dark:text-[#F7F8FC] mb-3 font-brand">
              Program Overview
            </h2>
            <p className="text-sm text-[#34425B] dark:text-[#D7DEEB] leading-relaxed mb-6">
              {opportunity.description}
            </p>

            {/* Benefits & Perks */}
            {opportunity.benefits_or_rewards && (
              <div className="bg-[#F7F8FC] dark:bg-[#202B3D] border border-[#E3E7F0] dark:border-[#344158] rounded-lg p-3.5 mb-6">
                <span className="text-xs font-bold uppercase tracking-wider text-[#C5A45D] dark:text-[#D6B779] block mb-1">
                  ★ Stated Benefits & Rewards
                </span>
                <span className="text-xs text-[#17213A] dark:text-[#F7F8FC] font-medium">
                  {opportunity.benefits_or_rewards}
                </span>
              </div>
            )}

            {/* Skills */}
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#17213A] dark:text-[#F7F8FC] mb-2">
              Required Skills
            </h3>
            <div className="flex flex-wrap gap-1.5 mb-6">
              {opportunity.required_skills && opportunity.required_skills.length > 0 ? (
                opportunity.required_skills.map((skill) => (
                  <span
                    key={skill}
                    className="bg-[#F7F8FC] dark:bg-[#202B3D] border border-[#E3E7F0] dark:border-[#344158] text-xs font-medium text-[#17213A] dark:text-[#F7F8FC] px-2.5 py-1 rounded-md"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <span className="text-xs text-[#596780] dark:text-[#B8C2D9]">
                  No specific required skills listed
                </span>
              )}
            </div>

            {/* Eligibility Requirements */}
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#17213A] dark:text-[#F7F8FC] mb-2">
              Stated Eligibility Criteria
            </h3>
            <ul className="text-xs text-[#596780] dark:text-[#B8C2D9] space-y-1.5">
              {Object.entries(opportunity.eligibility || {}).map(([key, val]) => (
                <li key={key} className="flex items-start gap-1.5">
                  <span className="text-[#6254E8] dark:text-[#9387FF] font-bold">•</span>
                  <span>
                    <b className="capitalize text-[#17213A] dark:text-[#F7F8FC]">
                      {key.replace(/_/g, ' ')}:
                    </b>{' '}
                    {Array.isArray(val) ? val.join(', ') : String(val)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Column (Rule Assessment & Fit Score) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Assessment Box */}
          <div className={`rounded-xl p-5 border ${ruleBg} shadow-xs`}>
            <div className="text-[10px] font-bold tracking-wider uppercase opacity-80 mb-1">
              DETERMINISTIC RULE ASSESSMENT
            </div>
            <h3 className="font-bold text-base text-[#17213A] dark:text-[#F7F8FC] mb-2 font-brand">
              {eligibility.status}
            </h3>
            <p className="text-xs text-[#596780] dark:text-[#B8C2D9] leading-relaxed mb-3">
              Calculated using transparent logic comparing your student profile with the stated eligibility rules.
            </p>

            <button
              onClick={() => setShowEligibilityBreakdown(!showEligibilityBreakdown)}
              className="text-xs font-bold text-[#6254E8] dark:text-[#9387FF] hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>{showEligibilityBreakdown ? 'Hide Criteria Check' : 'Check My Eligibility'}</span>
              <span>{showEligibilityBreakdown ? '▲' : '▼'}</span>
            </button>

            {showEligibilityBreakdown && (
              <div className="mt-3 pt-3 border-t border-black/10 dark:border-white/10 space-y-2 text-xs">
                {eligibility.reasons.length > 0 && (
                  <div>
                    <span className="font-bold text-[#16866A] dark:text-[#2DD4BF] block mb-1">
                      Matched criteria:
                    </span>
                    <ul className="space-y-0.5">
                      {eligibility.reasons.map((r, i) => (
                        <li key={i} className="flex items-start gap-1 text-[#34425B] dark:text-[#D7DEEB]">
                          <span>✓</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {eligibility.missing_information.length > 0 && (
                  <div className="mt-2">
                    <span className="font-bold text-[#A86B16] dark:text-[#FBBF24] block mb-1">
                      Information to complete / verify:
                    </span>
                    <ul className="space-y-0.5">
                      {eligibility.missing_information.map((m, i) => (
                        <li key={i} className="flex items-start gap-1 text-[#34425B] dark:text-[#D7DEEB]">
                          <span>•</span>
                          <span>{m}</span>
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => onNavigate('Student profile')}
                      className="mt-2 text-[11px] font-bold text-[#6254E8] dark:text-[#9387FF] underline block"
                    >
                      Update Profile to Verify →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Relevance Score Box */}
          <div className="bg-[#FFFFFF] dark:bg-[#182235] border border-[#E3E7F0] dark:border-[#344158] rounded-xl p-5 shadow-xs">
            <div className="text-[10px] font-bold tracking-wider uppercase text-[#6254E8] dark:text-[#9387FF] mb-1">
              PROFILE RELEVANCE
            </div>
            <div className="flex items-baseline gap-1 my-2">
              <span className="text-4xl font-extrabold text-[#6254E8] dark:text-[#9387FF] font-brand tracking-tight">
                {relevance.score}
              </span>
              <span className="text-sm font-bold text-[#596780] dark:text-[#B8C2D9]">/100</span>
            </div>
            <p className="text-xs text-[#596780] dark:text-[#B8C2D9] mb-3">
              Relevance score measures profile alignment, not selection probability.
            </p>
            <div className="w-full h-2 bg-[#E3E7F0] dark:bg-[#344158] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#6254E8] dark:bg-[#9387FF] rounded-full transition-all duration-300"
                style={{ width: `${relevance.score}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Before you apply facts */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#17213A] dark:text-[#F7F8FC]">
            Source & Verification
          </h2>
          <span className="text-xs text-[#596780] dark:text-[#B8C2D9]">
            Facts to check before applying
          </span>
        </div>
        <div className="bg-[#FFFFFF] dark:bg-[#182235] border border-[#E3E7F0] dark:border-[#344158] rounded-xl p-4 text-xs text-[#596780] dark:text-[#B8C2D9] leading-relaxed space-y-1.5 shadow-xs">
          <div>
            <b className="text-[#17213A] dark:text-[#F7F8FC]">Last verified date:</b> {opportunity.last_verified}
          </div>
          <div>
            <b className="text-[#17213A] dark:text-[#F7F8FC]">Official source:</b>{' '}
            {opportunity.source_url ? (
              <span className="text-[#6254E8] dark:text-[#9387FF] underline cursor-pointer" onClick={handleOpenSourceUrl}>
                {opportunity.source_url}
              </span>
            ) : (
              'Synthetic demo record — no external application link'
            )}
          </div>
          <div className="text-[#A86B16] dark:text-[#FBBF24] font-medium pt-1">
            Demo notice: Synthetic demo listing for prototype and presentation use. Always verify requirements directly at official program portals.
          </div>
        </div>
      </div>

      {/* Action buttons bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
        <button
          onClick={() => onToggleSave(opportunity.id)}
          className={`py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
            isSaved
              ? 'bg-[#24204F] text-[#9387FF] border border-[#6254E8]'
              : 'bg-[#6254E8] hover:bg-[#4F43CC] text-white shadow-xs'
          }`}
        >
          {isSaved ? 'Remove from Saved' : 'Save Opportunity'}
        </button>

        <button
          onClick={() => setShowTrackerModal(true)}
          className="py-3 px-4 rounded-xl text-xs font-bold border border-[#E3E7F0] dark:border-[#344158] hover:border-[#6254E8] text-[#17213A] dark:text-[#F7F8FC] bg-[#FFFFFF] dark:bg-[#182235] transition-colors cursor-pointer text-center"
        >
          Add to Application Tracker
        </button>

        <button
          onClick={() => onNavigate('Fit Report', opportunity.id)}
          className="py-3 px-4 rounded-xl text-xs font-bold border border-[#E3E7F0] dark:border-[#344158] hover:border-[#6254E8] text-[#17213A] dark:text-[#F7F8FC] bg-[#FFFFFF] dark:bg-[#182235] transition-colors cursor-pointer text-center"
        >
          Create Fit Report
        </button>

        <button
          onClick={handleOpenSourceUrl}
          className="py-3 px-4 rounded-xl text-xs font-bold border border-[#E3E7F0] dark:border-[#344158] hover:border-[#C5A45D] text-[#C5A45D] dark:text-[#D6B779] bg-[#FFFFFF] dark:bg-[#182235] transition-colors cursor-pointer text-center"
        >
          Open Official Page ↗
        </button>
      </div>

      {/* Modal for adding to tracker */}
      {showTrackerModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] dark:bg-[#182235] border border-[#E3E7F0] dark:border-[#344158] rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-base font-bold text-[#17213A] dark:text-[#F7F8FC] mb-2 font-brand">
              Add to Application Tracker
            </h3>
            <p className="text-xs text-[#596780] dark:text-[#B8C2D9] mb-4">
              Track {opportunity.title} through your active application stages.
            </p>
            <div className="space-y-3 mb-5">
              <label className="block text-xs font-bold text-[#17213A] dark:text-[#F7F8FC]">
                Set Application Status
              </label>
              <select
                value={selectedTrackerStatus}
                onChange={(e) => setSelectedTrackerStatus(e.target.value as TrackerStatus)}
                className="w-full bg-[#F7F8FC] dark:bg-[#202B3D] border border-[#E3E7F0] dark:border-[#344158] rounded-lg px-3 py-2 text-xs font-semibold text-[#17213A] dark:text-[#F7F8FC]"
              >
                {TRACKER_STATUSES.map((s) => (
                  <option key={s} value={s} className="bg-white dark:bg-[#182235]">
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowTrackerModal(false)}
                className="px-4 py-2 border border-[#E3E7F0] dark:border-[#344158] rounded-lg text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyTracker}
                className="px-4 py-2 bg-[#6254E8] hover:bg-[#4F43CC] text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Confirm & Track
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for synthetic demo listing notice */}
      {showUrlNoticeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] dark:bg-[#182235] border border-[#E3E7F0] dark:border-[#344158] rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">ℹ️</span>
              <h3 className="text-base font-bold text-[#17213A] dark:text-[#F7F8FC] font-brand">
                Synthetic Demonstration Record
              </h3>
            </div>
            <p className="text-xs text-[#596780] dark:text-[#B8C2D9] leading-relaxed mb-4">
              <b className="text-[#17213A] dark:text-[#F7F8FC]">{opportunity.title}</b> is part of OpportunityKit's synthetic demo catalogue. No external application URL is active for demo listings.
            </p>
            <div className="bg-[#F7F8FC] dark:bg-[#202B3D] border border-[#E3E7F0] dark:border-[#344158] rounded-lg p-3 text-xs text-[#596780] dark:text-[#B8C2D9] mb-5">
              You can test the deterministic eligibility rules, view the 100-point fit breakdown, generate grounded AI reports, and track this record in your application workspace.
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowUrlNoticeModal(false)}
                className="px-4 py-2 bg-[#6254E8] text-white rounded-lg text-xs font-bold cursor-pointer hover:bg-[#4F43CC]"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
