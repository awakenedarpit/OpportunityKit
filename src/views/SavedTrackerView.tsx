import React from 'react';
import { Opportunity, SavedRecord, StudentProfile, TrackerStatus } from '../types';
import { checkEligibility } from '../lib/eligibility';
import { TRACKER_STATUSES, NavItem, getDeadlineInfo } from '../lib/opportunities';

interface SavedTrackerViewProps {
  isTracker: boolean;
  opportunities: Opportunity[];
  savedRecords: Record<string, SavedRecord>;
  profile: StudentProfile;
  onUpdateStatus: (oppId: string, status: TrackerStatus) => void;
  onUpdateTasks: (oppId: string, tasks: string[], completedTasks?: string[]) => void;
  onUpdateNotes: (oppId: string, notes: string) => void;
  onUpdateAppliedDate: (oppId: string, appliedDate: string) => void;
  onToggleSave: (oppId: string) => void;
  onNavigate: (page: NavItem, opportunityId?: string) => void;
}

export const SavedTrackerView: React.FC<SavedTrackerViewProps> = ({
  isTracker,
  opportunities,
  savedRecords,
  profile,
  onUpdateStatus,
  onUpdateTasks,
  onUpdateNotes,
  onUpdateAppliedDate,
  onToggleSave,
  onNavigate,
}) => {
  const [statusFilter, setStatusFilter] = React.useState<string>('All statuses');
  const [taskInput, setTaskInput] = React.useState<Record<string, string>>({});
  const [recordToDelete, setRecordToDelete] = React.useState<string | null>(null);

  // Group records by status for tracker tabs
  const statusCounts = React.useMemo(() => {
    const counts: Record<string, number> = { 'All statuses': 0 };
    for (const s of TRACKER_STATUSES) {
      counts[s] = 0;
    }
    for (const opp of opportunities) {
      const rec = savedRecords[opp.id];
      if (rec) {
        counts['All statuses'] = (counts['All statuses'] || 0) + 1;
        counts[rec.status] = (counts[rec.status] || 0) + 1;
      }
    }
    return counts;
  }, [opportunities, savedRecords]);

  const records = React.useMemo(() => {
    const list: Array<{ opp: Opportunity; record: SavedRecord }> = [];
    for (const opp of opportunities) {
      const rec = savedRecords[opp.id];
      if (rec) {
        if (!isTracker || statusFilter === 'All statuses' || rec.status === statusFilter) {
          list.push({ opp, record: rec });
        }
      }
    }
    list.sort((a, b) => a.opp.deadline.localeCompare(b.opp.deadline));
    return list;
  }, [opportunities, savedRecords, isTracker, statusFilter]);

  const handleToggleTaskCompletion = (oppId: string, task: string) => {
    const rec = savedRecords[oppId];
    if (!rec) return;
    const completed = new Set(rec.completedTasks || []);
    if (completed.has(task)) {
      completed.delete(task);
    } else {
      completed.add(task);
    }
    onUpdateTasks(oppId, rec.tasks, Array.from(completed));
  };

  const handleAddTask = (oppId: string) => {
    const input = (taskInput[oppId] || '').trim();
    if (!input) return;
    const rec = savedRecords[oppId];
    if (!rec) return;
    const tasks = [...(rec.tasks || []), input];
    onUpdateTasks(oppId, tasks, rec.completedTasks);
    setTaskInput((prev) => ({ ...prev, [oppId]: '' }));
  };

  const handleRemoveTask = (oppId: string, indexToRemove: number) => {
    const rec = savedRecords[oppId];
    if (!rec) return;
    const removedTask = rec.tasks[indexToRemove];
    const newTasks = rec.tasks.filter((_, i) => i !== indexToRemove);
    const newCompleted = (rec.completedTasks || []).filter((t) => t !== removedTask);
    onUpdateTasks(oppId, newTasks, newCompleted);
  };

  const handleConfirmDelete = () => {
    if (recordToDelete) {
      onToggleSave(recordToDelete);
      setRecordToDelete(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1180px] mx-auto">
      {/* Intro */}
      <div>
        <div className="text-[10px] font-bold tracking-wider uppercase text-[#6254E8] dark:text-[#9387FF] mb-1">
          {isTracker ? 'APPLICATION TRACKER' : 'SAVED OPPORTUNITIES'}
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#17213A] dark:text-[#F7F8FC] mb-2 font-brand">
          {isTracker ? 'Track Your Progress' : 'Saved for Review'}
        </h1>
        <p className="text-xs md:text-sm text-[#596780] dark:text-[#B8C2D9] max-w-2xl leading-relaxed">
          {isTracker
            ? 'Manage active application stages, record submission dates, track preparation checklists, and keep personal interview notes.'
            : 'A calm space for opportunities worth revisiting. Review requirements, inspect fit, or promote listings into your active tracker.'}
        </p>
      </div>

      {/* Tracker Status Filter Tabs */}
      {isTracker && (
        <div className="flex flex-wrap gap-2 border-b border-[#E3E7F0] dark:border-[#344158] pb-3">
          {['All statuses', ...TRACKER_STATUSES].map((s) => {
            const count = statusCounts[s] || 0;
            const active = statusFilter === s;
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                  active
                    ? 'bg-[#6254E8] text-white shadow-xs'
                    : 'bg-[#FFFFFF] dark:bg-[#182235] text-[#596780] dark:text-[#B8C2D9] border border-[#E3E7F0] dark:border-[#344158] hover:border-[#6254E8]'
                }`}
              >
                <span>{s}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${active ? 'bg-[#24204F]' : 'bg-[#F7F8FC] dark:bg-[#202B3D]'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* List / Empty State */}
      {records.length === 0 ? (
        <div className="bg-[#FFFFFF] dark:bg-[#182235] border border-dashed border-[#CFD5E2] dark:border-[#344158] rounded-2xl p-10 text-center shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#6254E8] dark:text-[#9387FF] mb-1">
            {isTracker ? 'NO TRACKED APPLICATIONS' : 'A QUIET START'}
          </div>
          <h3 className="font-bold text-base text-[#17213A] dark:text-[#F7F8FC] mb-1 font-brand">
            {isTracker
              ? `No applications currently in status "${statusFilter}"`
              : 'No saved opportunities yet'}
          </h3>
          <p className="text-xs text-[#596780] dark:text-[#B8C2D9] mb-4">
            {isTracker
              ? 'Move opportunities from Discover into your tracker to monitor your progress.'
              : 'Save listings from the Discover catalogue when they feel worth a closer look.'}
          </p>
          <button
            onClick={() => onNavigate('Discover')}
            className="px-5 py-2.5 bg-[#6254E8] hover:bg-[#4F43CC] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            Browse catalogue
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="text-xs font-semibold text-[#596780] dark:text-[#B8C2D9]">
            {records.length} {isTracker ? 'tracked application' : 'saved opportunity'}{records.length === 1 ? '' : 's'}
          </div>

          {records.map(({ opp, record }) => {
            const eligibility = checkEligibility(profile, opp);
            const deadlineInfo = getDeadlineInfo(opp.deadline);
            const isEligible = eligibility.status.startsWith('Eligible');
            const isNotEligible = eligibility.status.startsWith('Not');
            const completedSet = new Set(record.completedTasks || []);

            return (
              <div
                key={opp.id}
                className={`bg-[#FFFFFF] dark:bg-[#182235] border rounded-xl p-5 shadow-xs flex flex-col gap-4 ${
                  deadlineInfo.isClosingSoon
                    ? 'border-l-4 border-l-[#C5A45D] dark:border-l-[#D6B779] border-[#E3E7F0] dark:border-[#344158] bg-[#FFFDF7] dark:bg-[#1C263A]'
                    : 'border-[#E3E7F0] dark:border-[#344158]'
                }`}
              >
                {/* Header row */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                  <div className="md:col-span-5">
                    <h3 className="font-bold text-sm text-[#17213A] dark:text-[#F7F8FC] font-brand">
                      {opp.title}
                    </h3>
                    <div className="text-xs text-[#596780] dark:text-[#B8C2D9] mt-0.5">
                      <b>{opp.organization}</b> · {opp.category} · Deadline:{' '}
                      <span className={`font-bold ${deadlineInfo.isClosingSoon ? 'text-[#A86B16] dark:text-[#FBBF24]' : 'text-[#C5A45D] dark:text-[#D6B779]'}`}>
                        {opp.deadline}
                      </span>
                      {deadlineInfo.isClosingSoon && (
                        <span className="ml-2 inline-flex items-center gap-1 bg-[#FFF4DF] dark:bg-[#493719] text-[#A86B16] dark:text-[#FBBF24] border border-[#F3DFAB] dark:border-[#80602B] text-[10px] font-extrabold px-1.5 py-0.2 rounded">
                          ⏰ {deadlineInfo.label}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Eligibility Pill */}
                  <div className="md:col-span-3">
                    <span
                      className={`inline-block text-[11px] font-extrabold px-2.5 py-1 rounded border ${
                        isEligible
                          ? 'bg-[#E5F5EF] dark:bg-[#17382F] text-[#16866A] dark:text-[#2DD4BF] border-[#C9ECDF] dark:border-[#286B58]'
                          : isNotEligible
                          ? 'bg-[#FDEBED] dark:bg-[#49222D] text-[#C43D52] dark:text-[#F87171] border-[#F4CBD0] dark:border-[#813B4A]'
                          : 'bg-[#FFF4DF] dark:bg-[#493719] text-[#A86B16] dark:text-[#FBBF24] border-[#F3DFAB] dark:border-[#80602B]'
                      }`}
                    >
                      {eligibility.status.replace(' based on available information', '').replace(' / needs verification', '')}
                    </span>
                  </div>

                  {/* Status Dropdown */}
                  <div className="md:col-span-2">
                    <select
                      value={record.status}
                      onChange={(e) => onUpdateStatus(opp.id, e.target.value as TrackerStatus)}
                      className="w-full bg-[#F7F8FC] dark:bg-[#202B3D] border border-[#E3E7F0] dark:border-[#344158] rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#17213A] dark:text-[#F7F8FC] focus:outline-none focus:border-[#6254E8]"
                    >
                      {TRACKER_STATUSES.map((s) => (
                        <option key={s} value={s} className="bg-white dark:bg-[#182235]">
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Open details & Remove */}
                  <div className="md:col-span-2 flex items-center gap-2">
                    <button
                      onClick={() => onNavigate('Opportunity details', opp.id)}
                      className="flex-1 px-3 py-1.5 border border-[#E3E7F0] dark:border-[#344158] hover:border-[#6254E8] text-xs font-semibold rounded-lg text-[#17213A] dark:text-[#F7F8FC] transition-colors cursor-pointer text-center"
                    >
                      Details
                    </button>
                    <button
                      onClick={() => setRecordToDelete(opp.id)}
                      className="p-1.5 text-xs text-[#C43D52] dark:text-[#F87171] hover:bg-[#FDEBED] dark:hover:bg-[#49222D] rounded-lg transition-colors cursor-pointer"
                      title="Remove from workspace"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Tracker Specific Fields: Applied Date & Notes */}
                {isTracker && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-[#E3E7F0] dark:border-[#344158]">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[#596780] dark:text-[#B8C2D9] mb-1">
                        Application Submission Date
                      </label>
                      <input
                        type="date"
                        value={record.applied_date || ''}
                        onChange={(e) => onUpdateAppliedDate(opp.id, e.target.value)}
                        className="w-full bg-[#F7F8FC] dark:bg-[#202B3D] border border-[#E3E7F0] dark:border-[#344158] rounded-lg px-2.5 py-1 text-xs text-[#17213A] dark:text-[#F7F8FC]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[#596780] dark:text-[#B8C2D9] mb-1">
                        Personal Notes & Follow-up
                      </label>
                      <input
                        type="text"
                        defaultValue={record.notes || ''}
                        onBlur={(e) => onUpdateNotes(opp.id, e.target.value)}
                        placeholder="e.g. Spoke with recruiter at career fair, interview scheduled..."
                        className="w-full bg-[#F7F8FC] dark:bg-[#202B3D] border border-[#E3E7F0] dark:border-[#344158] rounded-lg px-2.5 py-1 text-xs text-[#17213A] dark:text-[#F7F8FC]"
                      />
                    </div>
                  </div>
                )}

                {/* Preparation Checklist */}
                <div className="border-t border-[#E3E7F0] dark:border-[#344158] pt-3">
                  <div className="text-[11px] font-bold text-[#596780] dark:text-[#B8C2D9] mb-2 flex items-center justify-between">
                    <span>Preparation Checklist</span>
                    <span className="text-[10px] font-normal opacity-75">
                      {record.completedTasks?.length || 0} of {record.tasks?.length || 0} completed
                    </span>
                  </div>

                  {/* Tasks List */}
                  <div className="space-y-1.5 mb-2.5">
                    {(record.tasks || []).map((t, idx) => {
                      const isDone = completedSet.has(t);
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between bg-[#F7F8FC] dark:bg-[#202B3D] px-2.5 py-1.5 rounded-lg border border-[#E3E7F0] dark:border-[#344158] text-xs"
                        >
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={isDone}
                              onChange={() => handleToggleTaskCompletion(opp.id, t)}
                              className="w-3.5 h-3.5 rounded text-[#6254E8] accent-[#6254E8]"
                            />
                            <span className={isDone ? 'line-through text-[#7F91AD]' : 'text-[#17213A] dark:text-[#F7F8FC]'}>
                              {t}
                            </span>
                          </label>
                          <button
                            onClick={() => handleRemoveTask(opp.id, idx)}
                            className="text-[#7F91AD] hover:text-[#C43D52] text-xs ml-2 cursor-pointer"
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Add Task Input */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={taskInput[opp.id] || ''}
                      onChange={(e) => setTaskInput({ ...taskInput, [opp.id]: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTask(opp.id);
                        }
                      }}
                      placeholder="Add custom task (e.g. Update portfolio link, Request LOR)..."
                      className="flex-1 bg-[#F7F8FC] dark:bg-[#202B3D] border border-[#E3E7F0] dark:border-[#344158] rounded-lg px-3 py-1.5 text-xs text-[#17213A] dark:text-[#F7F8FC] placeholder-[#7F91AD] focus:outline-none focus:border-[#6254E8]"
                    />
                    <button
                      onClick={() => handleAddTask(opp.id)}
                      className="px-3 py-1.5 bg-[#6254E8] hover:bg-[#4F43CC] text-white text-xs font-semibold rounded-lg cursor-pointer"
                    >
                      + Add
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal for Deleting/Untracking */}
      {recordToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] dark:bg-[#182235] border border-[#E3E7F0] dark:border-[#344158] rounded-2xl max-w-sm w-full p-6 shadow-xl">
            <h3 className="text-base font-bold text-[#17213A] dark:text-[#F7F8FC] mb-2 font-brand">
              Confirm Removal
            </h3>
            <p className="text-xs text-[#596780] dark:text-[#B8C2D9] mb-5 leading-relaxed">
              Are you sure you want to remove this opportunity from your saved workspace and application tracker?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRecordToDelete(null)}
                className="px-4 py-2 border border-[#E3E7F0] dark:border-[#344158] rounded-lg text-xs font-semibold cursor-pointer"
              >
                Keep Record
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-[#C43D52] hover:bg-[#A32D40] text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
