import { templates } from '../templates';
import { ParamDef, SketchConfig, SketchLibrary } from '../types';
import { limitSketchLoops } from '../engine/generator';
import { ConversationTurn } from './studio';

const PROXY_URL = process.env.GROQ_PROXY_URL || 'https://canvas.tomi.workers.dev';

export class AIServiceError extends Error {}

export type GenerationMode = 'new' | 'refine';
export interface AIUsage {
  limit: number;
  remaining: number;
  resetsAt: string;
  reason?: 'daily' | 'burst' | 'global';
  retryAt?: string;
}

export async function getAIUsage(): Promise<AIUsage> {
  const response = await fetch(`${PROXY_URL.replace(/\/$/, '')}/usage`, { cache: 'no-store' });
  if (!response.ok) throw new AIServiceError('AI allowance temporarily unavailable.');
  const data = await response.json();
  return data.usage;
}

export async function generateConfigFromPrompt(prompt: string, currentConfig: SketchConfig, repair?: string, conversation: ConversationTurn[] = [], options: {
  mode?: GenerationMode;
  submissionId?: string;
  onUsage?: (usage: AIUsage) => void;
} = {}): Promise<SketchConfig> {
  const refining = options.mode !== 'new';
  const currentTemplate = templates[refining || repair ? currentConfig.templateId : ''];
  const systemPrompt = `You create original generative art and animations for Canvas using p5.js 1.9 global mode.
Always write a complete custom sketch, not a template selection. Return ONLY valid JSON:
{"title":"Short artwork title","libraries":[],"code":"complete JavaScript","params":[{"id":"speed","name":"Speed","type":"number","default":1,"min":0,"max":4,"step":0.1}]}

Declare 3-6 useful controls in params. Supported types:
- number: finite min < max, positive step, default within bounds
- color: default is a six-digit HEX string, e.g. "#ff6699"
- boolean: default is true or false
- enum: options is a nonempty array of strings, default is one of those strings
Each control needs a unique JavaScript identifier id and a short human-readable name.
Do not use code, constructor, prototype, or __proto__ as control ids.

Runtime contract:
- The host provides a mutable global object called params, initialized with your control defaults.
- Read params.speed, params.color, etc. directly in draw(), not only during setup(). Never declare or shadow params.
- EVERY declared control must visibly affect the artwork when changed, without reloading or resetting animation.
- For counts, initialize enough elements for the maximum and draw only the current count, or reconcile counts in draw().
- Define function setup() and function draw(). setup() calls createCanvas(windowWidth, windowHeight).
- Define function windowResized() { resizeCanvas(windowWidth, windowHeight); }.
- Do not use new p5(), HTML, imports, unlisted libraries, network calls, or DOM controls.
- Call p5 functions only inside setup/draw/events, not at top level. The host seeds random and noise before setup.
- Keep the code focused and complete so it fits the response budget. No markdown fences.

Optional host-provided libraries (return only needed names in libraries; never add script tags):
- "brush": p5.brush 1.1.4 with p5 1.11.3. Use createCanvas(windowWidth, windowHeight, WEBGL), pixelDensity(1), and setAttributes('preserveDrawingBuffer', true) before createCanvas. Coordinates are centered. brush.noField(); brush.noFill(); brush.noHatch(); brush.seed(37) initialize seeded brush drawing. brush.set('HB'|'2B'|'charcoal'|'marker'|'rotring', hexColor, weight); brush.line(x1,y1,x2,y2), brush.circle(x,y,r,true), brush.spline([[x,y],...],0.7). For watercolor: brush.noStroke(); brush.fill(hexColor,60); brush.bleed(0.1); brush.fillTexture(0.5,0.6). Flush brush.reBlend(); brush.reDraw(). On resize call brush.load() after resizeCanvas. Use very few watercolor shapes and bounded strokes with modest weights (typically 0.5-2): brush loops have a 500ms safety budget (ordinary sketches have 100ms). Never rebuild expensive brush paintings every animation frame; cache unchanged compositions, detect control changes in draw(), and repaint only when needed. Keep draw() running for control detection; noLoop() would prevent live controls from responding.
- "grain": p5.grain 0.8.0. In setup call p5grain.setup({random: () => random()}). p5grain.applyMonochromaticGrain(amount,false) adds exportable pixel texture; apply after painting/flushing brush, only when repainting, not every animation frame. No DOM texture overlays.
- Both may be combined. Ordinary animations should use libraries: []. Do not use brush or grain unless the requested visual style benefits from them.

${refining ? `REFINE THIS ARTWORK: preserve the current composition, palette, libraries and controls unless the request changes them.
Use recent conversation for references. Current artwork code and live values override earlier descriptions, including after restore/manual adjustment.
Control defaults must reflect the requested changes and current values.` : `NEW ARTWORK: create an independent composition from the current user prompt. Do not inherit a previous subject, palette, controls, or conversation. Any supplied failed attempt is only for repairing this new artwork.`}
Return the full code and full control list on every request.

Curated style references (inspiration only, not output template ids):
${Object.values(templates).filter(t => t.id !== 'custom-sketch').map(t => `${t.name}: ${t.description}`).join('\n')}`;

  const response = await fetch(PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      submissionId: options.submissionId ?? crypto.randomUUID(),
      messages: [
        { role: 'system', content: systemPrompt },
        ...(refining ? conversation.slice(-12) : []),
        ...(currentTemplate ? [{ role: 'user', content: `Current artwork:\n${JSON.stringify({
          title: currentConfig.generated?.title ?? currentTemplate.name,
          code: currentConfig.templateId === 'custom-sketch'
            ? currentConfig.params.code
            : currentTemplate.generateCode(currentConfig.params, currentConfig.seed),
          values: Object.fromEntries(Object.entries(currentConfig.params).filter(([id]) => id !== 'code')),
          controls: currentConfig.generated?.controls ?? currentTemplate.params,
          libraries: currentConfig.libraries ?? currentTemplate.libraries ?? [],
        })}` }] : []),
        { role: 'user', content: prompt },
        ...(repair ? [{ role: 'user', content: `Repair the failed attempt. Keep the original artistic intent and return the complete corrected JSON. Failure: ${repair}` }] : []),
      ],
      temperature: 0.8,
      max_tokens: 4096,
      response_format: { type: 'json_object' },
    }),
    signal: AbortSignal.timeout(90000),
  }).catch(() => { throw new AIServiceError('The AI service could not be reached. Please try again.'); });

  const responseData = await response.json().catch(() => {
    throw new AIServiceError('The AI service returned an unreadable response. Please try again.');
  });
  if (responseData.usage) options.onUsage?.(responseData.usage);
  if (!response.ok) throw new AIServiceError(response.status === 429 || response.status === 503
    ? responseData.error || 'AI allowance temporarily unavailable. Please try again later.'
    : 'The AI service is unavailable. Please try again shortly.');
  const content = responseData.choices?.[0]?.message?.content;
  try {
    if (typeof content !== 'string') throw new Error('AI returned no sketch. Please try again.');
    const data = JSON.parse(content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim());
    if (typeof data?.title !== 'string' || !data.title.trim() ||
        typeof data.code !== 'string' || !data.code.trim() ||
        !Array.isArray(data.params)) {
      throw new Error('AI returned an incomplete sketch or controls. Please try again.');
    }
    const libraries: SketchLibrary[] = data.libraries ?? [];
    if (!Array.isArray(libraries) || libraries.some(name => name !== 'brush' && name !== 'grain')) {
      throw new Error('AI returned an unsupported drawing library. Use only brush or grain.');
    }
    if (data.params.length < 1 || data.params.length > 8) {
      throw new Error(`Expected 1-8 controls, received ${data.params.length}. Reduce the controls to 3-6 and update the code to match.`);
    }
    // Parse without executing, using the same grammar as the preview's loop guard.
    limitSketchLoops(data.code);
    const ids = new Set<string>();
    const controls: ParamDef[] = data.params.map((p: any) => {
      if (!p || typeof p.id !== 'string' || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(p.id) ||
          ['code', '__proto__', 'constructor', 'prototype'].includes(p.id) || ids.has(p.id) ||
          typeof p.name !== 'string' || !p.name.trim()) {
        throw new Error('AI returned an invalid control. Please try again.');
      }
      ids.add(p.id);
      const control: ParamDef = { id: p.id, name: p.name.trim(), type: p.type, default: p.default };
      switch (p.type) {
        case 'number':
          if (![p.min, p.max, p.step, p.default].every(v => typeof v === 'number' && Number.isFinite(v)) ||
              p.min >= p.max || p.step <= 0 || p.step > p.max - p.min || p.default < p.min || p.default > p.max) {
            throw new Error(`AI returned invalid bounds for ${p.name}. Please try again.`);
          }
          return { ...control, min: p.min, max: p.max, step: p.step };
        case 'color':
          if (typeof p.default === 'string' && /^#[0-9a-f]{6}$/i.test(p.default)) return control;
          break;
        case 'boolean':
          if (typeof p.default === 'boolean') return control;
          break;
        case 'enum':
          if (Array.isArray(p.options) && p.options.length > 0 &&
              p.options.every((v: unknown) => typeof v === 'string') && p.options.includes(p.default)) {
            return { ...control, options: p.options };
          }
          break;
      }
      throw new Error(`AI returned an invalid value for ${p.name}. Please try again.`);
    });

    return {
      templateId: 'custom-sketch',
      ...(libraries.length ? { libraries: [...new Set(libraries)] } : {}),
      seed: currentTemplate ? currentConfig.seed : Math.floor(Math.random() * 1000000),
      params: { ...Object.fromEntries(controls.map(p => [p.id, p.default])), code: data.code },
      generated: {
        title: data.title.trim(), controls,
        ...(typeof responseData.provider === 'string' ? { provider: responseData.provider } : {}),
      },
    };
  } catch (error) {
    throw new Error(`${error instanceof Error ? error.message : 'Invalid sketch'}\nFailed response: ${String(content).slice(0, 24000)}`);
  }
}
