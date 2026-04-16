import { GoogleGenAI, Type } from '@google/genai';
import { templates } from '../templates';
import { SketchConfig } from '../types';

let aiInstance: GoogleGenAI | null = null;

function getAiInstance() {
  if (!aiInstance) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set.");
    }
    aiInstance = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiInstance;
}

export async function generateConfigFromPrompt(prompt: string, currentConfig: SketchConfig): Promise<SketchConfig> {
  const ai = getAiInstance();

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
    }))
  }));

  const systemInstruction = `You are an AI assistant for a creative coding tool called Canvas. 
Your goal is to translate a user's natural language request into a valid template configuration.
Available templates:
${JSON.stringify(availableTemplates, null, 2)}

Current configuration:
${JSON.stringify(currentConfig, null, 2)}

If the user asks to modify the current sketch, keep the current templateId and update the relevant parameters. 
If they ask for something entirely new, pick the best templateId and set suitable parameters.
Always return valid parameters as per the template definition. Provide colors in HEX format. Provide numbers that fit within min/max bounds if specified.
Provide the response strictly as valid JSON matching the schema.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          templateId: { type: Type.STRING, description: "The ID of the selected template." },
          params: { type: Type.OBJECT, description: "Key-value pairs of parameters matching the template." }
        },
        required: ["templateId", "params"]
      }
    }
  });

  const text = response.text || "{}";
  try {
    const data = JSON.parse(text);
    
    // Validate that the template exists
    if (!templates[data.templateId]) {
       return currentConfig; // fallback
    }

    // Merge new params with defaults to avoid missing keys
    const template = templates[data.templateId];
    const finalParams: Record<string, any> = {};
    template.params.forEach(p => {
      finalParams[p.id] = data.params[p.id] !== undefined ? data.params[p.id] : p.default;
    });

    return {
      templateId: data.templateId,
      seed: Math.floor(Math.random() * 1000000),
      params: finalParams
    };
  } catch (err) {
    console.error("Failed to parse AI response:", err);
    throw err;
  }
}
