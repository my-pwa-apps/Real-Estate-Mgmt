// Detail Panel - Universal detail viewer for all entities
// Provides a slide-in panel with comprehensive information

let currentDetailPanel = null;

/**
 * Show detail panel with entity information
 * @param {string} entityType - Type of entity (pand, huurder, contract, etc.)
 * @param {object} data - Entity data to display
 */
function showDetailPanel(entityType, data) {
    // Remove existing panel if any
    closeDetailPanel();

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'detail-panel-overlay';
    overlay.id = 'detailPanelOverlay';
    overlay.onclick = closeDetailPanel;

    // Create panel
    const panel = document.createElement('div');
    panel.className = 'detail-panel';
    panel.id = 'detailPanel';

    // Generate content based on entity type
    let content = '';
    switch (entityType) {
        case 'pand':
            content = generatePandDetail(data);
            break;
        case 'huurder':
            content = generateHuurderDetail(data);
            break;
        case 'contract':
            content = generateContractDetail(data);
            break;
        case 'onderhoud':
            content = generateOnderhoudDetail(data);
            break;
        case 'transactie':
            content = generateTransactieDetail(data);
            break;
        default:
            content = generateGenericDetail(data);
    }

    panel.innerHTML = content;

    // Add to DOM
    document.body.appendChild(overlay);
    document.body.appendChild(panel);

    // Trigger animation
    setTimeout(() => {
        overlay.classList.add('show');
        panel.classList.add('show');
    }, 10);

    // Store reference
    currentDetailPanel = { panel, overlay, entityType, data };

    // Add event listeners
    document.getElementById('closePanelBtn').onclick = closeDetailPanel;
}

/**
 * Close detail panel
 */
function closeDetailPanel() {
    const panel = document.getElementById('detailPanel');
    const overlay = document.getElementById('detailPanelOverlay');

    if (panel) {
        panel.classList.remove('show');
        overlay.classList.remove('show');

        setTimeout(() => {
            panel.remove();
            overlay.remove();
        }, 300);
    }

    currentDetailPanel = null;
}

/**
 * Generate Pand detail view
 */
