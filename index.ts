import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  WASocket,
} from "@whiskeysockets/baileys";
import pino from "pino";
import { Boom } from "@hapi/boom";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import QRCode from "qrcode";
import config, { saveConfig } from "./config.js";
import { handleMessage, handleGroupParticipants } from "./handler.js";
import { initScheduler } from "./scheduler.js";
import { initSholatReminder, getTodaySchedule } from "./modules/sholat.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Express setup
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

let sockInstance: WASocket | null = null;
let isConnected = false;
let currentQr: string | null = null;
let currentQrImage: string | null = null;

// Memory store for user-defined scheduled messages
interface ScheduledMessage {
  id: string;
  jid: string;
  text: string;
  time: string; // Readable datetime string
  status: "pending" | "sent" | "failed";
}
let scheduledMessages: ScheduledMessage[] = [];

// API routes for Web UI status
app.get("/api/status", (req, res) => {
  const sholatInfo = getTodaySchedule();
  res.json({
    connected: isConnected,
    qr: currentQr,
    qrImage: currentQrImage,
    sholat: sholatInfo,
  });
});

// API routes to get and edit entire configurations dynamically
app.get("/api/config", (req, res) => {
  res.json(config);
});

app.post("/api/config", (req, res) => {
  const {
    prefix,
    owners,
    botName,
    autoRead,
    respondToSelf,
    welcomeMessage,
    goodbyeMessage,
    autoAiResponse,
    sholatReminderEnabled,
    sholatReminderTarget,
  } = req.body;

  // Parse Prefix
  if (typeof prefix === "string" && prefix.trim() !== "") {
    config.prefix = prefix.trim();
  }

  // Parse Owners (comma separated list string gets parsed as string[])
  if (typeof owners === "string") {
    config.owners = owners
      .split(",")
      .map((s) => {
        let num = s.trim();
        if (num && !num.includes("@")) {
          num = num + "@s.whatsapp.net";
        }
        return num;
      })
      .filter(Boolean);
  } else if (Array.isArray(owners)) {
    config.owners = owners
      .map((s) => {
        let num = String(s).trim();
        if (num && !num.includes("@")) {
          num = num + "@s.whatsapp.net";
        }
        return num;
      })
      .filter(Boolean);
  }

  // Parse Bot Name
  if (typeof botName === "string" && botName.trim() !== "") {
    config.botName = botName.trim();
  }

  // Parse Welcome/Goodbye messages
  if (typeof welcomeMessage === "string") {
    config.welcomeMessage = welcomeMessage;
  }
  if (typeof goodbyeMessage === "string") {
    config.goodbyeMessage = goodbyeMessage;
  }

  // Parse Booleans
  if (typeof autoRead === "boolean") {
    config.autoRead = autoRead;
  }
  if (typeof respondToSelf === "boolean") {
    config.respondToSelf = respondToSelf;
  }
  if (typeof autoAiResponse === "boolean") {
    config.autoAiResponse = autoAiResponse;
  }
  if (typeof sholatReminderEnabled === "boolean") {
    config.sholatReminderEnabled = sholatReminderEnabled;
  }

  // Parse Sholat target JID
  if (
    typeof sholatReminderTarget === "string" &&
    sholatReminderTarget.trim() !== ""
  ) {
    let target = sholatReminderTarget.trim();
    if (target && !target.includes("@")) {
      target = target + "@s.whatsapp.net";
    }
    config.sholatReminderTarget = target;
  }

  console.log(
    "⚙️ Konfigurasi penuh diperbarui via Web UI:",
    JSON.stringify(config),
  );

  // Persist updated config to config.json file
  saveConfig(config);

  res.json({ success: true, config });
});

// API route to get all user-scheduled messages
app.get("/api/schedules", (req, res) => {
  res.json(scheduledMessages);
});

// API route to send instant messages
app.post("/api/send-message", async (req, res: any) => {
  const { jid, text } = req.body;
  if (!sockInstance || !isConnected) {
    return res
      .status(500)
      .json({ success: false, error: "Bot is not connected to WhatsApp yet." });
  }
  if (!jid || !text) {
    return res
      .status(400)
      .json({
        success: false,
        error: "Destination (JID) and message text are required.",
      });
  }
  try {
    await sockInstance.sendMessage(jid, { text });
    res.json({ success: true });
  } catch (e: any) {
    res
      .status(500)
      .json({ success: false, error: e.message || "Failed to send message." });
  }
});

