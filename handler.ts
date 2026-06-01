import { WASocket, proto, normalizeMessageContent } from '@whiskeysockets/baileys';
import config from './config.js';

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
 * Main Message Handler
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
            
            // Auto read if enabled
            if (config.autoRead && !isMe) {
                await sock.readMessages([msg.key]);
            }
            
            const text = extractText(msg).trim();
            if (!text) continue;
            
            // Log message
            const chatType = isGroup ? '[GROUP]' : '[DM]';
            console.log(`\x1b[36m${chatType}\x1b[0m From: ${senderJid} | Msg: ${text}`);
            
            // Check if it's a command
            if (text.startsWith(config.prefix)) {
                const args = text.slice(config.prefix.length).trim().split(/ +/);
                const command = args.shift()?.toLowerCase();
                if (!command) continue;
                
                const q = args.join(' ');
                const isOwner = config.owners.includes(senderJid) || isMe;
                
                // Process Commands
                switch (command) {
                    case 'ping': {
                        const start = Date.now();
                        await sock.sendMessage(remoteJid, { text: 'Calculating ping...' }, { quoted: msg });
                        const end = Date.now();
                        await sock.sendMessage(remoteJid, { text: `Pong! 🏓 Speed: *${end - start}ms*` }, { quoted: msg });
                        break;
                    }
                    
                    case 'help':
                    case 'menu': {
                        const menuText = `🤖 *${config.botName}* 🤖\n\n` +
                            `Berikut adalah daftar perintah yang tersedia:\n\n` +
                            `*Umum:*\n` +
                            `• \`${config.prefix}ping\` - Cek kecepatan respon bot.\n` +
                            `• \`${config.prefix}help\` - Menampilkan menu bantuan.\n` +
                            `• \`${config.prefix}owner\` - Menampilkan kontak owner bot.\n\n` +
                            `*Grup (Hanya di dalam Grup):*\n` +
                            `• \`${config.prefix}groupinfo\` - Informasi tentang grup saat ini.\n` +
                            `• \`${config.prefix}tagall\` - Tag seluruh anggota grup (Owner/Admin only).\n\n` +
                            `*Owner Only:*\n` +
                            `• \`${config.prefix}say <teks>\` - Mengulang pesan yang diketik owner.\n` +
                            `• \`${config.prefix}broadcast <teks>\` - Mengirim pesan ke semua chat aktif.\n\n` +
                            `_Bot berjalan menggunakan Baileys v7.0+ (ESM + TS)_`;
                        
                        await sock.sendMessage(remoteJid, { text: menuText }, { quoted: msg });
                        break;
                    }
                    
                    case 'owner': {
                        const ownerNum = config.owners[0].split('@')[0];
                        await sock.sendMessage(remoteJid, { text: `Kontak owner: wa.me/${ownerNum}` }, { quoted: msg });
                        break;
                    }
                    
                    case 'groupinfo': {
                        if (!isGroup) {
                            await sock.sendMessage(remoteJid, { text: 'Perintah ini hanya bisa digunakan di dalam grup!' }, { quoted: msg });
                            break;
                        }
                        
                        const metadata = await sock.groupMetadata(remoteJid);
                        const creationDate = metadata.creation ? new Date(metadata.creation * 1000).toLocaleString('id-ID') : 'Unknown';
                        const infoText = `👥 *Informasi Grup* 👥\n\n` +
                            `• *Nama Grup:* ${metadata.subject}\n` +
                            `• *ID Grup:* ${metadata.id}\n` +
                            `• *Dibuat Oleh:* wa.me/${metadata.owner?.split('@')[0] || 'Unknown'}\n` +
                            `• *Dibuat Pada:* ${creationDate}\n` +
                            `• *Jumlah Anggota:* ${metadata.participants.length}\n` +
                            `• *Deskripsi:* ${metadata.desc || 'Tidak ada deskripsi'}`;
                            
                        await sock.sendMessage(remoteJid, { text: infoText }, { quoted: msg });
                        break;
                    }
                    
                    case 'tagall': {
                        if (!isGroup) {
                            await sock.sendMessage(remoteJid, { text: 'Perintah ini hanya bisa digunakan di dalam grup!' }, { quoted: msg });
                            break;
                        }
                        
                        const metadata = await sock.groupMetadata(remoteJid);
                        
                        // Check if sender is admin or owner
                        const isSenderAdmin = metadata.participants.find(p => p.id === senderJid)?.admin !== null;
                        if (!isSenderAdmin && !isOwner) {
                            await sock.sendMessage(remoteJid, { text: 'Perintah ini hanya bisa digunakan oleh Admin grup atau Owner bot!' }, { quoted: msg });
                            break;
                        }
                        
                        let tagText = `📣 *TAG ALL MEMBERS* 📣\n`;
                        if (q) tagText += `*Pesan:* ${q}\n\n`;
                        else tagText += `\n`;
                        
                        const mentions: string[] = [];
                        for (const participant of metadata.participants) {
                            tagText += `👥 @${participant.id.split('@')[0]}\n`;
                            mentions.push(participant.id);
                        }
                        
                        await sock.sendMessage(remoteJid, { text: tagText, mentions }, { quoted: msg });
                        break;
                    }
                    
                    case 'say': {
                        if (!isOwner) {
                            await sock.sendMessage(remoteJid, { text: 'Perintah ini hanya untuk Owner bot!' }, { quoted: msg });
                            break;
                        }
                        if (!q) {
                            await sock.sendMessage(remoteJid, { text: `Gunakan format: \`${config.prefix}say <teks>\`` }, { quoted: msg });
                            break;
                        }
                        await sock.sendMessage(remoteJid, { text: q });
                        break;
                    }
                    
                    case 'broadcast':
                    case 'bc': {
                        if (!isOwner) {
                            await sock.sendMessage(remoteJid, { text: 'Perintah ini hanya untuk Owner bot!' }, { quoted: msg });
                            break;
                        }
                        if (!q) {
                            await sock.sendMessage(remoteJid, { text: `Gunakan format: \`${config.prefix}broadcast <teks>\`` }, { quoted: msg });
                            break;
                        }
                        
                        await sock.sendMessage(remoteJid, { text: 'Memulai broadcast...' }, { quoted: msg });
                        await sock.sendMessage(remoteJid, { text: `📢 *BROADCAST OWNER* 📢\n\n${q}` });
                        break;
                    }
                    
                    default:
                        break;
                }
            } else {
                // Auto replies based on keywords
                const lowerText = text.toLowerCase();
                if (lowerText === 'halo' || lowerText === 'hai' || lowerText === 'hi') {
                    await sock.sendMessage(remoteJid, { text: `Halo! Saya adalah *${config.botName}*. Ketik \`${config.prefix}help\` untuk melihat daftar perintah.` }, { quoted: msg });
                } else if (lowerText === 'p' || lowerText === 'assalamualaikum') {
                    await sock.sendMessage(remoteJid, { text: 'Waalaikumsalam / Halo! Silakan hubungi saya atau gunakan command bot.' }, { quoted: msg });
                }
            }
        }
    } catch (error) {
        console.error('Error in message handler:', error);
    }
}

/**
 * Handle Group Participant Updates (Welcome/Goodbye)
 */
export async function handleGroupParticipants(sock: WASocket, update: { id: string; participants: string[]; action: string }) {
    try {
        const { id, participants, action } = update;
        console.log(`Group participant update in ${id}: Action: ${action}`);
        
        for (const num of participants) {
            if (action === 'add') {
                const welcomeText = `👋 @${num.split('@')[0]} telah bergabung ke grup!\n\n${config.welcomeMessage}`;
                await sock.sendMessage(id, { text: welcomeText, mentions: [num] });
            } else if (action === 'remove') {
                const goodbyeText = `🏃 @${num.split('@')[0]} telah meninggalkan grup.\n\n${config.goodbyeMessage}`;
                await sock.sendMessage(id, { text: goodbyeText, mentions: [num] });
            }
        }
    } catch (error) {
        console.error('Error in group participants handler:', error);
    }
}