function generatePandDetail(pand) {
    const s = sanitizeHTML;
    const objectSoortLabel = pand.objectSoort ? capitalizeFirst(s(pand.objectSoort)) : 'Gebouw';
    return `
        <div class="detail-panel-header">
            <h2>🏢 Pand Details</h2>
            <button class="detail-panel-close" id="closePanelBtn">×</button>
        </div>
        <div class="detail-panel-body">
            <div class="detail-section">
                <div class="detail-section-title">📍 Locatie</div>
                <div class="detail-row">
                    <div class="detail-label">Adres</div>
                    <div class="detail-value"><strong>${s(pand.adres)}</strong></div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Postcode</div>
                    <div class="detail-value">${s(pand.postcode)}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Plaats</div>
                    <div class="detail-value">${s(pand.plaats)}</div>
                </div>
            </div>

            <div class="detail-section">
                <div class="detail-section-title">🏗️ Eigenschappen</div>
                <div class="detail-row">
                    <div class="detail-label">Objectsoort</div>
                    <div class="detail-value"><strong>${objectSoortLabel}</strong></div>
                </div>
                ${pand.objectNummer ? `
                <div class="detail-row">
                    <div class="detail-label">Objectnummer</div>
                    <div class="detail-value">${s(pand.objectNummer)}</div>
                </div>
                ` : ''}
                ${pand.parentObjectAdres ? `
                <div class="detail-row">
                    <div class="detail-label">Bovenliggend object</div>
                    <div class="detail-value">${s(pand.parentObjectAdres)}</div>
                </div>
                ` : ''}
                <div class="detail-row">
                    <div class="detail-label">Type</div>
                    <div class="detail-value"><span class="status-badge ${s(pand.type)}">${pand.type === 'bedrijfspand' ? 'Bedrijfspand' : 'Woning'}</span></div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Status</div>
                    <div class="detail-value"><span class="status-badge ${s(pand.status)}">${capitalizeFirst(s(pand.status))}</span></div>
                </div>
                ${pand.oppervlakte ? `
                <div class="detail-row">
                    <div class="detail-label">Oppervlakte</div>
                    <div class="detail-value">${pand.oppervlakte} m²</div>
                </div>
                ` : ''}
                ${pand.kamers ? `
                <div class="detail-row">
                    <div class="detail-label">Kamers</div>
                    <div class="detail-value">${pand.kamers}</div>
                </div>
                ` : ''}
                ${pand.bouwjaar ? `
                <div class="detail-row">
                    <div class="detail-label">Bouwjaar</div>
                    <div class="detail-value">${pand.bouwjaar}</div>
                </div>
                ` : ''}
                ${pand.energielabel ? `
                <div class="detail-row">
                    <div class="detail-label">Energielabel</div>
                    <div class="detail-value"><strong>${s(pand.energielabel)}</strong></div>
                </div>
                ` : ''}
                ${pand.bagId ? `
                <div class="detail-row">
                    <div class="detail-label">BAG ID</div>
                    <div class="detail-value">${s(pand.bagId)}</div>
                </div>
                ` : ''}
            </div>

            <div class="detail-section">
                <div class="detail-section-title">💰 Financieel</div>
                <div class="detail-row">
                    <div class="detail-label">Huurprijs</div>
                    <div class="detail-value"><strong style="font-size: 18px; color: var(--primary-color);">€${parseFloat(pand.huurprijs).toLocaleString('nl-NL')}</strong> / maand</div>
                </div>
                ${pand.streefhuur ? `
                <div class="detail-row">
                    <div class="detail-label">Streefhuur</div>
                    <div class="detail-value">€${parseFloat(pand.streefhuur).toLocaleString('nl-NL')} / maand</div>
                </div>
                ` : ''}
            </div>

            ${(pand.ownerNaam || pand.beheerderNaam) ? `
            <div class="detail-section">
                <div class="detail-section-title">🤝 Relaties</div>
                ${pand.ownerNaam ? `
                <div class="detail-row">
                    <div class="detail-label">Eigenaar</div>
                    <div class="detail-value">${s(pand.ownerNaam)}</div>
                </div>
                ` : ''}
                ${pand.beheerderNaam ? `
                <div class="detail-row">
                    <div class="detail-label">Beheerder</div>
                    <div class="detail-value">${s(pand.beheerderNaam)}</div>
                </div>
                ` : ''}
            </div>
            ` : ''}

            ${pand.beschrijving ? `
            <div class="detail-section">
                <div class="detail-section-title">📝 Beschrijving</div>
                <p style="color: var(--text-secondary); line-height: 1.6;">${s(pand.beschrijving)}</p>
            </div>
            ` : ''}

            ${pand.createdAt ? `
            <div class="detail-section">
                <div class="detail-section-title">ℹ️ Metadata</div>
                <div class="detail-row">
                    <div class="detail-label">Toegevoegd</div>
                    <div class="detail-value">${new Date(pand.createdAt).toLocaleDateString('nl-NL', { 
                        day: 'numeric', 
                        month: 'long', 
                        year: 'numeric' 
                    })}</div>
                </div>
            </div>
            ` : ''}
        </div>
        <div class="detail-actions">
            <button class="btn-primary" onclick="editPand('${pand.id}'); closeDetailPanel();">
                ✏️ Bewerken
            </button>
            <button class="btn-secondary" onclick="closeDetailPanel()">
                Sluiten
            </button>
        </div>
    `;
}

/**
 * Generate Huurder detail view
 */
