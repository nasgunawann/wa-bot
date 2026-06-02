import { initSettingsForm } from './js/config.js';
import { initSholatWidget } from './js/sholat.js';
import { initSchedulerPanel } from './js/scheduler.js';
import { initLogsPanel } from './js/logs.js';

let isConnected = false;

// Initialize all dashboard components on page load
document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initSettingsForm();
    initSholatWidget();
    initSchedulerPanel();
    initLogsPanel();

    // Start status polling
    pollStatus();
    setInterval(pollStatus, 5000);
    initRealtimeClock();
});

/**
 * Initializes and starts the real-time clock updates
 */
function initRealtimeClock() {
    const clockTime = document.getElementById('clockTime');
    if (!clockTime) return;

    function updateClock() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        clockTime.textContent = `${hours}:${minutes}:${seconds}`;
    }

    updateClock();
    setInterval(updateClock, 1000);
}

/**
 * Manages Single Page App tab switcher toggling
 */
function initTabs() {
    const tabButtons = document.querySelectorAll('nav button');
    const panels = document.querySelectorAll('.tab-panel');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.getAttribute('data-target');

            // Toggle active visual states on buttons
            tabButtons.forEach(btn => {
                btn.classList.remove('bg-indigo-600', 'text-white');
                btn.classList.add('text-slate-400');
            });
            button.classList.add('bg-indigo-600', 'text-white');
            button.classList.remove('text-slate-400');

            // Hide/Show correct tab panel card
            panels.forEach(panel => {
                if (panel.id === targetId) {
                    panel.classList.remove('hidden');
                } else {
                    panel.classList.add('hidden');
                }
            });
        });
    });

    // Select the first tab automatically on start
    if (tabButtons.length > 0) {
        tabButtons[0].click();
    }
}

/**
 * Periodically polls the server to retrieve pairing and socket statuses
 */
async function pollStatus() {
    try {
        const res = await fetch('/api/status');
        const data = await res.json();

        const badge = document.getElementById('statusBadge');
        const dot = document.getElementById('statusDot');
        const text = document.getElementById('statusText');
        const authOverlay = document.getElementById('authOverlay');
        const mainPanel = document.getElementById('mainPanel');

        const authSpinner = document.getElementById('authSpinner');
        const qrWrapper = document.getElementById('qrWrapper');
        const qrImageElement = document.getElementById('qrImageElement');
        const authTitle = document.getElementById('authTitle');
        const authSubtitle = document.getElementById('authSubtitle');
        const authList = document.getElementById('authList');

        isConnected = data.connected;

        if (isConnected) {
            // Update Connection Status Badge
            badge.className = "flex items-center gap-2 bg-slate-950/60 border border-emerald-800/40 px-4 py-2 rounded-full text-xs font-semibold select-none text-emerald-400";
            dot.className = "w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.6)] animate-pulse";
            text.innerText = "Connected";

            // Hide auth overlay and enable dashboard control
            authOverlay.classList.add('hidden');
            mainPanel.classList.remove('opacity-25', 'pointer-events-none', 'filter', 'blur-[4px]');
        } else {
            // Update Connection Status Badge
            badge.className = "flex items-center gap-2 bg-slate-950/60 border border-rose-800/40 px-4 py-2 rounded-full text-xs font-semibold select-none text-rose-400";
            dot.className = "w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.6)] animate-pulse";
            text.innerText = "Disconnected";

            // Show QR pairing code overlay and blur dashboard
            authOverlay.classList.remove('hidden');
            mainPanel.classList.add('opacity-25', 'pointer-events-none', 'filter', 'blur-[4px]');

            if (data.qrImage) {
                authSpinner.classList.add('hidden');
                qrWrapper.classList.remove('hidden');
                authTitle.innerText = "Pindai Kode QR Anda";
                authSubtitle.innerText = "Tautkan WhatsApp Anda dengan memindai kode di bawah:";
                authList.classList.remove('hidden');

                if (qrImageElement.src !== data.qrImage) {
                    qrImageElement.src = data.qrImage;
                }
            } else {
                qrWrapper.classList.add('hidden');
                authSpinner.classList.remove('hidden');
                authTitle.innerText = "Menghubungkan Sesi...";
                authSubtitle.innerText = "Menunggu modul Baileys membangkitkan kunci QR. Silakan cek konsol server jika memakan waktu lama.";
                authList.classList.add('hidden');
            }
        }

        // Forward status payload to other widgets if needed
        window.dispatchEvent(new CustomEvent('bot-status-updated', { detail: data }));

    } catch (e) {
        console.error('Failed to communicate with Bot Status API:', e);
    }
}
