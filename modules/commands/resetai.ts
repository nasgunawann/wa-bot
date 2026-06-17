import type { Command, ValidMessage } from './types.js';
import type { WASocket, proto } from '@whiskeysockets/baileys';
import { clearChatHistory } from '../../ai.js';

const resetaiCommand: Command = {
  name: 'resetai',

  async execute(params) {
    const { sock, msg, remoteJid } = params;

    const cleared = clearChatHistory(remoteJid);
    const message = cleared
      ? '🧹 Memori percakapan AI untuk obrolan ini telah berhasil dihapus!'
      : '💡 Obrolan ini belum memiliki riwayat memori percakapan aktif.';

    await sock.sendMessage(remoteJid, { text: message }, { quoted: msg as ValidMessage });
  },
};

export default resetaiCommand;