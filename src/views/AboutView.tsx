import React from 'react';
import { AISettings, ProviderConfig } from '../types';
import { loadAISettings, saveAISettings, AIProviderManager } from '../lib/aiProvider';
import { storage } from '../lib/storage';
import { DEMO_PROFILE, DEMO_SAVED_RECORDS } from '../lib/demoData';

interface AboutViewProps {
  onRefreshData: () => void;
}

interface ServerProviderInfo {
  configured: boolean;
  hasKey?: boolean;
  maskedKey?: string;
  endpoint?: string;
  model?: string;
  enabled?: boolean;
}

export const AboutView: React.FC<AboutViewProps> = ({ onRefreshData }) => {
  const [aiSettings, setAiSettings] = React.useState<AISettings>(loadAISettings());
  const [serverConfig, setServerConfig] = React.useState<Record<string, ServerProviderInfo>>({});
  const [isAiExpanded, setIsAiExpanded] = React.useState(true);
  const [testProvider, setTestProvider] = React.useState('grok');
  const [testResult, setTestResult] = React.useState<{ ok: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = React.useState(false);

  const [confirmClear, setConfirmClear] = React.useState(false);
  const [demoNotice, setDemoNotice] = React.useState('');

  // Fetch server-side AI configuration state
  React.useEffect(() => {
    fetch('/api/ai/config')
      .then((res) => res.json())
      .then((data) => {
        if (data?.providers) {
          setServerConfig(data.providers);
          // If server env has external enabled, sync
          if (data.external_enabled !== undefined && data.external_enabled) {
            setAiSettings((prev) => {
              const updated = { ...prev, external_enabled: true };
              saveAISettings(updated);
              return updated;
            });
          }
        }
      })
      .catch((err) => console.warn('Could not fetch server AI config:', err));
  }, []);

  const updateSetting = <K extends keyof AISettings>(key: K, val: AISettings[K]) => {
    const updated = { ...aiSettings, [key]: val };
    setAiSettings(updated);
    saveAISettings(updated);
  };

  const updateProviderConfig = (name: string, partial: Partial<ProviderConfig>) => {
    const updated = {
      ...aiSettings,
      providers: {
        ...aiSettings.providers,
        [name]: { ...aiSettings.providers[name], ...partial },
      },
    };
    setAiSettings(updated);
    saveAISettings(updated);
  };

  const handleTestProvider = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const manager = new AIProviderManager(aiSettings);
      const res = await manager.testProvider(testProvider);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ ok: false, message: err.message || 'Check failed' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleLoadDemo = () => {
    storage.seedDemoData(DEMO_PROFILE, DEMO_SAVED_RECORDS);
    setDemoNotice('Synthetic demo data loaded.');
    onRefreshData();
  };

  const handleClearDemo = () => {
    storage.clearDemoData();
    setConfirmClear(false);
    setDemoNotice('Demo records cleared; user-created records were preserved.');
    onRefreshData();
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1180px] mx-auto">
      {/* Intro */}
      <div>
        <div className="text-[10px] font-bold tracking-wider uppercase text-[#6254e8] dark:text-[#9387ff] mb-1">
          ABOUT OPPORTUNITYKIT
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#17213a] dark:text-[#f7f8fc] mb-2">
          Useful AI, with its boundaries visible.
        </h1>
        <p className="text-sm text-[#596780] dark:text-[#b8c2d9] max-w-2xl leading-relaxed">
          OpportunityKit is designed to help students make better-informed decisions without replacing their judgment or pretending an application outcome is guaranteed.
        </p>
      </div>

      {/* Two core principle surfaces */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-[#202b3d] border border-[#e3e7f0] dark:border-[#344158] rounded-xl p-5 shadow-xs">
          <div className="text-[10px] font-bold tracking-wider uppercase text-[#6254e8] dark:text-[#9387ff] mb-1">
            HOW IT WORKS
          </div>
          <h3 className="font-bold text-base text-[#17213a] dark:text-[#f7f8fc] mb-2">
            Rules first. AI second.
          </h3>
          <p className="text-xs text-[#596780] dark:text-[#b8c2d9] leading-relaxed">
            The deterministic eligibility engine checks explicit requirements in code. The relevance score shows its components. Local Gemma or external models only turn those supplied facts into a clearer Fit Report without modifying the verdict.
          </p>
        </div>

        <div className="bg-white dark:bg-[#202b3d] border border-[#e3e7f0] dark:border-[#344158] rounded-xl p-5 shadow-xs">
          <div className="text-[10px] font-bold tracking-wider uppercase text-[#6254e8] dark:text-[#9387ff] mb-1">
            TRUST
          </div>
          <h3 className="font-bold text-base text-[#17213a] dark:text-[#f7f8fc] mb-2">
            Verify before applying.
          </h3>
          <p className="text-xs text-[#596780] dark:text-[#b8c2d9] leading-relaxed">
            Every listing shows its source, verification date, and data status. The catalogue is synthetic demo data; new demo records have no external application link. Confirm all deadlines and requirements at the official source.
          </p>
        </div>
      </div>

      {/* AI Settings Expander */}
      <div className="bg-white dark:bg-[#202b3d] border border-[#e3e7f0] dark:border-[#344158] rounded-xl overflow-hidden shadow-xs">
        <button
          onClick={() => setIsAiExpanded(!isAiExpanded)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-[#f7f8fc] dark:hover:bg-[#26344a] transition-colors cursor-pointer"
        >
          <div>
            <div className="text-sm font-bold text-[#17213a] dark:text-[#f7f8fc]">
              AI Settings & Multi-Provider Architecture
            </div>
            <div className="text-xs text-[#596780] dark:text-[#b8c2d9]">
              Rules remain authoritative · Deterministic fallback is always active
            </div>
          </div>
          <span className="text-sm font-bold text-[#6254e8] dark:text-[#9387ff]">
            {isAiExpanded ? '▲ Hide' : '▼ Configure'}
          </span>
        </button>

        {isAiExpanded && (
          <div className="p-5 border-t border-[#e3e7f0] dark:border-[#344158] flex flex-col gap-5">
            {/* External Toggle */}
            <div className="flex items-center justify-between bg-[#f7f8fc] dark:bg-[#162138] p-3 rounded-lg border border-[#e3e7f0] dark:border-[#344158]">
              <div>
                <div className="text-xs font-bold text-[#17213a] dark:text-[#f7f8fc]">
                  Allow external AI providers (Google Gemini, xAI Grok, OpenRouter)
                </div>
                <div className="text-[11px] text-[#596780] dark:text-[#b8c2d9] mt-0.5">
                  When enabled, profile and opportunity evidence may be processed by configured external providers via secure server proxy routes. Ollama and deterministic fallback remain local.
                </div>
              </div>
              <input
                type="checkbox"
                checked={aiSettings.external_enabled}
                onChange={(e) => updateSetting('external_enabled', e.target.checked)}
                className="w-5 h-5 rounded text-[#6254e8] focus:ring-[#6254e8] accent-[#6254e8] cursor-pointer"
              />
            </div>

            {/* Provider Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* xAI Grok Card */}
              <div className="border border-[#e3e7f0] dark:border-[#344158] rounded-lg p-3 bg-white dark:bg-[#202b3d] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={aiSettings.providers.grok?.enabled || false}
                        onChange={(e) => updateProviderConfig('grok', { enabled: e.target.checked })}
                        className="w-4 h-4 text-[#6254e8] accent-[#6254e8]"
                      />
                      <span className="text-xs font-bold uppercase tracking-wider text-[#17213a] dark:text-[#f7f8fc]">
                        xAI Grok (X API)
                      </span>
                    </label>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        serverConfig.grok?.configured
                          ? 'bg-[#e5f5ef] dark:bg-[#17382f] text-[#16866a] dark:text-[#2dd4bf]'
                          : 'bg-[#fff4d9] dark:bg-[#493719] text-[#8b5d00] dark:text-[#fbbf24]'
                      }`}
                    >
                      {serverConfig.grok?.configured ? 'API Key Configured' : 'No API Key in Env'}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <label className="block text-[10px] text-[#596780] dark:text-[#b8c2d9] uppercase font-semibold">
                        Model
                      </label>
                      <input
                        type="text"
                        value={aiSettings.providers.grok?.model || 'grok-2-latest'}
                        onChange={(e) => updateProviderConfig('grok', { model: e.target.value })}
                        placeholder="grok-2-latest"
                        className="w-full bg-[#f7f8fc] dark:bg-[#162138] border border-[#e3e7f0] dark:border-[#344158] rounded px-2.5 py-1 text-xs text-[#17213a] dark:text-[#f7f8fc]"
                      />
                    </div>
                    <div className="text-[11px] text-[#596780] dark:text-[#b8c2d9]">
                      API Key: <span className="font-mono text-xs">{serverConfig.grok?.maskedKey || 'Not configured'}</span>
                      <p className="text-[10px] text-[#7f91ad] mt-0.5">
                        Set <code className="bg-[#10182b] text-[#f7f8fc] px-1 rounded">XAI_API_KEY</code> in your environment or <code className="bg-[#10182b] text-[#f7f8fc] px-1 rounded">.env</code>.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Google Gemini Card */}
              <div className="border border-[#e3e7f0] dark:border-[#344158] rounded-lg p-3 bg-white dark:bg-[#202b3d] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={aiSettings.providers.gemini?.enabled || false}
                        onChange={(e) => updateProviderConfig('gemini', { enabled: e.target.checked })}
                        className="w-4 h-4 text-[#6254e8] accent-[#6254e8]"
                      />
                      <span className="text-xs font-bold uppercase tracking-wider text-[#17213a] dark:text-[#f7f8fc]">
                        Google Gemini
                      </span>
                    </label>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        serverConfig.gemini?.configured
                          ? 'bg-[#e5f5ef] dark:bg-[#17382f] text-[#16866a] dark:text-[#2dd4bf]'
                          : 'bg-[#fff4d9] dark:bg-[#493719] text-[#8b5d00] dark:text-[#fbbf24]'
                      }`}
                    >
                      {serverConfig.gemini?.configured ? 'API Key Configured' : 'No API Key in Env'}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <label className="block text-[10px] text-[#596780] dark:text-[#b8c2d9] uppercase font-semibold">
                        Model
                      </label>
                      <input
                        type="text"
                        value={aiSettings.providers.gemini?.model || 'gemini-1.5-flash'}
                        onChange={(e) => updateProviderConfig('gemini', { model: e.target.value })}
                        placeholder="gemini-1.5-flash"
                        className="w-full bg-[#f7f8fc] dark:bg-[#162138] border border-[#e3e7f0] dark:border-[#344158] rounded px-2.5 py-1 text-xs text-[#17213a] dark:text-[#f7f8fc]"
                      />
                    </div>
                    <div className="text-[11px] text-[#596780] dark:text-[#b8c2d9]">
                      API Key: <span className="font-mono text-xs">{serverConfig.gemini?.maskedKey || 'Not configured'}</span>
                      <p className="text-[10px] text-[#7f91ad] mt-0.5">
                        Set <code className="bg-[#10182b] text-[#f7f8fc] px-1 rounded">GEMINI_API_KEY</code> in environment.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ollama Local Card */}
              <div className="border border-[#e3e7f0] dark:border-[#344158] rounded-lg p-3 bg-white dark:bg-[#202b3d] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={aiSettings.providers.ollama?.enabled || false}
                        onChange={(e) => updateProviderConfig('ollama', { enabled: e.target.checked })}
                        className="w-4 h-4 text-[#6254e8] accent-[#6254e8]"
                      />
                      <span className="text-xs font-bold uppercase tracking-wider text-[#17213a] dark:text-[#f7f8fc]">
                        Local Ollama (Gemma)
                      </span>
                    </label>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#eeeafe] dark:bg-[#302c50] text-[#4f43cc] dark:text-[#9387ff]">
                      Local-First
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <label className="block text-[10px] text-[#596780] dark:text-[#b8c2d9] uppercase font-semibold">
                        Model
                      </label>
                      <input
                        type="text"
                        value={aiSettings.providers.ollama?.model || 'gemma4:e4b'}
                        onChange={(e) => updateProviderConfig('ollama', { model: e.target.value })}
                        placeholder="gemma4:e4b"
                        className="w-full bg-[#f7f8fc] dark:bg-[#162138] border border-[#e3e7f0] dark:border-[#344158] rounded px-2.5 py-1 text-xs text-[#17213a] dark:text-[#f7f8fc]"
                      />
                    </div>
                    <div className="text-[11px] text-[#596780] dark:text-[#b8c2d9]">
                      Endpoint: <code className="text-xs">{serverConfig.ollama?.endpoint || 'http://127.0.0.1:11434'}</code>
                    </div>
                  </div>
                </div>
              </div>

              {/* OpenRouter Card */}
              <div className="border border-[#e3e7f0] dark:border-[#344158] rounded-lg p-3 bg-white dark:bg-[#202b3d] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={aiSettings.providers.openrouter?.enabled || false}
                        onChange={(e) => updateProviderConfig('openrouter', { enabled: e.target.checked })}
                        className="w-4 h-4 text-[#6254e8] accent-[#6254e8]"
                      />
                      <span className="text-xs font-bold uppercase tracking-wider text-[#17213a] dark:text-[#f7f8fc]">
                        OpenRouter
                      </span>
                    </label>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        serverConfig.openrouter?.configured
                          ? 'bg-[#e5f5ef] dark:bg-[#17382f] text-[#16866a] dark:text-[#2dd4bf]'
                          : 'bg-[#fff4d9] dark:bg-[#493719] text-[#8b5d00] dark:text-[#fbbf24]'
                      }`}
                    >
                      {serverConfig.openrouter?.configured ? 'API Key Configured' : 'No API Key in Env'}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <label className="block text-[10px] text-[#596780] dark:text-[#b8c2d9] uppercase font-semibold">
                        Model
                      </label>
                      <input
                        type="text"
                        value={aiSettings.providers.openrouter?.model || 'google/gemma-2-9b-it:free'}
                        onChange={(e) => updateProviderConfig('openrouter', { model: e.target.value })}
                        placeholder="google/gemma-2-9b-it:free"
                        className="w-full bg-[#f7f8fc] dark:bg-[#162138] border border-[#e3e7f0] dark:border-[#344158] rounded px-2.5 py-1 text-xs text-[#17213a] dark:text-[#f7f8fc]"
                      />
                    </div>
                    <div className="text-[11px] text-[#596780] dark:text-[#b8c2d9]">
                      API Key: <span className="font-mono text-xs">{serverConfig.openrouter?.maskedKey || 'Not configured'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Provider Health Check and Diagnostics */}
            <div className="pt-3 border-t border-[#e3e7f0] dark:border-[#344158] flex flex-col gap-3">
              <div className="text-xs font-bold text-[#17213a] dark:text-[#f7f8fc]">
                Provider Connectivity Diagnostic
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <select
                  value={testProvider}
                  onChange={(e) => {
                    setTestProvider(e.target.value);
                    setTestResult(null);
                  }}
                  className="bg-[#f7f8fc] dark:bg-[#162138] border border-[#e3e7f0] dark:border-[#344158] rounded-lg px-3 py-1.5 text-xs text-[#17213a] dark:text-[#f7f8fc]"
                >
                  <option value="grok">xAI Grok (X API)</option>
                  <option value="gemini">Google Gemini</option>
                  <option value="ollama">Ollama (Local)</option>
                  <option value="openrouter">OpenRouter</option>
                  <option value="fallback">Deterministic Fallback</option>
                </select>

                <button
                  onClick={handleTestProvider}
                  disabled={isTesting}
                  className="px-4 py-1.5 bg-[#6254e8] hover:bg-[#4f43cc] disabled:bg-[#a59ef5] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  {isTesting ? 'Checking connectivity…' : 'Test provider configuration'}
                </button>
              </div>

              {testResult && (
                <div
                  className={`p-3 rounded-lg border text-xs font-semibold ${
                    testResult.ok
                      ? 'bg-[#e5f5ef] dark:bg-[#17382f] border-[#c9ecdf] dark:border-[#286b58] text-[#16866a] dark:text-[#2dd4bf]'
                      : 'bg-[#fdebed] dark:bg-[#49222d] border-[#f4cbd0] dark:border-[#813b4a] text-[#c43d52] dark:text-[#f87171]'
                  }`}
                >
                  {testResult.message}
                </div>
              )}
            </div>

            <div className="text-[11px] text-[#7f91ad] bg-[#162138] p-3 rounded-lg border border-[#263d62]">
              <b className="text-[#d6b779]">Safe Fallback Guarantee:</b> Even if external providers or local Ollama are offline or unconfigured, OpportunityKit's built-in rule-based fallback generates grounded Fit Reports instantly. AI providers never alter deterministic eligibility.
            </div>
          </div>
        )}
      </div>

      {/* Local-first setup note */}
      <div className="bg-white dark:bg-[#202b3d] border border-[#e3e7f0] dark:border-[#344158] rounded-xl p-5 shadow-xs">
        <h3 className="font-bold text-sm text-[#17213a] dark:text-[#f7f8fc] mb-2">
          Local-first setup
        </h3>
        <pre className="bg-[#10182b] text-[#f7f8fc] p-3 rounded-lg text-xs overflow-x-auto font-mono mb-2">
          ollama pull gemma4:e4b{'\n'}# lighter fallback{'\n'}ollama pull gemma4:e2b
        </pre>
        <p className="text-xs text-[#596780] dark:text-[#b8c2d9]">
          No paid API key is required for the core demonstration. See README for setup, testing, and limitations.
        </p>
      </div>

      {/* Demo Data Management */}
      <div className="bg-white dark:bg-[#202b3d] border border-[#e3e7f0] dark:border-[#344158] rounded-xl p-5 shadow-xs flex flex-col gap-4">
        <div>
          <div className="text-[10px] font-bold tracking-wider uppercase text-[#6254e8] dark:text-[#9387ff] mb-1">
            DEMO DATA
          </div>
          <h3 className="font-bold text-base text-[#17213a] dark:text-[#f7f8fc] mb-1">
            Presentation-ready sample workspace
          </h3>
          <p className="text-xs text-[#596780] dark:text-[#b8c2d9] leading-relaxed">
            Load a fictional student profile, saved opportunities, two in-progress application examples, three upcoming deadlines, and explainable recommendations. Seeding is idempotent and never overwrites user-created records.
          </p>
        </div>

        {demoNotice && (
          <div className="p-3 bg-[#e5f5ef] dark:bg-[#17382f] border border-[#c9ecdf] dark:border-[#286b58] text-[#16866a] dark:text-[#2dd4bf] text-xs font-semibold rounded-lg">
            {demoNotice}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          <button
            onClick={handleLoadDemo}
            className="w-full py-2.5 px-4 bg-[#6254e8] hover:bg-[#4f43cc] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            Load demo data
          </button>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-[#596780] dark:text-[#b8c2d9] cursor-pointer">
              <input
                type="checkbox"
                checked={confirmClear}
                onChange={(e) => setConfirmClear(e.target.checked)}
                className="w-4 h-4 rounded text-[#6254e8] accent-[#6254e8]"
              />
              <span>Confirm clear demo records</span>
            </label>
            <button
              onClick={handleClearDemo}
              disabled={!confirmClear}
              className="px-4 py-2 bg-transparent border border-[#e3e7f0] dark:border-[#344158] hover:border-[#c43d52] disabled:opacity-40 text-xs font-semibold rounded-lg text-[#c43d52] transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              Clear demo data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
