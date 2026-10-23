// 6. TWO-SIDED PITY DISTRIBUTION (REVERSED 86+ -> 1-10 & LTR GRADIENT)
    // ==========================================
    function renderBiDirectionalDistributionSVG(history, isLc, isEvent, chartId = "main") {
        // Reversed order: 86+ (Hard) on the left down to 1-10 (Top 1%) on the right
        const buckets = [
            { label: (isLc ? "80" : "86+"), name: "Hard", min: (isLc ? 80 : 86), max: 100, wins: 0, losses: 0, std: 0 },
            { label: (isLc ? "66-79" : "74-85"), name: "Soft", min: (isLc ? 66 : 74), max: (isLc ? 79 : 85), wins: 0, losses: 0, std: 0 },
            { label: "41-73", name: "Early", min: 41, max: (isLc ? 65 : 73), wins: 0, losses: 0, std: 0 },
            { label: "11-40", name: "Lucky", min: 11, max: 40, wins: 0, losses: 0, std: 0 },
            { label: "1-10", name: "Top 1%", min: 1, max: 10, wins: 0, losses: 0, std: 0 }
        ];

        const ssr = history.filter(x => x.rank == '5');
        if (!ssr.length) return `<div class="chart-empty">No 5★ drops recorded yet</div>`;

        ssr.forEach(item => {
            for (let b of buckets) {
                if (item.pity >= b.min && item.pity <= b.max) {
                    if (item.is_win === true) b.wins++;
                    else if (item.is_win === false) b.losses++;
                    else b.std++;
                    break;
                }
            }
        });

        const width = 450, height = 210;
        const padL = 40, padR = 20;
        const chartW = width - padL - padR;
        const midY = 105;
        const armH = 70;

        const maxVal = Math.max(1, ...buckets.map(b => Math.max(b.wins, b.losses, b.std)));
        const barW = chartW / buckets.length;

        let bars = buckets.map((b, i) => {
            const x = padL + i * barW + 8;
            const actualW = barW - 16;
            const centerX = x + actualW / 2;

            let res = "";

            // Top bar: Wins (or Standard Drops) with Left-to-Right Gradient
            const topCount = isEvent ? b.wins : (b.wins + b.std);
            if (topCount > 0) {
                const h = Math.max(4, (topCount / maxVal) * armH);
                const y = midY - h;
                const tip = `${b.name} (${b.label}): ${topCount} Win(s)`;
                res += `
                <rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${actualW.toFixed(1)}" height="${h.toFixed(1)}" rx="3" fill="url(#win-ltr-${chartId})" opacity="0.95" class="chart-point" data-tip="${tip}" />
                <text x="${centerX.toFixed(1)}" y="${(y - 4).toFixed(1)}" fill="#38bdf8" font-size="10" font-weight="bold" text-anchor="middle" font-family="monospace">${topCount}</text>
                `;
            }

            // Bottom bar: 50/50 Losses with Left-to-Right Gradient
            if (isEvent && b.losses > 0) {
                const h = Math.max(4, (b.losses / maxVal) * armH);
                const y = midY;
                const tip = `${b.name} (${b.label}): ${b.losses} Loss(es)`;
                res += `
                <rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${actualW.toFixed(1)}" height="${h.toFixed(1)}" rx="3" fill="url(#loss-ltr-${chartId})" opacity="0.9" class="chart-point" data-tip="${tip}" />
                <text x="${centerX.toFixed(1)}" y="${(y + h + 11).toFixed(1)}" fill="#f87171" font-size="10" font-weight="bold" text-anchor="middle" font-family="monospace">${b.losses}</text>
                `;
            }

            // X-Axis bracket label
            res += `
            <text x="${centerX.toFixed(1)}" y="${(height - 4).toFixed(1)}" fill="#94a3b8" font-size="9" text-anchor="middle">${b.label}</text>
            `;

            return res;
        }).join('');

        return `<svg viewBox="0 0 ${width} ${height}" class="chart-svg" style="width:100%;height:100%;">
            <defs>
                <linearGradient id="win-ltr-${chartId}" gradientUnits="userSpaceOnUse" x1="${padL}" y1="0" x2="${width - padR}" y2="0">
                    <stop offset="0%" stop-color="#0284c7" />
                    <stop offset="50%" stop-color="#38bdf8" />
                    <stop offset="100%" stop-color="#34d399" />
                </linearGradient>
                <linearGradient id="loss-ltr-${chartId}" gradientUnits="userSpaceOnUse" x1="${padL}" y1="0" x2="${width - padR}" y2="0">
                    <stop offset="0%" stop-color="#b91c1c" />
                    <stop offset="50%" stop-color="#ef4444" />
                    <stop offset="100%" stop-color="#fb923c" />
                </linearGradient>
            </defs>
            <line x1="${padL}" y1="${midY}" x2="${width - padR}" y2="${midY}" stroke="rgba(255,255,255,0.25)" stroke-width="1.5" />
            
            ${isEvent ? `
            <text x="${padL - 6}" y="${midY - 8}" fill="#34d399" font-size="9" font-weight="bold" text-anchor="end">▲ WIN</text>
            <text x="${padL - 6}" y="${midY + 15}" fill="#f87171" font-size="9" font-weight="bold" text-anchor="end">▼ LOSS</text>
            ` : `
            <text x="${padL - 6}" y="${midY - 8}" fill="#38bdf8" font-size="9" font-weight="bold" text-anchor="end">DROPS</text>
            `}
            ${bars}
        </svg>`;
    }

    function renderDonutSVG(wins, losses, label = "Win Rate") {
        const total = wins + losses;
        if (total === 0) return `<div class="chart-empty">No 50/50 recorded yet</div>`;

        const width = 280, height = 210, cx = 140, cy = 95, r = 58, strokeW = 20;
        const rate = ((wins / total) * 100).toFixed(1);
        const circ = 2 * Math.PI * r;
        const winOffset = circ * (1 - (wins / total));

        return `<svg viewBox="0 0 ${width} ${height}" class="chart-svg" style="width:100%;height:100%;">
            <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#f87171" stroke-width="${strokeW}" opacity="0.85" />
            <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#34d399" stroke-width="${strokeW}" 
                stroke-dasharray="${circ}" stroke-dashoffset="${winOffset}" 
                transform="rotate(-90 ${cx} ${cy})" stroke-linecap="round" />
            <text x="${cx}" y="${cy - 4}" fill="#ffffff" font-size="22" font-weight="800" text-anchor="middle" font-family="monospace">${rate}%</text>
            <text x="${cx}" y="${cy + 15}" fill="#94a3b8" font-size="10" text-anchor="middle" text-transform="uppercase" letter-spacing="0.05em">${label}</text>
            <text x="${cx}" y="${height - 10}" fill="#94a3b8" font-size="11" text-anchor="middle">
                <tspan fill="#34d399" font-weight="bold">● ${wins} Wins</tspan> &nbsp;|&nbsp; 
                <tspan fill="#f87171" font-weight="bold">● ${losses} Losses</tspan>
            </text>
        </svg>`;
    }

    function renderSmoothMonthlyVolumeSVG(items, chartId = "std") {
        if (!items || !items.length) return `<div class="chart-empty">No activity records recorded</div>`;
        const months = {};
        items.forEach(it => {
            const m = it.time ? it.time.substring(0, 7) : "Unknown";
            months[m] = (months[m] || 0) + 1;
        });

        // Retrieve up to 12 months (full annual window)
        const sortedMonths = Object.keys(months).sort().slice(-12);
        if (!sortedMonths.length) return `<div class="chart-empty">No activity records</div>`;

        // If only 1 month exists, pad with previous month at 0 for a curve
        let dataPoints = sortedMonths.map(m => ({ label: m, count: months[m] }));
        if (dataPoints.length === 1) {
            dataPoints.unshift({ label: "", count: 0 });
        }

        const width = 880, height = 220;
        const padL = 45, padR = 30, padT = 30, padB = 35;
        const chartW = width - padL - padR;
        const chartH = height - padT - padB;
        const maxPulls = Math.max(1, ...dataPoints.map(d => d.count));

        const coords = dataPoints.map((d, i) => {
            const x = padL + (i / (dataPoints.length - 1)) * chartW;
            const y = padT + chartH - (d.count / maxPulls) * chartH;
            return { x, y, ...d };
        });

        // Build smooth Catmull-Rom / Bézier spline path
        let pathD = `M ${coords[0].x.toFixed(1)},${coords[0].y.toFixed(1)}`;
        for (let i = 0; i < coords.length - 1; i++) {
            const p0 = coords[i === 0 ? 0 : i - 1];
            const p1 = coords[i];
            const p2 = coords[i + 1];
            const p3 = coords[i + 2] || p2;

            const cp1x = p1.x + (p2.x - p0.x) / 6;
            const cp1y = p1.y + (p2.y - p0.y) / 6;
            const cp2x = p2.x - (p3.x - p1.x) / 6;
            const cp2y = p2.y - (p3.y - p1.y) / 6;

            pathD += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
        }

        // Fill area under curve
        const areaD = `${pathD} L ${coords[coords.length - 1].x.toFixed(1)},${(padT + chartH).toFixed(1)} L ${coords[0].x.toFixed(1)},${(padT + chartH).toFixed(1)} Z`;

        // Generate glowing nodes and labels
        let nodesHtml = coords.map(p => {
            if (!p.label) return "";
            const monthText = p.label.length >= 7 ? p.label.substring(2) : p.label;
            const tip = `${p.label}: ${p.count} warp(s)`;
            return `
            <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4" fill="#38bdf8" stroke="#070a13" stroke-width="2" class="chart-point" data-tip="${tip}" />
            <text x="${p.x.toFixed(1)}" y="${(p.y - 10).toFixed(1)}" fill="#ffffff" font-size="10" font-weight="bold" font-family="monospace" text-anchor="middle">${p.count}</text>
            <text x="${p.x.toFixed(1)}" y="${(padT + chartH + 20).toFixed(1)}" fill="#94a3b8" font-size="10" font-family="monospace" text-anchor="middle">${monthText}</text>
            `;
        }).join('');

        return `<svg viewBox="0 0 ${width} ${height}" class="chart-svg" style="width:100%;height:100%;">
            <defs>
                <linearGradient id="curve-grad-${chartId}" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.35" />
                    <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.0" />
                </linearGradient>
            </defs>
            <line x1="${padL}" y1="${padT + chartH}" x2="${width - padR}" y2="${padT + chartH}" stroke="rgba(255,255,255,0.12)" stroke-width="1.5" />
            <line x1="${padL}" y1="${padT}" x2="${padL}" y2="${padT + chartH}" stroke="rgba(255,255,255,0.12)" stroke-width="1.5" />
            <path d="${areaD}" fill="url(#curve-grad-${chartId})" />
            <path d="${pathD}" fill="none" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round" />
            ${nodesHtml}
        </svg>`;
    }

    function renderMonthlyActivitySVG(items) {
        if (!items || !items.length) return `<div class="chart-empty">No activity records</div>`;
        const months = {};
        items.forEach(it => {
            const m = it.time ? it.time.substring(0, 7) : "Unknown";
            months[m] = (months[m] || 0) + 1;
        });

        const sortedMonths = Object.keys(months).sort().slice(-8);
        if (!sortedMonths.length) return `<div class="chart-empty">No activity records</div>`;

        const width = 380, height = 210, padL = 30, padR = 20, padT = 30, padB = 30;
        const chartW = width - padL - padR;
        const chartH = height - padT - padB;
        const maxPulls = Math.max(1, ...sortedMonths.map(m => months[m]));
        const barW = chartW / sortedMonths.length;

        let bars = sortedMonths.map((m, i) => {
            const cnt = months[m];
            const h = (cnt / maxPulls) * chartH;
            const x = padL + i * barW + 6;
            const y = padT + chartH - h;
            const actualW = barW - 12;
            const lbl = m.length >= 7 ? m.substring(2) : m;
            const tipTxt = `${m}: ${cnt} pulls`;

            return `
            <rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${actualW.toFixed(1)}" height="${Math.max(2, h).toFixed(1)}" rx="3" fill="#38bdf8" opacity="0.85" class="chart-point" data-tip="${tipTxt}" />
            <text x="${(x + actualW/2).toFixed(1)}" y="${(y - 5).toFixed(1)}" fill="#ffffff" font-size="10" font-weight="bold" text-anchor="middle" font-family="monospace">${cnt}</text>
            <text x="${(x + actualW/2).toFixed(1)}" y="${(padT + chartH + 16).toFixed(1)}" fill="#94a3b8" font-size="9" text-anchor="middle">${lbl}</text>
            `;
        }).join('');

        return `<svg viewBox="0 0 ${width} ${height}" class="chart-svg" style="width:100%;height:100%;">
            <line x1="${padL}" y1="${padT + chartH}" x2="${width - padR}" y2="${padT + chartH}" stroke="rgba(255,255,255,0.15)" />
            ${bars}
        </svg>`;
    }

    // ==========================================
    // 7. DEEP FILTER & SORT HANDLER
    // ==========================================
    function applyTableFilter(tableId) {
        const state = tableFilters[tableId] || { rarity: 'all', outcome: 'all', search: '', sort: 'date_desc' };
        const tbody = document.getElementById(tableId);
        if (!tbody) return;

        // Remove any existing empty-state row first
        const existingEmpty = tbody.querySelector('.filter-empty-row');
        if (existingEmpty) existingEmpty.remove();

        let rows = Array.from(tbody.querySelectorAll('tr:not(.filter-empty-row)'));
        let visibleCount = 0;

        rows.forEach(r => {
            const rank = r.getAttribute('data-rank') || '';
            const outcome = r.getAttribute('data-outcome') || '';
            const name = (r.getAttribute('data-name') || '').toLowerCase();

            let matchRarity = (state.rarity === 'all') || (state.rarity === rank);
            let matchOutcome = (state.outcome === 'all') || (state.outcome === outcome);
            let matchSearch = !state.search || name.includes(state.search);

            if (matchRarity && matchOutcome && matchSearch) {
                r.style.display = '';
                visibleCount++;
            } else {
                r.style.display = 'none';
            }
        });

        if (visibleCount === 0 && rows.length > 0) {
            const table = tbody.closest('table');
            const colCount = table ? table.querySelectorAll('thead th').length : 5;
            const emptyTr = document.createElement('tr');
            emptyTr.className = 'filter-empty-row';
            emptyTr.innerHTML = `
                <td colspan="${colCount}" class="empty-filter-cell">
                    <div class="empty-filter-icon">🔍</div>
                    <div style="font-weight:700; color:var(--text-main); margin-bottom:4px;">No matching records found</div>
                    <div>No pulls match the active rarity, outcome, or search filters.</div>
                </td>`;
            tbody.appendChild(emptyTr);
            return;
        }

        let visibleRows = rows.filter(r => r.style.display !== 'none');
        visibleRows.sort((a, b) => {
            const pityA = parseInt(a.getAttribute('data-pity') || '0');
            const pityB = parseInt(b.getAttribute('data-pity') || '0');
            const dateA = a.getAttribute('data-date') || '';
            const dateB = b.getAttribute('data-date') || '';

            if (state.sort === 'pity_desc') return pityB - pityA;
            if (state.sort === 'pity_asc') return pityA - pityB;
            if (state.sort === 'date_asc') return dateA.localeCompare(dateB);
            return dateB.localeCompare(dateA);
        });

        visibleRows.forEach(r => tbody.appendChild(r));
    }

    function setFilterRarity(btn, tableId, rarity) {
        if (!tableFilters[tableId]) tableFilters[tableId] = { rarity: 'all', outcome: 'all', search: '', sort: 'date_desc' };
        tableFilters[tableId].rarity = rarity;
        btn.parentElement.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        applyTableFilter(tableId);
    }

    function setFilterOutcome(btn, tableId, outcome) {
        if (!tableFilters[tableId]) tableFilters[tableId] = { rarity: 'all', outcome: 'all', search: '', sort: 'date_desc' };
        tableFilters[tableId].outcome = outcome;
        btn.parentElement.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        applyTableFilter(tableId);
    }

    function setSearchQuery(input, tableId) {
        if (!tableFilters[tableId]) tableFilters[tableId] = { rarity: 'all', outcome: 'all', search: '', sort: 'date_desc' };
        tableFilters[tableId].search = input.value.toLowerCase().trim();
        applyTableFilter(tableId);
    }

    function setSortOrder(select, tableId) {
        if (!tableFilters[tableId]) tableFilters[tableId] = { rarity: 'all', outcome: 'all', search: '', sort: 'date_desc' };
        tableFilters[tableId].sort = select.value;
        applyTableFilter(tableId);
    }

    function getLuckStatus(pity, isLc) {
        let soft = isLc ? HSR_CONFIG.LC_SOFT : HSR_CONFIG.CHAR_SOFT;
        let hard = isLc ? HSR_CONFIG.LC_HARD : HSR_CONFIG.CHAR_HARD;
        if (pity <= 10) return ["TOP 1% 💎", "god"];
        if (pity <= 40) return ["LUCKY 🍀", "lucky"];
        if (pity < soft) return ["EARLY ⚡", "early"];
        if (pity < hard) return ["SOFT PITY ⚠️", "soft"];
        return ["HARD PITY 💀", "hard"];
    }

    // ==========================================
