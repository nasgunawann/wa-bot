/**
 * Live System Logs viewer and client-side filter module
 */

let cachedLogs = [];

export function initLogsPanel() {
    // Poll logs every 3 seconds for active, real-time logging feel
    fetchLogs();
    setInterval(fetchLogs, 3000);

    // Dynamic search filtering
    const searchInput = document.getElementById('logSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            renderLogsList(cachedLogs, searchInput.value.trim());
        });
    }
}

/**
 * Request system logs from backend API
 */
async function fetchLogs() {
    try {
        const res = await fetch('/api/logs');
        const logs = await res.json();
        
        cachedLogs = logs;
        
        const searchInput = document.getElementById('logSearchInput');
        const query = searchInput ? searchInput.value.trim() : '';
        
        renderLogsList(cachedLogs, query);
    } catch (e) {
        console.error('Failed to poll system logs:', e);
    }
}

/**
 * Render logs onto the page, optionally filtered by keyword query
 */
function renderLogsList(logs, query = '') {
    const wrapper = document.getElementById('logsWrapper');
    if (!wrapper) return;

    if (logs.length === 0) {
        wrapper.innerHTML = `<div class="text-slate-600 italic">Belum ada log aktivitas tercatat.</div>`;
        return;
    }

    // Filter logs if user typed a search query
    let filteredLogs = logs;
    if (query !== '') {
        const lowerQuery = query.toLowerCase();
        filteredLogs = logs.filter(l => 
            l.message.toLowerCase().includes(lowerQuery) || 
            l.type.toLowerCase().includes(lowerQuery) ||
            l.time.toLowerCase().includes(lowerQuery)
        );
    }

    if (filteredLogs.length === 0) {
        wrapper.innerHTML = `<div class="text-slate-600 italic">Tidak ada log cocok dengan kata kunci: "${query}"</div>`;
        return;
    }

    let html = '';
    // Display newest logs first (reverse order)
    filteredLogs.slice().reverse().forEach(log => {
        let typeColor = 'text-slate-400';
        let typePill = 'bg-slate-800/40 text-slate-400 border border-slate-700/50';

        if (log.type === 'success') {
            typeColor = 'text-emerald-400';
            typePill = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
        } else if (log.type === 'warning') {
            typeColor = 'text-amber-400';
            typePill = 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
        } else if (log.type === 'error') {
            typeColor = 'text-rose-400';
            typePill = 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
        }

        html += `
        <div class="flex items-start gap-3 border-b border-slate-900/60 pb-2 mb-2 last:border-0 last:pb-0 last:mb-0">
            <span class="text-slate-600 select-none whitespace-nowrap">${log.time}</span>
            <span class="px-2 py-0.5 rounded text-[8px] font-bold uppercase select-none tracking-wider ${typePill}">${log.type}</span>
            <span class="flex-1 break-all ${typeColor}">${log.message}</span>
        </div>
        `;
    });

    wrapper.innerHTML = html;
}
