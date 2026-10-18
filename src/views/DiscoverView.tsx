import React from 'react';
import { Opportunity, SavedRecord, StudentProfile } from '../types';
import { calculateRelevance } from '../lib/matching';
import { checkEligibility } from '../lib/eligibility';
import { CATEGORIES, NavItem, getDeadlineInfo } from '../lib/opportunities';

export { getDeadlineInfo };

interface DiscoverViewProps {
  profile: StudentProfile;
  opportunities: Opportunity[];
  savedRecords: Record<string, SavedRecord>;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onToggleSave: (oppId: string) => void;
  onNavigate: (page: NavItem, opportunityId?: string) => void;
}

const LOCATIONS = [
  'Any location',
  'Remote',
  'India',
  'Bengaluru',
  'New Delhi',
  'Mumbai',
  'Pune',
  'Hyderabad',
];

const ITEMS_PER_PAGE = 8;

export const DiscoverView: React.FC<DiscoverViewProps> = ({
  profile,
  opportunities,
  savedRecords,
  searchQuery,
  onSearchChange,
  onToggleSave,
  onNavigate,
}) => {
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = React.useState('Any location');
  const [selectedEligibility, setSelectedEligibility] = React.useState('All statuses');
  const [sortBy, setSortBy] = React.useState<'Relevance' | 'Deadline soonest' | 'Recently verified'>('Relevance');
  const [onlyClosingSoon, setOnlyClosingSoon] = React.useState(false);
  const [currentPageNum, setCurrentPageNum] = React.useState(1);

  const isDeadlineSortActive = sortBy === 'Deadline soonest';

  // Toggle deadline-based sorting
  const handleToggleDeadlineSort = () => {
    setCurrentPageNum(1);
    if (isDeadlineSortActive) {
      setSortBy('Relevance');
    } else {
      setSortBy('Deadline soonest');
    }
  };

  const toggleCategory = (cat: string) => {
    setCurrentPageNum(1);
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleClearAllFilters = () => {
    setSelectedCategories([]);
    setSelectedLocation('Any location');
    setSelectedEligibility('All statuses');
    setSortBy('Relevance');
    setOnlyClosingSoon(false);
    onSearchChange('');
    setCurrentPageNum(1);
  };

  // Count how many opportunities in the catalogue are closing within 7 days
  const closingSoonCount = React.useMemo(() => {
    return opportunities.filter((o) => getDeadlineInfo(o.deadline).isClosingSoon).length;
  }, [opportunities]);

  const hasActiveFilters =
    selectedCategories.length > 0 ||
    selectedLocation !== 'Any location' ||
    selectedEligibility !== 'All statuses' ||
    onlyClosingSoon ||
    Boolean(searchQuery.trim());

  const filtered = React.useMemo(() => {
    const list: Array<{
      opp: Opportunity;
      relevance: ReturnType<typeof calculateRelevance>;
      eligibility: ReturnType<typeof checkEligibility>;
      deadlineInfo: ReturnType<typeof getDeadlineInfo>;
    }> = [];

    for (const opp of opportunities) {
      const eligibility = checkEligibility(profile, opp);
      const deadlineInfo = getDeadlineInfo(opp.deadline);
      const haystack = `${opp.title} ${opp.organization} ${opp.description} ${opp.location} ${opp.required_skills?.join(' ')}`.toLowerCase();

      if (searchQuery && !haystack.includes(searchQuery.toLowerCase())) {
        continue;
      }

      if (onlyClosingSoon && !deadlineInfo.isClosingSoon) {
        continue;
      }

      if (selectedCategories.length > 0 && !selectedCategories.includes(opp.category)) {
        continue;
      }

      if (selectedLocation !== 'Any location') {
        const oppLoc = (opp.location || '').toLowerCase();
        const filterLoc = selectedLocation.toLowerCase();
        const isRemoteMatch = selectedLocation === 'Remote' && oppLoc.includes('remote');
        if (!oppLoc.includes(filterLoc) && !isRemoteMatch) {
          continue;
        }
      }

      if (selectedEligibility === 'Eligible' && !eligibility.status.startsWith('Eligible')) {
        continue;
      }
      if (selectedEligibility === 'Needs verification' && !eligibility.status.startsWith('Possibly')) {
        continue;
      }
      if (selectedEligibility === 'Known conflict' && !eligibility.status.startsWith('Not')) {
        continue;
      }

      list.push({
        opp,
        relevance: calculateRelevance(profile, opp),
        eligibility,
        deadlineInfo,
      });
    }

    if (sortBy === 'Relevance') {
      list.sort((a, b) => b.relevance.score - a.relevance.score);
    } else if (sortBy === 'Deadline soonest') {
      list.sort((a, b) => a.opp.deadline.localeCompare(b.opp.deadline));
    } else {
      list.sort((a, b) => b.opp.last_verified.localeCompare(a.opp.last_verified));
    }

    return list;
  }, [
    opportunities,
    profile,
    searchQuery,
    selectedCategories,
    selectedLocation,
    selectedEligibility,
    onlyClosingSoon,
    sortBy,
  ]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  const paginatedList = React.useMemo(() => {
    const start = (currentPageNum - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPageNum]);

  return (
    <div className="flex flex-col gap-6 max-w-[1180px] mx-auto">
      {/* Page Intro */}
      <div>
        <div className="text-[10px] font-bold tracking-wider uppercase text-[#6254E8] dark:text-[#9387FF] mb-1">
          DISCOVER
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#17213A] dark:text-[#F7F8FC] mb-2 font-brand">
          Find opportunities worth your attention.
        </h1>
        <p className="text-xs md:text-sm text-[#596780] dark:text-[#B8C2D9] max-w-2xl leading-relaxed">
          Search the catalogue, filter by opportunity type or eligibility status, and inspect deterministic rule assessments and fit breakdown for each match.
        </p>
      </div>

      {/* Search Input & Fast Toggle Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch">
        <div className="flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              onSearchChange(e.target.value);
              setCurrentPageNum(1);
            }}
            placeholder="Try Python, research, climate, fellowship, or a remote event..."
            className="w-full bg-[#FFFFFF] dark:bg-[#182235] border border-[#E3E7F0] dark:border-[#344158] rounded-xl px-4 py-3 text-xs md:text-sm focus:outline-none focus:border-[#6254E8] dark:focus:border-[#9387FF] text-[#17213A] dark:text-[#F7F8FC] placeholder-[#596780] dark:placeholder-[#B8C2D9] shadow-xs"
          />
        </div>

        {/* Deadline-based sorting toggle */}
        <button
          onClick={handleToggleDeadlineSort}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs shrink-0 ${
            isDeadlineSortActive
              ? 'bg-[#6254E8] text-white border border-[#6254E8] ring-2 ring-[#6254E8]/20'
              : 'bg-[#FFFFFF] dark:bg-[#182235] text-[#17213A] dark:text-[#F7F8FC] border border-[#E3E7F0] dark:border-[#344158] hover:border-[#6254E8]'
          }`}
          title="Toggle sorting by deadline soonest first"
        >
          <span>⏰</span>
          <span>Sort by Deadline Soonest</span>
          <span
            className={`w-2 h-2 rounded-full ${
              isDeadlineSortActive ? 'bg-[#75E6C4]' : 'bg-[#CFD5E2] dark:bg-[#4B5563]'
            }`}
          />
        </button>

        {/* Quick highlight filter for items closing within 7 days */}
        {closingSoonCount > 0 && (
          <button
            onClick={() => {
              setOnlyClosingSoon(!onlyClosingSoon);
              setCurrentPageNum(1);
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs shrink-0 ${
              onlyClosingSoon
                ? 'bg-[#A86B16] dark:bg-[#FBBF24] text-white dark:text-[#111827] border border-[#A86B16]'
                : 'bg-[#FFF4DF] dark:bg-[#493719] text-[#A86B16] dark:text-[#FBBF24] border border-[#F3DFAB] dark:border-[#80602B] hover:opacity-90'
            }`}
          >
            <span>🔥</span>
            <span>Closing in 7 Days</span>
            <span className="bg-black/10 dark:bg-white/20 text-[10px] px-1.5 py-0.2 rounded-full font-extrabold">
              {closingSoonCount}
            </span>
          </button>
        )}
      </div>

      {/* Filter Surface */}
      <div className="bg-[#FFFFFF] dark:bg-[#182235] border border-[#E3E7F0] dark:border-[#344158] rounded-xl p-4 shadow-xs flex flex-col gap-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Category Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#596780] dark:text-[#B8C2D9] mb-1.5">
              Category {selectedCategories.length > 0 && `(${selectedCategories.length})`}
            </label>
            <div className="flex flex-wrap gap-1">
              {CATEGORIES.map((cat) => {
                const active = selectedCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className={`text-[11px] font-semibold px-2 py-1 rounded-md transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#6254E8] text-white'
                        : 'bg-[#F7F8FC] dark:bg-[#202B3D] text-[#596780] dark:text-[#B8C2D9] hover:bg-[#EEEAFE] dark:hover:bg-[#24204F]'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Location Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#596780] dark:text-[#B8C2D9] mb-1.5">
              Location
            </label>
            <select
              value={selectedLocation}
              onChange={(e) => {
                setSelectedLocation(e.target.value);
                setCurrentPageNum(1);
              }}
              className="w-full bg-[#F7F8FC] dark:bg-[#202B3D] border border-[#E3E7F0] dark:border-[#344158] rounded-lg px-2.5 py-1.5 text-xs text-[#17213A] dark:text-[#F7F8FC] focus:outline-none focus:border-[#6254E8]"
            >
              {LOCATIONS.map((loc) => (
                <option key={loc} value={loc} className="bg-white dark:bg-[#202B3D]">
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Eligibility Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#596780] dark:text-[#B8C2D9] mb-1.5">
              Rule Eligibility
            </label>
            <select
              value={selectedEligibility}
              onChange={(e) => {
                setSelectedEligibility(e.target.value);
                setCurrentPageNum(1);
              }}
              className="w-full bg-[#F7F8FC] dark:bg-[#202B3D] border border-[#E3E7F0] dark:border-[#344158] rounded-lg px-2.5 py-1.5 text-xs text-[#17213A] dark:text-[#F7F8FC] focus:outline-none focus:border-[#6254E8]"
            >
              <option value="All statuses">All statuses</option>
              <option value="Eligible">Eligible</option>
              <option value="Needs verification">Needs verification</option>
              <option value="Known conflict">Known conflict</option>
            </select>
          </div>

          {/* Sort Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#596780] dark:text-[#B8C2D9] mb-1.5">
              Sort by
            </label>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as any);
                setCurrentPageNum(1);
              }}
              className="w-full bg-[#F7F8FC] dark:bg-[#202B3D] border border-[#E3E7F0] dark:border-[#344158] rounded-lg px-2.5 py-1.5 text-xs text-[#17213A] dark:text-[#F7F8FC] focus:outline-none focus:border-[#6254E8]"
            >
              <option value="Relevance">Relevance score</option>
              <option value="Deadline soonest">Deadline soonest</option>
              <option value="Recently verified">Recently verified</option>
            </select>
          </div>
        </div>

        {/* Clear all action */}
        {hasActiveFilters && (
          <div className="pt-2 border-t border-[#E3E7F0] dark:border-[#344158] flex items-center justify-between">
            <span className="text-xs text-[#596780] dark:text-[#B8C2D9]">
              {onlyClosingSoon && (
                <span className="text-[#A86B16] dark:text-[#FBBF24] font-semibold mr-2">
                  • Filtered to opportunities closing within 7 days
                </span>
              )}
              {isDeadlineSortActive && (
                <span className="text-[#6254E8] dark:text-[#9387FF] font-semibold">
                  • Sorted by deadline soonest first
                </span>
              )}
            </span>
            <button
              onClick={handleClearAllFilters}
              className="text-xs text-[#C43D52] dark:text-[#F87171] hover:underline font-semibold cursor-pointer"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Results Header */}
      <div className="flex items-end justify-between border-b border-[#E3E7F0] dark:border-[#344158] pb-3">
        <div>
          <div className="text-[10px] font-bold tracking-wider uppercase text-[#6254E8] dark:text-[#9387FF]">
            OPPORTUNITY INDEX
          </div>
          <h2 className="text-lg font-bold text-[#17213A] dark:text-[#F7F8FC]">
            {filtered.length} opportunities found
          </h2>
        </div>
        <span className="text-xs text-[#596780] dark:text-[#B8C2D9]">
          Showing page {currentPageNum} of {totalPages}
        </span>
      </div>

      {/* Results List */}
      {filtered.length === 0 ? (
        <div className="bg-[#FFFFFF] dark:bg-[#182235] border border-dashed border-[#CFD5E2] dark:border-[#344158] rounded-2xl p-10 text-center shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#6254E8] dark:text-[#9387FF] mb-1">
            NO MATCHES
          </div>
          <h3 className="font-bold text-base text-[#17213A] dark:text-[#F7F8FC] mb-1 font-brand">
            Try a broader search
          </h3>
          <p className="text-xs text-[#596780] dark:text-[#B8C2D9] mb-4">
            No opportunities match your current filters. Clear filters or explore related categories.
          </p>
          <button
            onClick={handleClearAllFilters}
            className="px-4 py-2 bg-[#6254E8] text-white text-xs font-bold rounded-lg cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="flex flex-col border border-[#E3E7F0] dark:border-[#344158] rounded-xl overflow-hidden bg-[#FFFFFF] dark:bg-[#182235] divide-y divide-[#E3E7F0] dark:divide-[#344158] shadow-xs">
          {paginatedList.map(({ opp, relevance, eligibility, deadlineInfo }) => {
            const isSaved = Boolean(savedRecords[opp.id]);
            const isEligible = eligibility.status.startsWith('Eligible');
            const isNotEligible = eligibility.status.startsWith('Not');

            const cleanStatus = eligibility.status
              .replace(' based on available information', '')
              .replace(' / needs verification', '')
              .replace(' based on known conflict', '');

            const isClosingSoon = deadlineInfo.isClosingSoon;

            return (
              <div
                key={opp.id}
                className={`p-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-center transition-colors ${
                  isClosingSoon
                    ? 'border-l-4 border-l-[#C5A45D] dark:border-l-[#D6B779] bg-[#FFFDF7] dark:bg-[#1C263A] hover:bg-[#FFF9EB] dark:hover:bg-[#202E46]'
                    : 'hover:bg-[#FBFCFD] dark:hover:bg-[#202B3D]'
                }`}
              >
                {/* Column 1: Title and Org */}
                <div className="md:col-span-5">
                  <div className="flex flex-wrap gap-1.5 mb-1.5 items-center">
                    <span className="bg-[#EEEAFE] dark:bg-[#302C50] text-[#4F43CC] dark:text-[#9387FF] text-[10px] font-extrabold px-2 py-0.5 rounded">
                      {opp.category}
                    </span>

                    {/* Closing Soon Highlight Badge */}
                    {isClosingSoon && (
                      <span className="bg-[#FFF4DF] dark:bg-[#493719] text-[#A86B16] dark:text-[#FBBF24] border border-[#F3DFAB] dark:border-[#80602B] text-[10px] font-extrabold px-2 py-0.5 rounded flex items-center gap-1 shadow-2xs">
                        <span>⏰</span>
                        <span>{deadlineInfo.label}</span>
                      </span>
                    )}

                    <span className="bg-[#F1F2F5] dark:bg-[#344158] text-[#657087] dark:text-[#D7DEEB] text-[10px] font-extrabold px-2 py-0.5 rounded">
                      DEMO DATA · NOT REAL
                    </span>
                  </div>
                  <h3
                    onClick={() => onNavigate('Opportunity details', opp.id)}
                    className="font-bold text-sm text-[#17213A] dark:text-[#F7F8FC] cursor-pointer hover:text-[#6254E8] dark:hover:text-[#9387FF] transition-colors font-brand"
                  >
                    {opp.title}
                  </h3>
                  <div className="text-xs text-[#596780] dark:text-[#B8C2D9] mt-0.5">
                    <b className="text-[#17213A] dark:text-[#F7F8FC]">{opp.organization}</b> · {opp.location}
                  </div>
                  <p className="text-xs text-[#596780] dark:text-[#B8C2D9] line-clamp-2 mt-1.5 leading-relaxed">
                    {opp.description}
                  </p>
                  {/* Skills tags */}
                  {opp.required_skills && opp.required_skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {opp.required_skills.slice(0, 3).map((sk) => (
                        <span
                          key={sk}
                          className="bg-[#F7F8FC] dark:bg-[#111827] text-[10px] font-medium text-[#596780] dark:text-[#B8C2D9] px-1.5 py-0.5 rounded border border-[#E3E7F0] dark:border-[#344158]"
                        >
                          {sk}
                        </span>
                      ))}
                      {opp.required_skills.length > 3 && (
                        <span className="text-[10px] text-[#596780] dark:text-[#B8C2D9] self-center">
                          +{opp.required_skills.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Column 2: Deadline with Highlighting */}
                <div className="md:col-span-2">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-[#596780] dark:text-[#B8C2D9]">
                    Deadline
                  </div>
                  <div
                    className={`text-xs mt-0.5 ${
                      isClosingSoon
                        ? 'font-extrabold text-[#A86B16] dark:text-[#FBBF24] flex flex-col'
                        : 'font-bold text-[#17213A] dark:text-[#F7F8FC]'
                    }`}
                  >
                    <span>{opp.deadline}</span>
                    {isClosingSoon && (
                      <span className="text-[10px] text-[#A86B16] dark:text-[#FBBF24] font-bold">
                        ({deadlineInfo.label})
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-[#596780] dark:text-[#B8C2D9] mt-0.5">
                    Verified {opp.last_verified}
                  </div>
                </div>

                {/* Column 3: Fit & Score */}
                <div className="md:col-span-3">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-[#596780] dark:text-[#B8C2D9]">
                    Your fit
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <span
                      className={`text-[11px] font-extrabold px-2 py-0.5 rounded border ${
                        isEligible
                          ? 'bg-[#E5F5EF] dark:bg-[#17382F] text-[#16866A] dark:text-[#2DD4BF] border-[#C9ECDF] dark:border-[#286B58]'
                          : isNotEligible
                          ? 'bg-[#FDEBED] dark:bg-[#49222D] text-[#C43D52] dark:text-[#F87171] border-[#F4CBD0] dark:border-[#813B4A]'
                          : 'bg-[#FFF4DF] dark:bg-[#493719] text-[#A86B16] dark:text-[#FBBF24] border-[#F3DFAB] dark:border-[#80602B]'
                      }`}
                    >
                      {cleanStatus}
                    </span>
                  </div>
                  <div className="text-xs text-[#596780] dark:text-[#B8C2D9] mt-1 font-brand">
                    <span className="font-extrabold text-[#6254E8] dark:text-[#9387FF]">
                      {relevance.score}/100
                    </span>{' '}
                    fit score
                  </div>
                </div>

                {/* Column 4: Actions */}
                <div className="md:col-span-2 flex flex-col sm:flex-row md:flex-col gap-2">
                  <button
                    onClick={() => onNavigate('Opportunity details', opp.id)}
                    className="w-full px-3 py-1.5 border border-[#E3E7F0] dark:border-[#344158] hover:border-[#6254E8] dark:hover:border-[#9387FF] text-xs font-semibold rounded-lg text-[#17213A] dark:text-[#F7F8FC] transition-colors cursor-pointer text-center"
                  >
                    Details
                  </button>
                  <button
                    onClick={() => onToggleSave(opp.id)}
                    className={`w-full px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer text-center ${
                      isSaved
                        ? 'bg-[#24204F] text-[#9387FF] border border-[#6254E8]'
                        : 'border border-[#E3E7F0] dark:border-[#344158] text-[#17213A] dark:text-[#F7F8FC] hover:bg-[#F7F8FC] dark:hover:bg-[#202B3D]'
                    }`}
                  >
                    {isSaved ? 'Saved ✓' : 'Save'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-[#E3E7F0] dark:border-[#344158] pt-4">
          <button
            onClick={() => setCurrentPageNum((p) => Math.max(1, p - 1))}
            disabled={currentPageNum === 1}
            className="px-3 py-1.5 border border-[#E3E7F0] dark:border-[#344158] rounded-lg text-xs font-semibold disabled:opacity-40 cursor-pointer"
          >
            ← Previous
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setCurrentPageNum(p)}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  currentPageNum === p
                    ? 'bg-[#6254E8] text-white'
                    : 'text-[#596780] dark:text-[#B8C2D9] hover:bg-[#EEEAFE] dark:hover:bg-[#202B3D]'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <button
            onClick={() => setCurrentPageNum((p) => Math.min(totalPages, p + 1))}
            disabled={currentPageNum === totalPages}
            className="px-3 py-1.5 border border-[#E3E7F0] dark:border-[#344158] rounded-lg text-xs font-semibold disabled:opacity-40 cursor-pointer"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};
