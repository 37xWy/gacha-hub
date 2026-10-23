// 8. HSR DASHBOARD & COMBINED SUMMARY BUILDER
    // ==========================================
    function getAccountNicknames() {
        try {
            return JSON.parse(localStorage.getItem('hsr_account_nicknames')) || {};
        } catch (e) {
            return {};
        }
    }

    function setAccountNickname(uid, nickname) {
        let nicks = getAccountNicknames();
        if (!nickname || !nickname.trim()) {
            delete nicks[uid];
        } else {
            nicks[uid] = nickname.trim();
        }
        localStorage.setItem('hsr_account_nicknames', JSON.stringify(nicks));
        const savedHSR = localStorage.getItem('hsr_accounts');
        if (savedHSR) {
            buildHSR(JSON.parse(savedHSR));
            switchUIDTab(uid);
        }
        showToast("✨ Account nickname updated!");
    }

    function promptEditNickname(event, uid) {
        event.stopPropagation();
        let nicks = getAccountNicknames();
        let current = nicks[uid] || "";
        let input = prompt(`Enter a nickname for Account UID ${uid}:`, current);
        if (input !== null) {
            setAccountNickname(uid, input);
        }
    }

    function formatAccountDisplay(uid) {
        let nicks = getAccountNicknames();
        let colorClass = getAccountPaletteClass(uid);
        if (nicks[uid]) {
            return `<span class="${colorClass}" style="color:var(--acc-color); font-weight:700;">${nicks[uid]}</span> <span style="font-size:0.82em; opacity:0.75;">(${uid})</span>`;
        }
        return `<span>UID:</span> <span class="${colorClass}" style="color:var(--acc-color); font-weight:700;">${uid}</span>`;
    }

    function formatAccountBadge(uid) {
        let nicks = getAccountNicknames();
        let colorClass = getAccountPaletteClass(uid);
        if (nicks[uid]) {
            return `<span class="pill-badge acc-badge-colored ${colorClass}" style="font-size:10px;">${nicks[uid]} (${uid})</span>`;
        }
        return `<span class="pill-badge acc-badge-colored ${colorClass}" style="font-size:10px;">UID: ${uid}</span>`;
    }

    function getAccountPaletteClass(uid) {
        let hash = 0;
        let str = String(uid);
        for (let i = 0; i < str.length; i++) {
            hash = (hash << 5) - hash + str.charCodeAt(i);
            hash |= 0;
        }
        let index = Math.abs(hash) % 6;
        return `acc-palette-${index}`;
    }

    function deleteSingleAccount(event, uid) {
        event.stopPropagation();
        let nicks = getAccountNicknames();
        let displayName = nicks[uid] ? `"${nicks[uid]}" (${uid})` : `UID ${uid}`;
        if (confirm(`Are you sure you want to delete account ${displayName}?\nThis will remove its warp records from this browser.`)) {
            let accountsDict = JSON.parse(localStorage.getItem('hsr_accounts')) || {};
            delete accountsDict[uid];
            localStorage.setItem('hsr_accounts', JSON.stringify(accountsDict));
            
            // Clean up nickname too
            delete nicks[uid];
            localStorage.setItem('hsr_account_nicknames', JSON.stringify(nicks));
            
            buildHSR(accountsDict);
            updateDropZoneVisibility();
            showToast(`🗑️ Account ${displayName} deleted.`);
        }
    }

    function renderBannerPanel(uid, code, bannerKey, title, subtitle, items, isFirst = false, isCombined = false) {
        let activeCls = isFirst ? " active" : "";
        let tableId = `tbl-${uid}-${code}`;
        let chartId = `${uid}-${code}`.replace(/[^a-zA-Z0-9]/g, '_');

        let panelHtml = `<div id="panel-${uid}-${bannerKey}" class="banner-view-panel${activeCls}">`;

        if (!items || !items.length) {
            panelHtml += `
            <div class="empty-state">
                <div class="empty-icon">🌠</div>
                <div class="empty-text">No records on ${title}</div>
                <p>No pulls recorded in this specific banner bucket yet.</p>
            </div></div>`;
            return panelHtml;
        }

        items.sort((a, b) => parseInt(a.id || 0) - parseInt(b.id || 0));
        let isLc = (code === '12' || code === '22');
        let isEvent = ['11', '12', '21', '22'].includes(code);
        let hardCap = (code === '2') ? HSR_CONFIG.DEP_HARD : (isLc ? HSR_CONFIG.LC_HARD : HSR_CONFIG.CHAR_HARD);
        let softPityVal = isLc ? HSR_CONFIG.LC_SOFT : HSR_CONFIG.CHAR_SOFT;
        let stdLcs = HSR_CONFIG.STD_LCS;

        let pity5 = 0, pity4 = 0, total = 0, wins = 0, losses = 0, streak = 0;
        let last5StarWasWin = null;
        let history = [];

        items.forEach(item => {
            total++; pity5++; pity4++;
            let is5Star = item.rank_type == "5";
            let isDDD = item.rank_type == "4" && item.name === "Dance! Dance! Dance!";

            if (is5Star || isDDD) {
                let status = "", statusClass = "", isWin = null;
                let itemPity = is5Star ? pity5 : pity4;

                if (is5Star) {
                    let luck = getLuckStatus(pity5, isLc);
                    status = luck[0]; statusClass = "badge badge-" + luck[1];

                    if (isEvent) {
                        let isOffBanner = isLc ? stdLcs.includes(item.name) : isCharacterOffBannerLoss(item.name, item.time);
                        if (isOffBanner) {
                            isWin = false; losses++; streak = streak <= 0 ? streak - 1 : -1;
                            last5StarWasWin = false;
                        } else {
                            isWin = true; wins++; streak = streak >= 0 ? streak + 1 : 1;
                            last5StarWasWin = true;
                        }
                    }
                    pity5 = 0;
                } else {
                    status = "DDD ★★★★"; statusClass = "badge badge-4star";
                    pity4 = 0;
                }

                let dateStr = item.time ? item.time.split(' ')[0] : "Unknown";
                history.push({ 
                    name: item.name, 
                    pity: itemPity, 
                    status: status, 
                    class: statusClass, 
                    date: dateStr, 
                    is_win: isWin, 
                    rank: item.rank_type,
                    accountUid: item.accountUid || uid 
                });
            } else if (item.rank_type == "4") {
                pity4 = 0;
            }
        });

        history.reverse();
        let ssrOnly = history.filter(x => x.rank == '5');
        let avgPity = ssrOnly.length ? (ssrOnly.reduce((a, b) => a + b.pity, 0) / ssrOnly.length).toFixed(1) : 0;
        let percent = Math.min(100, (pity5 / hardCap) * 100);
        let remaining = Math.max(0, hardCap - pity5);
        let softMarkerPercent = (softPityVal / hardCap) * 100;
        let inSoftPity = pity5 >= softPityVal;

        let guaranteeStatus = "";
        if (isEvent) {
            if (last5StarWasWin === false) {
                guaranteeStatus = `<span style="color:var(--green); font-weight:700;">● Guaranteed Featured Next!</span>`;
            } else if (last5StarWasWin === true) {
                guaranteeStatus = `<span style="color:var(--accent); font-weight:700;">● Next 5★ on 50/50</span>`;
            }
        }

        // Banner Hero Card (No Fake Stellar Jades, Isolated Account Stats)
        panelHtml += `
        <div class="banner-hero-card">
            <div class="banner-hero-header">
                <div>
                    <h2 class="banner-title">${title}</h2>
                    <div class="banner-subtitle">${subtitle}</div>
                </div>
                <div class="banner-pills">
                    <span class="pill-badge">Total: ${total} Warps</span>
                    <span class="pill-badge gold-text">${ssrOnly.length} 5★ Drops</span>
                    ${!isCombined ? guaranteeStatus : ''}
                </div>
            </div>

            <div class="banner-stats-grid">
                ${!isCombined ? `
                <div class="b-stat-box">
                    <div class="b-stat-label">Current Pity</div>
                    <div class="b-stat-val gold-text">${pity5} <span style="font-size:0.7em; color:var(--text-muted);">/ ${hardCap}</span></div>
                </div>` : ''}
                <div class="b-stat-box">
                    <div class="b-stat-label">Average 5★ Pity</div>
                    <div class="b-stat-val">${avgPity}</div>
                </div>
                ${!isCombined ? `
                <div class="b-stat-box">
                    <div class="b-stat-label">Guaranteed In</div>
                    <div class="b-stat-val" style="color:var(--accent);">${remaining} <span style="font-size:0.7em; color:var(--text-muted);">pulls</span></div>
                </div>` : ''}
                ${isEvent && (wins + losses > 0) ? `
                <div class="b-stat-box">
                    <div class="b-stat-label">50/50 Win Rate</div>
                    <div class="b-stat-val" style="color:var(--green);">${((wins / (wins + losses)) * 100).toFixed(1)}% <span style="font-size:0.65em; color:var(--text-muted);">(${wins}W-${losses}L)</span></div>
                </div>` : ''}
            </div>

            ${!isCombined ? `
            <!-- Minimalist Dual-Tier Glass Pill Pity Bar -->
            <div class="pity-pill-wrap">
                <div class="pity-pill-labels">
                    <span style="font-weight:700; color:var(--text-main); font-size:12px; display:flex; align-items:center; gap:6px;">
                        <span>🌠 Pity Progress</span>
                        ${inSoftPity ? '<span style="color:#ef4444; font-weight:800; font-size:10px; background:rgba(239,68,68,0.15); border:1px solid #ef4444; border-radius:3px; padding:1px 5px;">SOFT PITY ACTIVE</span>' : ''}
                    </span>
                    <span style="font-weight:800; font-family:monospace; color:${inSoftPity ? '#fbbf24' : '#38bdf8'}; font-size:14px;">
                        ${pity5} <span style="color:var(--text-muted); font-size:12px;">/ ${hardCap}</span>
                    </span>
                </div>
                <div class="pity-pill-track">
                    ${code !== '2' ? `<div class="pity-pill-target" style="left: ${softMarkerPercent}%;" title="Soft Pity starts at pull ${softPityVal}"></div>` : ''}
                    <div class="pity-pill-fill ${inSoftPity ? 'in-soft-pity' : ''}" style="width: ${percent}%;"></div>
                </div>
                <div class="pity-pill-sub">
                    <span>${code !== '2' ? `🛡️ Normal Pity: 0 – ${softPityVal}` : 'Standard Pool'}</span>
                    <span>${code !== '2' ? `⚠️ Soft Pity: ${softPityVal} – ${hardCap}` : ''}</span>
                    <span>🎯 Hard Pity: ${hardCap}</span>
                </div>
            </div>` : ''}
        </div>`;

        // Charts Section
        if (code === '1' || code === '2') {
            // Standard / Departure Banners: Full-Width Smooth Curve Graph over the year
            panelHtml += `
            <div class="charts-grid" style="grid-template-columns: 1fr;">
                <div class="chart-card">
                    <div class="chart-header">
                        <h4 class="chart-title">📈 Annual Warp Activity Timeline (12-Month Smooth Curve)</h4>
                        <span style="font-size:11px; color:var(--text-muted);">Historical Pull Progression Over Time</span>
                    </div>
                    <div class="chart-body" style="min-height:220px;">
                        ${renderSmoothMonthlyVolumeSVG(items, chartId)}
                    </div>
                </div>
            </div>`;
        } else {
            // Limited Event Banners: Two-Sided Win/Loss Distribution + 50/50 Donut
            panelHtml += `
            <div class="charts-grid">
                <div class="chart-card">
                    <div class="chart-header">
                        <h4 class="chart-title">📊 Two-Sided Pity Bracket Distribution</h4>
                        <span style="font-size:11px; color:var(--text-muted);">${isEvent ? 'Wins (Top) vs Losses (Underside)' : 'Drops by Pity Bracket'}</span>
                    </div>
                    <div class="chart-body">
                        ${renderBiDirectionalDistributionSVG(history, isLc, isEvent, chartId)}
                    </div>
                </div>

                <div class="chart-card">
                    <div class="chart-header">
                        <h4 class="chart-title">${isEvent ? '🍩 50/50 Win Rate Breakdown' : '📅 Monthly Pull Volume'}</h4>
                        <span style="font-size:11px; color:var(--text-muted);">${isEvent ? 'Featured vs Standard Loss' : 'Warp Activity'}</span>
                    </div>
                    <div class="chart-body">
                        ${isEvent ? renderDonutSVG(wins, losses, isLc ? '75/25 Rate' : '50/50 Rate') : renderMonthlyActivitySVG(items)}
                    </div>
                </div>
            </div>`;
        }

        // Deep Filter & Sort Toolbar
        panelHtml += `
        <div class="toolbar-panel">
            <div class="toolbar-left">
                <div class="filter-pill-group">
                    <button class="filter-pill active" onclick="setFilterRarity(this, '${tableId}', 'all')">All</button>
                    <button class="filter-pill" onclick="setFilterRarity(this, '${tableId}', '5')">5★</button>
                    <button class="filter-pill ddd-pill" onclick="setFilterRarity(this, '${tableId}', '4')">4★ Dance! Dance! Dance!</button>
                </div>
                ${isEvent ? `
                <div class="filter-pill-group">
                    <button class="filter-pill active" onclick="setFilterOutcome(this, '${tableId}', 'all')">All Outcomes</button>
                    <button class="filter-pill" onclick="setFilterOutcome(this, '${tableId}', 'win')">Wins Only</button>
                    <button class="filter-pill" onclick="setFilterOutcome(this, '${tableId}', 'loss')">Losses Only</button>
                </div>` : ''}
            </div>

            <div class="toolbar-right">
                <div class="search-control-wrap">
                    <span class="search-icon-prefix">🔍</span>
                    <input type="text" class="search-box" placeholder="Search character or Light Cone..." oninput="setSearchQuery(this, '${tableId}')">
                </div>
                <div class="sort-control-wrap">
                    <select class="sort-select" onchange="setSortOrder(this, '${tableId}')">
                        <option value="date_desc">📅 Newest Date</option>
                        <option value="date_asc">📅 Oldest Date</option>
                        <option value="pity_desc">⚡ Highest Pity</option>
                        <option value="pity_asc">⚡ Lowest Pity</option>
                    </select>
                </div>
            </div>
        </div>`;

        // History Table
        panelHtml += `
        <div class="table-wrap">
            <table>
                <thead>
                    <tr>
                        ${isCombined ? '<th>Account</th>' : ''}
                        <th>Entity</th>
                        <th>Pity</th>
                        <th>Status / Tier</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody id="${tableId}">`;

        history.forEach(item => {
            let nClass = item.rank == '5' ? "gold-text" : "purple-text";
            let wlBadge = item.is_win === true ? "<span class='tag-win'>WIN</span>" : item.is_win === false ? "<span class='tag-loss'>LOSS</span>" : "";
            let outcomeAttr = item.is_win === true ? "win" : item.is_win === false ? "loss" : "none";
            let paletteClass = getAccountPaletteClass(item.accountUid);

            panelHtml += `
            <tr class="acc-row-gradient ${paletteClass}" data-rank="${item.rank}" data-outcome="${outcomeAttr}" data-name="${item.name}" data-pity="${item.pity}" data-date="${item.date}">
                ${isCombined ? `<td>${formatAccountBadge(item.accountUid)}</td>` : ''}
                <td class="name-cell ${nClass}">${item.name} ${wlBadge}</td>
                <td style="font-weight:bold; color:#ffffff; font-family:monospace;">${item.pity}</td>
                <td><span class="${item.class}">${item.status}</span></td>
                <td style="color:var(--text-muted); font-size:11px;">${item.date}</td>
            </tr>`;
        });

        panelHtml += `</tbody></table></div></div>`;
        return panelHtml;
    }

    function buildHSR(accountsDict) {
        let uids = Object.keys(accountsDict).sort();
        if (uids.length === 0) {
            document.getElementById('hsr-content').innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🌠</div>
                    <div class="empty-text">No local HSR warp data found</div>
                    <p>Drag & drop your <code>hsr_UID.json</code> above, paste JSON text, or explore with realistic sample data.</p>
                    <div style="margin-top: 16px;">
                        <button class="btn-action btn-gold" onclick="loadDemoData()">✨ Load Sample HSR Data</button>
                    </div>
                </div>`;
            return;
        }

        let firstUid = uids[0];
        if (!currentHsrUid || (!accountsDict[currentHsrUid] && currentHsrUid !== 'ALL_ACCOUNTS')) {
            currentHsrUid = firstUid;
        }

        // Check if any account has collab banners
        let hasCollabWarps = false;
        uids.forEach(u => {
            (accountsDict[u] || []).forEach(item => {
                if (item.gacha_type === '21' || item.gacha_type === '22') hasCollabWarps = true;
            });
        });

        // 2-Column Layout: Sticky Unified Navigation Sidebar (Accounts + Banners) + Main Content Area
        let html = `<div class="hsr-layout-container">`;

        // Left Sticky Unified Sidebar
        html += `
        <aside class="unified-sidebar">
            <!-- Section 1: Accounts List -->
            <div class="sidebar-section">
                <div class="sidebar-section-title">
                    <span>ACCOUNTS</span>
                    <span class="count">${uids.length}</span>
                </div>
                <div class="sidebar-list">`;

        uids.forEach(uid => {
            let active = (uid === currentHsrUid) ? " active" : "";
            html += `
            <div id="btn-${uid}" class="uid-btn${active}" onclick="switchUIDTab('${uid}')">
                <div class="uid-btn-info">${formatAccountDisplay(uid)}</div>
                <div class="uid-btn-actions">
                    <span class="uid-edit-btn" onclick="promptEditNickname(event, '${uid}')" title="Edit account nickname">✏️</span>
                    <span class="uid-del-btn" onclick="deleteSingleAccount(event, '${uid}')" title="Delete account ${uid}">✕</span>
                </div>
            </div>`;
        });

        let allAccActive = (currentHsrUid === 'ALL_ACCOUNTS') ? " active" : "";
        html += `
            <div id="btn-ALL_ACCOUNTS" class="uid-btn summary-btn${allAccActive}" onclick="switchUIDTab('ALL_ACCOUNTS')">
                <div class="uid-btn-info">📊 All Accounts</div>
            </div>
            </div>
            </div>

            <!-- Section 2: Banner Subtabs -->
            <div class="sidebar-section">
                <div class="sidebar-section-title">
                    <span>BANNERS</span>
                </div>
                <div id="sidebar-banner-subtabs" class="sidebar-list">
                    <button class="sidebar-subtab-btn${currentHsrBannerKey === '11' ? ' active' : ''}" data-banner-key="11" onclick="switchBannerSubtab(null, '11')">🌟 Character</button>
                    <button class="sidebar-subtab-btn${currentHsrBannerKey === '12' ? ' active' : ''}" data-banner-key="12" onclick="switchBannerSubtab(null, '12')">🗡️ Light Cone</button>
                    <button class="sidebar-subtab-btn${currentHsrBannerKey === '1' ? ' active' : ''}" data-banner-key="1" onclick="switchBannerSubtab(null, '1')">🌌 Stellar Warp</button>
                    <button class="sidebar-subtab-btn${currentHsrBannerKey === '2' ? ' active' : ''}" data-banner-key="2" onclick="switchBannerSubtab(null, '2')">🎟️ Departure</button>
                    ${hasCollabWarps ? `<button class="sidebar-subtab-btn${currentHsrBannerKey === 'collab' ? ' active' : ''}" data-banner-key="collab" onclick="switchBannerSubtab(null, 'collab')">🤝 Collab</button>` : ''}
                </div>
            </div>

            <!-- Section 3: Sidebar Bottom Actions -->
            <div class="sidebar-bottom">
                <button class="clear-btn" style="width:100%; text-align:center; padding:7px 10px; font-size:11px;" onclick="clearData('hsr_accounts')">🗑️ Clear All Accounts</button>
            </div>
        </aside>`;

        // Right Main Content Area (Containing the account panels)
        html += `<div class="account-main-content">`;

        // 1. Render Each Individual Account (Strictly isolated, single-view display)
        uids.forEach(uid => {
            let data = accountsDict[uid] || [];
            let active = (uid === currentHsrUid) ? " active" : "";
            html += `<div id="acc-${uid}" class="account-view${active}">`;

            let banners = { '11': [], '12': [], '1': [], '2': [], '21': [], '22': [] };
            data.forEach(item => {
                if (item.gacha_type && banners[item.gacha_type]) {
                    banners[item.gacha_type].push(item);
                }
            });

            // Isolated Banner Panels
            html += renderBannerPanel(uid, '11', '11', 'Character Event Warp', `Limited Character Pool • UID ${uid}`, banners['11'], currentHsrBannerKey === '11', false);
            html += renderBannerPanel(uid, '12', '12', 'Light Cone Event Warp', `Limited Light Cone Pool • UID ${uid}`, banners['12'], currentHsrBannerKey === '12', false);
            html += renderBannerPanel(uid, '1', '1', 'Stellar Warp', `Permanent Standard Pool • UID ${uid}`, banners['1'], currentHsrBannerKey === '1', false);
            html += renderBannerPanel(uid, '2', '2', 'Departure Warp', `Beginner Discount Pool • UID ${uid}`, banners['2'], currentHsrBannerKey === '2', false);

            if (banners['21'].length || banners['22'].length) {
                html += renderBannerPanel(uid, '21', 'collab', 'Collab Warp Hub', `Special Crossover Pool • UID ${uid}`, banners['21'], currentHsrBannerKey === 'collab', false);
            }

            html += `</div>`; // Close account-view
        });

        // 2. Render the "ALL_ACCOUNTS" Combined View (Structured the same as a normal account tab, combining all accounts)
        let combinedBanners = { '11': [], '12': [], '1': [], '2': [], '21': [], '22': [] };
        uids.forEach(u => {
            (accountsDict[u] || []).forEach(item => {
                if (item.gacha_type && combinedBanners[item.gacha_type]) {
                    combinedBanners[item.gacha_type].push({ ...item, accountUid: u });
                }
            });
        });

        let allActive = (currentHsrUid === 'ALL_ACCOUNTS') ? " active" : "";
        html += `<div id="acc-ALL_ACCOUNTS" class="account-view${allActive}">`;

        html += renderBannerPanel('ALL_ACCOUNTS', '11', '11', 'Character Event Warp (Combined)', `All Accounts Combined (${uids.length} Accounts)`, combinedBanners['11'], currentHsrBannerKey === '11', true);
        html += renderBannerPanel('ALL_ACCOUNTS', '12', '12', 'Light Cone Event Warp (Combined)', `All Accounts Combined (${uids.length} Accounts)`, combinedBanners['12'], currentHsrBannerKey === '12', true);
        html += renderBannerPanel('ALL_ACCOUNTS', '1', '1', 'Stellar Warp (Combined)', `All Accounts Combined (${uids.length} Accounts)`, combinedBanners['1'], currentHsrBannerKey === '1', true);
        html += renderBannerPanel('ALL_ACCOUNTS', '2', '2', 'Departure Warp (Combined)', `All Accounts Combined (${uids.length} Accounts)`, combinedBanners['2'], currentHsrBannerKey === '2', true);

        if (combinedBanners['21'].length || combinedBanners['22'].length) {
            html += renderBannerPanel('ALL_ACCOUNTS', '21', 'collab', 'Collab Warp Hub (Combined)', `All Accounts Combined (${uids.length} Accounts)`, combinedBanners['21'], currentHsrBannerKey === 'collab', true);
        }

        html += `</div>`; // Close acc-ALL_ACCOUNTS
        html += `</div></div>`; // Close account-main-content & hsr-layout-container

        document.getElementById('hsr-content').innerHTML = html;
    }

    // ==========================================
