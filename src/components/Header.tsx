import React from 'react';
import { NavItem } from '../lib/opportunities';
import { StudentProfile } from '../types';

interface HeaderProps {
  currentPage: NavItem;
  profile: StudentProfile;
  savedCount: number;
  trackerCount: number;
  isDark: boolean;
  onToggleTheme: (dark: boolean) => void;
  onOpenMobileNav: () => void;
  onNavigate: (page: NavItem) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  profile,
  savedCount,
  isDark,
  onToggleTheme,
  onOpenMobileNav,
  onNavigate,
}) => {
  return (
    <header className="bg-[#FFFFFF] dark:bg-[#182235] border-b border-[#E3E7F0] dark:border-[#344158] sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between transition-colors shadow-2xs">
      {/* Left side: Mobile menu toggle & page breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileNav}
          className="md:hidden p-1.5 rounded-lg text-[#596780] dark:text-[#B8C2D9] hover:bg-[#F7F8FC] dark:hover:bg-[#202B3D] cursor-pointer"
          aria-label="Open sidebar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-brand font-bold text-[#6254E8] dark:text-[#9387FF] hidden sm:inline">
            OpportunityKit
          </span>
          <span className="text-[#CFD5E2] dark:text-[#4B5563] hidden sm:inline">/</span>
          <span className="font-semibold text-[#17213A] dark:text-[#F7F8FC] text-xs sm:text-sm">
            {currentPage}
          </span>
        </div>
      </div>

      {/* Right side: Student Profile chip, Saved count, Theme toggle */}
      <div className="flex items-center gap-3">
        {/* Profile Pill */}
        <button
          onClick={() => onNavigate('Student profile')}
          className="flex items-center gap-2 bg-[#F7F8FC] dark:bg-[#202B3D] hover:bg-[#EEEAFE] dark:hover:bg-[#24204F] border border-[#E3E7F0] dark:border-[#344158] px-2.5 py-1 rounded-full text-xs transition-colors cursor-pointer"
          title="Edit student profile"
        >
          <span className="w-5 h-5 rounded-full bg-[#6254E8] text-white flex items-center justify-center font-bold text-[10px]">
            {profile.name ? profile.name.charAt(0).toUpperCase() : 'S'}
          </span>
          <span className="font-semibold text-[#17213A] dark:text-[#F7F8FC] max-w-[100px] sm:max-w-[140px] truncate text-[11px]">
            {profile.name || 'Set up profile'}
          </span>
        </button>

        {/* Quick Saved Link */}
        <button
          onClick={() => onNavigate('Saved opportunities')}
          className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-[#596780] dark:text-[#B8C2D9] hover:text-[#6254E8] dark:hover:text-[#9387FF] px-2 py-1 rounded-lg transition-colors cursor-pointer"
          title="Saved opportunities"
        >
          <span>Saved</span>
          {savedCount > 0 && (
            <span className="bg-[#EEEAFE] dark:bg-[#302C50] text-[#6254E8] dark:text-[#9387FF] text-[10px] font-bold px-1.5 py-0.2 rounded-full">
              {savedCount}
            </span>
          )}
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={() => onToggleTheme(!isDark)}
          className="p-1.5 rounded-lg text-[#596780] dark:text-[#B8C2D9] hover:bg-[#F7F8FC] dark:hover:bg-[#202B3D] border border-[#E3E7F0] dark:border-[#344158] transition-colors cursor-pointer"
          title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
          aria-label="Toggle theme"
        >
          {isDark ? (
            <svg className="w-4 h-4 text-[#D6B779]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-[#17213A]" fill="currentColor" viewBox="0 0 20 20">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
          )}
        </button>
      </div>
    </header>
  );
};