// API route to schedule a message at a future date/time
app.post("/api/schedule-message", (req, res: any) => {
  const { jid, text, datetime } = req.body;
  if (!sockInstance || !isConnected) {
    return res
      .status(500)
      .json({ success: false, error: "Bot is not connected to WhatsApp yet." });
  }
  if (!jid || !text || !datetime) {
    return res
      .status(400)
      .json({
        success: false,
        error: "Destination, message text, and target date/time are required.",
      });
  }

  const targetTime = new Date(datetime).getTime();
  const now = Date.now();
  const delay = targetTime - now;

  if (delay <= 0) {
    return res
      .status(400)
      .json({ success: false, error: "Target time must be in the future!" });
  }

  const id = Math.random().toString(36).substring(2, 9);
  const timeString = new Date(datetime).toLocaleString("id-ID");

  const newSchedule: ScheduledMessage = {
    id,
    jid,
    text,
    time: timeString,
    status: "pending",
  };

  scheduledMessages.push(newSchedule);

  // Setup one-shot timer for the scheduled task
  setTimeout(async () => {
    const currentTask = scheduledMessages.find((s) => s.id === id);
    if (!currentTask || !sockInstance || !isConnected) {
      if (currentTask) currentTask.status = "failed";
      return;
    }
    try {
      console.log(
        `⏰ Scheduler Web: Mengirim pesan terjadwal otomatis (ID: ${id}) ke: ${jid}`,
      );
      await sockInstance.sendMessage(jid, { text });
      currentTask.status = "sent";
    } catch (e) {
      console.error(`❌ Gagal mengirim pesan terjadwal (ID: ${id}):`, e);
      currentTask.status = "failed";
    }
  }, delay);

  res.json({ success: true, schedule: newSchedule });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🌐 Web UI Dashboard is running at http://localhost:${PORT}`);
});

async function startBot() {
  console.log("🤖 Menginisialisasi Nanasgunung WhatsApp Bot...");

  // 1. Fetch the latest WhatsApp Web version to avoid handshake issues
  const { version, isLatest } = await fetchLatestBaileysVersion();
  console.log(
    `ℹ️ Menggunakan versi WA Web: v${version.join(".")}, isLatest: ${isLatest}`,
  );

  // 2. Setup multi file auth state for persistent sessions
  const { state, saveCreds } = await useMultiFileAuthState("auth_session");

  // 3. Create socket connection
  const sock: WASocket = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false, // Disable default completely
    logger: pino({ level: "silent" }), // Suppress pino debug logs
    browser: ["Antigravity Bot", "Chrome", "1.0.0"],
  });

  sockInstance = sock;

  // 4. Handle connection updates
  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      currentQr = qr;
      // Generate server-side Base64 QR Image asynchronously
      QRCode.toDataURL(qr, { scale: 8 })
        .then((url) => {
          currentQrImage = url;
        })
        .catch((err) => {
          console.error("❌ Gagal menghasilkan gambar QR di server:", err);
        });
      console.log(
        "📢 Kode QR baru dihasilkan! Kunjungi http://localhost:3000 untuk melakukan pemindaian.",
      );
    }

    if (connection === "close") {
      isConnected = false;
      const errorReason =
        lastDisconnect?.error instanceof Boom
          ? lastDisconnect.error
          : new Boom(lastDisconnect?.error);

      const statusCode = errorReason?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      console.log(
        `⚠️ Koneksi terputus. Alasan: ${errorReason?.message || "Unknown"} (Status Code: ${statusCode}). Reconnecting: ${shouldReconnect}`,
      );

      if (shouldReconnect) {
        console.log("🔄 Mencoba menghubungkan kembali...");
        startBot();
      } else {
        currentQr = null;
        currentQrImage = null; // Clear QR Image if explicitly logged out
        console.log(
          '❌ Sesi telah berakhir atau Anda telah keluar. Silakan hapus folder "auth_session" dan mulai ulang bot.',
        );
      }
    } else if (connection === "open") {
      isConnected = true;
      currentQr = null;
      currentQrImage = null; // Clear QR Image as we are connected
      console.log("\n=============================================");
      console.log("🎉 BOT TELAH BERHASIL TERHUBUNG KE WHATSAPP!");
      if (sock.user) {
        console.log(
          `👉 Pengguna: ${sock.user.name || "Bot"} (${sock.user.id.split(":")[0]})`,
        );
      }
      console.log("=============================================\n");

      // Inisialisasi tugas penjadwalan otomatis
      initScheduler(sock);

      // Inisialisasi pengingat sholat otomatis Medan
      initSholatReminder(sock);
    }
  });

  // 5. Handle credential updates to persist session
  sock.ev.on("creds.update", saveCreds);

  // 6. Handle incoming messages (DMs and Groups)
  sock.ev.on("messages.upsert", async (m) => {
    await handleMessage(sock, m);
  });

  // 7. Handle group participants update (Welcome / Goodbye)
  sock.ev.on("group-participants.update", async (update) => {
    await handleGroupParticipants(sock, update);
  });
}

// Start the bot and handle unhandled rejections
startBot().catch((err) => {
  console.error("Fatal error starting bot:", err);
});
