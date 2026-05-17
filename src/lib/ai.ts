import { templates } from '../templates';
import { SketchConfig } from '../types';

export async function generateConfigFromPrompt(prompt: string, currentConfig: SketchConfig): Promise<SketchConfig> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is not set.');

  const availableTemplates = Object.values(templates).map(t => ({
    id: t.id,
    name: t.name,
    description: t.description,
    params: t.params.map(p => ({
      id: p.id,
      name: p.name,
      type: p.type,
      default: p.default,
      options: p.options,
      min: p.min,
      max: p.max,
    }))
  }));

  const systemPrompt = `You are an AI assistant for Canvas, a generative art tool powered by p5.js.
Translate the user's natural language request into a valid sketch configuration.

Available templates:
${JSON.stringify(availableTemplates, null, 2)}

Current configuration:
${JSON.stringify(currentConfig, null, 2)}

Rules:
- If the user wants to modify the current sketch, keep templateId and update relevant params.
- If they want something new, pick the best matching templateId.
- Always return valid params matching the template's param definitions.
- Colors must be valid HEX strings (e.g. "#ff0000").
- Numbers must respect min/max bounds.
- Respond ONLY with a valid JSON object with keys: "templateId" (string) and "params" (object).`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`xAI API error: ${response.status} ${err}`);
  }

  const json = await response.json();
  const text = json.choices?.[0]?.message?.content ?? '{}';

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
