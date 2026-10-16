// npx tsx scripts/evaluate-repair.ts: 30 Lite prompts, up to two repairs each.
// Uses environment credentials; never deploys or changes the app.
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { AIServiceError, generateConfigFromPrompt } from '../src/lib/ai';
import { generateHtml } from '../src/engine/generator';

const groq = process.argv.includes('--groq');
const replay = process.argv.includes('--replay');
const saved = replay ? JSON.parse(readFileSync('docs/phase3-repair-evaluation.json', 'utf8')).results : null;
const prompts: string[] = JSON.parse(readFileSync('scripts/evaluation-prompts.json', 'utf8')).flat().slice(0, groq ? 8 : 30);
const nativeFetch = globalThis.fetch;
const rows: any[] = [];
let currentAttempt: any;
globalThis.fetch = (async (_url: unknown, init: RequestInit) => {
  if (replay) {
    const content = saved[rows.length - 1].attempts.at(-1).content;
    return Response.json({ choices: [{ message: { content } }] });
  }
  const body = JSON.parse(init.body as string);
  const start = performance.now();
  const response = await nativeFetch(groq ? 'https://api.groq.com/openai/v1/chat/completions' : 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent', {
    method: 'POST',
    headers: groq ? { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GROQ_API_KEY}` }
      : { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY! },
    body: JSON.stringify(groq ? {
      model: 'openai/gpt-oss-120b', messages: body.messages, temperature: 0.8,
      max_tokens: 4096, reasoning_effort: 'low', response_format: { type: 'json_object' },
    } : {
      systemInstruction: { parts: [{ text: body.messages[0].content }] },
      contents: body.messages.slice(1).map((m: any) => ({ role: 'user', parts: [{ text: m.content }] })),
      generationConfig: { temperature: 0.8, maxOutputTokens: 4096, responseMimeType: 'application/json' },
    }),
    signal: AbortSignal.timeout(15000),
  });
  const data: any = await response.json();
  currentAttempt.httpStatus = response.status;
  currentAttempt.latencyMs = Math.round(performance.now() - start);
  currentAttempt.usage = data.usageMetadata ?? data.usage;
  currentAttempt.model = data.modelVersion ?? data.model;
  if (!response.ok) return Response.json({ error: 'Provider unavailable' }, { status: response.status });
  const text = groq ? data.choices?.[0]?.message?.content : data.candidates?.[0]?.content?.parts?.map((p: any) => p.text ?? '').join('');
  currentAttempt.content = text;
  return Response.json({ choices: [{ message: { content: text } }] });
}) as typeof fetch;
const browser = (args: string[], input?: string) => execFileSync('agent-browser', ['--session', 'repair-eval', '--restore', ...args], { input, encoding: 'utf8', timeout: 30000, maxBuffer: 4 * 1024 * 1024 });
try {
  browser(['open', 'https://example.com']);
  browser(['set', 'viewport', '800', '600', '2']);
  for (const prompt of prompts) {
    const row: any = { prompt, attempts: [], success: false };
    rows.push(row);
    let config: any = { templateId: '', seed: 12345, params: {} };
    let failure: string | undefined;
    for (let attempt = 0; attempt <= (replay ? 0 : 2); attempt++) {
      currentAttempt = { repair: attempt > 0 };
      row.attempts.push(currentAttempt);
      try {
        config = await generateConfigFromPrompt(prompt, config, failure);
        currentAttempt.validated = true;
        const html = generateHtml(config, 'evaluation');
        const code = `new Promise(resolve => {
          document.body.innerHTML = '';
          const frame = document.createElement('iframe');
          frame.sandbox = 'allow-scripts allow-downloads';
          frame.style = 'width:780px;height:560px';
          let timer, settled = false;
          const finish = value => { if (settled) return; settled = true; clearTimeout(timer); clearTimeout(deadline); window.removeEventListener('message', handler); resolve(value); };
          const handler = event => {
            if (event.source !== frame.contentWindow || event.data?.runId !== 'evaluation') return;
            if (event.data.type === 'sketch-error') finish({ success: false, error: event.data.message });
            if (event.data.type === 'sketch-ready') timer = setTimeout(() => finish({ success: true }), 2000);
          };
          const deadline = setTimeout(() => finish({ success: false, error: 'No draw within 15 seconds' }), 15000);
          window.addEventListener('message', handler);
          document.body.append(frame); frame.srcdoc = ${JSON.stringify(html)};
        })`;
        const result = JSON.parse(browser(['eval', '--stdin', '--json'], code)).data.result;
        currentAttempt.runtime = result;
        if (!result.success) throw new Error(result.error);
        row.success = true;
        break;
      } catch (error) {
        failure = error instanceof Error ? error.message : String(error);
        currentAttempt.error = failure;
        if (error instanceof AIServiceError) break;
      }
    }
    console.log(rows.length, row.success ? 'PASS' : 'FAIL', row.attempts.length);
  }
} finally {
  globalThis.fetch = nativeFetch;
  try { browser(['close']); } catch {}
  writeFileSync(replay ? 'docs/phase3-guard-replay.json' : groq ? 'docs/phase3-groq-evaluation.json' : 'docs/phase3-repair-evaluation.json', JSON.stringify({
    date: new Date().toISOString(), provider: groq ? 'openai/gpt-oss-120b' : 'gemini-flash-lite-latest',
    notes: `${prompts.length} prompts, sequential; real app validation + opaque sandbox iframe readiness and two-second probation. No visual or control correctness score. ${replay ? 'Replays final saved attempts without API calls, with current loop guard.' : 'Provider calls capped at 15 seconds. Reported tokens only, billed dollars unverified.'}`,
    results: rows,
  }, null, 2) + '\n');
}
