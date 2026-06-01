import { WASocket } from '@whiskeysockets/baileys';
import config from '../config.js';

/**
 * Handle group participant updates (Welcome & Goodbye notifications)
 * @param sock Baileys socket instance
 * @param update Raw update event from group-participants.update
 */
export async function processGroupParticipants(
    sock: WASocket,
    update: { id: string; participants: string[]; action: string }
) {
    try {
        const { id, participants, action } = update;
        console.log(`Group participant update in ${id}: Action: ${action}`);
        
        for (const num of participants) {
            if (action === 'add') {
                const welcomeText = `👋 @${num.split('@')[0]} telah bergabung ke grup!\n\n${config.welcomeMessage}`;
                await sock.sendMessage(id, { text: welcomeText, mentions: [num] });
            } else if (action === 'remove') {
                const goodbyeText = `🏃 @${num.split('@')[0]} telah meninggalkan grup.\n\n${config.goodbyeMessage}`;
                await sock.sendMessage(id, { text: goodbyeText, mentions: [num] });
            }
        }
    } catch (error) {
        console.error('❌ Error dalam pemrosesan welcome/goodbye grup:', error);
    }
}
