import type { Command, ValidMessage } from './types.js';
import type { WASocket, proto } from '@whiskeysockets/baileys';
import config from '../../config.js';

const sayCommand: Command = {
  name: 'say',

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
        { text: `Gunakan format: \`${config.prefix}say <teks>\`` },
        { quoted: msg as ValidMessage },
      );
      return;
    }

    await sock.sendMessage(remoteJid, { text: q });
  },
};

export default sayCommand;