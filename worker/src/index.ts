import { type QuotaNamespace, type Usage } from './quota';
export { QuotaLimiter } from './quota';

export interface Env {
  QUOTAS?: QuotaNamespace;
  GLOBAL_DAILY_ATTEMPT_LIMIT?: string;
  GEMINI_API_KEY?: string;
  GROQ_API_KEY?: string;
  OPENROUTER_API_KEY?: string;
  AI: { run: (model: string, inputs: Record<string, unknown>) => Promise<unknown> };
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const ALLOWED_ORIGINS = new Set([
  'https://canvas.tomiabe.com',
  'https://tomiabe.github.io',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:31235',
]);

function corsHeaders(origin: string | null): Record<string, string> {
  const allow = origin && ALLOWED_ORIGINS.has(origin) ? origin : '';
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Expose-Headers': 'Retry-After',
    Vary: 'Origin',
  };
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) =>
    timer = setTimeout(() => reject(new Error('timeout')), ms)
  );
  try { return await Promise.race([promise, timeout]); }
  finally { clearTimeout(timer!); }
}

async function boundedBody(request: Request): Promise<any> {
  const reader = request.body?.getReader();
  if (!reader) throw new Error('Missing body');
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 65536) { await reader.cancel(); throw new Error('Body exceeds 64 KiB'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
}

function validBody(body: any): boolean {
  return body && typeof body === 'object'
    && typeof body.submissionId === 'string'
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.submissionId)
    && Array.isArray(body.messages) && body.messages.length > 0 && body.messages.length <= 32
    && body.messages.every((m: any) => m && ['system', 'user', 'assistant'].includes(m.role) && typeof m.content === 'string' && m.content.length > 0 && m.content.length <= 32768)
    && body.messages.reduce((sum: number, m: any) => sum + m.content.length, 0) <= 48000
    && (body.temperature === undefined || (typeof body.temperature === 'number' && Number.isFinite(body.temperature) && body.temperature >= 0 && body.temperature <= 2))
    && (body.max_tokens === undefined || (Number.isInteger(body.max_tokens) && body.max_tokens >= 1 && body.max_tokens <= 4096))
    && (body.response_format === undefined || (body.response_format && ['json_object', 'text'].includes(body.response_format.type)));
}

// ── Gemini ────────────────────────────────────────────────────────
async function tryGemini(model: string, messages: ChatMessage[], temperature: number, maxTokens: number, apiKey: string, jsonMode: boolean): Promise<string> {
  const system = messages.find(m => m.role === 'system');
  const rest = messages.filter(m => m.role !== 'system');

  const res = await withTimeout(
    fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...(system ? { systemInstruction: { parts: [{ text: system.content }] } } : {}),
        contents: rest.map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        })),
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
          // Flash-Lite rejects thinkingBudget 0 with "invalid argument".
          ...(model === 'gemini-flash-latest' ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
          ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
        },
      }),
    }),
    15000
  );

  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  const data: any = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') ?? '';
  if (!text) throw new Error('Gemini returned empty content');
  return text;
}

// ── Cloudflare Workers AI ─────────────────────────────────────────
async function tryWorkersAI(env: Env, messages: ChatMessage[], temperature: number, maxTokens: number): Promise<string> {
  const result: any = await withTimeout(
    Promise.resolve(
      env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
        messages,
        temperature,
        max_tokens: maxTokens,
      })
    ),
    15000
  );
  const response = result?.response ?? '';
  if (!response) throw new Error('Workers AI returned empty content');
  // Workers AI sometimes returns already-parsed JSON; callers expect a string.
  return typeof response === 'string' ? response : JSON.stringify(response);
}

// ── Groq ──────────────────────────────────────────────────────────
async function tryGroq(messages: ChatMessage[], temperature: number, maxTokens: number, apiKey: string, jsonMode: boolean): Promise<string> {
  const res = await withTimeout(
    fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        reasoning_effort: 'low',
        messages,
        temperature,
        max_tokens: maxTokens,
        ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
      }),
    }),
    15000
  );
  if (!res.ok) throw new Error(`Groq ${res.status}: ${await res.text()}`);
  const data: any = await res.json();
  const text = data.choices?.[0]?.message?.content ?? '';
  if (!text) throw new Error('Groq returned empty content');
  return text;
}

