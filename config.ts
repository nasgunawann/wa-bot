export interface BotConfig {
    prefix: string;
    owners: string[];
    botName: string;
    autoRead: boolean;
    respondToSelf: boolean;
    welcomeMessage: string;
    goodbyeMessage: string;
}

const config: BotConfig = {
    // Prefix for commands
    prefix: '/',
    
    // Owner numbers (include @s.whatsapp.net format)
    owners: [
        '6281234567890@s.whatsapp.net' // Replace with your WhatsApp ID / JID
    ],
    
    // Bot Name
    botName: 'Antigravity Bot',
    
    // Auto-read messages
    autoRead: true,
    
    // Respond to own messages (for testing)
    respondToSelf: false,
    
    // Welcome message for groups
    welcomeMessage: 'Selamat datang di grup! Silakan patuhi peraturan yang ada.',
    
    // Goodbye message for groups
    goodbyeMessage: 'Selamat tinggal! Semoga sukses di tempat baru.'
};

export default config;
