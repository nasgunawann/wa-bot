import type { Command, ValidMessage } from './types.js';
import type { WASocket, proto } from '@whiskeysockets/baileys';
import { askGemini } from '../../ai.js';

const aiCommand: Command = {
  name: 'ai',

  async execute(params) {
    const { sock, msg, args, remoteJid } = params;

    if (!args[0]) {
      await sock.sendMessage(
        remoteJid,
        {
          text: 'Silakan ketik pertanyaan Anda! Contoh: `/ai kenapa awan berwarna putih?`',
        },
        { quoted: msg as ValidMessage },
      );
      return;
    }

    await sock.sendPresenceUpdate('composing', remoteJid);
    const aiReply = await askGemini(args.join(' '), remoteJid);
    await sock.sendMessage(remoteJid, { text: aiReply }, { quoted: msg as ValidMessage });
  },
};

export default aiCommand;