import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';

const apiKey = process.env.GEMINI_API_KEY || '';
const modelName = process.env.GEMINI_MODEL || 'gemini-flash-latest';

// Initialize the Google Gen AI client
const ai = new GoogleGenAI({ apiKey });

/**
 * Send a prompt to the configured Gemini model
 * @param prompt The question or command
 * @returns Generated text response
 */
export async function askGemini(prompt: string): Promise<string> {
    if (!apiKey) {
        return '⚠️ Error: GEMINI_API_KEY belum dikonfigurasi di file .env!';
    }
    try {
        console.log(`🧠 Memanggil Gemini AI menggunakan model: ${modelName}...`);
        const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
                systemInstruction: 'Kamu adalah asisten pintar bernama Antigravity Bot. Jawablah menggunakan bahasa Indonesia yang santun, ramah, kreatif, dan informatif.'
            }
        });
        return response.text || 'Maaf, saya tidak dapat merumuskan jawaban saat ini.';
    } catch (error) {
        console.error('❌ Error dari Gemini API:', error);
        return 'Terjadi kesalahan sistem saat menghubungi otak AI saya. 🧠❌';
    }
}
