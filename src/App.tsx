import React from 'react';
import { Opportunity, SavedRecord, StudentProfile, TrackerStatus } from './types';
import { OPPORTUNITIES, NavItem } from './lib/opportunities';
import { storage } from './lib/storage';
import { DEMO_PROFILE, DEMO_SAVED_RECORDS } from './lib/demoData';
import { Sidebar } from './components/Sidebar';
import { OverviewView } from './views/OverviewView';
import { DiscoverView } from './views/DiscoverView';
import { OpportunityDetailView } from './views/OpportunityDetailView';
import { FitReportView } from './views/FitReportView';
import { SavedTrackerView } from './views/SavedTrackerView';
import { StudentProfileView } from './views/StudentProfileView';
import { AboutView } from './views/AboutView';

export const App: React.FC = () => {
  // Theme state: dark is default in OpportunityKit
  const [isDark, setIsDark] = React.useState<boolean>(() => {
    const saved = localStorage.getItem('opportunitykit_theme');
    return saved !== null ? saved === 'dark' : true;
  });

  const [isMobileOpen, setIsMobileOpen] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState<NavItem>('Overview');
  const [selectedOppId, setSelectedOppId] = React.useState<string>(OPPORTUNITIES[0]?.id || '');
  const [searchQuery, setSearchQuery] = React.useState('');

  // Initial seed check matching Streamlit app.py
  React.useEffect(() => {
    if (!storage.hasAnyRecords() && !storage.getDemoDisabled()) {
      storage.seedDemoData(DEMO_PROFILE, DEMO_SAVED_RECORDS);
    }
  }, []);

  const [profile, setProfile] = React.useState<StudentProfile>(() => {
    return (
      storage.loadProfile() || {
        name: '',
        education_level: '',
        field_of_study: '',
        college_or_institution: '',
        graduation_year: 2028,
        skills: [],
        interests: [],
        opportunity_types: [],
        location_preference: 'Any',
        accessibility_preferences: '',
      }
    );
  });

  const [savedRecords, setSavedRecords] = React.useState<Record<string, SavedRecord>>(() => {
    return storage.savedItems();
  });

  // Keep dark class on root document
  React.useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('opportunitykit_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('opportunitykit_theme', 'light');
    }
  }, [isDark]);

  // Sync state when storage changes
  React.useEffect(() => {
    const handleStorageChange = () => {
      setSavedRecords(storage.savedItems());
      const loaded = storage.loadProfile();
      if (loaded) setProfile(loaded);
    };

    window.addEventListener('opportunitykit_saved_changed', handleStorageChange);
    window.addEventListener('opportunitykit_profile_changed', handleStorageChange);

    return () => {
      window.removeEventListener('opportunitykit_saved_changed', handleStorageChange);
      window.removeEventListener('opportunitykit_profile_changed', handleStorageChange);
    };
  }, []);

  const handleNavigate = (page: NavItem, oppId?: string) => {
    setCurrentPage(page);
    if (oppId) {
      setSelectedOppId(oppId);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleSave = (oppId: string) => {
    const isSaved = storage.isSaved(oppId);
    storage.setSaved(oppId, !isSaved);
    setSavedRecords(storage.savedItems());
  };

  const handleUpdateStatus = (oppId: string, status: TrackerStatus) => {
    storage.updateStatus(oppId, status);
    setSavedRecords(storage.savedItems());
  };

  const handleUpdateTasks = (oppId: string, tasks: string[], completedTasks?: string[]) => {
    storage.updateTasks(oppId, tasks, completedTasks);
    setSavedRecords(storage.savedItems());
  };

  const handleUpdateNotes = (oppId: string, notes: string) => {
    storage.updateNotes(oppId, notes);
    setSavedRecords(storage.savedItems());
  };

  const handleUpdateAppliedDate = (oppId: string, appliedDate: string) => {
    storage.updateAppliedDate(oppId, appliedDate);
    setSavedRecords(storage.savedItems());
  };

  const handleSaveProfile = (updated: StudentProfile) => {
    storage.saveProfile(updated, 'user');
    setProfile(updated);
  };

  const handleRefreshData = () => {
    setSavedRecords(storage.savedItems());
    const loaded = storage.loadProfile();
    if (loaded) setProfile(loaded);
  };

  const currentOpportunity: Opportunity =
    OPPORTUNITIES.find((o) => o.id === selectedOppId) || OPPORTUNITIES[0];

  const savedCount = Object.keys(savedRecords).length;
  const trackerCount = savedCount;

  return (
    <div className="min-h-screen bg-[#F7F8FC] dark:bg-[#111827] text-[#17213A] dark:text-[#F7F8FC] flex">
      {/* Sidebar navigation */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        isDark={isDark}
        onToggleTheme={setIsDark}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
        savedCount={savedCount}
        trackerCount={trackerCount}
      />

      {/* Main content wrapper */}
      <div className="flex-1 md:pl-[260px] flex flex-col min-h-screen">
        {/* Mobile topbar */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[#10182B] border-b border-[#1E2A44] sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="p-1.5 rounded-lg text-[#B8C2D9] hover:text-white hover:bg-[#162138] focus:outline-none cursor-pointer"
              aria-label="Open navigation menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="font-extrabold text-sm tracking-tight text-white font-brand">OpportunityKit</span>
          </div>
          <span className="text-xs text-[#C5A45D] dark:text-[#D6B779] font-semibold">{currentPage}</span>
        </header>

        {/* View container */}
        <main className="flex-1 p-4 sm:p-8 lg:p-10">
          {currentPage === 'Overview' && (
            <OverviewView
              profile={profile}
              opportunities={OPPORTUNITIES}
              savedRecords={savedRecords}
              onNavigate={handleNavigate}
              onSearch={setSearchQuery}
            />
          )}

          {currentPage === 'Discover' && (
            <DiscoverView
              profile={profile}
              opportunities={OPPORTUNITIES}
              savedRecords={savedRecords}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onToggleSave={handleToggleSave}
              onNavigate={handleNavigate}
            />
          )}

          {currentPage === 'Opportunity details' && (
            <OpportunityDetailView
              opportunity={currentOpportunity}
              profile={profile}
              savedRecords={savedRecords}
              onToggleSave={handleToggleSave}
              onUpdateStatus={handleUpdateStatus}
              onNavigate={handleNavigate}
            />
          )}

          {currentPage === 'Fit Report' && (
            <FitReportView
              opportunities={OPPORTUNITIES}
              selectedOppId={selectedOppId}
              onSelectOpp={setSelectedOppId}
              profile={profile}
            />
          )}

          {(currentPage === 'Saved opportunities' || currentPage === 'Application tracker') && (
            <SavedTrackerView
              isTracker={currentPage === 'Application tracker'}
              opportunities={OPPORTUNITIES}
              savedRecords={savedRecords}
              profile={profile}
              onUpdateStatus={handleUpdateStatus}
              onUpdateTasks={handleUpdateTasks}
              onUpdateNotes={handleUpdateNotes}
              onUpdateAppliedDate={handleUpdateAppliedDate}
              onToggleSave={handleToggleSave}
              onNavigate={handleNavigate}
            />
          )}

          {currentPage === 'Student profile' && (
            <StudentProfileView
              initialProfile={profile}
              onSaveProfile={handleSaveProfile}
              onNavigateToDiscover={() => handleNavigate('Discover')}
            />
          )}

          {currentPage === 'About' && (
            <AboutView onRefreshData={handleRefreshData} />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
