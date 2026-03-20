// Global Search - Search across all entities from any page

/**
 * Perform a global search across all entity types
 * @param {string} query - Search term
 * @returns {Array} - Array of results with entityType, entity data, and match description
 */
async function globalSearch(query) {
    if (!query || query.trim().length < 2) return [];
    
    const searchTerm = query.toLowerCase().trim();
    const results = [];

    try {
        const [pandenData, huurdersData, contractenData, onderhoudData, transactiesData, werkbonnenData] = await Promise.all([
            dbGetAll('panden'),
            dbGetAll('huurders'),
            dbGetAll('contracten'),
            dbGetAll('onderhoud'),
            dbGetAll('transacties'),
            dbGetAll('werkbonnen')
        ]);

        // Search panden
        pandenData.forEach(p => {
            const fields = [p.adres, p.postcode, p.plaats, p.type, p.beschrijving].filter(Boolean);
            const match = fields.find(f => f.toLowerCase().includes(searchTerm));
            if (match) {
                results.push({
                    entityType: 'pand',
                    id: p.id,
                    title: p.adres,
                    subtitle: `${p.postcode} ${p.plaats}`,
                    icon: '🏢',
                    badge: p.status,
                    badgeClass: p.status,
                    page: 'panden.html',
                    data: p
                });
            }
        });

        // Search huurders
        huurdersData.forEach(h => {
            const fields = [h.voornaam, h.achternaam, h.email, h.telefoon, h.notities].filter(Boolean);
            const match = fields.find(f => f.toLowerCase().includes(searchTerm));
            if (match) {
                results.push({
                    entityType: 'huurder',
                    id: h.id,
                    title: `${h.voornaam} ${h.achternaam}`,
                    subtitle: h.email,
                    icon: '👤',
                    badge: null,
                    page: 'huurders.html',
                    data: h
                });
            }
        });

        // Search contracten (by linked names)
        contractenData.forEach(c => {
            const huurder = huurdersData.find(h => h.id === c.huurderId);
            const pand = pandenData.find(p => p.id === c.pandId);
            const huurderNaam = huurder ? `${huurder.voornaam} ${huurder.achternaam}` : '';
            const pandAdres = pand ? pand.adres : '';
            const fields = [huurderNaam, pandAdres, c.voorwaarden].filter(Boolean);
            const match = fields.find(f => f.toLowerCase().includes(searchTerm));
            if (match) {
                results.push({
                    entityType: 'contract',
                    id: c.id,
                    title: `Contract: ${huurderNaam}`,
                    subtitle: pandAdres,
                    icon: '📄',
                    badge: null,
                    page: 'contracten.html',
                    data: c
                });
            }
        });

        // Search onderhoud
        onderhoudData.forEach(m => {
            const pand = pandenData.find(p => p.id === m.pandId);
            const pandAdres = pand ? pand.adres : '';
            const fields = [m.titel, m.beschrijving, pandAdres, m.notities].filter(Boolean);
            const match = fields.find(f => f.toLowerCase().includes(searchTerm));
            if (match) {
                results.push({
                    entityType: 'onderhoud',
                    id: m.id,
                    title: m.titel,
                    subtitle: pandAdres,
                    icon: '🔧',
                    badge: m.prioriteit,
                    badgeClass: m.prioriteit,
                    page: 'onderhoud.html',
                    data: m
                });
            }
        });

        // Search transacties
        transactiesData.forEach(t => {
            const fields = [t.beschrijving, t.omschrijving, t.categorie, t.notities].filter(Boolean);
            const match = fields.find(f => f.toLowerCase().includes(searchTerm));
            if (match) {
                results.push({
                    entityType: 'transactie',
                    id: t.id,
                    title: t.beschrijving || t.omschrijving,
                    subtitle: `€${parseFloat(t.bedrag).toLocaleString('nl-NL')} - ${t.datum}`,
                    icon: '💰',
                    badge: t.type,
                    badgeClass: t.type,
                    page: 'financieel.html',
                    data: t
                });
            }
        });

        // Search werkbonnen
        werkbonnenData.forEach(w => {
            const fields = [w.werkbonNummer, w.pandAdres, w.titel, w.beschrijving, w.huurderNaam, w.onderhoudsBedrijf].filter(Boolean);
            const match = fields.find(f => f.toLowerCase().includes(searchTerm));
            if (match) {
                results.push({
                    entityType: 'werkbon',
                    id: w.id,
                    title: w.werkbonNummer,
                    subtitle: `${w.pandAdres} - ${w.titel}`,
                    icon: '📋',
                    badge: w.status,
                    badgeClass: w.status,
                    page: 'werkbonnen.html',
                    data: w
                });
            }
        });

    } catch (error) {
        console.error('Global search error:', error);
    }

    return results;
}

