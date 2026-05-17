import Groq from 'groq-sdk';
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
  const groq = getGroq();

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    temperature: 0.9,
    max_tokens: 2048,
  });

  const code = completion.choices[0]?.message?.content ?? '';

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
