import fs from 'fs';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const prompt = fs.readFileSync('./prompts/classify-braindump.md', 'utf-8');

function safeParse(text, original) {
  try {
    return JSON.parse(text);
  } catch (e) {
    // attempt cleanup
    try {
      const cleaned = text
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      return JSON.parse(cleaned);
    } catch (e2) {
      return {
        tasks: [],
        notes: [{ text: original, area: 'unknown', person: null, keep: true }]
      };
    }
  }
}

export async function classify(text) {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `${prompt}\n\nINPUT:\n${text}`
  });

  const parsed = safeParse(response.text, text);

  // minimal validation
  return {
    tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
    notes: Array.isArray(parsed.notes) ? parsed.notes : []
  };
}
