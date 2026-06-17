import type { Command, ValidMessage } from './types.js';
import type { WASocket, proto } from '@whiskeysockets/baileys';

const groupinfoCommand: Command = {
  name: 'groupinfo',

  async execute(params) {
    const { sock, msg, args, remoteJid, isGroup } = params;

    if (!isGroup) {
      await sock.sendMessage(
        remoteJid,
        { text: 'Perintah ini hanya bisa digunakan di dalam grup!' },
        { quoted: msg as ValidMessage },
      );
      return;
    }

    const metadata = await sock.groupMetadata(remoteJid);
    const creationDate = metadata.creation
      ? new Date(metadata.creation * 1000).toLocaleString('id-ID')
      : 'Unknown';

    const infoText =
      `👥 *Informasi Grup* 👥\n\n` +
      `• *Nama Grup:* ${metadata.subject}\n` +
      `• *ID Grup:* ${metadata.id}\n` +
      `• *Dibuat Oleh:* wa.me/${metadata.owner?.split('@')[0] || 'Unknown'}\n` +
      `• *Dibuat Pada:* ${creationDate}\n` +
      `• *Jumlah Anggota:* ${metadata.participants.length}\n` +
      `• *Deskripsi:* ${metadata.desc || 'Tidak ada deskripsi'}`;

    await sock.sendMessage(remoteJid, { text: infoText }, { quoted: msg as ValidMessage });
  },
};

export default groupinfoCommand;