/**
 * Bot Configuration Form handler module
 */

let originalConfig = null;

export function initSettingsForm() {
    loadFullConfig().then(() => {
        // Register change/input listeners to all inputs to dynamically enable/disable save button
        const inputs = [
            'cfgBotName', 'cfgPrefix', 'cfgOwners', 'cfgAutoRead', 
            'cfgRespondSelf', 'cfgAutoAi', 'cfgSholat', 'cfgSholatTarget', 
            'cfgWelcome', 'cfgGoodbye'
        ];

        inputs.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            const eventType = el.type === 'checkbox' ? 'change' : 'input';
            el.addEventListener(eventType, checkChanges);
        });
    });

    const saveBtn = document.getElementById('btnSaveConfig');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveFullConfig);
    }
}

/**
 * Request active settings payload from Express API
 */
async function loadFullConfig() {
    try {
        const res = await fetch('/api/config');
        const data = await res.json();
        
        // Cache the original configuration
        originalConfig = data;

        document.getElementById('cfgBotName').value = data.botName || '';
        document.getElementById('cfgPrefix').value = data.prefix || '/';
        
        // Clean owner JIDs from suffix for user readability
        const cleanOwners = data.owners ? data.owners.map(o => o.split('@')[0]).join(', ') : '';
        document.getElementById('cfgOwners').value = cleanOwners;
        
        // Toggles mapping
        document.getElementById('cfgAutoRead').checked = !!data.autoRead;
        document.getElementById('cfgRespondSelf').checked = !!data.respondToSelf;
        document.getElementById('cfgAutoAi').checked = !!data.autoAiResponse;
        document.getElementById('cfgSholat').checked = !!data.sholatReminderEnabled;
        
        // Dynamic sholat target JID formatting
        const target = data.sholatReminderTarget || '';
        const cleanSholatTarget = target.endsWith('@s.whatsapp.net') ? target.split('@')[0] : target;
        document.getElementById('cfgSholatTarget').value = cleanSholatTarget;
        
        document.getElementById('cfgWelcome').value = data.welcomeMessage || '';
        document.getElementById('cfgGoodbye').value = data.goodbyeMessage || '';

        // Dynamically update the background task status widget
        const sholatEnabled = !!data.sholatReminderEnabled;
        const sholatDot = document.getElementById('statusDotSholat');
        const sholatText = document.getElementById('statusTextSholat');
        if (sholatDot && sholatText) {
            if (sholatEnabled) {
                sholatDot.className = "w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]";
                sholatText.innerText = "Aktif";
                sholatText.className = "not-italic font-semibold text-emerald-400";
            } else {
                sholatDot.className = "w-1.5 h-1.5 rounded-full bg-slate-600";
                sholatText.innerText = "Nonaktif";
                sholatText.className = "not-italic font-semibold text-slate-500";
            }
        }

        // Initialize Save Button as disabled/gray on load
        updateSaveButtonState(false);

    } catch (error) {
        console.error('Gagal memuat konfigurasi dari API:', error);
    }
}

/**
 * Checks if the current input state differs from the loaded originalConfig
 */
function checkChanges() {
    if (!originalConfig) return;

    const botName = document.getElementById('cfgBotName').value;
    const prefix = document.getElementById('cfgPrefix').value;
    const ownersInput = document.getElementById('cfgOwners').value;
    const autoRead = document.getElementById('cfgAutoRead').checked;
    const respondToSelf = document.getElementById('cfgRespondSelf').checked;
    const autoAiResponse = document.getElementById('cfgAutoAi').checked;
    const sholatReminderEnabled = document.getElementById('cfgSholat').checked;
    const sholatReminderTarget = document.getElementById('cfgSholatTarget').value;
    const welcomeMessage = document.getElementById('cfgWelcome').value;
    const goodbyeMessage = document.getElementById('cfgGoodbye').value;

    // Process original owner JIDs for identical comparison
    const ownersOriginal = originalConfig.owners ? originalConfig.owners.map(o => o.split('@')[0]).join(', ') : '';
    
    // Process original sholat target JID for identical comparison
    const targetOriginal = originalConfig.sholatReminderTarget || '';
    const sholatTargetOriginal = targetOriginal.endsWith('@s.whatsapp.net') ? targetOriginal.split('@')[0] : targetOriginal;

    const cleanOwnersInput = ownersInput.split(',').map(s => s.trim()).filter(Boolean).join(',');
    const cleanOwnersOriginal = ownersOriginal.split(',').map(s => s.trim()).filter(Boolean).join(',');

    const hasChanged = 
        botName !== (originalConfig.botName || '') ||
        prefix !== (originalConfig.prefix || '/') ||
        cleanOwnersInput !== cleanOwnersOriginal ||
        autoRead !== !!originalConfig.autoRead ||
        respondToSelf !== !!originalConfig.respondToSelf ||
        autoAiResponse !== !!originalConfig.autoAiResponse ||
        sholatReminderEnabled !== !!originalConfig.sholatReminderEnabled ||
        sholatReminderTarget.trim() !== sholatTargetOriginal.trim() ||
        welcomeMessage !== (originalConfig.welcomeMessage || '') ||
        goodbyeMessage !== (originalConfig.goodbyeMessage || '');

    updateSaveButtonState(hasChanged);
}

/**
 * Toggle Save Button disabled and style attributes based on change status
 */
function updateSaveButtonState(hasChanged) {
    const btn = document.getElementById('btnSaveConfig');
    if (!btn) return;

    if (hasChanged) {
        btn.disabled = false;
        btn.className = "w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm py-3 rounded-xl shadow-[0_4px_16px_rgba(16,185,129,0.25)] flex items-center justify-center gap-2 cursor-pointer transition duration-300";
    } else {
        btn.disabled = true;
        btn.className = "w-full bg-slate-800 text-slate-500 border border-slate-700/50 font-bold text-sm py-3 rounded-xl flex items-center justify-center gap-2 cursor-not-allowed select-none opacity-50 transition duration-300";
    }
}

/**
 * Save configurations back to the server
 */
async function saveFullConfig(event) {
    if (event) event.preventDefault();

    const botName = document.getElementById('cfgBotName').value;
    const prefix = document.getElementById('cfgPrefix').value;
    const owners = document.getElementById('cfgOwners').value;
    const autoRead = document.getElementById('cfgAutoRead').checked;
    const respondToSelf = document.getElementById('cfgRespondSelf').checked;
    const autoAiResponse = document.getElementById('cfgAutoAi').checked;
    const sholatReminderEnabled = document.getElementById('cfgSholat').checked;
    const sholatReminderTarget = document.getElementById('cfgSholatTarget').value;
    const welcomeMessage = document.getElementById('cfgWelcome').value;
    const goodbyeMessage = document.getElementById('cfgGoodbye').value;

    try {
        const res = await fetch('/api/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                botName, 
                prefix, 
                owners, 
                autoRead, 
                respondToSelf, 
                autoAiResponse, 
                sholatReminderEnabled, 
                sholatReminderTarget,
                welcomeMessage,
                goodbyeMessage
            })
        });

        const result = await res.json();
        if (result.success) {
            window.showToast('Semua pengaturan berhasil diperbarui!', 'success');
            loadFullConfig(); // reload to cache the new settings and disable the button again
        } else {
            window.showToast('Gagal menyimpan pengaturan: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('Gagal memperbarui konfigurasi:', error);
        window.showToast('Terjadi kesalahan: ' + error.message, 'error');
    }
}
