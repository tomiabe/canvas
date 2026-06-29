import { templates } from '../templates';
import { SketchConfig } from '../types';

const PROXY_URL = process.env.GROQ_PROXY_URL || 'https://canvas-groq-proxy.tomi.workers.dev';

export async function generateConfigFromPrompt(prompt: string, currentConfig: SketchConfig): Promise<SketchConfig> {
  const templateList = Object.values(templates)
    .map(t => `${t.id}: ${t.name} — ${t.description}`)
    .join('\n');

  const currentTemplate = currentConfig.templateId ? templates[currentConfig.templateId] : null;
  const currentParamDefs = currentTemplate
    ? currentTemplate.params.map(p => ({
        id: p.id,
        name: p.name,
        type: p.type,
        default: p.default,
        ...(p.options ? { options: p.options } : {}),
        ...(p.min !== undefined ? { min: p.min } : {}),
        ...(p.max !== undefined ? { max: p.max } : {}),
      }))
    : [];

  const systemPrompt = `You are an AI assistant for Canvas, a generative art tool powered by p5.js.
Translate the user's natural language request into a valid sketch configuration.

Available templates (id: name — description):
${templateList}

Current templateId: "${currentConfig.templateId || 'none'}"
${currentParamDefs.length ? `Current template params:\n${JSON.stringify(currentParamDefs, null, 2)}` : ''}

Rules:
- If the user wants to modify the current sketch, keep templateId and update relevant params.
- If an existing template fits well, pick the best matching templateId from the list above.
- If the request needs a feature, shape, or behavior NOT covered by any template's params
  (e.g. a specific scene, a game, custom physics, a literal subject like an object or character),
  use templateId "custom-sketch" and write complete, raw p5.js code into params.code.
  Rules for params.code:
  - Global mode only: setup() and draw() functions, no new p5() wrapper.
  - setup() must call createCanvas(windowWidth, windowHeight).
  - Include windowResized() { resizeCanvas(windowWidth, windowHeight); }.
  - Keep it concise (under ~120 lines, no comments) — output is token-limited and a cut-off response breaks.
- Colors must be valid HEX strings (e.g. "#ff0000").
- Numbers must respect min/max bounds.
- Respond ONLY with a valid JSON object: {"templateId": string, "params": object}.
- Only include params you want to change; omit the rest (defaults will be used), except params.code
  for custom-sketch which must always be the full code.`;

  const response = await fetch(PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: 0.8,
      max_tokens: 4096,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`AI proxy error ${response.status}: ${text}`);
  }

  const responseData = await response.json();
  let text: string = responseData.choices?.[0]?.message?.content ?? '{}';

  // Strip markdown fences if the model includes them anyway
  text = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();

  try {
    const data = JSON.parse(text);

    if (!templates[data.templateId]) return currentConfig;

    const template = templates[data.templateId];
    const finalParams: Record<string, any> = {};
    template.params.forEach(p => {
      finalParams[p.id] = data.params?.[p.id] !== undefined ? data.params[p.id] : p.default;
    });

    return {
      templateId: data.templateId,
      seed: Math.floor(Math.random() * 1000000),
      params: finalParams,
    };
  } catch (err) {
    console.error('Failed to parse AI response:', err, text);
    throw err;
  }
}
