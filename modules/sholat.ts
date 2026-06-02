import { WASocket } from '@whiskeysockets/baileys';
import { askGemini } from '../ai.js';
import config from '../config.js';
import { addLog } from '../index.js';

export interface PrayerSchedule {
    subuh: string;
    dzuhur: string;
    ashar: string;
    maghrib: string;
    isya: string;
    [key: string]: string;
}

let todaySchedule: PrayerSchedule | null = null;
let lastFetchedDate: string = '';
let sentPrayersToday: { [key: string]: boolean } = {};

/**
 * Get current cached prayer schedule
 */
export function getTodaySchedule(): { schedule: PrayerSchedule | null; date: string } {
    return {
        schedule: todaySchedule,
        date: lastFetchedDate
    };
}

/**
 * Fetch Medan prayer schedule for the current date
 */
async function fetchMedanSchedule(): Promise<PrayerSchedule | null> {
    try {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;

        // Avoid repeated fetches if already loaded today
        if (todaySchedule && lastFetchedDate === dateStr) {
            return todaySchedule;
        }

        addLog('info', 'Memulai pencarian ID Kota Medan di API Jadwal Sholat...');
        const searchRes = await fetch('https://api.myquran.com/v2/sholat/kota/cari/medan');
        const searchData = await searchRes.json();

        let cityId = '0228'; // Fallback default ID for KOTA MEDAN

        if (searchData.status && searchData.data && searchData.data.length > 0) {
            // Find KOTA MEDAN specifically (avoid KAB. SUMEDANG)
            const medan = searchData.data.find((item: any) => item.lokasi.includes('KOTA MEDAN'));
            if (medan) {
                cityId = medan.id;
            }
        }

        addLog('info', `Mengunduh jadwal sholat Medan (ID: ${cityId}) untuk tanggal: ${dateStr}`);
        const scheduleRes = await fetch(`https://api.myquran.com/v2/sholat/jadwal/${cityId}/${year}/${month}/${day}`);
        const scheduleData = await scheduleRes.json();

        if (scheduleData.status && scheduleData.data && scheduleData.data.jadwal) {
            const j = scheduleData.data.jadwal;
            todaySchedule = {
                subuh: j.subuh,
                dzuhur: j.dzuhur,
                ashar: j.ashar,
                maghrib: j.maghrib,
                isya: j.isya
            };
            lastFetchedDate = dateStr;
            sentPrayersToday = {}; // Reset sent triggers for the new day
            addLog('info', `Jadwal Sholat Medan Terkini berhasil dimuat.`);
            return todaySchedule;
        }
    } catch (error: any) {
        addLog('error', `Gagal memuat jadwal sholat Medan: ${error.message || error}`);
    }
    return null;
}

let activeSock: WASocket | null = null;

/**
 * Update the active socket instance used by the prayer reminder
 * @param newSock The new active WASocket
 */
export function updateSholatSocket(newSock: WASocket) {
    activeSock = newSock;
    addLog('info', 'Socket referensi di Sholat Reminder berhasil diperbarui.');
}

/**
 * Initialize the Prayer Times automatic reminder daemon
 * @param sock Active Baileys socket instance
 */
export function initSholatReminder(sock: WASocket) {
    // If sholat reminder has already been initialized, just update the socket reference
    if (activeSock) {
        updateSholatSocket(sock);
        return;
    }

    activeSock = sock;
    addLog('info', 'Menginisialisasi modul pengingat jadwal sholat otomatis Kota Medan...');

    // Load initial schedule
    fetchMedanSchedule();

    // Check timings every 30 seconds
    setInterval(async () => {
        try {
            // Skip execution if disabled in config
            if (!config.sholatReminderEnabled) return;

            // Skip if the socket is not fully connected/open yet to prevent "Connection Closed" crash on startup
            if (!activeSock || !activeSock.ws || (activeSock.ws as any).readyState !== 1) {
                return;
            }

            // Ensure schedule is fresh for today
            const schedule = await fetchMedanSchedule();
            if (!schedule) return;

            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const currentTimeStr = `${hours}:${minutes}`;

            // Read target dynamically from config
            const targetJid = config.sholatReminderTarget || config.owners[0];

            // Define the 5 obligatory prayers to track
            const obligatoryPrayers = ['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya'];

            for (const prayerName of obligatoryPrayers) {
                const prayerTime = schedule[prayerName];
                
                // If current time matches scheduled time, and it has not been notified today
                if (prayerTime === currentTimeStr && !sentPrayersToday[prayerName]) {
                    sentPrayersToday[prayerName] = true; // Mark as sent immediately to avoid loops
                    
                    addLog('info', `Alarm Sholat: Waktunya sholat ${prayerName.toUpperCase()} (${prayerTime})!`);

                    // Request a peaceful spiritual reminder text from Gemini AI
                    const aiPrompt = `Tuliskan satu kalimat ucapan pengingat ibadah sholat yang damai, sejuk, dan memotivasi untuk waktu sholat ${prayerName.toUpperCase()} bagi umat muslim.`;
                    const aiMessage = await askGemini(aiPrompt);

                    const alertText = `🕌 *PENGINGAT JADWAL SHOLAT* 🕌\n\n` +
                        `📢 *Waktunya Sholat ${prayerName.toUpperCase()}* telah tiba untuk wilayah *Kota Medan* dan sekitarnya (${prayerTime} WIB).\n\n` +
                        `💬 _${aiMessage}_\n\n` +
                        `*“Sesungguhnya shalat itu adalah fardhu yang ditentukan waktunya atas orang-orang yang beriman.” (An-Nisa: 103)*`;

                    await activeSock.sendMessage(targetJid, { text: alertText });
                    addLog('success', `Pesan alarm sholat ${prayerName} berhasil dikirim ke: ${targetJid}`);
                }
            }
        } catch (error: any) {
            addLog('error', `Gagal memproses alarm scheduler sholat: ${error.message || error}`);
        }
    }, 30000); // 30 seconds interval
}
