import { WASocket, proto } from '@whiskeysockets/baileys';
import { askGemini } from '../ai.js';
import config from '../config.js';

/**
 * Handle automatic AI responses (Auto Assistant)
 * Supports:
 * 1. Automatic responses in private DMs (if autoAiResponse is enabled).
 * 2. Automatic responses in Groups ONLY when the bot is @mentioned.
 * 
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
    if (!config.autoAiResponse || isMe) return;

    // Get bot's own WhatsApp normalized JID
    const botNumber = sock.user?.id.split(':')[0];
    const botJid = botNumber ? `${botNumber}@s.whatsapp.net` : null;

    let shouldReply = false;
    let cleanPrompt = text;

    if (isGroup) {
        // --- 👥 GROUP AUTO-RESPONDER ONLY ON @MENTION ---
        if (botJid && botNumber) {
            // Check if the bot's JID is listed in the mentionedJid array of the contextInfo
            const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
            const mentionedJids = contextInfo?.mentionedJid || [];
            
            const wasMentionedInArray = mentionedJids.includes(botJid);
            const wasMentionedInText = text.includes(`@${botNumber}`);
            
            // Check if user is replying/quoting a message generated/sent by the bot
            const isReplyingToBot = contextInfo?.participant === botJid;

            if (wasMentionedInArray || wasMentionedInText || isReplyingToBot) {
                shouldReply = true;
                
                // Clean the @mention tag from the text prompt to give Gemini a cleaner context
                cleanPrompt = text.replace(new RegExp(`@${botNumber}`, 'g'), '').trim();
            }
        }
    } else {
        // --- 💬 PRIVATE DM AUTO-RESPONDER (Always reply if enabled) ---
        shouldReply = true;
    }

    if (shouldReply) {
        try {
            // Trigger typing presence indicator to simulate natural reply
            await sock.sendPresenceUpdate('composing', remoteJid);
            
            // Ask Gemini AI with cleaned prompt and session ID for memory
            const aiReply = await askGemini(cleanPrompt, remoteJid);
            
            // Send response back with quoted reference
            await sock.sendMessage(remoteJid, { text: aiReply }, { quoted: msg });
        } catch (error) {
            console.error('❌ Gagal merespon obrolan otomatis asisten AI:', error);
        }
    }
}
