// Werkbonnen Management

let werkbonnen = [];
let filteredWerkbonnen = [];

// Load all werkbonnen
async function loadWerkbonnen() {
    try {
        showLoading('Werkbonnen laden...');
        const data = await dbGetAll('werkbonnen');
        werkbonnen = data;
        
        // Sort by creation date descending
        werkbonnen.sort((a, b) => new Date(b.aanmaakDatum) - new Date(a.aanmaakDatum));
        
        filteredWerkbonnen = [...werkbonnen];
        populateYearFilter();
        renderWerkbonnen();
        hideLoading();
    } catch (error) {
        console.error('Error loading werkbonnen:', error);
        hideLoading();
        showToast('Fout bij het laden van werkbonnen', 'error');
    }
}

// Populate year filter
function populateYearFilter() {
    const jaarFilter = document.getElementById('jaarFilter');
    const years = [...new Set(werkbonnen.map(w => new Date(w.aanmaakDatum).getFullYear()))];
    years.sort((a, b) => b - a);
    
    const currentOptions = jaarFilter.innerHTML;
    jaarFilter.innerHTML = '<option value="">Alle jaren</option>' +
        years.map(year => `<option value="${year}">${year}</option>`).join('');
}

// Render werkbonnen table
function renderWerkbonnen() {
    const tbody = document.getElementById('werkbonnenTableBody');
    
    if (filteredWerkbonnen.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-state">Geen werkbonnen gevonden</td></tr>';
        return;
    }

    tbody.innerHTML = filteredWerkbonnen.map(werkbon => {
        const priorityClass = werkbon.prioriteit || 'normaal';
        const statusClass = werkbon.status || 'aangemaakt';
        
        return `
            <tr onclick="viewWerkbonDetail('${werkbon.id}')" style="cursor: pointer;">
                <td><strong>${werkbon.werkbonNummer}</strong></td>
                <td>${werkbon.pandAdres}</td>
                <td>${werkbon.titel}</td>
                <td><span class="priority-badge ${priorityClass}">${capitalizeFirst(werkbon.prioriteit || 'normaal')}</span></td>
                <td><span class="status-badge ${statusClass}">${capitalizeFirst(werkbon.status || 'aangemaakt')}</span></td>
                <td>${new Date(werkbon.aanmaakDatum).toLocaleDateString('nl-NL')}</td>
                <td>€${parseFloat(werkbon.werkelijkeKosten || werkbon.geschatteKosten || 0).toLocaleString('nl-NL')}</td>
                <td onclick="event.stopPropagation();">
                    <button class="action-btn" onclick="downloadWerkbon('${werkbon.id}')" title="Download">💾</button>
                    <button class="action-btn" onclick="printWerkbon('${werkbon.id}')" title="Print">🖨️</button>
                    <button class="action-btn" onclick="resendWerkbon('${werkbon.id}')" title="Opnieuw versturen">📧</button>
                </td>
            </tr>
        `;
    }).join('');
}

