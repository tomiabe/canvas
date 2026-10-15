import { templates } from '../templates';
import { ParamDef, SketchConfig } from '../types';

const PROXY_URL = process.env.GROQ_PROXY_URL || 'https://canvas.tomi.workers.dev';

export async function generateConfigFromPrompt(prompt: string, currentConfig: SketchConfig): Promise<SketchConfig> {
  const currentTemplate = templates[currentConfig.templateId];
  const systemPrompt = `You create original generative art and animations for Canvas using p5.js 1.9 global mode.
Always write a complete custom sketch, not a template selection. Return ONLY valid JSON:
{"title":"Short artwork title","code":"complete JavaScript","params":[{"id":"speed","name":"Speed","type":"number","default":1,"min":0,"max":4,"step":0.1}]}

Declare 3–6 useful controls in params. Supported types:
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
- Do not use new p5(), HTML, imports, external libraries, network calls, or DOM controls.
- Call p5 functions only inside setup/draw/events, not at top level. The host seeds random and noise before setup.
- Keep the code focused and complete so it fits the response budget. No markdown fences.

When editing, preserve the current composition and existing controls unless the request needs a change.
The control defaults in your response must reflect the requested changes and the current values.
Return the full code and full control list on every request.

Curated style references (inspiration only, not output template ids):
${Object.values(templates).filter(t => t.id !== 'custom-sketch').map(t => `${t.name}: ${t.description}`).join('\n')}`;

  const response = await fetch(PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [
        { role: 'system', content: systemPrompt },
        ...(currentTemplate ? [{ role: 'user', content: `Current artwork:\n${JSON.stringify({
          title: currentConfig.generated?.title ?? currentTemplate.name,
          code: currentConfig.templateId === 'custom-sketch'
            ? currentConfig.params.code
            : currentTemplate.generateCode(currentConfig.params, currentConfig.seed),
          values: Object.fromEntries(Object.entries(currentConfig.params).filter(([id]) => id !== 'code')),
          controls: currentConfig.generated?.controls ?? currentTemplate.params,
        })}` }] : []),
        { role: 'user', content: prompt },
      ],
      temperature: 0.8,
      max_tokens: 4096,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) throw new Error(`AI proxy error ${response.status}`);
  const responseData = await response.json();
  const content = responseData.choices?.[0]?.message?.content;
  if (typeof content !== 'string') throw new Error('AI returned no sketch. Please try again.');
  const data = JSON.parse(content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim());
  if (typeof data?.title !== 'string' || !data.title.trim() ||
      typeof data.code !== 'string' || !data.code.trim() ||
      !Array.isArray(data.params) || data.params.length < 1 || data.params.length > 8) {
    throw new Error('AI returned an incomplete sketch or controls. Please try again.');
  }
  // Compile without executing, so syntax errors never replace the current artwork.
  new Function('params', data.code);
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
    seed: currentTemplate ? currentConfig.seed : Math.floor(Math.random() * 1000000),
    params: { ...Object.fromEntries(controls.map(p => [p.id, p.default])), code: data.code },
    generated: { title: data.title.trim(), controls },
  };
}
