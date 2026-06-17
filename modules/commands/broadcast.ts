import type { Command, ValidMessage } from './types.js';
import type { WASocket, proto } from '@whiskeysockets/baileys';
import config from '../../config.js';

const broadcastCommand: Command = {
  name: 'broadcast',
  aliases: ['bc'],

  async execute(params) {
    const { sock, msg, args, remoteJid, isOwner } = params;
    const q = args.join(' ');

    if (!isOwner) {
      await sock.sendMessage(
        remoteJid,
        { text: 'Perintah ini hanya untuk Owner bot!' },
        { quoted: msg as ValidMessage },
      );
      return;
    }

    if (!q) {
      await sock.sendMessage(
        remoteJid,
        { text: `Gunakan format: \`${config.prefix}broadcast <teks>\`` },
        { quoted: msg as ValidMessage },
      );
      return;
    }

    await sock.sendMessage(
      remoteJid,
      { text: 'Memulai broadcast...' },
      { quoted: msg as ValidMessage },
    );

    await sock.sendMessage(remoteJid, {
      text: `📢 *BROADCAST OWNER* 📢\n\n${q}`,
    });
  },
};

export default broadcastCommand;