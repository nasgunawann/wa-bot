import { WASocket, proto } from '@whiskeysockets/baileys';
import config from '../config.js';
import { askGemini } from '../ai.js';

/**
 * Handle manual commands starting with the configured prefix
 * @param sock Baileys socket instance
 * @param msg Raw WhatsApp message
 * @param command The parsed command (without prefix)
 * @param args Remaining arguments array
 * @param q The combined arguments string
 * @param remoteJid Target chat ID
 * @param senderJid Message sender ID
 * @param isGroup Boolean flag if group chat
 * @param isMe Boolean flag if sent by self
 */
export async function processCommand(
    sock: WASocket,
    msg: proto.IWebMessageInfo,
    command: string,
    args: string[],
    q: string,
    remoteJid: string,
    senderJid: string,
    isGroup: boolean,
    isMe: boolean
) {
    const isOwner = config.owners.includes(senderJid) || isMe;

    switch (command) {
        case 'ai': {
            if (!q) {
                await sock.sendMessage(remoteJid, { text: 'Silakan ketik pertanyaan Anda! Contoh: `/ai kenapa awan berwarna putih?`' }, { quoted: msg });
                break;
            }
            
            await sock.sendPresenceUpdate('composing', remoteJid);
            const aiReply = await askGemini(q);
            await sock.sendMessage(remoteJid, { text: aiReply }, { quoted: msg });
            break;
        }
        
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
                `• \`${config.prefix}ai <pertanyaan>\` - Bertanya cerdas ke Gemini AI. 🧠\n` +
                `• \`${config.prefix}ping\` - Cek kecepatan respon bot.\n` +
                `• \`${config.prefix}help\` - Menampilkan menu bantuan.\n` +
                `• \`${config.prefix}owner\` - Menampilkan kontak owner bot.\n\n` +
                `*Grup (Hanya di dalam Grup):*\n` +
                `• \`${config.prefix}groupinfo\` - Informasi tentang grup saat ini.\n` +
                `• \`${config.prefix}tagall\` - Tag seluruh anggota grup (Owner/Admin only).\n\n` +
                `*Owner Only:*\n` +
                `• \`${config.prefix}say <teks>\` - Mengulang pesan yang diketik owner.\n` +
                `• \`${config.prefix}broadcast <teks>\` - Mengirim pesan ke semua chat aktif.\n\n` +
                `_Bot berjalan menggunakan Baileys v7.0+ & Gemini AI (${process.env.GEMINI_MODEL || 'gemini-flash-latest'})_`;
            
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
}
