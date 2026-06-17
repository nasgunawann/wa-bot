/**
 * Custom Message Scheduler & Instant Sender panel handler
 */

function getLocalISOString(date) {
    const tzOffset = date.getTimezoneOffset() * 60000;
    return (new Date(date.getTime() - tzOffset)).toISOString().slice(0, 16);
}

export function initSchedulerPanel() {
    // Set default datetime and min limit to current local time
    const dtInput = document.getElementById('scheduleDatetime');
    if (dtInput) {
        const now = new Date();
        dtInput.min = getLocalISOString(now);

        const future = new Date(now);
        future.setHours(future.getHours() + 1);
        future.setMinutes(0);
        dtInput.value = getLocalISOString(future);
    }

    // Recipient type select hint helper (Instant message)
    const typeSelect = document.getElementById('sendRecipientType');
    if (typeSelect) {
        typeSelect.addEventListener('change', () => {
            const hint = document.getElementById('sendTargetHint');
            if (typeSelect.value === 'group') {
                hint.innerHTML = "Masukkan ID grup lengkap (contoh: <code>120363234567890@g.us</code>).";
            } else {
                hint.innerHTML = "Masukkan nomor lengkap tanpa + atau spasi (contoh: <code>6281234567890</code>).";
            }
        });
    }

    // Recipient type select hint helper (Scheduler)
    const schedTypeSelect = document.getElementById('scheduleRecipientType');
    if (schedTypeSelect) {
        schedTypeSelect.addEventListener('change', () => {
            const hint = document.getElementById('scheduleTargetHint');
            if (schedTypeSelect.value === 'group') {
                hint.innerHTML = "Masukkan ID grup lengkap (contoh: <code>120363234567890@g.us</code>).";
            } else {
                hint.innerHTML = "Masukkan nomor lengkap tanpa + atau spasi (contoh: <code>6281234567890</code>).";
            }
        });
    }

    // Handlers
    document.getElementById('instantMessageForm').addEventListener('submit', handleInstantSend);
    document.getElementById('schedulerMessageForm').addEventListener('submit', handleSchedulerAdd);

    // Initial load and periodic refresh of schedules queue
    loadSchedulesList();
    setInterval(loadSchedulesList, 10000);
}

/**
 * Handle direct instant messaging AJAX submission
 */
async function handleInstantSend(e) {
    e.preventDefault();

    let jid = document.getElementById('sendTargetJid').value.trim();
    const text = document.getElementById('sendMessageContent').value;
    const type = document.getElementById('sendRecipientType').value;

    if (!jid || !text) return;

    // Sanitize phone number suffix for contacts
    if (type === 'dm' && !jid.includes('@')) {
        jid = jid + '@s.whatsapp.net';
    } else if (type === 'group' && !jid.includes('@')) {
        jid = jid + '@g.us';
    }

    try {
        const res = await fetch('/api/send-message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jid, text })
        });
        const data = await res.json();
        
        if (data.success) {
            window.showToast('Pesan WhatsApp berhasil dikirim secara instan!', 'success');
            document.getElementById('sendMessageContent').value = ''; // clear text
        } else {
            window.showToast('Gagal mengirim pesan: ' + data.error, 'error');
        }
    } catch (err) {
        console.error('Error sending instant message:', err);
        window.showToast('Terjadi kesalahan jaringan saat mengirim.', 'error');
    }
}

/**
 * Handle new dynamic scheduled message registration
 */
async function handleSchedulerAdd(e) {
    e.preventDefault();

    let jid = document.getElementById('scheduleTargetJid').value.trim();
    const datetime = document.getElementById('scheduleDatetime').value;
    const text = document.getElementById('scheduleMessageContent').value;
    const type = document.getElementById('scheduleRecipientType').value;

    if (!jid || !datetime || !text) return;

    // Sanitize phone number suffix for contacts/groups
    if (type === 'dm' && !jid.includes('@')) {
        jid = jid + '@s.whatsapp.net';
    } else if (type === 'group' && !jid.includes('@')) {
        jid = jid + '@g.us';
    }

    try {
        const res = await fetch('/api/schedule-message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jid, text, datetime })
        });
        const data = await res.json();

        if (data.success) {
            window.showToast('Pesan berhasil dijadwalkan secara otomatis!', 'success');
            document.getElementById('scheduleMessageContent').value = ''; // clear text
            loadSchedulesList(); // reload queue
        } else {
            window.showToast('Gagal menjadwalkan: ' + data.error, 'error');
        }
    } catch (err) {
        console.error('Error scheduling message:', err);
        window.showToast('Terjadi kesalahan saat menghubungi API scheduler.', 'error');
    }
}

/**
 * Fetch and render the active queue of scheduled messages
 */
async function loadSchedulesList() {
    try {
        const res = await fetch('/api/schedules');
        const list = await res.json();
        
        const wrapper = document.getElementById('schedulesWrapper');
        if (!wrapper) return;

        if (list.length === 0) {
            wrapper.innerHTML = `<div class="text-center text-xs text-slate-600 py-12">Belum ada antrean pesan terjadwal.</div>`;
            return;
        }

        let html = '';
        list.slice().reverse().forEach(item => {
            const cleanJid = item.jid.split('@')[0];
            const isGroup = item.jid.endsWith('@g.us');
            
            let badgeClass = 'bg-slate-950 text-slate-400 border border-slate-800';
            if (item.status === 'sent') badgeClass = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
            else if (item.status === 'failed') badgeClass = 'bg-rose-500/10 text-rose-400 border border-rose-500/20';

            html += `
            <div class="bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl space-y-2 text-xs">
                <div class="flex justify-between items-center gap-2">
                    <span class="font-bold text-slate-300 truncate max-w-[150px]">${isGroup ? '👥 Grup: ' : '👤 '}${cleanJid}</span>
                    <span class="px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase ${badgeClass}">${item.status}</span>
                </div>
                <p class="text-slate-400 break-words font-sans">${item.text}</p>
                <div class="text-[10px] text-slate-500 flex justify-between">
                    <span>⏰ Kirim: ${item.time}</span>
                </div>
            </div>
            `;
        });

        wrapper.innerHTML = html;
    } catch (error) {
        console.error('Failed to load schedules list:', error);
    }
}
