import cron from 'node-cron';
import { WASocket } from '@whiskeysockets/baileys';
import { askGemini } from './ai.js';
import config from './config.js';

let activeSock: WASocket | null = null;

/**
 * Update the active socket instance used by the scheduler
 * @param newSock The new active WASocket
 */
export function updateSchedulerSocket(newSock: WASocket) {
    activeSock = newSock;
    console.log('🔄 Socket referensi di Scheduler berhasil diperbarui.');
}

/**
 * Initialize automatic message scheduling and cron jobs
 * @param sock Active Baileys socket instance
 */
export function initScheduler(sock: WASocket) {
    // If scheduler has already been initialized, just update the socket reference
    if (activeSock) {
        updateSchedulerSocket(sock);
        return;
    }
    
    activeSock = sock;
    console.log('⏰ Menginisialisasi sistem penjadwalan otomatis (Scheduler)...');

    // ----------------------------------------------------------------------
    // Otomatisasi 1: Pengingat Motivasi Pagi Setiap Hari (Jam 07:00 AM)
    // Pola Cron: '0 7 * * *' (Menit 0, Jam 7, Setiap Hari)
    // ----------------------------------------------------------------------
    cron.schedule('0 7 * * *', async () => {
        try {
            if (!activeSock) return;
            console.log('⏰ Scheduler: Mengirim pesan motivasi pagi otomatis...');
            
            // Tanya Gemini AI untuk membuat pesan motivasi segar
            const motivationPrompt = 'Berikan kutipan motivasi pagi hari yang segar, singkat, penuh energi positif, dan ramah untuk mengawali hari.';
            const aiMessage = await askGemini(motivationPrompt);
            
            const messageText = `🌅 *Antigravity Daily Motivation* 🌅\n\n${aiMessage}\n\n_Pesan otomatis dikirim oleh sistem penjadwalan._`;
            
            // Kirim ke JID pemilik (owner) pertama
            const targetJid = config.owners[0];
            await activeSock.sendMessage(targetJid, { text: messageText });
            console.log(`✅ Pesan motivasi pagi berhasil dikirim ke: ${targetJid}`);
        } catch (error) {
            console.error('❌ Gagal menjalankan scheduler motivasi pagi:', error);
        }
    });

    // ----------------------------------------------------------------------
    // Otomatisasi 2: Laporan Kesehatan Sistem Setiap Jam (Menit ke-0)
    // Pola Cron: '0 * * * *' (Setiap jam pada menit ke-0)
    // Untuk demo/testing: Anda bisa ganti ke '*/30 * * * *' untuk setiap 30 menit
    // ----------------------------------------------------------------------
    cron.schedule('0 * * * *', async () => {
        try {
            if (!activeSock) return;
            console.log('⏰ Scheduler: Menjalankan hourly system health-check...');
            const timeString = new Date().toLocaleTimeString('id-ID');
            
            const healthText = `🤖 *System Health Check* 🤖\n\n` +
                `• *Waktu:* ${timeString}\n` +
                `• *Status:* Online & Responsif ✅\n` +
                `• *Model AI:* ${process.env.GEMINI_MODEL || 'gemini-flash-latest'} 🧠`;

            // Kirim ke owner sebagai notifikasi uptime bot
            const targetJid = config.owners[0];
            await activeSock.sendMessage(targetJid, { text: healthText });
            console.log('✅ Health-check terkirim ke owner.');
        } catch (error) {
            console.error('❌ Gagal menjalankan scheduler health check:', error);
        }
    });

    console.log('✅ Seluruh tugas penjadwalan otomatis aktif di latar belakang!');
}

