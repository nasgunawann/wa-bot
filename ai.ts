import { GoogleGenAI } from "@google/genai";
import "dotenv/config";

const apiKey = process.env.GEMINI_API_KEY || "";
const modelName = process.env.GEMINI_MODEL || "gemini-flash-latest";

// Initialize the Google Gen AI client
const ai = new GoogleGenAI({ apiKey });

interface ChatMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

// In-memory store for chat histories keyed by JID/sessionId
const chatHistories = new Map<string, ChatMessage[]>();

/**
 * Send a prompt to the configured Gemini model with conversation memory support
 * @param prompt The current message text
 * @param sessionId Optional identifier (e.g. sender WhatsApp JID) to persist history
 * @returns Generated text response
 */
export async function askGemini(prompt: string, sessionId?: string): Promise<string> {
  if (!apiKey) {
    return "⚠️ Error: GEMINI_API_KEY belum dikonfigurasi di file .env!";
  }
  try {
    console.log(`🧠 Memanggil Gemini AI menggunakan model: ${modelName}...`);
    
    let contents: any = prompt;
    let history: ChatMessage[] = [];

    if (sessionId) {
      history = chatHistories.get(sessionId) || [];
      // Combine existing history with the new user message
      contents = [
        ...history,
        { role: "user", parts: [{ text: prompt }] }
      ];
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents: contents,
      config: {
        systemInstruction:
          "Kamu adalah asisten pintar bernama Nanasgunung Creative Bot. Jawablah menggunakan bahasa Indonesia yang santun, ramah, kreatif, dan informatif. Ingat riwayat percakapan yang diberikan untuk memberikan jawaban yang logis dan berkesinambungan.",
      },
    });

    const replyText = response.text || "Maaf, saya tidak dapat merumuskan jawaban saat ini.";

    if (sessionId) {
      // Append the new interaction to the history
      history.push({ role: "user", parts: [{ text: prompt }] });
      history.push({ role: "model", parts: [{ text: replyText }] });

      // Cap memory to the last 10 messages (5 turns of conversation) to manage token usage
      if (history.length > 10) {
        history = history.slice(history.length - 10);
      }
      
      chatHistories.set(sessionId, history);
    }

    return replyText;
  } catch (error) {
    console.error("❌ Error dari Gemini API:", error);
    return "Terjadi kesalahan sistem saat menghubungi otak AI saya. 🧠❌";
  }
}

/**
 * Clear the conversation history for a specific session/JID
 * @param sessionId The sender's JID or conversation ID
 */
export function clearChatHistory(sessionId: string): boolean {
  if (chatHistories.has(sessionId)) {
    chatHistories.delete(sessionId);
    console.log(`🧹 Memori percakapan untuk ${sessionId} berhasil dihapus.`);
    return true;
  }
  return false;
}

