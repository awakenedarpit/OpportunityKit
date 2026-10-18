import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

function maskKey(key?: string): string {
  if (!key) return 'Not configured';
  if (key.length <= 8) return 'Configured';
  return `${key.slice(0, 4)}…${key.slice(-4)}`;
}

function resolveGrokConfig() {
  const envGrokModel = process.env.OPPORTUNITYKIT_GROK_MODEL || '';
  let xaiKey = process.env.XAI_API_KEY || process.env.X_API_KEY || '';

  // Detect if key was accidentally passed in OPPORTUNITYKIT_GROK_MODEL
  if (!xaiKey && (envGrokModel.startsWith('gsk_') || envGrokModel.startsWith('xai-') || envGrokModel.length > 40)) {
    xaiKey = envGrokModel;
  }

  const isGroq = xaiKey.startsWith('gsk_');
  const defaultEndpoint = isGroq ? 'https://api.groq.com/openai/v1' : 'https://api.x.ai/v1';
  const endpoint = process.env.OPPORTUNITYKIT_GROK_URL || defaultEndpoint;

  let model = envGrokModel;
  if (!model || model.startsWith('gsk_') || model.startsWith('xai-') || model.length > 40) {
    model = isGroq ? 'llama-3.3-70b-versatile' : 'grok-2-latest';
  }

  return { key: xaiKey, isGroq, endpoint, model };
}

function resolveGeminiModel() {
  const envModel = process.env.OPPORTUNITYKIT_GEMINI_MODEL || '';
  if (!envModel || envModel.startsWith('AQ.') || envModel.length > 35) {
    return 'gemini-1.5-flash';
  }
  return envModel;
}

function resolveOpenRouterModel() {
  const envModel = process.env.OPPORTUNITYKIT_OPENROUTER_MODEL || '';
  if (!envModel || envModel.startsWith('sk-or-') || envModel.length > 40) {
    return 'google/gemma-2-9b-it:free';
  }
  return envModel;
}

// AI Configuration status (reads server env vars without exposing secrets)
app.get('/api/ai/config', (_req, res) => {
  const grok = resolveGrokConfig();
  const geminiKey = process.env.GEMINI_API_KEY || '';
  const openrouterKey = process.env.OPENROUTER_API_KEY || '';
  const externalEnabledEnv =
    (process.env.OPPORTUNITYKIT_ENABLE_EXTERNAL_AI || '').toLowerCase() in
    { '1': 1, true: 1, yes: 1, on: 1 };

  res.json({
    external_enabled: externalEnabledEnv,
    providers: {
      ollama: {
        configured: true,
        endpoint: process.env.OPPORTUNITYKIT_OLLAMA_URL || 'http://127.0.0.1:11434',
        model: process.env.OPPORTUNITYKIT_MODEL || 'gemma4:e4b',
        enabled: true,
      },
      grok: {
        configured: Boolean(grok.key),
        hasKey: Boolean(grok.key),
        maskedKey: maskKey(grok.key),
        endpoint: grok.endpoint,
        model: grok.model,
        isGroq: grok.isGroq,
        enabled: (process.env.OPPORTUNITYKIT_GROK_ENABLED || '').toLowerCase() in { '1': 1, true: 1, yes: 1, on: 1 },
      },
      gemini: {
        configured: Boolean(geminiKey),
        hasKey: Boolean(geminiKey),
        maskedKey: maskKey(geminiKey),
        endpoint: process.env.OPPORTUNITYKIT_GEMINI_URL || 'https://generativelanguage.googleapis.com/v1beta',
        model: resolveGeminiModel(),
        enabled: (process.env.OPPORTUNITYKIT_GEMINI_ENABLED || '').toLowerCase() in { '1': 1, true: 1, yes: 1, on: 1 },
      },
      openrouter: {
        configured: Boolean(openrouterKey),
        hasKey: Boolean(openrouterKey),
        maskedKey: maskKey(openrouterKey),
        endpoint: process.env.OPPORTUNITYKIT_OPENROUTER_URL || 'https://openrouter.ai/api/v1',
        model: resolveOpenRouterModel(),
        enabled: (process.env.OPPORTUNITYKIT_OPENROUTER_ENABLED || '').toLowerCase() in { '1': 1, true: 1, yes: 1, on: 1 },
      },
      fallback: {
        configured: true,
        endpoint: '',
        model: 'deterministic',
        enabled: true,
      },
    },
  });
});