function generateHuurderDetail(huurder) {
    const s = sanitizeHTML;
    return `
        <div class="detail-panel-header">
            <h2>👤 Huurder Details</h2>
            <button class="detail-panel-close" id="closePanelBtn">×</button>
        </div>
        <div class="detail-panel-body">
            <div class="detail-section">
                <div class="detail-section-title">👤 Persoonlijke Gegevens</div>
                <div class="detail-row">
                    <div class="detail-label">Naam</div>
                    <div class="detail-value"><strong>${s(huurder.voornaam)} ${s(huurder.achternaam)}</strong></div>
                </div>
                ${huurder.geboortedatum ? `
                <div class="detail-row">
                    <div class="detail-label">Geboortedatum</div>
                    <div class="detail-value">${new Date(huurder.geboortedatum).toLocaleDateString('nl-NL', { 
                        day: 'numeric', 
                        month: 'long', 
                        year: 'numeric' 
                    })}</div>
                </div>
                ` : ''}
            </div>

            <div class="detail-section">
                <div class="detail-section-title">📞 Contactgegevens</div>
                <div class="detail-row">
                    <div class="detail-label">Email</div>
                    <div class="detail-value"><a href="mailto:${s(huurder.email)}" style="color: var(--primary-color);">${s(huurder.email)}</a></div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Telefoon</div>
                    <div class="detail-value"><a href="tel:${s(huurder.telefoon)}" style="color: var(--primary-color);">${s(huurder.telefoon)}</a></div>
                </div>
            </div>

            ${huurder.notities ? `
            <div class="detail-section">
                <div class="detail-section-title">📝 Notities</div>
                <p style="color: var(--text-secondary); line-height: 1.6;">${s(huurder.notities)}</p>
            </div>
            ` : ''}

            ${huurder.createdAt ? `
            <div class="detail-section">
                <div class="detail-section-title">ℹ️ Metadata</div>
                <div class="detail-row">
                    <div class="detail-label">Toegevoegd</div>
                    <div class="detail-value">${new Date(huurder.createdAt).toLocaleDateString('nl-NL', { 
                        day: 'numeric', 
                        month: 'long', 
                        year: 'numeric' 
                    })}</div>
                </div>
            </div>
            ` : ''}
        </div>
        <div class="detail-actions">
            <button class="btn-primary" onclick="editHuurder('${huurder.id}'); closeDetailPanel();">
                ✏️ Bewerken
            </button>
            <button class="btn-secondary" onclick="closeDetailPanel()">
                Sluiten
            </button>
        </div>
    `;
}

/**
 * Generate Contract detail view
 */
function generateContractDetail(contract) {
    const s = sanitizeHTML;
    return `
        <div class="detail-panel-header">
            <h2>📄 Contract Details</h2>
            <button class="detail-panel-close" id="closePanelBtn">×</button>
        </div>
        <div class="detail-panel-body">
            <div class="detail-section">
                <div class="detail-section-title">📋 Contract Informatie</div>
                ${contract.contractTypeLabel ? `
                <div class="detail-row">
                    <div class="detail-label">Contracttype</div>
                    <div class="detail-value">${s(contract.contractTypeLabel)}</div>
                </div>
                ` : ''}
                ${contract.contractFaseLabel ? `
                <div class="detail-row">
                    <div class="detail-label">Fase</div>
                    <div class="detail-value">${s(contract.contractFaseLabel)}</div>
                </div>
                ` : ''}
                <div class="detail-row">
                    <div class="detail-label">Status</div>
                    <div class="detail-value"><span class="status-badge ${s(contract.status)}">${capitalizeFirst(s(contract.status))}</span></div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Startdatum</div>
                    <div class="detail-value">${new Date(contract.startdatum).toLocaleDateString('nl-NL')}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Einddatum</div>
                    <div class="detail-value">${new Date(contract.einddatum).toLocaleDateString('nl-NL')}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Huurprijs</div>
                    <div class="detail-value"><strong style="font-size: 18px; color: var(--primary-color);">€${parseFloat(contract.huurprijs).toLocaleString('nl-NL')}</strong> / maand</div>
                </div>
                ${(contract.borg || contract.borgsom) ? `
                <div class="detail-row">
                    <div class="detail-label">Borgsom</div>
                    <div class="detail-value">€${parseFloat(contract.borg || contract.borgsom).toLocaleString('nl-NL')}</div>
                </div>
                ` : ''}
                ${contract.indexatieMethode ? `
                <div class="detail-row">
                    <div class="detail-label">Indexatiemethode</div>
                    <div class="detail-value">${s(contract.indexatieMethode)}</div>
                </div>
                ` : ''}
                ${contract.waarborgType ? `
                <div class="detail-row">
                    <div class="detail-label">Waarborgtype</div>
                    <div class="detail-value">${s(contract.waarborgType)}</div>
                </div>
                ` : ''}
                ${contract.contractReferentie ? `
                <div class="detail-row">
                    <div class="detail-label">Externe referentie</div>
                    <div class="detail-value">${s(contract.contractReferentie)}</div>
                </div>
                ` : ''}
            </div>

            ${(contract.voorwaarden || contract.opmerkingen) ? `
            <div class="detail-section">
                <div class="detail-section-title">📝 Voorwaarden</div>
                <p style="color: var(--text-secondary); line-height: 1.6;">${s(contract.voorwaarden || contract.opmerkingen)}</p>
            </div>
            ` : ''}
        </div>
        <div class="detail-actions">
            <button class="btn-primary" onclick="editContract('${contract.id}'); closeDetailPanel();">
                ✏️ Bewerken
            </button>
            <button class="btn-secondary" onclick="closeDetailPanel()">
                Sluiten
            </button>
        </div>
    `;
}

