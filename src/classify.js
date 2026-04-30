import fs from 'fs';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const prompt = fs.readFileSync('./prompts/classify-braindump.md', 'utf-8');

export async function classify(text) {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `${prompt}\n\nINPUT:\n${text}`
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    return { tasks: [], notes: [{ text, area: 'unknown' }] };
  }
}
