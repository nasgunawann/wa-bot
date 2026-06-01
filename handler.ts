import { WASocket, proto, normalizeMessageContent } from '@whiskeysockets/baileys';
import config from './config.js';
import { processCommand } from './modules/commands.js';
import { processAutoAssistant } from './modules/assistant.js';
import { processGroupParticipants } from './modules/welcome.js';

/**
 * Extract text from WhatsApp message info safely
 */
export function extractText(msg: proto.IWebMessageInfo): string {
    const message = normalizeMessageContent(msg.message);
    if (!message) return '';
    
    return (
        message.conversation || 
        message.extendedTextMessage?.text || 
        message.imageMessage?.caption || 
        message.videoMessage?.caption || 
        message.documentMessage?.caption || 
        message.templateButtonReplyMessage?.selectedId || 
        message.buttonsResponseMessage?.selectedButtonId || 
        ''
    );
}

/**
 * Main Message Router/Dispatcher
 */
export async function handleMessage(sock: WASocket, m: { messages: proto.IWebMessageInfo[]; type: string }) {
    try {
        const { messages, type } = m;
        if (type !== 'notify') return; // Only process notifications of new messages
        
        for (const msg of messages) {
            // Ignore messages without actual content or from status broadcasts
            if (!msg.message || msg.key.remoteJid === 'status@broadcast') continue;
            
            const remoteJid = msg.key.remoteJid;
            if (!remoteJid) continue;
            
            const isGroup = remoteJid.endsWith('@g.us');
            const isMe = msg.key.fromMe;
            
            // Check self-response settings
            if (isMe && !config.respondToSelf) continue;
            
            // Extract sender JID
            const senderJid = isGroup ? (msg.key.participant || '') : remoteJid;
            
            const text = extractText(msg).trim();
            if (!text) continue;
            
            // --- 🕵️‍♂️ LOGIKA AUTO READ CERDAS ---
            const isCommand = text.startsWith(config.prefix);
            const botNumber = sock.user?.id.split(':')[0];
            const botJid = botNumber ? `${botNumber}@s.whatsapp.net` : null;
            const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
            const mentionedJids = contextInfo?.mentionedJid || [];
            
            const isMentioned = isGroup && botNumber && botJid && (
                mentionedJids.includes(botJid) || 
                text.includes(`@${botNumber}`)
            );

            // Hanya tandai centang biru (read) jika:
            // 1. autoRead diaktifkan dan bukan pesan kita sendiri
            // 2. Chat berada di DM pribadi ATAU berupa command grup ATAU bot di-tag di grup
            if (config.autoRead && !isMe) {
                if (!isGroup || isCommand || isMentioned) {
                    await sock.readMessages([msg.key]);
                }
            }
            
            // Log message
            const chatType = isGroup ? '[GROUP]' : '[DM]';
            console.log(`\x1b[36m${chatType}\x1b[0m From: ${senderJid} | Msg: ${text}`);
            
            // Check if it's a command
            if (isCommand) {
                const args = text.slice(config.prefix.length).trim().split(/ +/);
                const command = args.shift()?.toLowerCase();
                if (!command) continue;
                
                const q = args.join(' ');
                
                // Dispatch to the specialized Commands Module
                await processCommand(sock, msg, command, args, q, remoteJid, senderJid, isGroup, isMe);
            } else {
                // Dispatch to the specialized Auto-Assistant AI Module
                await processAutoAssistant(sock, msg, text, remoteJid, isGroup, isMe);
                
                // Fallback standard replies if auto AI is disabled
                if (!isGroup && !isMe && !config.autoAiResponse) {
                    const lowerText = text.toLowerCase();
                    if (lowerText === 'halo' || lowerText === 'hai' || lowerText === 'hi') {
                        await sock.sendMessage(remoteJid, { text: `Halo! Saya adalah *${config.botName}*. Ketik \`${config.prefix}help\` untuk melihat daftar perintah.` }, { quoted: msg });
                    } else if (lowerText === 'p' || lowerText === 'assalamualaikum') {
                        await sock.sendMessage(remoteJid, { text: 'Waalaikumsalam / Halo! Silakan hubungi saya atau gunakan command bot.' }, { quoted: msg });
                    }
                }
            }
        }
    } catch (error) {
        console.error('❌ Error dalam Router handleMessage utama:', error);
    }
}

/**
 * Handle Group Participant Updates Dispatcher
 */
export async function handleGroupParticipants(sock: WASocket, update: { id: string; participants: string[]; action: string }) {
    // Dispatch to the specialized Welcome/Goodbye Module
    await processGroupParticipants(sock, update);
}
