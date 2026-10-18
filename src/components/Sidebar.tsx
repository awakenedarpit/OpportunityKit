import React from 'react';
import { NavItem, NAV_ITEMS } from '../lib/opportunities';

interface SidebarProps {
  currentPage: NavItem;
  onNavigate: (page: NavItem) => void;
  isDark: boolean;
  onToggleTheme: (dark: boolean) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  savedCount?: number;
  trackerCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  isDark,
  onToggleTheme,
  isMobileOpen,
  onCloseMobile,
  savedCount = 0,
  trackerCount = 0,
}) => {
  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-[260px] bg-[#10182B] dark:bg-[#10182B] border-r border-[#1E2A44] flex flex-col justify-between p-5 transition-transform duration-200 md:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col gap-6">
          {/* Brand header */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('Overview')}>
            <img
              src="/assets/opportunitykit-logo-dark.svg"
              alt="OpportunityKit logo"
              className="h-9 w-auto"
            />
          </div>

          {/* Navigation */}
          <nav className="flex flex-col gap-1">
            <span className="text-[10px] font-bold tracking-wider uppercase text-[#7F91AD] px-3 mb-1">
              Workspace
            </span>
            {NAV_ITEMS.map((item) => {
              const active =
                currentPage === item ||
                (item === 'Discover' && (currentPage === 'Opportunity details' || currentPage === 'Fit Report'));

              const badge =
                item === 'Saved opportunities' && savedCount > 0
                  ? savedCount
                  : item === 'Application tracker' && trackerCount > 0
                  ? trackerCount
                  : null;

              return (
                <button
                  key={item}
                  onClick={() => {
                    onNavigate(item);
                    onCloseMobile();
                  }}
                  className={`text-left px-3 py-2.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                    active
                      ? 'bg-[#24204F] text-white border-l-3 border-[#6254E8] pl-2.5 shadow-xs'
                      : 'text-[#B8C4D8] hover:bg-[#162B50] hover:text-white'
                  }`}
                >
                  <span className="truncate">{item}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {badge !== null && (
                      <span className="bg-[#6254E8] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-[18px] text-center">
                        {badge}
                      </span>
                    )}
                    {active && <span className="w-1.5 h-1.5 rounded-full bg-[#6254E8]" />}
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Local-first banner */}
          <div className="bg-[#122544] border border-[#263D62] rounded-xl p-3.5 text-xs text-[#AFBDD1] leading-relaxed shadow-xs">
            <div className="flex items-center gap-1.5 text-[#D6B779] font-bold text-xs mb-1">
              <span>✦</span>
              <span>Local-first by design</span>
            </div>
            <p className="text-[11px] text-[#8F9FB5]">
              Your student profile and tracked applications stay private on this device. Fit Reports use transparent rules and grounded AI.
            </p>
          </div>
        </div>

        {/* Footer controls: theme and build note */}
        <div className="pt-4 border-t border-[#1E2A44] flex flex-col gap-3">
          <div>
            <div className="text-[10px] font-bold tracking-wider uppercase text-[#B8C2D9] mb-2">
              Appearance
            </div>
            <label className="flex items-center justify-between text-xs text-[#B8C4D8] cursor-pointer bg-[#162138] px-3 py-2 rounded-lg hover:bg-[#1B2947] transition-colors">
              <span className="font-medium">Dark mode</span>
              <input
                type="checkbox"
                checked={isDark}
                onChange={(e) => onToggleTheme(e.target.checked)}
                className="w-4 h-4 rounded text-[#6254E8] focus:ring-[#6254E8] accent-[#6254E8] cursor-pointer"
              />
            </label>
          </div>
          <div className="text-[11px] text-[#7F91AD] flex items-center justify-between">
            <span>OpportunityKit</span>
            <span className="text-[#C5A45D] font-mono text-[10px]">SETU 2026</span>
          </div>
        </div>
      </aside>
    </>
  );
};
