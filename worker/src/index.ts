export interface Env {
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
  'https://tomiabe.github.io',
  'http://localhost:3000',
  'http://localhost:5173',
]);

function corsHeaders(origin: string | null): Record<string, string> {
  const allow = origin && ALLOWED_ORIGINS.has(origin) ? origin : '';
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  };
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('timeout')), ms)
  );
  return Promise.race([promise, timeout]);
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

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers });
    }

    let body: { messages?: ChatMessage[]; temperature?: number; max_tokens?: number; response_format?: { type: string } };
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    if (!Array.isArray(body.messages)) {
      return new Response(JSON.stringify({ error: 'messages array is required' }), {
        status: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    const messages = body.messages;
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

    const errors: string[] = [];
    for (const provider of providers) {
      try {
        const content = await provider.run();
        return new Response(
          JSON.stringify({ provider: provider.name, choices: [{ message: { role: 'assistant', content } }] }),
          { status: 200, headers: { ...headers, 'Content-Type': 'application/json' } }
        );
      } catch (err) {
        const msg = `${provider.name}: ${err instanceof Error ? err.message : String(err)}`;
        console.error(msg);
        errors.push(msg);
      }
    }

    return new Response(JSON.stringify({ error: 'All providers failed', details: errors }), {
      status: 502,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  },
};
