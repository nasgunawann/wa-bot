import { WASocket, proto } from '@whiskeysockets/baileys';
import { askGemini } from '../ai.js';
import config from '../config.js';

/**
 * Handle automatic AI responses in DMs when enabled in configuration
 * @param sock Baileys socket instance
 * @param msg Raw WhatsApp message
 * @param text The extracted text content
 * @param remoteJid Target chat ID
 * @param isGroup Boolean flag if group chat
 * @param isMe Boolean flag if sent by self
 */
export async function processAutoAssistant(
    sock: WASocket,
    msg: proto.IWebMessageInfo,
    text: string,
    remoteJid: string,
    isGroup: boolean,
    isMe: boolean
) {
    // Check if it is a private DM, not sent by bot itself, and auto AI response is enabled
    if (!isGroup && !isMe && config.autoAiResponse) {
        try {
            // Trigger typing presence indicator to simulate natural reply
            await sock.sendPresenceUpdate('composing', remoteJid);
            
            // Ask Gemini AI with configured fallback and models
            const aiReply = await askGemini(text);
            
            // Send response back
            await sock.sendMessage(remoteJid, { text: aiReply }, { quoted: msg });
        } catch (error) {
            console.error('❌ Gagal merespon obrolan otomatis asisten AI:', error);
        }
    }
}
