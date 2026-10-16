// Historical pre-Phase-3 baseline models, including the now-obsolete Groq ID.
// Run: npx tsx scripts/evaluate-ai.ts (32 quota-bearing/possibly billable requests, concurrency 2).
// Uses actual app prompt/validator and renderer, but never contacts/deploys the worker.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { generateConfigFromPrompt } from '../src/lib/ai';
import { generateHtml } from '../src/engine/generator';

const nativeFetch = globalThis.fetch;
const empty: any = { templateId: '', seed: 12345, params: {} };
let request: any;
globalThis.fetch = (async (_url: any, init: any) => {
  request = JSON.parse(init.body);
  return Response.json({ choices: [{ message: { content: '{}' } }] });
}) as any;
await generateConfigFromPrompt('capture', empty).catch(() => {});
globalThis.fetch = nativeFetch;
const providers = [
  ['gemini', 'gemini-flash-latest', 'GEMINI_API_KEY'],
  ['gemini-lite', 'gemini-flash-lite-latest', 'GEMINI_API_KEY'],
  ['groq', 'llama-3.3-70b-versatile', 'GROQ_API_KEY'],
  ['openrouter', 'meta-llama/llama-3.3-70b-instruct:free', 'OPENROUTER_API_KEY'],
];
const fixture = JSON.parse(readFileSync(new URL('./evaluation-prompts.json', import.meta.url), 'utf8'));
const results: any[] = [];
const jobs = providers.flatMap(([provider, model, key], pi) => fixture.map((variants: string[], i: number) => ({ provider, model, key, prompt: variants[pi], category: i })));
let cursor = 0;
async function worker() {
  while (cursor < jobs.length) {
    const job = jobs[cursor++];
    const row: any = { ...job }; delete row.key;
    results.push(row);
    if (!process.env[job.key]) { row.error = 'missing key'; continue; }
    const messages = [...request.messages.slice(0, -1), { role: 'user', content: job.prompt }];
    let url: string, body: any, headers: any = { 'Content-Type': 'application/json' };
    if (job.provider.startsWith('gemini')) {
      url = `https://generativelanguage.googleapis.com/v1beta/models/${job.model}:generateContent`;
      headers['x-goog-api-key'] = process.env[job.key];
      body = { systemInstruction: { parts: [{ text: messages[0].content }] }, contents: [{ role: 'user', parts: [{ text: job.prompt }] }], generationConfig: { temperature: 0.8, maxOutputTokens: 4096, responseMimeType: 'application/json', ...(job.provider === 'gemini' ? { thinkingConfig: { thinkingBudget: 0 } } : {}) } };
    } else {
      url = job.provider === 'groq' ? 'https://api.groq.com/openai/v1/chat/completions' : 'https://openrouter.ai/api/v1/chat/completions';
      headers.Authorization = `Bearer ${process.env[job.key]}`;
      body = { model: job.model, messages, temperature: 0.8, max_tokens: 4096, ...(job.provider === 'groq' ? { response_format: { type: 'json_object' } } : {}) };
    }
    const start = performance.now();
    try {
      const response = await nativeFetch(url, { method: 'POST', headers, body: JSON.stringify(body), signal: AbortSignal.timeout(15000) });
      row.httpStatus = response.status;
      const data: any = await response.json();
      row.latencyMs = Math.round(performance.now() - start);
      if (!response.ok) { row.error = JSON.stringify(data.error ?? data).replaceAll(process.env[job.key]!, '[REDACTED]').slice(0, 1200); continue; }
      row.usage = data.usageMetadata ?? data.usage;
      row.finishReason = data.candidates?.[0]?.finishReason ?? data.choices?.[0]?.finish_reason;
      row.content = job.provider.startsWith('gemini') ? data.candidates?.[0]?.content?.parts?.map((p: any) => p.text ?? '').join('') : data.choices?.[0]?.message?.content;
      if (!row.content) row.error = 'empty content';
    } catch (error: any) { row.latencyMs = Math.round(performance.now() - start); row.error = error.name; }
    console.log(job.provider, job.category, row.httpStatus ?? row.error, row.latencyMs);
  }
}
if (process.argv.includes('--runtime-only')) {
  results.push(...JSON.parse(readFileSync('docs/phase3-evaluation.json', 'utf8')).results);
} else {
  await Promise.all([worker(), worker()]);
}
const ab = (args: string[], input?: string) => execFileSync('agent-browser', ['--session', 'canvas-eval', ...args], { input, encoding: 'utf8', timeout: 30000, maxBuffer: 4 * 1024 * 1024 });
try {
  // Secure origin is required by p5.sound's AudioWorklet, even for silent sketches.
  ab(['open', 'https://example.com']); ab(['set', 'viewport', '800', '600', '2']);
  for (const row of results) {
    if (!row.content) continue;
    try {
      JSON.parse(row.content); row.strictJson = true;
    } catch { row.strictJson = false; }
    globalThis.fetch = (async () => Response.json({ choices: [{ message: { content: row.content } }] })) as any;
    let config: any;
    try { config = await generateConfigFromPrompt(row.prompt, empty); row.appSchemaAndSyntax = true; }
    catch (error: any) { row.appSchemaAndSyntax = false; row.validationError = error.message; continue; }
    finally { globalThis.fetch = nativeFetch; }
    const html = generateHtml(config);
    const code = `(async () => {
      document.body.innerHTML = ''; const errors = [];
      window.onmessage = e => { if(e.data?.type === 'sketch-error') errors.push(e.data.message); };
      const frame = document.createElement('iframe'); frame.style='width:780px;height:560px'; document.body.append(frame);
      frame.srcdoc = ${JSON.stringify(html)};
      await new Promise(r => setTimeout(r, 500));
      for(let i = 0; i < 100 && frame.contentWindow.document.readyState !== 'complete' && !errors.length; i++) await new Promise(r => setTimeout(r, 100));
      const neededExplicitBootstrap = !frame.contentWindow.document.querySelector('canvas');
      if (neededExplicitBootstrap && typeof frame.contentWindow.p5 === 'function') {
        try { frame.contentWindow.__evaluationP5 = new frame.contentWindow.p5(); } catch(e) { errors.push(String(e)); }
      }
      await new Promise(r => setTimeout(r, 2500));
      const w = frame.contentWindow; const canvas = w.document.querySelector('canvas');
      const result = { errors, neededExplicitBootstrap, readyState: w.document.readyState, setupDefined: typeof w.setup === 'function', p5Loaded: typeof w.p5 === 'function', frameCount: w.frameCount ?? 0, canvas: canvas ? [canvas.width, canvas.height] : null };
      if (typeof w.noLoop === 'function') w.noLoop(); return result;
    })()`;
    try { row.runtime = JSON.parse(ab(['eval', '--stdin', '--json'], code)); }
    catch (error: any) { row.runtimeHarnessError = error.message.slice(0, 300); }
  }
} finally {
  globalThis.fetch = nativeFetch;
  try { ab(['close']); } catch {}
  mkdirSync('docs', { recursive: true });
  writeFileSync('docs/phase3-evaluation.json', JSON.stringify({ date: new Date().toISOString(), concurrency: 2, timeoutMs: 15000, systemPrompt: request.messages[0].content, notes: '32 distinct creation prompts; no editing context. Actual app schema/syntax validator and generated HTML in Chromium; 2.5-second default-state smoke test, no control mutation or visual fidelity scoring. Costs not independently verified. No retries.', results }, null, 2) + '\n');
}
