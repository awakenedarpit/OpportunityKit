import React from 'react';
import { FitReport, Opportunity, StudentProfile } from '../types';
import { checkEligibility } from '../lib/eligibility';
import { calculateRelevance } from '../lib/matching';
import { AIProviderManager } from '../lib/aiProvider';

interface FitReportViewProps {
  opportunities: Opportunity[];
  selectedOppId: string;
  onSelectOpp: (id: string) => void;
  profile: StudentProfile;
}

export const FitReportView: React.FC<FitReportViewProps> = ({
  opportunities,
  selectedOppId,
  onSelectOpp,
  profile,
}) => {
  const currentOpp =
    opportunities.find((o) => o.id === selectedOppId) || opportunities[0];

  const eligibility = checkEligibility(profile, currentOpp);
  const relevance = calculateRelevance(profile, currentOpp);

  const [report, setReport] = React.useState<FitReport | null>(null);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [errorStatus, setErrorStatus] = React.useState('');

  // Reset report if selected opportunity changes
  React.useEffect(() => {
    setReport(null);
    setErrorStatus('');
  }, [currentOpp.id]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setErrorStatus('');
    try {
      const manager = new AIProviderManager();
      const res = await manager.generateFitReport(profile, currentOpp, eligibility);
      setReport(res);
    } catch (e: any) {
      console.error('Fit Report error:', e);
      setErrorStatus(e.message || 'Generation encountered an error; using grounded rule fallback.');
    } finally {
      setIsGenerating(false);
    }
  };

  const isEligible = eligibility.status.startsWith('Eligible');
  const isNotEligible = eligibility.status.startsWith('Not');

  const ruleBg = isEligible
    ? 'bg-[#E5F5EF] dark:bg-[#17382F] border-[#C9ECDF] dark:border-[#286B58]'
    : isNotEligible
    ? 'bg-[#FDEBED] dark:bg-[#49222D] border-[#F4CBD0] dark:border-[#813B4A]'
    : 'bg-[#FFF4DF] dark:bg-[#493719] border-[#F3DFAB] dark:border-[#80602B]';

  return (
    <div className="flex flex-col gap-6 max-w-[1180px] mx-auto">
      {/* Opportunity Selector Dropdown */}
      <div className="bg-[#FFFFFF] dark:bg-[#182235] border border-[#E3E7F0] dark:border-[#344158] rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <label className="text-xs font-bold uppercase tracking-wider text-[#596780] dark:text-[#B8C2D9]">
          Select Opportunity to Evaluate:
        </label>
        <select
          value={currentOpp.id}
          onChange={(e) => onSelectOpp(e.target.value)}
          className="w-full sm:w-auto min-w-[340px] bg-[#F7F8FC] dark:bg-[#202B3D] border border-[#E3E7F0] dark:border-[#344158] rounded-lg px-3 py-2 text-xs font-semibold text-[#17213A] dark:text-[#F7F8FC] focus:outline-none focus:border-[#6254E8]"
        >
          {opportunities.map((opp) => (
            <option key={opp.id} value={opp.id} className="bg-white dark:bg-[#182235]">
              {opp.title} ({opp.organization})
            </option>
          ))}
        </select>
      </div>

      {/* Page Intro */}
      <div>
        <div className="text-[10px] font-bold tracking-wider uppercase text-[#6254E8] dark:text-[#9387FF] mb-1">
          FIT REPORT
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#17213A] dark:text-[#F7F8FC] mb-2 font-brand">
          A clearer path from interest to action.
        </h1>
        <p className="text-xs md:text-sm text-[#596780] dark:text-[#B8C2D9] max-w-2xl leading-relaxed">
          Combines deterministic Python/TypeScript eligibility calculations with grounded AI explanations. The AI is strictly bounded by supplied facts and can never change your eligibility status.
        </p>
      </div>

      {/* Overall Fit Summary */}
      <div className="bg-[#FFFFFF] dark:bg-[#182235] border border-[#E3E7F0] dark:border-[#344158] rounded-xl p-6 shadow-xs">
        <div className="text-[10px] font-bold tracking-wider uppercase text-[#6254E8] dark:text-[#9387FF] mb-2">
          OVERALL FIT SUMMARY
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-4">
          <div className="flex items-baseline gap-1 shrink-0">
            <span className="text-5xl font-extrabold text-[#6254E8] dark:text-[#9387FF] font-brand tracking-tight">
              {relevance.score}
            </span>
            <span className="text-sm font-bold text-[#596780] dark:text-[#B8C2D9]">/100</span>
          </div>
          <div>
            <h3 className="font-bold text-base text-[#17213A] dark:text-[#F7F8FC] font-brand">
              {currentOpp.title}
            </h3>
            <p className="text-xs text-[#596780] dark:text-[#B8C2D9] mt-0.5">
              Transparent relevance composite: Skills (45), Interest (20), Education (15), Location (10), Deadline (10).
            </p>
          </div>
        </div>
        <div className="w-full h-2 bg-[#E3E7F0] dark:bg-[#344158] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#6254E8] dark:bg-[#9387FF] rounded-full transition-all duration-300"
            style={{ width: `${relevance.score}%` }}
          />
        </div>
      </div>

      {/* Two Columns: Eligibility Rules vs Score Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Eligibility Assessment */}
        <div className="flex flex-col gap-4">
          <div className={`rounded-xl p-5 border ${ruleBg} shadow-xs`}>
            <div className="text-[10px] font-bold tracking-wider uppercase opacity-80 mb-1">
              DETERMINISTIC ELIGIBILITY STATUS
            </div>
            <h3 className="font-bold text-base text-[#17213A] dark:text-[#F7F8FC] mb-3 font-brand">
              {eligibility.status}
            </h3>

            {eligibility.reasons && eligibility.reasons.length > 0 && (
              <div className="mb-3">
                <div className="text-xs font-bold text-[#17213A] dark:text-[#F7F8FC] mb-1.5">
                  What supports this assessment
                </div>
                <ul className="text-xs text-[#596780] dark:text-[#B8C2D9] space-y-1">
                  {eligibility.reasons.map((r, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-[#16866A] dark:text-[#2DD4BF] font-bold">✓</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {eligibility.missing_information && eligibility.missing_information.length > 0 && (
              <div>
                <div className="text-xs font-bold text-[#17213A] dark:text-[#F7F8FC] mb-1.5">
                  Information to complete / verify
                </div>
                <ul className="text-xs text-[#596780] dark:text-[#B8C2D9] space-y-1">
                  {eligibility.missing_information.map((m, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-[#A86B16] dark:text-[#FBBF24] font-bold">•</span>
                      <span>{m}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Right: Score Breakdown */}
        <div className="bg-[#FFFFFF] dark:bg-[#182235] border border-[#E3E7F0] dark:border-[#344158] rounded-xl p-5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="text-[10px] font-bold tracking-wider uppercase text-[#6254E8] dark:text-[#9387FF] mb-3">
              100-POINT COMPONENT BREAKDOWN
            </div>
            <div className="space-y-3">
              {[
                { label: 'Skills overlap', max: 45, val: relevance.components['Skills overlap'] },
                { label: 'Interest/category', max: 20, val: relevance.components['Interest/category'] },
                { label: 'Education alignment', max: 15, val: relevance.components['Education alignment'] },
                { label: 'Location fit', max: 10, val: relevance.components['Location fit'] },
                { label: 'Deadline suitability', max: 10, val: relevance.components['Deadline suitability'] },
              ].map(({ label, max, val }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#596780] dark:text-[#B8C2D9]">{label}</span>
                    <span className="font-bold text-[#17213A] dark:text-[#F7F8FC]">
                      {val} / {max}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-[#E3E7F0] dark:bg-[#344158] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#6254E8] dark:bg-[#9387FF] rounded-full"
                      style={{ width: `${Math.min(100, (val / max) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Button to Generate Report */}
      <div>
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full py-3.5 px-6 bg-[#6254E8] hover:bg-[#4F43CC] disabled:bg-[#A59EF5] text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span>Checking AI providers & generating grounded report…</span>
            </>
          ) : (
            'Generate grounded Fit Report'
          )}
        </button>
        {errorStatus && (
          <div className="mt-2 text-xs text-[#A86B16] dark:text-[#FBBF24]">
            Notice: {errorStatus}
          </div>
        )}
      </div>

      {/* Report Display or Placeholder */}
      {report ? (
        <div className="flex flex-col gap-4">
          <div className="text-xs text-[#596780] dark:text-[#B8C2D9] flex items-center justify-between">
            <span><b>Explanation source:</b> {report.source}</span>
            <span className="text-[#16866A] dark:text-[#2DD4BF] font-semibold">Grounded in verified profile facts</span>
          </div>

          <div className="bg-[#FFFFFF] dark:bg-[#182235] border border-[#E3E7F0] dark:border-[#344158] rounded-xl p-5 shadow-xs">
            <h3 className="font-bold text-sm text-[#17213A] dark:text-[#F7F8FC] mb-2 font-brand">
              Why this matches you
            </h3>
            <ul className="text-xs text-[#34425B] dark:text-[#D7DEEB] space-y-1.5">
              {report.why_match.map((item, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-[#6254E8] dark:text-[#9387FF] font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-[#FFFFFF] dark:bg-[#182235] border border-[#E3E7F0] dark:border-[#344158] rounded-xl p-5 shadow-xs">
            <h3 className="font-bold text-sm text-[#17213A] dark:text-[#F7F8FC] mb-2 font-brand">
              Your profile strengths
            </h3>
            <ul className="text-xs text-[#34425B] dark:text-[#D7DEEB] space-y-1.5">
              {report.strengths.map((item, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-[#16866A] dark:text-[#2DD4BF] font-bold">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-[#FFFFFF] dark:bg-[#182235] border border-[#E3E7F0] dark:border-[#344158] rounded-xl p-5 shadow-xs">
            <h3 className="font-bold text-sm text-[#17213A] dark:text-[#F7F8FC] mb-2 font-brand">
              Gaps or criteria to address
            </h3>
            <ul className="text-xs text-[#34425B] dark:text-[#D7DEEB] space-y-1.5">
              {report.gaps.map((item, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-[#A86B16] dark:text-[#FBBF24] font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-[#FFFFFF] dark:bg-[#182235] border border-[#E3E7F0] dark:border-[#344158] rounded-xl p-5 shadow-xs">
            <h3 className="font-bold text-sm text-[#17213A] dark:text-[#F7F8FC] mb-2 font-brand">
              Recommended preparation & next steps
            </h3>
            <ul className="text-xs text-[#34425B] dark:text-[#D7DEEB] space-y-1.5">
              {report.next_steps.map((item, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-[#6254E8] dark:text-[#9387FF] font-bold">↗</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-[#FFFFFF] dark:bg-[#182235] border border-[#E3E7F0] dark:border-[#344158] rounded-xl p-5 shadow-xs">
            <h3 className="font-bold text-sm text-[#17213A] dark:text-[#F7F8FC] mb-2 font-brand">
              Before applying
            </h3>
            <ul className="text-xs text-[#34425B] dark:text-[#D7DEEB] space-y-1.5 mb-3">
              {report.before_applying.map((item, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-[#C5A45D] dark:text-[#D6B779] font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="text-[11px] text-[#7F91AD] border-t border-[#E3E7F0] dark:border-[#344158] pt-2">
              {currentOpp.source_url ? `Official source: ${currentOpp.source_url}` : 'Source: Synthetic demo record — no external application link'} · Last verified {currentOpp.last_verified}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[#FFFFFF] dark:bg-[#182235] border border-dashed border-[#CFD5E2] dark:border-[#344158] rounded-2xl p-8 text-center shadow-xs">
          <h3 className="font-bold text-sm text-[#17213A] dark:text-[#F7F8FC] mb-1 font-brand">
            Your evidence-based Fit Report is ready when you are
          </h3>
          <p className="text-xs text-[#596780] dark:text-[#B8C2D9]">
            Generate a grounded explanation using your configured AI provider or review the transparent deterministic assessment above.
          </p>
        </div>
      )}
    </div>
  );
};
