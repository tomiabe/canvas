import Groq from 'groq-sdk';
import { templates } from '../templates';
import { SketchConfig } from '../types';

let groqInstance: Groq | null = null;

function getGroq() {
  if (!groqInstance) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error('GROQ_API_KEY is not set.');
    groqInstance = new Groq({ apiKey, dangerouslyAllowBrowser: true });
  }
  return groqInstance;
}

export async function generateConfigFromPrompt(prompt: string, currentConfig: SketchConfig): Promise<SketchConfig> {
  const groq = getGroq();

  const templateList = Object.values(templates).map(t => `${t.id}: ${t.name} — ${t.description}`).join('\n');

  const currentTemplate = templates[currentConfig.templateId];
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
- If they want something new, pick the best matching templateId from the list above.
- Colors must be valid HEX strings (e.g. "#ff0000").
- Numbers must respect min/max bounds.
- Respond ONLY with a valid JSON object: {"templateId": string, "params": object}.
- Only include params you want to change; omit the rest (defaults will be used).`;

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
  });

  const text = completion.choices[0]?.message?.content ?? '{}';

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
