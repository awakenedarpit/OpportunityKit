import { SavedRecord, StudentProfile, TrackerStatus } from '../types';

const STORAGE_KEYS = {
  PROFILE: 'opportunitykit_profile',
  PROFILE_ORIGIN: 'opportunitykit_profile_origin',
  SAVED: 'opportunitykit_saved',
  META: 'opportunitykit_meta',
};

class ClientStorage {
  private getMeta(key: string, defaultValue: string | null = null): string | null {
    try {
      const meta = JSON.parse(localStorage.getItem(STORAGE_KEYS.META) || '{}');
      return meta[key] !== undefined ? meta[key] : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private setMeta(key: string, value: string): void {
    try {
      const meta = JSON.parse(localStorage.getItem(STORAGE_KEYS.META) || '{}');
      meta[key] = value;
      localStorage.setItem(STORAGE_KEYS.META, JSON.stringify(meta));
    } catch (e) {
      console.error('Error saving meta', e);
    }
  }

  public saveProfile(profile: StudentProfile, origin: 'user' | 'demo' = 'user'): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
      this.setMeta('profile_origin', origin);
      window.dispatchEvent(new Event('opportunitykit_profile_changed'));
    } catch (e) {
      console.error('Error saving profile', e);
    }
  }

  public loadProfile(): StudentProfile | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  public isSaved(opportunityId: string): boolean {
    const items = this.savedItems();
    return Boolean(items[opportunityId]);
  }

  public setSaved(opportunityId: string, saved = true, origin: 'user' | 'demo' = 'user'): void {
    try {
      const items = this.savedItems();
      if (saved) {
        if (!items[opportunityId]) {
          items[opportunityId] = {
            status: 'Interested',
            tasks: ['Review eligibility requirements', 'Prepare application materials'],
            completedTasks: [],
            saved_at: new Date().toISOString(),
            origin,
          };
        }
      } else {
        delete items[opportunityId];
      }
      localStorage.setItem(STORAGE_KEYS.SAVED, JSON.stringify(items));
      window.dispatchEvent(new Event('opportunitykit_saved_changed'));
    } catch (e) {
      console.error('Error modifying saved items', e);
    }
  }

  public savedItems(): Record<string, SavedRecord> {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SAVED);
      if (!raw) return {};
      const parsed: Record<string, any> = JSON.parse(raw);
      // Map legacy "Planning" status to "Preparing"
      const normalized: Record<string, SavedRecord> = {};
      for (const [id, rec] of Object.entries(parsed)) {
        normalized[id] = {
          ...rec,
          status: rec.status === 'Planning' ? 'Preparing' : rec.status,
          tasks: rec.tasks || [],
          completedTasks: rec.completedTasks || [],
          notes: rec.notes || '',
        };
      }
      return normalized;
    } catch {
      return {};
    }
  }

  public updateStatus(opportunityId: string, status: TrackerStatus): void {
    try {
      const items = this.savedItems();
      if (items[opportunityId]) {
        items[opportunityId].status = status;
        if (status === 'Applied' && !items[opportunityId].applied_date) {
          items[opportunityId].applied_date = new Date().toISOString().split('T')[0];
        }
        localStorage.setItem(STORAGE_KEYS.SAVED, JSON.stringify(items));
        window.dispatchEvent(new Event('opportunitykit_saved_changed'));
      }
    } catch (e) {
      console.error('Error updating status', e);
    }
  }

  public updateTasks(opportunityId: string, tasks: string[], completedTasks?: string[]): void {
    try {
      const items = this.savedItems();
      if (items[opportunityId]) {
        items[opportunityId].tasks = tasks;
        if (completedTasks !== undefined) {
          items[opportunityId].completedTasks = completedTasks;
        }
        localStorage.setItem(STORAGE_KEYS.SAVED, JSON.stringify(items));
        window.dispatchEvent(new Event('opportunitykit_saved_changed'));
      }
    } catch (e) {
      console.error('Error updating tasks', e);
    }
  }

  public updateNotes(opportunityId: string, notes: string): void {
    try {
      const items = this.savedItems();
      if (items[opportunityId]) {
        items[opportunityId].notes = notes;
        localStorage.setItem(STORAGE_KEYS.SAVED, JSON.stringify(items));
        window.dispatchEvent(new Event('opportunitykit_saved_changed'));
      }
    } catch (e) {
      console.error('Error updating notes', e);
    }
  }

  public updateAppliedDate(opportunityId: string, appliedDate: string): void {
    try {
      const items = this.savedItems();
      if (items[opportunityId]) {
        items[opportunityId].applied_date = appliedDate;
        localStorage.setItem(STORAGE_KEYS.SAVED, JSON.stringify(items));
        window.dispatchEvent(new Event('opportunitykit_saved_changed'));
      }
    } catch (e) {
      console.error('Error updating applied date', e);
    }
  }

  public hasAnyRecords(): boolean {
    const profile = this.loadProfile();
    const saved = this.savedItems();
    return Boolean(profile || Object.keys(saved).length > 0);
  }

  public getDemoDisabled(): boolean {
    return this.getMeta('demo_disabled') === '1';
  }

  public seedDemoData(
    profile: StudentProfile,
    records: Record<string, TrackerStatus>
  ): void {
    try {
      const existingProfile = this.loadProfile();
      if (!existingProfile) {
        this.saveProfile(profile, 'demo');
      }

      const items = this.savedItems();
      for (const [oppId, status] of Object.entries(records)) {
        if (!items[oppId]) {
          const defaultTasks =
            status === 'Preparing'
              ? ['Review official requirements', 'Update resume', 'Draft application statement']
              : status === 'Applied'
              ? ['Application submitted', 'Await confirmation email']
              : ['Bookmark listing', 'Check eligibility rules'];

          items[oppId] = {
            status,
            tasks: defaultTasks,
            completedTasks: status === 'Applied' ? ['Application submitted'] : [],
            applied_date: status === 'Applied' ? '2026-10-10' : undefined,
            notes:
              status === 'Preparing'
                ? 'Discussed with lab advisor. Aiming to submit 3 days before deadline.'
                : status === 'Applied'
                ? 'Submitted via official portal. Follow-up expected in 2 weeks.'
                : 'Looks promising for next semester.',
            saved_at: new Date().toISOString(),
            origin: 'demo',
          };
        }
      }
      localStorage.setItem(STORAGE_KEYS.SAVED, JSON.stringify(items));
      this.setMeta('demo_seeded', '1');
      this.setMeta('demo_disabled', '0');
      window.dispatchEvent(new Event('opportunitykit_saved_changed'));
      window.dispatchEvent(new Event('opportunitykit_profile_changed'));
    } catch (e) {
      console.error('Error seeding demo data', e);
    }
  }

  public clearDemoData(): void {
    try {
      const items = this.savedItems();
      const newItems: Record<string, SavedRecord> = {};
      for (const [id, record] of Object.entries(items)) {
        if (record.origin !== 'demo') {
          newItems[id] = record;
        }
      }
      localStorage.setItem(STORAGE_KEYS.SAVED, JSON.stringify(newItems));

      const profileOrigin = this.getMeta('profile_origin');
      if (profileOrigin === 'demo') {
        localStorage.removeItem(STORAGE_KEYS.PROFILE);
        this.setMeta('profile_origin', '');
      }

      this.setMeta('demo_disabled', '1');
      window.dispatchEvent(new Event('opportunitykit_saved_changed'));
      window.dispatchEvent(new Event('opportunitykit_profile_changed'));
    } catch (e) {
      console.error('Error clearing demo data', e);
    }
  }
}

export const storage = new ClientStorage();
