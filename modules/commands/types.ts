import { WASocket, proto } from '@whiskeysockets/baileys';

export type ValidMessage = proto.IWebMessageInfo & {
  key: proto.IMessageKey;
};

export interface CommandParams {
  sock: WASocket;
  msg: proto.IWebMessageInfo;
  args: string[];
  q: string;
  remoteJid: string;
  senderJid: string;
  isGroup: boolean;
  isMe: boolean;
  isOwner: boolean;
}

export interface Command {
  name: string;
  aliases?: string[];
  execute(params: CommandParams): Promise<void>;
}