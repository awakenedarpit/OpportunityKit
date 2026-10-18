import { AISettings, FitReport, Opportunity, ProviderConfig, RuleResult, StudentProfile } from '../types';

export const PROVIDERS = ['ollama', 'openrouter', 'gemini', 'grok', 'fallback'] as const;

export const DEFAULT_PRIORITY = ['ollama', 'openrouter', 'gemini', 'grok', 'fallback'];

export function fallbackReport(
  profile: StudentProfile,
  opportunity: Opportunity,
  eligibility: RuleResult,
  reason?: string
): FitReport {
  const profileSkills = new Set((profile.skills || []).map((s) => s.toLowerCase()));
  const matchingSkills = (opportunity.required_skills || []).filter((s) =>
    profileSkills.has(s.toLowerCase())
  );

  let strengths = matchingSkills.map((s) => `Matching skill: ${s}`);
  if (strengths.length === 0) {
    strengths = ['Your profile has been compared using the information you entered.'];
  }

  let gaps =
    eligibility.missing_information.length > 0
      ? eligibility.missing_information
      : eligibility.reasons
          .filter((r) => !r.toLowerCase().includes('matches'))
          .map((r) => `Review the requirement: ${r}`);

  if (gaps.length === 0) {
    gaps = ['No specific gaps were identified by the available rules; verify the official listing.'];
  }

  const sourceReference = opportunity.source_url
    ? `Official source: ${opportunity.source_url}`
    : 'Source: synthetic demo record — no external application link';

  const source = reason ? `Rule-based fallback · ${reason}` : 'Rule-based fallback';

  return {
    why_match: [
      `This is a ${opportunity.category.toLowerCase()} opportunity from ${opportunity.organization}.`,
      ...strengths.slice(0, 2),
    ],
    eligibility_summary: eligibility.status,
    strengths,
    gaps,
    next_steps: [
      'Read the official listing carefully.',
      'Prepare evidence for the required skills.',
      'Confirm all eligibility details before applying.',
    ],
    before_applying: [
      `Deadline: ${opportunity.deadline}`,
      sourceReference,
      'This is demo data; verify current details before applying.',
    ],
    source,
  };
}

export function maskedKey(value: string): string {
  if (!value) return 'Not configured';
  return value.length > 8 ? `${value.slice(0, 4)}…${value.slice(-4)}` : 'Configured';
}

const AI_STORAGE_KEY = 'opportunitykit_ai_settings';

export function loadAISettings(): AISettings {
  try {
    const raw = localStorage.getItem(AI_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to load AI settings', e);
  }

  return {
    priority: [...DEFAULT_PRIORITY],
    providers: {
      ollama: {
        name: 'ollama',
        enabled: true,
        model: 'gemma4:e4b',
        api_key: '',
        endpoint: 'http://127.0.0.1:11434',
        timeout_seconds: 30,
      },
      openrouter: {
        name: 'openrouter',
        enabled: false,
        model: 'google/gemma-2-9b-it:free',
        api_key: '',
        endpoint: 'https://openrouter.ai/api/v1',
        timeout_seconds: 30,
      },
      gemini: {
        name: 'gemini',
        enabled: false,
        model: 'gemini-1.5-flash',
        api_key: '',
        endpoint: 'https://generativelanguage.googleapis.com/v1beta',
        timeout_seconds: 30,
      },
      grok: {
        name: 'grok',
        enabled: false,
        model: 'grok-2-latest',
        api_key: '',
        endpoint: 'https://api.x.ai/v1',
        timeout_seconds: 30,
      },
      fallback: {
        name: 'fallback',
        enabled: true,
        model: 'deterministic',
        api_key: '',
        endpoint: '',
        timeout_seconds: 30,
      },
    },
    external_enabled: false,
    max_attempts: 4,
  };
}

export function saveAISettings(settings: AISettings): void {
  try {
    localStorage.setItem(AI_STORAGE_KEY, JSON.stringify(settings));
    window.dispatchEvent(new Event('opportunitykit_ai_settings_changed'));
  } catch (e) {
    console.error('Failed to save AI settings', e);
  }
}

export class AIProviderManager {
  public lastStatus: Record<string, string> = {};
  public lastError: string = '';

  constructor(private settings: AISettings = loadAISettings()) {}

  public async generateFitReport(
    profile: StudentProfile,
    opportunity: Opportunity,
    eligibility: RuleResult
  ): Promise<FitReport> {
    try {
      const res = await fetch('/api/ai/fit-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile,
          opportunity,
          eligibility,
          external_enabled: this.settings.external_enabled,
        }),
      });

      if (res.ok) {
        const report = await res.json();
        if (report && report.eligibility_summary === eligibility.status) {
          return report;
        }
      }
    } catch (err: any) {
      console.warn('Backend fit-report endpoint failed, using local fallback:', err);
    }

    return fallbackReport(profile, opportunity, eligibility);
  }

  public async testProvider(name: string): Promise<{ ok: boolean; message: string }> {
    const config = this.settings.providers[name];
    if (name === 'fallback') {
      return { ok: true, message: 'Deterministic fallback is available' };
    }
    if (!config || !config.enabled) {
      return { ok: false, message: `Provider ${name.toUpperCase()} is disabled` };
    }
    if (name !== 'ollama' && !this.settings.external_enabled) {
      return {
        ok: false,
        message: 'External AI is disabled in settings. Enable "Allow external AI providers" above.',
      };
    }

    try {
      const res = await fetch('/api/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: name,
          external_enabled: this.settings.external_enabled,
          model: config.model,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      return await res.json();
    } catch (err: any) {
      return {
        ok: false,
        message: err.message || `${name} connection check failed`,
      };
    }
  }
}
