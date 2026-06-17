import type { Command, ValidMessage } from './types.js';
import type { WASocket, proto } from '@whiskeysockets/baileys';
import config from '../../config.js';

const tagallCommand: Command = {
  name: 'tagall',

  async execute(params) {
    const { sock, msg, args, remoteJid, senderJid, isGroup, isOwner } = params;

    if (!isGroup) {
      await sock.sendMessage(
        remoteJid,
        { text: 'Perintah ini hanya bisa digunakan di dalam grup!' },
        { quoted: msg as ValidMessage },
      );
      return;
    }

    const q = args.join(' ');
    const metadata = await sock.groupMetadata(remoteJid);

    const isSenderAdmin =
      metadata.participants.find((p) => p.id === senderJid)?.admin !== null;

    if (!isSenderAdmin && !isOwner) {
      await sock.sendMessage(
        remoteJid,
        {
          text: 'Perintah ini hanya bisa digunakan oleh Admin grup atau Owner bot!',
        },
        { quoted: msg as ValidMessage },
      );
      return;
    }

    let tagText = `📣 *TAG ALL MEMBERS* 📣\n`;
    if (q) tagText += `*Pesan:* ${q}\n\n`;
    else tagText += `\n`;

    const mentions: string[] = [];
    for (const participant of metadata.participants) {
      tagText += `👥 @${participant.id.split('@')[0]}\n`;
      mentions.push(participant.id);
    }

    await sock.sendMessage(
      remoteJid,
      { text: tagText, mentions },
      { quoted: msg as ValidMessage },
    );
  },
};

export default tagallCommand;