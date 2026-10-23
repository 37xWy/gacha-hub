// 9. ARKNIGHTS ENDFIELD ENGINE
    // ==========================================
    function analyzeEndfieldPool(items, isWeapon, hardCap) {
        items.sort((a, b) => {
            let seqA = parseInt(a.seqId || a.seq_id || a.id || 0);
            let seqB = parseInt(b.seqId || b.seq_id || b.id || 0);
            if (seqA && seqB && seqA !== seqB) return seqA - seqB;
            let tsA = parseInt(a.gachaTs || a.time || 0);
            let tsB = parseInt(b.gachaTs || b.time || 0);
            return tsA - tsB;
        });

        let pity = 0, total = 0, wins = 0, losses = 0, streak = 0, history = [];
        let limit = isWeapon ? 15 : 50;
        let lastPoolId = null, currentBannerPulls = 0, currentBannerName = "None";

        items.forEach(item => {
            total++; pity++;
            let poolName = item.poolName || item.pool_name || 'Unknown Banner';
            let poolId = item.poolId || item.pool_id || poolName || 'unknown_id';
            
            if (poolId !== lastPoolId) { lastPoolId = poolId; currentBannerPulls = 0; currentBannerName = poolName; }
            currentBannerPulls++;

            let rarityVal = parseInt(item.rarity || item.rank || item.rank_type || 0);
            if (rarityVal === 6) {
                let label = "Regular", labelCls = "badge badge-reg";
                if (pity <= limit) { label = "Early ⚡"; labelCls = "badge badge-early"; }
                else if (pity >= hardCap) { label = "Hard Pity 💀"; labelCls = "badge badge-hard"; }
                
                let name = item.charName || item.weaponName || item.name || item.id || "Unknown";
                let isWin = null, target = null;

                if (isWeapon) {
                    target = EF_CONFIG.WEAPON_BANNERS[poolName] || Object.entries(EF_CONFIG.WEAPON_BANNERS).find(([k]) => poolName.toLowerCase().includes(k.toLowerCase()))?.[1];
                } else if (!poolName.toLowerCase().includes('standard') && !poolName.toLowerCase().includes('beginner')) {
                    target = EF_CONFIG.CHAR_BANNERS[poolName] || Object.entries(EF_CONFIG.CHAR_BANNERS).find(([k]) => poolName.toLowerCase().includes(k.toLowerCase()))?.[1];
                }

                if (target) {
                    if (name.toLowerCase() === target.toLowerCase()) { isWin = true; wins++; streak = streak >= 0 ? streak + 1 : 1; } 
                    else { isWin = false; losses++; streak = streak <= 0 ? streak - 1 : -1; }
                }

                let ts = parseInt(item.gachaTs || item.ts || 0);
                let dateStr = "-";
                if (ts) {
                    dateStr = new Date(ts * (ts < 10000000000 ? 1000 : 1)).toISOString().split('T')[0];
                } else if (item.time) {
                    dateStr = String(item.time).split(' ')[0];
                }
                
                history.push({ name: name, pity: pity, label: label, class: labelCls, date: dateStr, is_win: isWin, pool_name: poolName });
                pity = 0;
            }
        });

        history.reverse();
        let avgPity = history.length ? (history.reduce((a, b) => a + b.pity, 0) / history.length).toFixed(1) : 0;
        return { total, pity, history, count: history.length, avgPity, wins, losses, streak, activeCount: currentBannerPulls, activeName: currentBannerName };
    }

    function buildEndfield(efData) {
        if (!efData) return;
        const chars = efData.characters || [];
        const weaps = efData.weapons || [];
        if (!chars.length && !weaps.length) return;
        let html = "<div style='display:grid; grid-template-columns:repeat(auto-fit, minmax(460px, 1fr)); gap:20px;'>";
        
        const renderEfCard = (title, subtitle, items, isWeapon) => {
            if(!items || items.length === 0) return "";
            let hardCap = isWeapon ? EF_CONFIG.WEAPON_HARD : EF_CONFIG.CHAR_HARD;
            let stats = analyzeEndfieldPool(items, isWeapon, hardCap);
            let percent = Math.min(100, (stats.pity / hardCap) * 100);
            let remaining = hardCap - stats.pity;

            let cardHtml = `
            <div class="banner-hero-card">
                <div class="banner-hero-header">
                    <div>
                        <h3 class="banner-title" style="font-size:1.25rem;">${title}</h3>
                        <div class="banner-subtitle">${subtitle}</div>
                    </div>
                    <span class="pill-badge">Total: ${stats.total}</span>
                </div>
                <div class="banner-stats-grid">
                    <div class="b-stat-box"><div class="b-stat-label">Current Pity</div><div class="b-stat-val gold-text">${stats.pity} / ${hardCap}</div></div>
                    <div class="b-stat-box"><div class="b-stat-label">Avg Pity</div><div class="b-stat-val">${stats.avgPity}</div></div>
                    <div class="b-stat-box"><div class="b-stat-label">Guaranteed In</div><div class="b-stat-val" style="color:var(--accent);">${remaining} pulls</div></div>
                </div>
                <div class="pity-pill-wrap" style="margin:16px 0;">
                    <div class="pity-pill-labels">
                        <span style="font-weight:700; color:var(--text-main); font-size:12px;">🔶 Headhunting Pity</span>
                        <span style="font-weight:800; font-family:monospace; color:#fbbf24; font-size:13px;">${stats.pity} <span style="color:var(--text-muted); font-size:11px;">/ ${hardCap}</span></span>
                    </div>
                    <div class="pity-pill-track">
                        <div class="ef-progress-bar" style="width: ${percent}%;"></div>
                    </div>
                    <div class="pity-pill-sub">
                        <span>Pity Progress</span>
                        <span>${remaining} pulls until guarantee</span>
                    </div>
                </div>`;

            if (stats.wins + stats.losses > 0) {
                let rate = ((stats.wins / (stats.wins + stats.losses)) * 100).toFixed(1);
                let sTxt = stats.streak > 0 ? `${stats.streak} Wins` : `${Math.abs(stats.streak)} Losses`;
                let sCol = stats.streak > 0 ? "var(--green)" : "var(--red)";
                cardHtml += `
                <div class="fifty-box">
                    <div>
                        <div class="fifty-title">${isWeapon ? '25/75' : '50/50'} Analytics (6★)</div>
                        <div class="fifty-val" style="color:#ffffff">${rate}% <span style="font-weight:normal; color:var(--text-muted); font-size:0.8em">(${stats.wins}W-${stats.losses}L)</span></div>
                    </div>
                    <div style="text-align:right;">
                        <div class="fifty-title">Streak</div>
                        <div class="fifty-val" style="color:${sCol}">${sTxt}</div>
                    </div>
                </div>`;
            }

            if (stats.history.length > 0) {
                cardHtml += `<div class="table-wrap" style="margin-top:16px;"><table><thead><tr><th>6★ Drop</th><th>Pity</th><th>Status</th><th>Date</th></tr></thead><tbody>`;
                stats.history.slice(0, 10).forEach(ssr => {
                    let wlBadge = ssr.is_win === true ? "<span class='tag-win'>WIN</span>" : ssr.is_win === false ? "<span class='tag-loss'>LOSS</span>" : "";
                    cardHtml += `<tr>
                        <td class="name-cell gold-text">${ssr.name} ${wlBadge}</td>
                        <td style="color:#ffffff; font-weight:bold; font-family:monospace;">${ssr.pity}</td>
                        <td><span class="${ssr.class}">${ssr.label}</span></td>
                        <td style="color:var(--text-muted); font-size:11px;">${ssr.date}</td>
                    </tr>`;
                });
                cardHtml += `</tbody></table></div>`;
            } else {
                cardHtml += `<div class="empty-state" style="padding:18px; margin-top:12px; border:1px dashed var(--border-color); border-radius:var(--radius-sm);"><div class="empty-text" style="font-size:13px;">No 6★ drops recorded yet</div><p style="font-size:12px; color:var(--text-muted); margin:4px 0 0 0;">Pulling history will list here once a 6★ is obtained.</p></div>`;
            }
            return cardHtml + "</div>";
        };

        let charEvent = chars.filter(i => {
            let p = (i.poolName || i.pool_name || i.poolId || i.pool_id || '').toLowerCase();
            return !p.includes('standard') && !p.includes('beginner') && !p.includes('basic');
        });
        let charStd = chars.filter(i => {
            let p = (i.poolName || i.pool_name || i.poolId || i.pool_id || '').toLowerCase();
            return p.includes('standard') || p.includes('basic');
        });
        
        if (charEvent.length) html += renderEfCard("Charted Headhunting", "Event History", charEvent, false);
        if (charStd.length) html += renderEfCard("Basic Headhunting", "Permanent Channel", charStd, false);

        let wPools = {};
        weaps.forEach(item => {
            let key = (item.poolId || item.pool_id || '') + (item.poolName || item.pool_name || '');
            if (!wPools[key]) wPools[key] = { name: item.poolName || item.pool_name || 'Weapon Banner', items: [] };
            wPools[key].items.push(item);
        });
        Object.values(wPools).forEach(data => {
            html += renderEfCard(data.name, "Charted Equipment", data.items, true);
        });

        document.getElementById('endfield-content').innerHTML = html + "</div>";
    }
