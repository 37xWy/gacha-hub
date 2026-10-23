// ==========================================
    // 1. GAME CONSTANTS & CONFIGURATION
    // ==========================================
    const HSR_CONFIG = {
        CHAR_HARD: 90,
        CHAR_SOFT: 74,
        LC_HARD: 80,
        LC_SOFT: 66,
        DEP_HARD: 50,
        // The Permanent Original 7 Standard Characters (always off-rate on limited event banners)
        PERM_7_CHARS: ["Himeko", "Welt", "Bronya", "Gepard", "Clara", "Yanqing", "Bailu"],
        // Expanded 50/50 Loss Pool: Retired limited characters and their retirement effective dates
        // If pulled ON or AFTER this datetime, they are considered a 50/50 off-banner loss.
        // If pulled BEFORE this datetime (during their original/rerun rate-ups), they are recorded as a WIN.
        EXPANDED_LOSS_CHARS: {
            "Seele": "2025-04-09 06:00:00",       // Added in v3.2
            "Blade": "2025-04-09 06:00:00",       // Added in v3.2
            "Fu Xuan": "2025-04-09 06:00:00",     // Added in v3.2
            "Silver Wolf": "2026-04-22 06:00:00", // Added in v4.2
            "Argenti": "2026-04-22 06:00:00",     // Added in v4.2
            "Yunli": "2026-04-22 06:00:00"        // Added in v4.2
        },
        STD_LCS: ["Night on the Milky Way", "In the Name of the World", "But the Battle Isn't Over", "Moment of Victory", "Something Irreplaceable", "Sleep Like the Dead", "Time Waits for No One"]
    };

    function isCharacterOffBannerLoss(name, pullTimeStr) {
        if (HSR_CONFIG.PERM_7_CHARS.includes(name)) return true;
        const retiredDate = HSR_CONFIG.EXPANDED_LOSS_CHARS[name];
        if (retiredDate) {
            if (!pullTimeStr) return true;
            return pullTimeStr >= retiredDate;
        }
        return false;
    }

    const EF_CONFIG = {
        CHAR_HARD: 80,
        WEAPON_HARD: 40,
        CHAR_BANNERS: { 'The Floaty Messenger': 'Gilberta', 'Scars of the Forge': 'Laevatain' },
        WEAPON_BANNERS: { 'Cosmic Voice Issue': 'Dreams of the Starry Beach', 'Solid Ice Issue': 'Khravengger' },
        WEAPON_LADDER: [[100, "Weapon Selector"], [180, "Featured Guarantee"], [260, "Weapon Selector"], [340, "Featured Guarantee"]]
    };

    const tableFilters = {};

    // ==========================================
    // 2. NAVIGATION & ROUTING
    // ==========================================
    function switchTab(tabId) {
        document.querySelectorAll('.app-view').forEach(v => v.classList.remove('active'));
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        
        const targetView = document.getElementById(tabId);
        if (targetView) targetView.classList.add('active');
        
        const activeBtn = document.querySelector(`button[onclick="switchTab('${tabId}')"]`);
        if (activeBtn) activeBtn.classList.add('active');

        if (tabId === 'hsr-view') window.history.replaceState(null, null, ' ');
        else if (tabId === 'endfield-view') window.history.replaceState(null, null, '#endfield');
        else if (tabId === 'guide-view') window.history.replaceState(null, null, '#guide');
    }

    let currentHsrUid = null;
    let currentHsrBannerKey = '11';

    function switchUIDTab(uid) {
        currentHsrUid = uid;
        document.querySelectorAll('.account-view').forEach(v => v.classList.remove('active'));
        document.querySelectorAll('.uid-btn').forEach(b => b.classList.remove('active'));
        
        const targetView = document.getElementById(`acc-${uid}`);
        const targetBtn = document.getElementById(`btn-${uid}`);
        if (targetView) targetView.classList.add('active');
        if (targetBtn) targetBtn.classList.add('active');

        // Check if current active banner exists in target account, fallback to '11' if not
        let targetPanel = document.getElementById(`panel-${uid}-${currentHsrBannerKey}`);
        if (!targetPanel) {
            currentHsrBannerKey = '11';
        }
        switchBannerSubtab(uid, currentHsrBannerKey);
    }

    function switchBannerSubtab(uid, bannerKey) {
        if (!uid) uid = currentHsrUid;
        currentHsrBannerKey = bannerKey;

        const accView = document.getElementById(`acc-${uid}`);
        if (accView) {
            accView.querySelectorAll('.banner-view-panel').forEach(p => p.classList.remove('active'));
            const targetPanel = document.getElementById(`panel-${uid}-${bannerKey}`);
            if (targetPanel) targetPanel.classList.add('active');
        }

        // Highlight active subtab in unified sidebar
        document.querySelectorAll('.sidebar-subtab-btn').forEach(b => {
            if (b.dataset.bannerKey === bannerKey) {
                b.classList.add('active');
            } else {
                b.classList.remove('active');
            }
        });
    }

    function updateDropZoneVisibility() {
        const dropContainer = document.getElementById('drop-zone-container');
        if (!dropContainer) return;
        
        let hasHsr = false, hasEndfield = false;
        try {
            const hsr = JSON.parse(localStorage.getItem('hsr_accounts') || '{}');
            hasHsr = Object.keys(hsr).length > 0;
        } catch(e) {}
        try {
            const ef = JSON.parse(localStorage.getItem('endfield_data') || '{}');
            hasEndfield = (ef.characters && ef.characters.length > 0) || (ef.weapons && ef.weapons.length > 0);
        } catch(e) {}

        if (hasHsr || hasEndfield) {
            dropContainer.classList.add('compact-mode');
        } else {
            dropContainer.classList.remove('compact-mode');
        }
    }

    window.onload = () => {
        let hash = window.location.hash;
        if (hash === '#endfield') switchTab('endfield-view');
        else if (hash === '#guide') switchTab('guide-view');
        else switchTab('hsr-view');

        const savedHSR = localStorage.getItem('hsr_accounts');
        if (savedHSR) {
            try { buildHSR(JSON.parse(savedHSR)); } catch (err) { console.error(err); }
        }
        
        const savedEndfield = localStorage.getItem('endfield_data');
        if (savedEndfield) {
            try { buildEndfield(JSON.parse(savedEndfield)); } catch (err) { console.error(err); }
        }

        updateDropZoneVisibility();
        setupSVGTooltips();
        setupScrollTopListener();
    };

    function setupScrollTopListener() {
        const topBtn = document.getElementById('scroll-top-btn');
        if (!topBtn) return;
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                topBtn.classList.add('visible');
            } else {
                topBtn.classList.remove('visible');
            }
        });
    }

    // ==========================================
    // 3. TOAST, CLIPBOARD, MODAL & TOOLTIPS
    // ==========================================
    function showToast(msg) {
        const toast = document.getElementById('toast');
        toast.innerHTML = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2600);
    }

    function copyToClipboard(text, btnElement) {
        navigator.clipboard.writeText(text).then(() => {
            if (btnElement) {
                const orig = btnElement.innerHTML;
                btnElement.innerHTML = "Copied! ✓";
                setTimeout(() => btnElement.innerHTML = orig, 2000);
            }
            showToast("Copied to clipboard! ✓");
        }).catch(() => {
            showToast("Failed to copy. Please select and copy manually.");
        });
    }

    function copyAIPrompt(btn) {
        const code = document.getElementById('ai-prompt-text').innerText;
        copyToClipboard(code, btn);
    }

    function copyPythonScript(btn) {
        const code = document.getElementById('python-script-text').innerText;
        copyToClipboard(code, btn);
    }

    function openPasteModal() { document.getElementById('paste-modal').classList.add('active'); }
    function closePasteModal(e) {
        if (!e || e.target.id === 'paste-modal' || e.target.classList.contains('modal-close') || e.target.innerText === 'Cancel') {
            document.getElementById('paste-modal').classList.remove('active');
        }
    }

    function setupSVGTooltips() {
        const tip = document.getElementById('svg-tooltip');
        document.addEventListener('mouseover', e => {
            if (e.target.classList.contains('chart-point') && e.target.dataset.tip) {
                tip.innerHTML = e.target.dataset.tip;
                tip.style.display = 'block';
            }
        });
        document.addEventListener('mousemove', e => {
            if (tip.style.display === 'block') {
                tip.style.left = e.clientX + 'px';
                tip.style.top = e.clientY + 'px';
            }
        });
        document.addEventListener('mouseout', e => {
            if (e.target.classList.contains('chart-point')) {
                tip.style.display = 'none';
            }
        });
    }

    // ==========================================
    // 4. DATA IMPORT & MANAGEMENT
    // ==========================================
    const dropZone = document.getElementById('drop-zone');
    ['dragover', 'dragleave', 'drop'].forEach(evt => dropZone.addEventListener(evt, e => e.preventDefault()));
    dropZone.addEventListener('dragover', () => dropZone.classList.add('dragover'));
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', e => { 
        dropZone.classList.remove('dragover'); 
        handleFiles(e.dataTransfer.files); 
    });
    document.getElementById('file-input').addEventListener('change', e => handleFiles(e.target.files));

    function handleFiles(files) {
        if (!files || !files.length) return;
        for (let file of files) {
            if (file.name.endsWith('.json')) {
                let reader = new FileReader();
                reader.onload = e => {
                    let parsedData;
                    try { parsedData = JSON.parse(e.target.result); }
                    catch (err) { alert(`Error parsing JSON in ${file.name}.`); return; }
                    processImportedData(parsedData, file.name);
                };
                reader.readAsText(file);
            } else {
                alert(`Please upload a valid .json file. (Received: ${file.name})`);
            }
        }
    }

    function processImportedData(data, sourceName = "", manualUid = "") {
        try {
            const fname = sourceName.toLowerCase();
            if (fname.includes('endfield') || (Array.isArray(data) && data[0] && (data[0].charName || data[0].weaponName || data[0].poolId))) {
                let efData = JSON.parse(localStorage.getItem('endfield_data')) || { characters: [], weapons: [] };
                if (fname.includes('character')) efData.characters = data;
                else if (fname.includes('weapon')) efData.weapons = data;
                else {
                    if (Array.isArray(data) && data[0] && data[0].charName) efData.characters = data;
                    else if (Array.isArray(data) && data[0] && data[0].weaponName) efData.weapons = data;
                }
                localStorage.setItem('endfield_data', JSON.stringify(efData));
                buildEndfield(efData);
                updateDropZoneVisibility();
                switchTab('endfield-view');
                showToast("Endfield data imported successfully! 🔶");
                return;
            }

            if (!Array.isArray(data) && typeof data === 'object') {
                const keys = Object.keys(data);
                if (keys.length > 0 && Array.isArray(data[keys[0]])) {
                    let accountsDict = JSON.parse(localStorage.getItem('hsr_accounts')) || {};
                    Object.assign(accountsDict, data);
                    localStorage.setItem('hsr_accounts', JSON.stringify(accountsDict));
                    buildHSR(accountsDict);
                    updateDropZoneVisibility();
                    switchTab('hsr-view');
                    showToast(`Imported backup with ${keys.length} HSR account(s)! ⭐`);
                    return;
                }
            }

            if (Array.isArray(data)) {
                let uid = manualUid.trim();
                if (!uid) {
                    if (data[0] && data[0].uid) uid = String(data[0].uid);
                    else {
                        let uidMatch = sourceName.match(/\d+/);
                        uid = uidMatch ? uidMatch[0] : "Account_1";
                    }
                }
                let accountsDict = JSON.parse(localStorage.getItem('hsr_accounts')) || {};
                accountsDict[uid] = data;
                localStorage.setItem('hsr_accounts', JSON.stringify(accountsDict));
                buildHSR(accountsDict);
                updateDropZoneVisibility();
                switchUIDTab(uid);
                switchTab('hsr-view');
                showToast(`Loaded ${data.length} warps for UID: ${uid} ⭐`);
                return;
            }

            alert("Unrecognized JSON structure. Please check the Tutorial tab for valid schema formats.");
        } catch (err) {
            console.error(err);
            alert("Failed to process data. Check console for details.");
        }
    }

    function importFromGuide() {
        const raw = document.getElementById('guide-paste-text').value.trim();
        const uid = document.getElementById('guide-paste-uid').value.trim();
        if (!raw) { alert("Please paste your JSON first."); return; }
        try {
            const data = JSON.parse(raw);
            processImportedData(data, "pasted_input.json", uid);
        } catch (err) { alert("Invalid JSON format! Please check syntax brackets."); }
    }

    function importFromModal() {
        const raw = document.getElementById('modal-paste-text').value.trim();
        const uid = document.getElementById('modal-paste-uid').value.trim();
        if (!raw) { alert("Please paste your JSON first."); return; }
        try {
            const data = JSON.parse(raw);
            processImportedData(data, "pasted_modal.json", uid);
            closePasteModal();
        } catch (err) { alert("Invalid JSON format! Please verify your JSON string."); }
    }

    function clearData(storageKey) {
        const name = storageKey === 'hsr_accounts' ? 'Honkai: Star Rail' : 'Endfield';
        if (confirm(`Are you sure you want to wipe all local ${name} data?`)) {
            localStorage.removeItem(storageKey);
            location.reload();
        }
    }

    function removeSingleUID(uid) {
        if (confirm(`Remove UID ${uid} from local storage?`)) {
            let accountsDict = JSON.parse(localStorage.getItem('hsr_accounts')) || {};
            delete accountsDict[uid];
            localStorage.setItem('hsr_accounts', JSON.stringify(accountsDict));
            buildHSR(accountsDict);
            showToast(`UID ${uid} removed.`);
        }
    }

    function exportUID(uid) {
        let accountsDict = JSON.parse(localStorage.getItem('hsr_accounts')) || {};
        if (!accountsDict[uid]) return;
        const blob = new Blob([JSON.stringify(accountsDict[uid], null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `hsr_${uid}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast(`Exported hsr_${uid}.json! 📥`);
    }

    function exportAllHSR() {
        let accountsDict = JSON.parse(localStorage.getItem('hsr_accounts')) || {};
        if (!Object.keys(accountsDict).length) { alert("No HSR data found to export."); return; }
        const blob = new Blob([JSON.stringify(accountsDict, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `hsr_accounts_backup.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast("Exported all HSR accounts backup! 💾");
    }

    // ==========================================
    // 5. SAMPLE DEMO DATA GENERATOR
    // ==========================================
    function loadDemoData() {
        let pulls = [];
        let idCounter = 1710000000000000;
        const fourStarPool = ["Gallagher", "Pela", "Tingyun", "Natasha", "Guinaifen", "Lynx", "Xueyi", "Moze", "Asta", "Serval"];
        let fourIdx = 0;

        const addPulls = (gachaType, count, name, rank, time, isLc = false) => {
            let since4 = 0;
            for (let i = 0; i < count - 1; i++) {
                idCounter++;
                since4++;
                if (since4 >= 9) {
                    pulls.push({
                        gacha_type: gachaType,
                        id: String(idCounter),
                        name: fourStarPool[fourIdx % fourStarPool.length],
                        item_type: "Character",
                        rank_type: "4",
                        time: time,
                        uid: "800888888"
                    });
                    fourIdx++;
                    since4 = 0;
                } else {
                    pulls.push({
                        gacha_type: gachaType,
                        id: String(idCounter),
                        name: isLc ? "Passkey" : "Darting Arrow",
                        item_type: "Light Cone",
                        rank_type: "3",
                        time: time,
                        uid: "800888888"
                    });
                }
            }
            idCounter++;
            pulls.push({
                gacha_type: gachaType,
                id: String(idCounter),
                name: name,
                item_type: rank === "4" ? "Character" : (isLc ? "Light Cone" : "Character"),
                rank_type: rank,
                time: time,
                uid: "800888888"
            });
        };

        // Departure Warp (50 pulls)
        addPulls("2", 50, "Welt", "5", "2023-04-26 12:00:00");

        // Standard Stellar Warp ('1')
        addPulls("1", 78, "Clara", "5", "2024-01-10 12:00:00");
        addPulls("1", 79, "Something Irreplaceable", "5", "2024-04-15 12:00:00", true);
        addPulls("1", 52, "Passkey", "3", "2024-09-01 12:00:00", true);

        // Character Event Warp ('11')
        addPulls("11", 78, "Bronya", "5", "2024-03-27 12:15:00"); // 78 pity (loss)
        addPulls("11", 75, "Acheron", "5", "2024-03-27 12:30:00"); // 75 pity (win)
        addPulls("11", 34, "Robin", "5", "2024-05-08 13:00:00"); // 34 pity (early win)
        addPulls("11", 8, "Firefly", "5", "2024-06-19 14:00:00"); // 8 pity (god / top 1%)
        addPulls("11", 81, "Gepard", "5", "2025-01-15 10:00:00"); // 81 pity (loss)
        addPulls("11", 77, "Feixiao", "5", "2025-02-01 11:00:00"); // 77 pity (win)
        addPulls("11", 42, "Arrows", "3", "2025-03-01 15:00:00", true); // current pity 42

        // Light Cone Event Warp ('12')
        addPulls("12", 68, "Along the Passing Shore", "5", "2024-03-28 12:00:00", true);
        addPulls("12", 67, "Night on the Milky Way", "5", "2024-05-10 12:00:00", true);
        addPulls("12", 45, "Flowing Nightglow", "5", "2024-05-10 12:30:00", true);
        addPulls("12", 18, "Collapsing Sky", "3", "2024-06-20 12:00:00", true);

        let accountsDict = JSON.parse(localStorage.getItem('hsr_accounts')) || {};
        accountsDict["800888888 (Demo)"] = pulls;
        localStorage.setItem('hsr_accounts', JSON.stringify(accountsDict));
        buildHSR(accountsDict);
        updateDropZoneVisibility();
        switchUIDTab("800888888 (Demo)");
        switchTab('hsr-view');
        showToast("✨ Sample HSR demo account loaded!");
    }

    // ==========================================
