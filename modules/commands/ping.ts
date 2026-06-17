import type { Command, ValidMessage } from './types.js';
import type { WASocket, proto } from '@whiskeysockets/baileys';

const pingCommand: Command = {
  name: 'ping',

  async execute(params) {
    const { sock, msg, remoteJid } = params;

    const start = Date.now();
    await sock.sendMessage(remoteJid, { text: 'Calculating ping...' }, { quoted: msg as ValidMessage });
    const end = Date.now();

    await sock.sendMessage(
      remoteJid,
      { text: `Pong! 🏓 Speed: *${end - start}ms*` },
      { quoted: msg as ValidMessage },
    );
  },
};

export default pingCommand;