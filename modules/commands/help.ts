import type { Command, ValidMessage } from './types.js';
import type { WASocket, proto } from '@whiskeysockets/baileys';
import config from '../../config.js';

const helpCommand: Command = {
  name: 'help',
  aliases: ['menu'],

  async execute(params) {
    const { sock, msg, remoteJid } = params;

    const menuText =
      `🤖 *${config.botName}* 🤖\n\n` +
      `Berikut adalah daftar perintah yang tersedia:\n\n` +
      `*Umum:*\n` +
      `• \`${config.prefix}ai <pertanyaan>\` - Bertanya cerdas ke Gemini AI. 🧠\n` +
      `• \`${config.prefix}resetai\` - Menghapus memori riwayat chat AI pada obrolan ini. 🧹\n` +
      `• \`${config.prefix}ping\` - Cek kecepatan respon bot.\n` +
      `• \`${config.prefix}help\` - Menampilkan menu bantuan.\n` +
      `• \`${config.prefix}owner\` - Menampilkan kontak owner bot.\n\n` +
      `*Grup (Hanya di dalam Grup):*\n` +
      `• \`${config.prefix}groupinfo\` - Informasi tentang grup saat ini.\n` +
      `• \`${config.prefix}tagall\` - Tag seluruh anggota grup (Owner/Admin only).\n\n` +
      `*Owner Only:*\n` +
      `• \`${config.prefix}say <teks>\` - Mengulang pesan yang diketik owner.\n` +
      `• \`${config.prefix}broadcast <teks>\` - Mengirim pesan ke semua chat aktif.\n\n` +
      `_Bot berjalan menggunakan model Gemini AI (${process.env.GEMINI_MODEL || 'gemini-flash-latest'})_`;

    await sock.sendMessage(remoteJid, { text: menuText }, { quoted: msg as ValidMessage });
  },
};

export default helpCommand;