// Test provider connectivity
app.post('/api/ai/test', async (req, res) => {
  const { provider, external_enabled, model } = req.body || {};
  const grok = resolveGrokConfig();
  const geminiKey = process.env.GEMINI_API_KEY || '';
  const openrouterKey = process.env.OPENROUTER_API_KEY || '';
  const ollamaUrl = process.env.OPPORTUNITYKIT_OLLAMA_URL || 'http://127.0.0.1:11434';

  if (provider === 'fallback') {
    return res.json({ ok: true, message: 'Deterministic fallback is available' });
  }

  if (provider !== 'ollama' && !external_enabled) {
    return res.json({
      ok: false,
      message: 'External AI is disabled in settings. Enable "Allow external AI providers" first.',
    });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    if (provider === 'grok') {
      if (!grok.key) {
        return res.json({
          ok: false,
          message: 'X (xAI) API key is not configured. Set XAI_API_KEY in your environment to use Grok.',
        });
      }
      try {
        const grokUrl = grok.endpoint.replace(/\/$/, '');
        const response = await fetch(`${grokUrl}/models`, {
          headers: { Authorization: `Bearer ${grok.key}` },
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (response.status === 401 || response.status === 403) {
          return res.json({
            ok: false,
            message: grok.isGroq
              ? 'Groq authentication failed; verify your Groq API key.'
              : 'xAI authentication failed; check your XAI_API_KEY.',
          });
        }
        if (!response.ok) {
          return res.json({ ok: false, message: `API returned HTTP ${response.status}.` });
        }
        return res.json({
          ok: true,
          message: grok.isGroq
            ? 'Groq API connectivity check succeeded (using ultra-fast Llama/Gemma models).'
            : 'xAI (Grok) connectivity check succeeded.',
        });
      } catch (err: any) {
        clearTimeout(timeout);
        return res.json({
          ok: false,
          message: err.name === 'AbortError' ? 'Connection timed out.' : 'X (xAI) API is currently unreachable.',
        });
      }
    }

    if (provider === 'gemini') {
      if (!geminiKey) {
        return res.json({
          ok: false,
          message: 'Google Gemini API key is not configured. Set GEMINI_API_KEY in your environment.',
        });
      }
      try {
        const geminiUrl = (process.env.OPPORTUNITYKIT_GEMINI_URL || 'https://generativelanguage.googleapis.com/v1beta').replace(/\/$/, '');
        const response = await fetch(`${geminiUrl}/models?key=${encodeURIComponent(geminiKey)}`, {
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (response.status === 400 || response.status === 403) {
          return res.json({ ok: false, message: 'Gemini authentication failed; check your GEMINI_API_KEY.' });
        }
        if (!response.ok) {
          return res.json({ ok: false, message: `Gemini API returned HTTP ${response.status}.` });
        }
        return res.json({ ok: true, message: 'Google Gemini connectivity check succeeded.' });
      } catch (err: any) {
        clearTimeout(timeout);
        return res.json({
          ok: false,
          message: err.name === 'AbortError' ? 'Gemini connection timed out.' : 'Gemini API is currently unreachable.',
        });
      }
    }

    if (provider === 'openrouter') {
      if (!openrouterKey) {
        return res.json({
          ok: false,
          message: 'OpenRouter API key is not configured. Set OPENROUTER_API_KEY in your environment.',
        });
      }
      try {
        const openrouterUrl = (process.env.OPPORTUNITYKIT_OPENROUTER_URL || 'https://openrouter.ai/api/v1').replace(/\/$/, '');
        const response = await fetch(`${openrouterUrl}/models`, {
          headers: { Authorization: `Bearer ${openrouterKey}` },
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (!response.ok) {
          return res.json({ ok: false, message: `OpenRouter returned HTTP ${response.status}.` });
        }
        return res.json({ ok: true, message: 'OpenRouter connectivity check succeeded.' });
      } catch (err: any) {
        clearTimeout(timeout);
        return res.json({
          ok: false,
          message: err.name === 'AbortError' ? 'OpenRouter connection timed out.' : 'OpenRouter API is currently unreachable.',
        });
      }
    }

    if (provider === 'ollama') {
      try {
        const response = await fetch(`${ollamaUrl.replace(/\/$/, '')}/api/tags`, {
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (!response.ok) {
          return res.json({ ok: false, message: 'Ollama endpoint returned an error.' });
        }
        const data = await response.json();
        const models = (data.models || []).map((m: any) => m.name || m.model);
        const targetModel = model || process.env.OPPORTUNITYKIT_MODEL || 'gemma4:e4b';
        if (models.length > 0 && !models.some((m: string) => m.includes(targetModel.split(':')[0]))) {
          return res.json({
            ok: true,
            message: `Ollama is running. Note: model ${targetModel} was not found in installed tags (${models.join(', ')}).`,
          });
        }
        return res.json({ ok: true, message: 'Ollama local connectivity check succeeded.' });
      } catch {
        clearTimeout(timeout);
        return res.json({
          ok: false,
          message: 'Ollama is offline or not running at ' + ollamaUrl,
        });
      }
    }

    return res.json({ ok: false, message: 'Unknown provider' });
  } catch (e: any) {
    return res.json({ ok: false, message: e.message || 'Connectivity check failed' });
  }
});

// Fit Report Generation Proxy with Fallback
app.post('/api/ai/fit-report', async (req, res) => {
  const { profile, opportunity, eligibility, external_enabled } = req.body || {};
  if (!profile || !opportunity || !eligibility) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  // Deterministic fallback generator
  const getFallbackReport = (reason?: string) => {
    const profileSkills = new Set((profile.skills || []).map((s: string) => (s || '').toLowerCase()));
    const matchingSkills = (opportunity.required_skills || []).filter((s: string) =>
      profileSkills.has((s || '').toLowerCase())
    );

    let strengths = matchingSkills.map((s: string) => `Matching skill: ${s}`);
    if (strengths.length === 0) {
      strengths = ['Your profile has been compared using the information you entered.'];
    }

    let gaps =
      (eligibility.missing_information || []).length > 0
        ? eligibility.missing_information
        : (eligibility.reasons || [])
            .filter((r: string) => !(r || '').toLowerCase().includes('matches'))
            .map((r: string) => `Review the requirement: ${r}`);

    if (gaps.length === 0) {
      gaps = ['No specific gaps were identified by the available rules; verify the official listing.'];
    }

    const sourceReference = opportunity.source_url
      ? `Official source: ${opportunity.source_url}`
      : 'Source: synthetic demo record — no external application link';

    const source = reason ? `Rule-based fallback · ${reason}` : 'Rule-based fallback';

    return {
      why_match: [
        `This is a ${(opportunity.category || '').toLowerCase()} opportunity from ${opportunity.organization}.`,
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
  };

  const xaiKey = process.env.XAI_API_KEY || process.env.X_API_KEY || '';
  const geminiKey = process.env.GEMINI_API_KEY || '';
  const openrouterKey = process.env.OPENROUTER_API_KEY || '';
  const ollamaUrl = process.env.OPPORTUNITYKIT_OLLAMA_URL || 'http://127.0.0.1:11434';

  const schema = {
    why_match: ['string'],
    eligibility_summary: 'string',
    strengths: ['string'],
    gaps: ['string'],
    next_steps: ['string'],
    before_applying: ['string'],
  };

  const prompt = `Return only JSON matching this schema. Use only the supplied evidence. Never invent facts, URLs, deadlines, stipends, organizations, or guarantees. Preserve the deterministic eligibility_summary exactly.
SCHEMA:
${JSON.stringify(schema)}
EVIDENCE:
${JSON.stringify({ profile, opportunity, eligibility })}`;

  const validatePayload = (raw: any, sourceLabel: string) => {
    let payload = raw;
    if (typeof payload === 'string') {
      let text = payload.trim();
      if (text.startsWith('```')) {
        text = text.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
      }
      payload = JSON.parse(text);
    }
    const fields = ['why_match', 'strengths', 'gaps', 'next_steps', 'before_applying'] as const;
    for (const f of fields) {
      if (!Array.isArray(payload[f])) throw new Error(`invalid ${f}`);
    }
    if (payload.eligibility_summary !== eligibility.status) {
      throw new Error('model changed deterministic eligibility');
    }
    return {
      source: sourceLabel,
      eligibility_summary: eligibility.status,
      why_match: payload.why_match,
      strengths: payload.strengths,
      gaps: payload.gaps,
      next_steps: payload.next_steps,
      before_applying: payload.before_applying,
    };
  };

  // Try Ollama first if running
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const ollamaModel = process.env.OPPORTUNITYKIT_MODEL || 'gemma4:e4b';
    const oRes = await fetch(`${ollamaUrl.replace(/\/$/, '')}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: ollamaModel,
        messages: [{ role: 'user', content: prompt }],
        format: 'json',
        stream: false,
        options: { temperature: 0 },
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (oRes.ok) {
      const data = await oRes.json();
      const content = data?.message?.content;
      if (content) {
        return res.json(validatePayload(content, `Gemma via local Ollama (${ollamaModel})`));
      }
    }
  } catch {
    // fall through
  }

  // Try external providers if allowed
  if (external_enabled) {
    // Try Gemini
    if (geminiKey) {
      try {
        const geminiModel = process.env.OPPORTUNITYKIT_GEMINI_MODEL || 'gemini-1.5-flash';
        const geminiUrl = (process.env.OPPORTUNITYKIT_GEMINI_URL || 'https://generativelanguage.googleapis.com/v1beta').replace(/\/$/, '');
        const gRes = await fetch(`${geminiUrl}/models/${encodeURIComponent(geminiModel)}:generateContent?key=${encodeURIComponent(geminiKey)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0, responseMimeType: 'application/json' },
          }),
        });
        if (gRes.ok) {
          const data = await gRes.json();
          const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (content) {
            return res.json(validatePayload(content, `Google Gemini (${geminiModel})`));
          }
        }
      } catch {
        // fall through
      }
    }

    // Try Grok (xAI or Groq)
    const grok = resolveGrokConfig();
    if (grok.key) {
      try {
        const grokUrl = grok.endpoint.replace(/\/$/, '');
        const xRes = await fetch(`${grokUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${grok.key}`,
          },
          body: JSON.stringify({
            model: grok.model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0,
            response_format: { type: 'json_object' },
          }),
        });
        if (xRes.ok) {
          const data = await xRes.json();
          const content = data?.choices?.[0]?.message?.content;
          if (content) {
            const providerName = grok.isGroq ? `Groq (${grok.model})` : `xAI Grok (${grok.model})`;
            return res.json(validatePayload(content, providerName));
          }
        }
      } catch {
        // fall through
      }
    }

    // Try OpenRouter
    if (openrouterKey) {
      try {
        const orModel = process.env.OPPORTUNITYKIT_OPENROUTER_MODEL || 'google/gemma-2-9b-it:free';
        const orUrl = (process.env.OPPORTUNITYKIT_OPENROUTER_URL || 'https://openrouter.ai/api/v1').replace(/\/$/, '');
        const orRes = await fetch(`${orUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${openrouterKey}`,
          },
          body: JSON.stringify({
            model: orModel,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0,
            response_format: { type: 'json_object' },
          }),
        });
        if (orRes.ok) {
          const data = await orRes.json();
          const content = data?.choices?.[0]?.message?.content;
          if (content) {
            return res.json(validatePayload(content, `OpenRouter (${orModel})`));
          }
        }
      } catch {
        // fall through
      }
    }
  }

  // Fallback to grounded deterministic report
  return res.json(getFallbackReport());
});

// Mount Vite or serve static
if (process.env.NODE_ENV !== 'production') {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`OpportunityKit server listening at http://0.0.0.0:${PORT}`);
});
