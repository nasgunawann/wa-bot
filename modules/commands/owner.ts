import type { Command, ValidMessage } from './types.js';
import type { WASocket, proto } from '@whiskeysockets/baileys';
import config from '../../config.js';

const ownerCommand: Command = {
  name: 'owner',

  async execute(params) {
    const { sock, msg, remoteJid } = params;

    const ownerNum = config.owners[0].split('@')[0];
    await sock.sendMessage(
      remoteJid,
      { text: `Kontak owner: wa.me/${ownerNum}` },
      { quoted: msg as ValidMessage },
    );
  },
};

export default ownerCommand;