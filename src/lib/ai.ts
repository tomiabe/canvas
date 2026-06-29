import { SketchConfig } from '../types';

const PROXY_URL = process.env.GROQ_PROXY_URL || 'https://canvas-groq-proxy.tomi.workers.dev';

const SYSTEM_PROMPT = `You are a creative generative art programmer. When the user describes a visual idea, write complete p5.js code that brings it to life.

Rules:
- Use global mode (setup() and draw() functions, no new p5() wrapper)
- Always call createCanvas(windowWidth, windowHeight) in setup()
- Add windowResized() { resizeCanvas(windowWidth, windowHeight); } to support resizing
- Write animated, living art — not static images
- Use p5.js built-ins: noise(), random(), sin(), cos(), map(), lerp(), etc.
- Do not use any external libraries beyond p5.js
- Respond ONLY with raw JavaScript code — no markdown fences, no explanation`;

export async function generateSketchCode(prompt: string): Promise<string> {
  const response = await fetch(PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.9,
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`AI proxy error ${response.status}: ${text}`);
  }

  const data = await response.json();
  const code: string = data.choices?.[0]?.message?.content ?? '';

  // Strip markdown fences if the model includes them anyway
  return code
    .replace(/^```(?:javascript|js)?\n?/i, '')
    .replace(/\n?```$/i, '')
    .trim();
}

export async function generateConfigFromPrompt(prompt: string, _currentConfig: SketchConfig): Promise<SketchConfig> {
  const code = await generateSketchCode(prompt);
  return {
    templateId: '',
    seed: 0,
    params: {},
    customCode: code,
  };
}