/**
 * Initialize global search UI on the page
 */
function initGlobalSearch() {
    // Create search overlay
    const overlay = document.createElement('div');
    overlay.id = 'globalSearchOverlay';
    overlay.className = 'global-search-overlay';
    overlay.innerHTML = `
        <div class="global-search-modal">
            <div class="global-search-header">
                <span class="global-search-icon">🔍</span>
                <input type="text" id="globalSearchInput" placeholder="Zoek in alles... (panden, huurders, contracten, etc.)" autocomplete="off">
                <button class="global-search-close" onclick="closeGlobalSearch()">✕</button>
            </div>
            <div id="globalSearchResults" class="global-search-results">
                <p class="global-search-hint">Typ minimaal 2 tekens om te zoeken</p>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeGlobalSearch();
    });

    // Search input handler
    const input = document.getElementById('globalSearchInput');
    let searchTimeout;
    input.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            performGlobalSearch(e.target.value);
        }, 300);
    });

    // Keyboard shortcut: Ctrl+K or Cmd+K to open search
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            openGlobalSearch();
        }
        if (e.key === 'Escape' && overlay.classList.contains('show')) {
            closeGlobalSearch();
        }
    });
}

function openGlobalSearch() {
    const overlay = document.getElementById('globalSearchOverlay');
    overlay.classList.add('show');
    document.getElementById('globalSearchInput').focus();
    document.getElementById('globalSearchInput').value = '';
    document.getElementById('globalSearchResults').innerHTML = '<p class="global-search-hint">Typ minimaal 2 tekens om te zoeken</p>';
}

function closeGlobalSearch() {
    const overlay = document.getElementById('globalSearchOverlay');
    overlay.classList.remove('show');
}

async function performGlobalSearch(query) {
    const resultsContainer = document.getElementById('globalSearchResults');
    
    if (!query || query.trim().length < 2) {
        resultsContainer.innerHTML = '<p class="global-search-hint">Typ minimaal 2 tekens om te zoeken</p>';
        return;
    }

    resultsContainer.innerHTML = '<p class="global-search-hint">Zoeken...</p>';
    
    const results = await globalSearch(query);
    
    if (results.length === 0) {
        resultsContainer.innerHTML = `<p class="global-search-hint">Geen resultaten gevonden voor "${sanitizeHTML(query)}"</p>`;
        return;
    }

    const s = sanitizeHTML;
    resultsContainer.innerHTML = results.map(r => `
        <a href="${r.page}#${r.id}" class="global-search-result" onclick="closeGlobalSearch()">
            <span class="result-icon">${r.icon}</span>
            <div class="result-content">
                <div class="result-title">${s(r.title)}</div>
                <div class="result-subtitle">${s(r.subtitle || '')}</div>
            </div>
            ${r.badge ? `<span class="status-badge ${s(r.badgeClass || '')}">${s(r.badge)}</span>` : ''}
        </a>
    `).join('');
}

// Init on page load
document.addEventListener('DOMContentLoaded', () => {
    initGlobalSearch();
});

// Export
window.globalSearch = globalSearch;
window.openGlobalSearch = openGlobalSearch;
window.closeGlobalSearch = closeGlobalSearch;