// ── OpenRouter ────────────────────────────────────────────────────
async function tryOpenRouter(messages: ChatMessage[], temperature: number, maxTokens: number, apiKey: string): Promise<string> {
  const res = await withTimeout(
    fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.3-70b-instruct:free',
        messages,
        temperature,
        max_tokens: maxTokens,
      }),
    }),
    15000
  );
  if (!res.ok) throw new Error(`OpenRouter ${res.status}: ${await res.text()}`);
  const data: any = await res.json();
  const text = data.choices?.[0]?.message?.content ?? '';
  if (!text) throw new Error('OpenRouter returned empty content');
  return text;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin');
    const headers = corsHeaders(origin);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
    }

    const isUsage = request.method === 'GET' && new URL(request.url).pathname === '/usage';
    if (request.method !== 'POST' && !isUsage) {
      return new Response('Method not allowed', { status: 405, headers });
    }

    const reply = (data: unknown, status = 200, extra: Record<string, string> = {}) => new Response(JSON.stringify(data), {
      status, headers: { ...headers, 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...extra },
    });
    let body: { submissionId?: string; messages?: ChatMessage[]; temperature?: number; max_tokens?: number; response_format?: { type: string } } = {};
    if (!isUsage) {
      try {
        body = await boundedBody(request);
      } catch {
        return reply({ error: 'Invalid JSON body or body exceeds 64 KiB' }, 400);
      }
      if (!validBody(body)) {
        return reply({ error: 'Invalid submissionId, messages, or generation options' }, 400);
      }
    }

    let usage: Usage;
    let identity: string;
    const reserve = async (action: 'usage' | 'submission' | 'attempt') => {
      if (!env.QUOTAS) throw new Error('Quota binding unavailable');
      const result = await env.QUOTAS.get(env.QUOTAS.idFromName('global')).fetch(new Request('https://quota/internal', {
        method: 'POST', body: JSON.stringify({ action, identity, submissionId: body.submissionId?.toLowerCase() }),
      }));
      if (!result.ok) throw new Error('Quota storage unavailable');
      const data = await result.json() as { allowed: boolean; usage: Usage; error?: string };
      if (typeof data.allowed !== 'boolean' || !data.usage || data.usage.limit !== 10 || !Number.isInteger(data.usage.remaining)) throw new Error('Invalid quota response');
      usage = data.usage;
      if (!data.allowed && action !== 'usage') return reply({ error: data.error, usage }, 429, {
        'Retry-After': String(Math.max(1, Math.ceil((Date.parse(usage.retryAt ?? usage.resetsAt) - Date.now()) / 1000))),
      });
    };
    try {
      const ip = request.headers.get('CF-Connecting-IP');
      if (!ip) throw new Error('Network identity unavailable');
      identity = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip))), byte => byte.toString(16).padStart(2, '0')).join('');
      const denied = await reserve(isUsage ? 'usage' : 'submission');
      if (denied) return denied;
      if (isUsage) return reply({ usage });
    } catch {
      return reply({ error: 'AI allowance temporarily unavailable; please retry later' }, 503);
    }

    const messages = body.messages!;
    const temperature = body.temperature ?? 0.8;
    const maxTokens = Math.min(body.max_tokens ?? 4096, 4096);
    const jsonMode = body.response_format?.type === 'json_object';

    const providers: Array<{ name: string; run: () => Promise<string> }> = [];
    if (env.GEMINI_API_KEY) {
      // Orb evaluation: Lite answered 8/8; Flash was quota-blocked (see docs/phase3-evaluation.md).
      providers.unshift(
        { name: 'gemini-lite', run: () => tryGemini('gemini-flash-lite-latest', messages, temperature, maxTokens, env.GEMINI_API_KEY!, jsonMode) },
        { name: 'gemini', run: () => tryGemini('gemini-flash-latest', messages, temperature, maxTokens, env.GEMINI_API_KEY!, jsonMode) },
      );
    }
    if (env.GROQ_API_KEY) {
      providers.push({ name: 'groq', run: () => tryGroq(messages, temperature, maxTokens, env.GROQ_API_KEY!, jsonMode) });
    }
    providers.push({ name: 'workers-ai', run: () => tryWorkersAI(env, messages, temperature, maxTokens) });
    if (env.OPENROUTER_API_KEY) {
      providers.push({ name: 'openrouter', run: () => tryOpenRouter(messages, temperature, maxTokens, env.OPENROUTER_API_KEY!) });
    }

    for (const provider of providers) {
      try {
        const denied = await reserve('attempt');
        if (denied) return denied;
      } catch {
        return reply({ error: 'AI allowance temporarily unavailable; please retry later' }, 503);
      }
      try {
        const content = await provider.run();
        return reply({ provider: provider.name, choices: [{ message: { role: 'assistant', content } }], usage });
      } catch {
        // Do not expose or log upstream response bodies (which may contain secrets).
        console.error(`${provider.name}: provider attempt failed`);
      }
    }

    return reply({ error: 'All providers failed', usage }, 502);
  },
};
