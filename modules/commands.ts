import { WASocket, proto } from '@whiskeysockets/baileys';
import config from '../config.js';
import type { Command, CommandParams } from './commands/types.js';
import aiCmd from './commands/ai.js';
import resetaiCmd from './commands/resetai.js';
import pingCmd from './commands/ping.js';
import helpCmd from './commands/help.js';
import ownerCmd from './commands/owner.js';
import groupinfoCmd from './commands/groupinfo.js';
import tagallCmd from './commands/tagall.js';
import sayCmd from './commands/say.js';
import broadcastCmd from './commands/broadcast.js';

const registry = new Map<string, Command>();

function register(cmd: Command) {
  registry.set(cmd.name, cmd);
  cmd.aliases?.forEach(a => registry.set(a, cmd));
}

register(aiCmd);
register(resetaiCmd);
register(pingCmd);
register(helpCmd);
register(ownerCmd);
register(groupinfoCmd);
register(tagallCmd);
register(sayCmd);
register(broadcastCmd);

export async function processCommand(
  sock: WASocket,
  msg: proto.IWebMessageInfo,
  command: string,
  args: string[],
  q: string,
  remoteJid: string,
  senderJid: string,
  isGroup: boolean,
  isMe: boolean,
) {
  const handler = registry.get(command);
  if (!handler) return;

  const isOwner = config.owners.includes(senderJid) || isMe;

  const params: CommandParams = {
    sock, msg, args, q, remoteJid, senderJid, isGroup, isMe, isOwner,
  };

  await handler.execute(params);
}
