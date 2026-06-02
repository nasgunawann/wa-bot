/**
 * Medan Prayer Schedule Widget module
 */

export function initSholatWidget() {
    // Listen to status updates from the main orchestrator
    window.addEventListener('bot-status-updated', (event) => {
        const data = event.detail;
        renderSholatWidget(data);
    });
}

/**
 * Render Mosque prayer timings card layout and handle active highlighting
 */
function renderSholatWidget(data) {
    const sholatWidget = document.getElementById('sholatWidget');
    if (!data.sholat || !data.sholat.schedule) {
        sholatWidget.style.display = 'none';
        return;
    }

    sholatWidget.style.display = 'block';
    document.getElementById('sholatWidgetDate').innerText = data.sholat.date || 'Hari ini';

    const s = data.sholat.schedule;
    
    // Fill text contents
    document.getElementById('sholatSubuh').innerText = s.subuh;
    document.getElementById('sholatDzuhur').innerText = s.dzuhur;
    document.getElementById('sholatAshar').innerText = s.ashar;
    document.getElementById('sholatMaghrib').innerText = s.maghrib;
    document.getElementById('sholatIsya').innerText = s.isya;

    // Highlight the upcoming prayer dynamically
    highlightNextPrayer(s);
}

/**
 * Calculates and highlights the upcoming prayer timing cards
 */
function highlightNextPrayer(schedule) {
    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentAbsoluteMinutes = currentHours * 60 + currentMinutes;

    const prayerIds = ['Subuh', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya'];
    const prayerTimes = [
        schedule.subuh,
        schedule.dzuhur,
        schedule.ashar,
        schedule.maghrib,
        schedule.isya
    ];

    let nextPrayerIndex = -1;

    // Convert prayer times into absolute minutes and find the first one in the future
    for (let i = 0; i < prayerTimes.length; i++) {
        if (!prayerTimes[i]) continue;
        const [h, m] = prayerTimes[i].split(':').map(Number);
        const prayerAbsoluteMinutes = h * 60 + m;

        if (prayerAbsoluteMinutes > currentAbsoluteMinutes) {
            nextPrayerIndex = i;
            break;
        }
    }

    // If all prayers today have passed, the next one is Subuh tomorrow
    if (nextPrayerIndex === -1) {
        nextPrayerIndex = 0;
    }

    // Apply high-contrast indigo highlight to the upcoming prayer card, reset others
    prayerIds.forEach((id, index) => {
        const card = document.getElementById(`card${id}`);
        if (!card) return;

        if (index === nextPrayerIndex) {
            card.className = "bg-indigo-600/20 border border-indigo-500 p-2 rounded-xl scale-105 transition-all duration-300 shadow-[0_0_12px_rgba(99,102,241,0.2)]";
            card.querySelector('span').className = "block text-[10px] text-indigo-400 font-semibold mb-1";
            card.querySelector('strong').className = "text-slate-100 font-bold";
        } else {
            card.className = "bg-slate-950/60 border border-slate-800/60 p-2 rounded-xl transition-all duration-300";
            card.querySelector('span').className = "block text-[10px] text-slate-500 font-semibold mb-1";
            card.querySelector('strong').className = "text-slate-200";
        }
    });
}
