import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_PATH = path.join(__dirname, "config.json");

export interface BotConfig {
  prefix: string;
  owners: string[];
  botName: string;
  autoRead: boolean;
  respondToSelf: boolean;
  welcomeMessage: string;
  goodbyeMessage: string;
  autoAiResponse: boolean; // Toggle for AI automatic responses in DMs
  sholatReminderEnabled: boolean; // Toggle for Prayer alerts
  sholatReminderTarget: string; // WhatsApp JID target for prayer alerts
}

const defaultConfig: BotConfig = {
  // Prefix for commands
  prefix: "/",

  // Owner numbers (include @s.whatsapp.net format)
  owners: [
    "6281265945954@s.whatsapp.net", // Replace with your WhatsApp ID / JID
  ],

  // Bot Name
  botName: "Nanasgunung Creative Bot",

  // Auto-read messages
  autoRead: true,

  // Respond to own messages (for testing)
  respondToSelf: false,

  // Welcome message for groups
  welcomeMessage: "Selamat datang di grup! Silakan patuhi peraturan yang ada.",

  // Goodbye message for groups
  goodbyeMessage: "Selamat tinggal! Semoga sukses di tempat baru.",

  // Enable/Disable auto AI response in DMs
  autoAiResponse: true,

  // Enable/Disable Medan Prayer schedule automatic alerts
  sholatReminderEnabled: true,

  // Default target for Medan Prayer schedule alerts (JID nomor WA pribadi atau ID Grup @g.us)
  sholatReminderTarget: "6281265945954@s.whatsapp.net",
};

// Initialize config with defaults
let config: BotConfig = { ...defaultConfig };

// Try to load existing config from config.json
try {
  if (fs.existsSync(CONFIG_PATH)) {
    const fileData = fs.readFileSync(CONFIG_PATH, "utf-8");
    const savedConfig = JSON.parse(fileData);
    // Merge defaults with saved config to handle any missing fields gracefully
    config = { ...defaultConfig, ...savedConfig };
    console.log("📂 Berhasil memuat konfigurasi dari config.json");
  } else {
    // Write default config to create the file
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(defaultConfig, null, 2), "utf-8");
    console.log("📝 Membuat file config.json baru dengan nilai default");
  }
} catch (error) {
  console.error("⚠️ Gagal membaca/menulis config.json, menggunakan default:", error);
}

/**
 * Persist the current configuration object to config.json
 */
export function saveConfig(newConfig: BotConfig) {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(newConfig, null, 2), "utf-8");
    console.log("💾 Konfigurasi berhasil disimpan ke config.json");
    return true;
  } catch (error) {
    console.error("❌ Gagal menyimpan konfigurasi ke config.json:", error);
    return false;
  }
}

export default config;