// View werkbon detail
function viewWerkbonDetail(werkbonId) {
    const werkbon = werkbonnen.find(w => w.id === werkbonId);
    if (!werkbon) return;
    
    // Create detail panel with werkbon info
    const detailHTML = `
        <div class="detail-panel-header">
            <h2>📋 Werkbon ${werkbon.werkbonNummer}</h2>
            <button class="detail-panel-close" onclick="closeWerkbonDetail()">×</button>
        </div>
        <div class="detail-panel-body">
            <div class="detail-section">
                <div class="detail-section-title">📍 Locatie</div>
                <div class="detail-row">
                    <div class="detail-label">Adres</div>
                    <div class="detail-value"><strong>${werkbon.pandAdres}</strong></div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Postcode</div>
                    <div class="detail-value">${werkbon.pandPostcode}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Plaats</div>
                    <div class="detail-value">${werkbon.pandPlaats}</div>
                </div>
            </div>

            ${werkbon.huurderNaam ? `
            <div class="detail-section">
                <div class="detail-section-title">👤 Huurder</div>
                <div class="detail-row">
                    <div class="detail-label">Naam</div>
                    <div class="detail-value">${werkbon.huurderNaam}</div>
                </div>
                ${werkbon.huurderTelefoon ? `
                <div class="detail-row">
                    <div class="detail-label">Telefoon</div>
                    <div class="detail-value">${werkbon.huurderTelefoon}</div>
                </div>
                ` : ''}
                ${werkbon.huurderEmail ? `
                <div class="detail-row">
                    <div class="detail-label">Email</div>
                    <div class="detail-value">${werkbon.huurderEmail}</div>
                </div>
                ` : ''}
            </div>
            ` : ''}

            <div class="detail-section">
                <div class="detail-section-title">🔧 Werkzaamheden</div>
                <div class="detail-row">
                    <div class="detail-label">Titel</div>
                    <div class="detail-value"><strong>${werkbon.titel}</strong></div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Prioriteit</div>
                    <div class="detail-value"><span class="priority-badge ${werkbon.prioriteit}">${capitalizeFirst(werkbon.prioriteit)}</span></div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Status</div>
                    <div class="detail-value"><span class="status-badge ${werkbon.status}">${capitalizeFirst(werkbon.status)}</span></div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Beschrijving</div>
                    <div class="detail-value">${werkbon.beschrijving}</div>
                </div>
            </div>

            ${werkbon.onderhoudsBedrijf ? `
            <div class="detail-section">
                <div class="detail-section-title">🏢 Onderhoudsbedrijf</div>
                <div class="detail-row">
                    <div class="detail-label">Bedrijf</div>
                    <div class="detail-value">${werkbon.onderhoudsBedrijf}</div>
                </div>
                ${werkbon.contactPersoon ? `
                <div class="detail-row">
                    <div class="detail-label">Contact</div>
                    <div class="detail-value">${werkbon.contactPersoon}</div>
                </div>
                ` : ''}
                ${werkbon.contactTelefoon ? `
                <div class="detail-row">
                    <div class="detail-label">Telefoon</div>
                    <div class="detail-value">${werkbon.contactTelefoon}</div>
                </div>
                ` : ''}
            </div>
            ` : ''}

            <div class="detail-section">
                <div class="detail-section-title">💰 Financieel</div>
                <div class="detail-row">
                    <div class="detail-label">Geschatte kosten</div>
                    <div class="detail-value">€${parseFloat(werkbon.geschatteKosten || 0).toLocaleString('nl-NL', { minimumFractionDigits: 2 })}</div>
                </div>
                ${werkbon.werkelijkeKosten ? `
                <div class="detail-row">
                    <div class="detail-label">Werkelijke kosten</div>
                    <div class="detail-value"><strong style="font-size: 18px; color: var(--primary-color);">€${parseFloat(werkbon.werkelijkeKosten).toLocaleString('nl-NL', { minimumFractionDigits: 2 })}</strong></div>
                </div>
                ` : ''}
            </div>

            <div class="detail-section">
                <div class="detail-section-title">📅 Data</div>
                <div class="detail-row">
                    <div class="detail-label">Aangemaakt</div>
                    <div class="detail-value">${new Date(werkbon.aanmaakDatum).toLocaleDateString('nl-NL')}</div>
                </div>
                ${werkbon.verstuurdDatum ? `
                <div class="detail-row">
                    <div class="detail-label">Verstuurd</div>
                    <div class="detail-value">${new Date(werkbon.verstuurdDatum).toLocaleDateString('nl-NL')}</div>
                </div>
                ` : ''}
                ${werkbon.geplanddatum ? `
                <div class="detail-row">
                    <div class="detail-label">Gepland</div>
                    <div class="detail-value">${new Date(werkbon.geplanddatum).toLocaleDateString('nl-NL')}</div>
                </div>
                ` : ''}
                ${werkbon.uitgevoerdDatum ? `
                <div class="detail-row">
                    <div class="detail-label">Uitgevoerd</div>
                    <div class="detail-value">${new Date(werkbon.uitgevoerdDatum).toLocaleDateString('nl-NL')}</div>
                </div>
                ` : ''}
            </div>
        </div>
        <div class="detail-actions">
            <button class="btn-secondary" onclick="downloadWerkbon('${werkbon.id}')">
                💾 Download
            </button>
            <button class="btn-secondary" onclick="printWerkbon('${werkbon.id}')">
                🖨️ Print
            </button>
            <button class="btn-primary" onclick="resendWerkbon('${werkbon.id}')">
                📧 Opnieuw Versturen
            </button>
            <button class="btn-secondary" onclick="closeWerkbonDetail()">
                Sluiten
            </button>
        </div>
    `;

    // Show in panel
    const existingPanel = document.getElementById('werkbonDetailPanel');
    if (existingPanel) existingPanel.remove();

    const existingOverlay = document.getElementById('werkbonDetailOverlay');
    if (existingOverlay) existingOverlay.remove();

    const overlay = document.createElement('div');
    overlay.className = 'detail-panel-overlay';
    overlay.id = 'werkbonDetailOverlay';
    overlay.onclick = closeWerkbonDetail;

    const panel = document.createElement('div');
    panel.className = 'detail-panel';
    panel.id = 'werkbonDetailPanel';
    panel.innerHTML = detailHTML;

    document.body.appendChild(overlay);
    document.body.appendChild(panel);

    setTimeout(() => {
        overlay.classList.add('show');
        panel.classList.add('show');
    }, 10);
}