/**
 * Generate Onderhoud detail view
 */
function generateOnderhoudDetail(onderhoud) {
    const s = sanitizeHTML;
    return `
        <div class="detail-panel-header">
            <h2>🔧 Onderhoud Details</h2>
            <button class="detail-panel-close" id="closePanelBtn">×</button>
        </div>
        <div class="detail-panel-body">
            <div class="detail-section">
                <div class="detail-section-title">🔧 Melding Informatie</div>
                <div class="detail-row">
                    <div class="detail-label">Status</div>
                    <div class="detail-value"><span class="status-badge ${s(onderhoud.status)}">${capitalizeFirst(s(onderhoud.status))}</span></div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Prioriteit</div>
                    <div class="detail-value"><span class="priority-badge ${s(onderhoud.prioriteit)}">${capitalizeFirst(s(onderhoud.prioriteit))}</span></div>
                </div>
                ${onderhoud.categorie ? `
                <div class="detail-row">
                    <div class="detail-label">Categorie</div>
                    <div class="detail-value">${s(onderhoud.categorie)}</div>
                </div>
                ` : ''}
                ${onderhoud.probleemCategorie ? `
                <div class="detail-row">
                    <div class="detail-label">Probleemcategorie</div>
                    <div class="detail-value">${s(onderhoud.probleemCategorie)}</div>
                </div>
                ` : ''}
                ${onderhoud.kostenCategorie ? `
                <div class="detail-row">
                    <div class="detail-label">Kosten categorie</div>
                    <div class="detail-value">${s(onderhoud.kostenCategorie)}</div>
                </div>
                ` : ''}
                ${onderhoud.datum ? `
                <div class="detail-row">
                    <div class="detail-label">Datum</div>
                    <div class="detail-value">${new Date(onderhoud.datum).toLocaleDateString('nl-NL')}</div>
                </div>
                ` : ''}
            </div>

            <div class="detail-section">
                <div class="detail-section-title">📝 Beschrijving</div>
                <p style="color: var(--text-secondary); line-height: 1.6;">${s(onderhoud.beschrijving || 'Geen beschrijving')}</p>
            </div>

            ${onderhoud.kosten ? `
            <div class="detail-section">
                <div class="detail-section-title">💰 Kosten</div>
                <div class="detail-row">
                    <div class="detail-label">Bedrag</div>
                    <div class="detail-value"><strong style="font-size: 18px; color: var(--primary-color);">€${parseFloat(onderhoud.kosten).toLocaleString('nl-NL')}</strong></div>
                </div>
            </div>
            ` : ''}

            ${(onderhoud.uitvoerderNaam || onderhoud.melderNaam || onderhoud.externeReferentie) ? `
            <div class="detail-section">
                <div class="detail-section-title">🧾 Verwerking</div>
                ${onderhoud.uitvoerderNaam ? `
                <div class="detail-row">
                    <div class="detail-label">Uitvoerder</div>
                    <div class="detail-value">${s(onderhoud.uitvoerderNaam)}</div>
                </div>
                ` : ''}
                ${onderhoud.melderNaam ? `
                <div class="detail-row">
                    <div class="detail-label">Melder</div>
                    <div class="detail-value">${s(onderhoud.melderNaam)}${onderhoud.melderContact ? ` (${s(onderhoud.melderContact)})` : ''}</div>
                </div>
                ` : ''}
                ${onderhoud.externeReferentie ? `
                <div class="detail-row">
                    <div class="detail-label">Externe referentie</div>
                    <div class="detail-value">${s(onderhoud.externeReferentie)}</div>
                </div>
                ` : ''}
            </div>
            ` : ''}
        </div>
        <div class="detail-actions">
            ${!onderhoud.werkbonId ? `
            <button class="btn-primary" onclick="createWerkbon('${onderhoud.id}'); closeDetailPanel();" style="background: var(--success-color);">
                📄 Werkbon Aanmaken
            </button>
            ` : `
            <button class="btn-primary" onclick="viewExistingWerkbon('${onderhoud.werkbonId}'); closeDetailPanel();" style="background: var(--info-color);">
                📋 Bekijk Werkbon
            </button>
            `}
            <button class="btn-primary" onclick="editMelding('${onderhoud.id}'); closeDetailPanel();">
                ✏️ Bewerken
            </button>
            <button class="btn-secondary" onclick="closeDetailPanel()">
                Sluiten
            </button>
        </div>
    `;
}