// Close werkbon detail
function closeWerkbonDetail() {
    const panel = document.getElementById('werkbonDetailPanel');
    const overlay = document.getElementById('werkbonDetailOverlay');

    if (panel) {
        panel.classList.remove('show');
        overlay.classList.remove('show');

        setTimeout(() => {
            panel.remove();
            overlay.remove();
        }, 300);
    }
}

// Resend werkbon
async function resendWerkbon(werkbonId) {
    const werkbon = werkbonnen.find(w => w.id === werkbonId);
    if (!werkbon) return;

    // Show send modal similar to onderhoud.js
    const modalHTML = `
        <div id="resendWerkbonModal" class="modal show" style="display: flex;">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>📧 Werkbon Versturen</h2>
                    <button class="close-btn" onclick="closeResendModal()">&times;</button>
                </div>
                
                <div style="padding: 24px;">
                    <p style="margin-bottom: 20px;">Selecteer de ontvangers voor werkbon ${werkbon.werkbonNummer}:</p>
                    
                    <div style="margin-bottom: 20px;">
                        <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                            <input type="checkbox" id="resendToHuurder" ${werkbon.huurderEmail ? 'checked' : 'disabled'}>
                            <span>Verstuur naar huurder ${werkbon.huurderEmail ? '(' + werkbon.huurderEmail + ')' : '(geen email)'}</span>
                        </label>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                            <input type="checkbox" id="resendToOnderhoudsBedrijf" ${werkbon.onderhoudsBedrijf ? 'checked' : ''}>
                            <span>Verstuur naar onderhoudsbedrijf</span>
                        </label>
                        <div id="resendOnderhoudsBedrijfFields" style="margin-top: 10px; padding-left: 30px; ${werkbon.onderhoudsBedrijf ? 'display: block;' : 'display: none;'}">
                            <div class="form-group">
                                <label>Bedrijfsnaam</label>
                                <input type="text" id="resendOnderhoudsBedrijf" value="${werkbon.onderhoudsBedrijf || ''}" placeholder="Naam onderhoudsbedrijf">
                            </div>
                            <div class="form-group">
                                <label>Email *</label>
                                <input type="email" id="resendOnderhoudsBedrijfEmail" placeholder="email@onderhoudsbedrijf.nl">
                            </div>
                        </div>
                    </div>
                </div>

                <div class="modal-footer">
                    <button type="button" class="btn-secondary" onclick="closeResendModal()">
                        Annuleren
                    </button>
                    <button type="button" class="btn-primary" onclick="sendResendWerkbon('${werkbon.id}')">
                        📧 Verstuur
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    document.getElementById('resendToOnderhoudsBedrijf').addEventListener('change', (e) => {
        document.getElementById('resendOnderhoudsBedrijfFields').style.display = e.target.checked ? 'block' : 'none';
    });
}

// Close resend modal
function closeResendModal() {
    const modal = document.getElementById('resendWerkbonModal');
    if (modal) modal.remove();
}

// Send resend werkbon
async function sendResendWerkbon(werkbonId) {
    try {
        const sendToHuurder = document.getElementById('resendToHuurder').checked;
        const sendToOnderhoudsBedrijf = document.getElementById('resendToOnderhoudsBedrijf').checked;

        if (!sendToHuurder && !sendToOnderhoudsBedrijf) {
            showToast('Selecteer minimaal één ontvanger', 'error');
            return;
        }

        const options = {
            sendToHuurder,
            sendToOnderhoudsBedrijf,
            saveToSharePoint: true
        };

        if (sendToOnderhoudsBedrijf) {
            const bedrijfEmail = document.getElementById('resendOnderhoudsBedrijfEmail').value.trim();
            
            if (!bedrijfEmail) {
                showToast('Vul email in', 'error');
                return;
            }

            options.onderhoudsBedrijfEmail = bedrijfEmail;
        }

        showLoading('Werkbon versturen...');
        
        await sendWerkbon(werkbonId, options);
        
        hideLoading();
        closeResendModal();
        closeWerkbonDetail();
        loadWerkbonnen();

    } catch (error) {
        hideLoading();
        console.error('Error resending werkbon:', error);
    }
}

// Filters
document.getElementById('statusFilter').addEventListener('change', applyFilters);
document.getElementById('jaarFilter').addEventListener('change', applyFilters);
document.getElementById('searchInput').addEventListener('input', applyFilters);

function applyFilters() {
    const statusFilter = document.getElementById('statusFilter').value;
    const jaarFilter = document.getElementById('jaarFilter').value;
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();

    filteredWerkbonnen = werkbonnen.filter(werkbon => {
        const matchesStatus = !statusFilter || werkbon.status === statusFilter;
        const matchesYear = !jaarFilter || new Date(werkbon.aanmaakDatum).getFullYear().toString() === jaarFilter;
        const matchesSearch = !searchTerm || 
            werkbon.werkbonNummer.toLowerCase().includes(searchTerm) ||
            werkbon.pandAdres.toLowerCase().includes(searchTerm) ||
            werkbon.titel.toLowerCase().includes(searchTerm);

        return matchesStatus && matchesYear && matchesSearch;
    });

    renderWerkbonnen();
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await ensureAuthenticated();
        await loadWerkbonnen();
        
        // Check if there's a werkbon ID in the hash
        const hash = window.location.hash.substring(1);
        if (hash) {
            // Give it a moment for data to load
            setTimeout(() => {
                const werkbon = werkbonnen.find(w => w.id === hash);
                if (werkbon) {
                    viewWerkbonDetail(hash);
                } else {
                    showToast('Werkbon niet gevonden', 'error');
                }
                // Clear hash
                history.replaceState(null, null, 'werkbonnen.html');
            }, 500);
        }
    } catch (error) {
        console.error('Initialization error:', error);
    }
});

// Export functions
window.viewWerkbonDetail = viewWerkbonDetail;
window.closeWerkbonDetail = closeWerkbonDetail;
window.resendWerkbon = resendWerkbon;
window.closeResendModal = closeResendModal;
window.sendResendWerkbon = sendResendWerkbon;