/**
 * Generate Transactie detail view
 */
function generateTransactieDetail(transactie) {
    const s = sanitizeHTML;
    return `
        <div class="detail-panel-header">
            <h2>💰 Transactie Details</h2>
            <button class="detail-panel-close" id="closePanelBtn">×</button>
        </div>
        <div class="detail-panel-body">
            <div class="detail-section">
                <div class="detail-section-title">💳 Transactie Informatie</div>
                <div class="detail-row">
                    <div class="detail-label">Type</div>
                    <div class="detail-value"><span class="status-badge ${s(transactie.type)}">${capitalizeFirst(s(transactie.type))}</span></div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Bedrag</div>
                    <div class="detail-value"><strong style="font-size: 20px; color: ${transactie.type === 'inkomsten' ? 'var(--success-color)' : 'var(--danger-color)'};">${transactie.type === 'inkomsten' ? '+' : '-'} €${Math.abs(parseFloat(transactie.bedrag)).toLocaleString('nl-NL')}</strong></div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Datum</div>
                    <div class="detail-value">${new Date(transactie.datum).toLocaleDateString('nl-NL', { 
                        day: 'numeric', 
                        month: 'long', 
                        year: 'numeric' 
                    })}</div>
                </div>
                ${transactie.categorie ? `
                <div class="detail-row">
                    <div class="detail-label">Categorie</div>
                    <div class="detail-value">${s(transactie.categorie)}</div>
                </div>
                ` : ''}
            </div>

            ${transactie.beschrijving ? `
            <div class="detail-section">
                <div class="detail-section-title">📝 Beschrijving</div>
                <p style="color: var(--text-secondary); line-height: 1.6;">${s(transactie.beschrijving)}</p>
            </div>
            ` : ''}
        </div>
        <div class="detail-actions">
            <button class="btn-primary" onclick="editTransactie('${transactie.id}'); closeDetailPanel();">
                ✏️ Bewerken
            </button>
            <button class="btn-secondary" onclick="closeDetailPanel()">
                Sluiten
            </button>
        </div>
    `;
}

/**
 * Generate generic detail view
 */
function generateGenericDetail(data) {
    const s = sanitizeHTML;
    const rows = Object.entries(data)
        .filter(([key]) => key !== 'id')
        .map(([key, value]) => `
            <div class="detail-row">
                <div class="detail-label">${capitalizeFirst(s(key))}</div>
                <div class="detail-value">${s(String(value))}</div>
            </div>
        `).join('');

    return `
        <div class="detail-panel-header">
            <h2>📋 Details</h2>
            <button class="detail-panel-close" id="closePanelBtn">×</button>
        </div>
        <div class="detail-panel-body">
            <div class="detail-section">
                ${rows}
            </div>
        </div>
        <div class="detail-actions">
            <button class="btn-secondary" onclick="closeDetailPanel()">
                Sluiten
            </button>
        </div>
    `;
}

// Close panel on ESC key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && currentDetailPanel) {
        closeDetailPanel();
    }
});
