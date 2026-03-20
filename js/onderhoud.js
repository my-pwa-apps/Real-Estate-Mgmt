// Onderhoud Management

let meldingen = [];
let panden = [];
let filteredMeldingen = [];

function getProbleemCategorieLabel(categorie) {
    const labels = {
        bouwkundig: 'Bouwkundig',
        elektra: 'Elektra',
        installatie: 'Installatie',
        sanitair: 'Sanitair',
        veiligheid: 'Veiligheid',
        overig: 'Overig'
    };
    return labels[categorie] || capitalizeFirst(categorie || 'onbekend');
}

const modal = document.getElementById('meldingModal');
const addMeldingBtn = document.getElementById('addMeldingBtn');
const closeModal = document.getElementById('closeModal');
const cancelBtn = document.getElementById('cancelBtn');
const meldingForm = document.getElementById('meldingForm');

// Load all data
async function loadAllData() {
    try {
        showLoading('Gegevens laden...');
        const [meldingenData, pandenData] = await Promise.all([
            dbGetAll('onderhoud'),
            dbGetAll('panden')
        ]);

        meldingen = meldingenData;
        // Sort by creation date descending
        meldingen.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        
        panden = pandenData;

        filteredMeldingen = [...meldingen];
        populateDropdowns();
        renderMeldingen();
        hideLoading();
    } catch (error) {
        console.error('Error loading data:', error);
        hideLoading();
        showToast('Fout bij het laden van gegevens', 'error');
    }
}

// Populate dropdown lists
function populateDropdowns() {
    const pandSelect = document.getElementById('pandId');
    pandSelect.innerHTML = '<option value="">Selecteer pand</option>' +
        panden.map(p => `<option value="${p.id}">${p.adres}, ${p.plaats}</option>`).join('');
}

// Render meldingen as cards
function renderMeldingen() {
    const container = document.getElementById('meldingenGrid');
    
    if (filteredMeldingen.length === 0) {
        container.innerHTML = '<p class="empty-state">Geen onderhoudsmeldingen gevonden</p>';
        return;
    }

    container.innerHTML = filteredMeldingen.map(melding => {
        const pand = panden.find(p => p.id === melding.pandId);
        const priorityClass = melding.prioriteit || 'normaal';
        const statusClass = melding.status || 'nieuw';
        const s = sanitizeHTML;
        
        return `
            <div class="item-card" onclick="viewOnderhoudDetail('${melding.id}')">
                <div class="item-card-header">
                    <h3>${s(melding.titel)}</h3>
                    <div class="item-card-actions" onclick="event.stopPropagation();">
                        ${!isViewerRole() ? `${!melding.werkbonId ? `<span class="action-icon" onclick="createWerkbon('${melding.id}')" title="Werkbon Aanmaken">📄</span>` : `<span class="action-icon" style="opacity: 0.5;" title="Werkbon aangemaakt">✅</span>`}
                        <span class="action-icon" onclick="editMelding('${melding.id}')" title="Bewerken">✏️</span>
                        <span class="action-icon" onclick="deleteMelding('${melding.id}')" title="Verwijderen">🗑️</span>` : `${melding.werkbonId ? `<span class="action-icon" style="opacity: 0.5;" title="Werkbon aangemaakt">✅</span>` : ''}`}
                    </div>
                </div>
                <div class="item-card-body">
                    <p>🏢 ${pand ? s(pand.adres) : 'Onbekend pand'}</p>
                    ${melding.probleemCategorie ? `<p>🧩 ${s(getProbleemCategorieLabel(melding.probleemCategorie))}</p>` : ''}
                    <p style="margin-top: 8px;">${s(melding.beschrijving)}</p>
                    ${melding.geplande_datum ? `<p>📅 Gepland: ${new Date(melding.geplande_datum).toLocaleDateString('nl-NL')}</p>` : ''}
                    ${melding.kosten ? `<p>💰 Kosten: €${parseFloat(melding.kosten).toLocaleString('nl-NL')}</p>` : ''}
                    ${melding.uitvoerderNaam ? `<p>🏗️ Uitvoerder: ${s(melding.uitvoerderNaam)}</p>` : ''}
                </div>
                <div class="item-card-footer">
                    <span class="priority-badge ${s(priorityClass)}">${capitalizeFirst(s(melding.prioriteit || 'normaal'))}</span>
                    <span class="status-badge ${s(statusClass)}">${capitalizeFirst(s(melding.status || 'nieuw'))}</span>
                </div>
            </div>
        `;
    }).join('');
}

// Open modal for new melding
addMeldingBtn.addEventListener('click', () => {
    document.getElementById('modalTitle').textContent = 'Nieuwe Melding';
    meldingForm.reset();
    document.getElementById('meldingId').value = '';
    modal.classList.add('show');
});

// Close modal
function closeModalWindow() {
    modal.classList.remove('show');
}

closeModal.addEventListener('click', closeModalWindow);
cancelBtn.addEventListener('click', closeModalWindow);

modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModalWindow();
    }
});

// Save melding
meldingForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const meldingData = {
        pandId: document.getElementById('pandId').value,
        titel: document.getElementById('titel').value.trim(),
        beschrijving: document.getElementById('beschrijving').value.trim(),
        probleemCategorie: document.getElementById('probleemCategorie').value || null,
        prioriteit: document.getElementById('prioriteit').value,
        status: document.getElementById('status').value,
        kostenCategorie: document.getElementById('kostenCategorie').value || null,
        uitvoerderNaam: document.getElementById('uitvoerderNaam').value.trim() || null,
        geplande_datum: document.getElementById('geplanddatum').value || null,
        kosten: parseFloat(document.getElementById('kosten').value) || null,
        melderNaam: document.getElementById('melderNaam').value.trim() || null,
        melderContact: document.getElementById('melderContact').value.trim() || null,
        externeReferentie: document.getElementById('externeReferentie').value.trim() || null,
        notities: document.getElementById('notities').value.trim()
    };

    // Validate prioriteit against allowed values
    const validPrioriteiten = ['laag', 'normaal', 'hoog', 'urgent'];
    if (!validPrioriteiten.includes(meldingData.prioriteit)) {
        showToast('Ongeldige prioriteit geselecteerd', 'error');
        return;
    }

    // Validate status against allowed values
    const validStatuses = ['nieuw', 'in-behandeling', 'gepland', 'afgerond'];
    if (!validStatuses.includes(meldingData.status)) {
        showToast('Ongeldige status geselecteerd', 'error');
        return;
    }

    // Validate kosten is not negative
    if (meldingData.kosten !== null && meldingData.kosten < 0) {
        showToast('Kosten kunnen niet negatief zijn', 'error');
        return;
    }

    const meldingId = document.getElementById('meldingId').value;

    try {
        showLoading(meldingId ? 'Melding bijwerken...' : 'Melding opslaan...');
        if (meldingId) {
            await dbUpdate('onderhoud', meldingId, meldingData);
            showToast('Melding succesvol bijgewerkt', 'success');
        } else {
            await dbAdd('onderhoud', meldingData);
            showToast('Melding succesvol toegevoegd', 'success');
        }

        closeModalWindow();
        await loadAllData();
    } catch (error) {
        console.error('Error saving melding:', error);
        hideLoading();
        showToast('Fout bij het opslaan van de melding', 'error');
    }
});

// Edit melding
async function editMelding(id) {
    const melding = meldingen.find(m => m.id === id);
    if (!melding) return;

    document.getElementById('modalTitle').textContent = 'Melding Bewerken';
    document.getElementById('meldingId').value = melding.id;
    document.getElementById('pandId').value = melding.pandId;
    document.getElementById('titel').value = melding.titel;
    document.getElementById('beschrijving').value = melding.beschrijving;
    document.getElementById('probleemCategorie').value = melding.probleemCategorie || '';
    document.getElementById('prioriteit').value = melding.prioriteit || 'normaal';
    document.getElementById('status').value = melding.status || 'nieuw';
    document.getElementById('kostenCategorie').value = melding.kostenCategorie || '';
    document.getElementById('uitvoerderNaam').value = melding.uitvoerderNaam || '';
    document.getElementById('geplanddatum').value = melding.geplande_datum || '';
    document.getElementById('kosten').value = melding.kosten || '';
    document.getElementById('melderNaam').value = melding.melderNaam || '';
    document.getElementById('melderContact').value = melding.melderContact || '';
    document.getElementById('externeReferentie').value = melding.externeReferentie || '';
    document.getElementById('notities').value = melding.notities || '';

    modal.classList.add('show');
}

// Delete melding
async function deleteMelding(id) {
    const confirmed = await showConfirm('Weet u zeker dat u deze melding wilt verwijderen?', 'Melding verwijderen');
    if (!confirmed) return;

    try {
        showLoading('Melding verwijderen...');
        await dbDelete('onderhoud', id);
        showToast('Melding succesvol verwijderd', 'success');
        await loadAllData();
    } catch (error) {
        console.error('Error deleting melding:', error);
        hideLoading();
        showToast('Fout bij het verwijderen van de melding', 'error');
    }
}

// Filters
document.getElementById('statusFilter').addEventListener('change', applyFilters);
document.getElementById('prioriteitFilter').addEventListener('change', applyFilters);
document.getElementById('searchInput').addEventListener('input', applyFilters);

function applyFilters() {
    const statusFilter = document.getElementById('statusFilter').value;
    const prioriteitFilter = document.getElementById('prioriteitFilter').value;
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();

    filteredMeldingen = meldingen.filter(melding => {
        const matchesStatus = !statusFilter || melding.status === statusFilter;
        const matchesPrioriteit = !prioriteitFilter || melding.prioriteit === prioriteitFilter;
        
        const pand = panden.find(p => p.id === melding.pandId);
        const matchesSearch = !searchTerm || 
            melding.titel.toLowerCase().includes(searchTerm) ||
            melding.beschrijving.toLowerCase().includes(searchTerm) ||
            (pand && pand.adres.toLowerCase().includes(searchTerm));

        return matchesStatus && matchesPrioriteit && matchesSearch;
    });

    renderMeldingen();
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await ensureAuthenticated();
        await loadAllData();
    } catch (error) {
        console.error('Initialization error:', error);
    }
});

// Send confirmation email to huurder
async function sendConfirmationEmail(meldingId) {
    try {
        // Check if Microsoft signed in
        if (!isMicrosoftSignedIn()) {
            const signIn = await showConfirm('U moet eerst inloggen met Microsoft 365 om emails te versturen. Nu inloggen?', 'Microsoft 365 vereist');
            if (signIn) {
                await signInToMicrosoft();
            }
            return;
        }

        const melding = meldingen.find(m => m.id === meldingId);
        if (!melding) return;

        const pand = panden.find(p => p.id === melding.pandId);
        if (!pand) return;

        // Get huurder from active contract
        const contracten = await dbGetAll('contracten');
        const contract = contracten.find(c => c.pandId === pand.id);
        
        if (!contract) {
            showToast('Geen actief contract gevonden voor dit pand', 'warning');
            return;
        }

        const huurders = await dbGetAll('huurders');
        const huurder = huurders.find(h => h.id === contract.huurderId);
        
        if (!huurder) {
            showToast('Huurder gegevens niet gevonden', 'error');
            return;
        }

        // Fill template with data
        const emailData = fillEmailTemplate('onderhoud_bevestiging', {
            huurder: huurder,
            pand: pand,
            melding: melding
        });

        emailData.to = [huurder.email];
        emailData.saveToSharePoint = true;

        await sendEmail(emailData);

        showToast('Bevestiging verstuurd naar ' + huurder.email, 'success');
        
        // Save email to SharePoint
        const folderPath = `Onderhoud/${new Date().getFullYear()}/${pand.adres.replace(/[^a-z0-9]/gi, '_')}`;
        await saveEmailToSharePoint(emailData, folderPath);

        // Update melding status
        await dbUpdate('onderhoud', meldingId, { status: 'in-behandeling' });
        await loadAllData();

    } catch (error) {
        console.error('Error sending email:', error);
        showToast('Fout bij versturen email: ' + error.message, 'error');
    }
}

// View onderhoud detail in side panel
function viewOnderhoudDetail(meldingId) {
    const melding = meldingen.find(m => m.id === meldingId);
    if (!melding) return;
    
    const pand = panden.find(p => p.id === melding.pandId);
    
    const enrichedMelding = {
        ...melding,
        pandAdres: pand ? `${pand.adres}, ${pand.plaats}` : 'Onbekend',
        pandType: pand?.type || ''
    };
    
    if (typeof showDetailPanel === 'function') {
        showDetailPanel('onderhoud', enrichedMelding);
    }
}

// Create and send werkbon
async function createWerkbon(meldingId) {
    try {
        // Get melding details for preview
        const melding = meldingen.find(m => m.id === meldingId);
        if (!melding) return;

        const pand = panden.find(p => p.id === melding.pandId);
        
        // Show preview/confirm modal FIRST
        showWerkbonPreviewModal(meldingId, melding, pand);

    } catch (error) {
        console.error('Error showing werkbon preview:', error);
        showToast('Fout bij voorbereiden werkbon: ' + error.message, 'error');
    }
}

// Show werkbon preview modal before creating
function showWerkbonPreviewModal(meldingId, melding, pand) {
    const modalHTML = `
        <div id="werkbonPreviewModal" class="modal show" style="display: flex;">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>📄 Werkbon Aanmaken</h2>
                    <button class="close-btn" onclick="closeWerkbonPreviewModal()">&times;</button>
                </div>
                
                <div style="padding: 24px;">
                    <p style="margin-bottom: 20px;">U staat op het punt een werkbon aan te maken voor:</p>
                    
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                        <strong>🏢 Pand:</strong> ${pand ? pand.adres : 'Onbekend'}<br>
                        <strong>🔧 Werkzaamheden:</strong> ${melding.titel}<br>
                        <strong>⚠️ Prioriteit:</strong> ${melding.prioriteit}<br>
                        ${melding.kosten ? `<strong>💰 Geschatte kosten:</strong> €${parseFloat(melding.kosten).toLocaleString('nl-NL')}<br>` : ''}
                    </div>
                    
                    <p style="color: #666; font-size: 14px;">
                        Na het aanmaken kunt u de werkbon versturen, downloaden of printen.
                    </p>
                </div>

                <div class="modal-footer">
                    <button type="button" class="btn-secondary" onclick="closeWerkbonPreviewModal()">
                        Annuleren
                    </button>
                    <button type="button" class="btn-primary" onclick="confirmCreateWerkbon('${meldingId}')">
                        ✓ Werkbon Aanmaken
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Close preview modal
function closeWerkbonPreviewModal() {
    const modal = document.getElementById('werkbonPreviewModal');
    if (modal) modal.remove();
}

// Confirm and actually create werkbon
async function confirmCreateWerkbon(meldingId) {
    closeWerkbonPreviewModal();
    
    try {
        showLoading('Werkbon aanmaken...');

        // NOW generate werkbon
        const werkbon = await generateWerkbon(meldingId);
        
        hideLoading();

        // Show send options modal
        showWerkbonSendModal(werkbon);

    } catch (error) {
        hideLoading();
        console.error('Error creating werkbon:', error);
        showToast('Fout bij aanmaken werkbon: ' + error.message, 'error');
    }
}

// View existing werkbon
async function viewExistingWerkbon(werkbonId) {
    try {
        // Redirect to werkbonnen page with hash to open detail
        window.location.href = `werkbonnen.html#${werkbonId}`;
    } catch (error) {
        console.error('Error viewing werkbon:', error);
        showToast('Fout bij openen werkbon', 'error');
    }
}

// Show werkbon send options modal
function showWerkbonSendModal(werkbon) {
    const modalHTML = `
        <div id="werkbonSendModal" class="modal show" style="display: flex;">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>📄 Werkbon ${werkbon.werkbonNummer}</h2>
                    <button class="close-btn" onclick="closeWerkbonSendModal()">&times;</button>
                </div>
                
                <div style="padding: 24px;">
                    <p style="margin-bottom: 20px;">Werkbon succesvol aangemaakt. Selecteer de ontvangers:</p>
                    
                    <div style="margin-bottom: 20px;">
                        <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                            <input type="checkbox" id="sendToHuurder" ${werkbon.huurderEmail ? 'checked' : 'disabled'}>
                            <span>Verstuur naar huurder ${werkbon.huurderEmail ? '(' + werkbon.huurderEmail + ')' : '(geen email)'}</span>
                        </label>
                        ${werkbon.huurderId ? `
                        <div style="margin-left: 30px; margin-top: 8px;">
                            <a href="huurders.html#${werkbon.huurderId}" target="_blank" style="color: var(--primary-color); font-size: 13px; text-decoration: none;">
                                👤 Bekijk huurder informatie →
                            </a>
                        </div>
                        ` : werkbon.huurderNaam ? `
                        <div style="margin-left: 30px; margin-top: 8px; color: #999; font-size: 13px;">
                            Huurder: ${werkbon.huurderNaam} (geen email beschikbaar)
                        </div>
                        ` : `
                        <div style="margin-left: 30px; margin-top: 8px; color: #999; font-size: 13px;">
                            ⚠️ Geen huurder gekoppeld aan dit pand
                        </div>
                        `}
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                            <input type="checkbox" id="sendToOnderhoudsBedrijf">
                            <span>Verstuur naar onderhoudsbedrijf</span>
                        </label>
                        <div id="onderhoudsBedrijfFields" style="margin-top: 10px; padding-left: 30px; display: none;">
                            <div class="form-group">
                                <label>Bedrijfsnaam *</label>
                                <input type="text" id="onderhoudsBedrijf" placeholder="Naam onderhoudsbedrijf">
                            </div>
                            <div class="form-group">
                                <label>Email *</label>
                                <input type="email" id="onderhoudsBedrijfEmail" placeholder="email@onderhoudsbedrijf.nl">
                            </div>
                            <div class="form-group">
                                <label>Contactpersoon</label>
                                <input type="text" id="contactPersoon" placeholder="Naam contactpersoon">
                            </div>
                            <div class="form-group">
                                <label>Telefoon</label>
                                <input type="tel" id="contactTelefoon" placeholder="06-12345678">
                            </div>
                        </div>
                    </div>
                </div>

                <div class="modal-footer">
                    <button type="button" class="btn-secondary" onclick="downloadWerkbon('${werkbon.id}')">
                        💾 Download
                    </button>
                    <button type="button" class="btn-secondary" onclick="printWerkbon('${werkbon.id}')">
                        🖨️ Print
                    </button>
                    <button type="button" class="btn-primary" onclick="sendWerkbonFromModal('${werkbon.id}')">
                        📧 Verstuur
                    </button>
                </div>
            </div>
        </div>
    `;

    // Add modal to page
    const existingModal = document.getElementById('werkbonSendModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Toggle onderhoudsbedrijf fields
    document.getElementById('sendToOnderhoudsBedrijf').addEventListener('change', (e) => {
        document.getElementById('onderhoudsBedrijfFields').style.display = e.target.checked ? 'block' : 'none';
    });
}

// Close werkbon send modal
function closeWerkbonSendModal() {
    const modal = document.getElementById('werkbonSendModal');
    if (modal) {
        modal.remove();
    }
    // Reload data to show updated status
    loadAllData();
    showToast('Werkbon succesvol aangemaakt', 'success');
}

// Send werkbon from modal
async function sendWerkbonFromModal(werkbonId) {
    try {
        const sendToHuurder = document.getElementById('sendToHuurder').checked;
        const sendToOnderhoudsBedrijf = document.getElementById('sendToOnderhoudsBedrijf').checked;

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
            const bedrijfNaam = document.getElementById('onderhoudsBedrijf').value.trim();
            const bedrijfEmail = document.getElementById('onderhoudsBedrijfEmail').value.trim();
            
            if (!bedrijfNaam || !bedrijfEmail) {
                showToast('Vul bedrijfsnaam en email in', 'error');
                return;
            }

            options.onderhoudsBedrijfEmail = bedrijfEmail;

            // Update werkbon with company info
            await dbUpdate('werkbonnen', werkbonId, {
                onderhoudsBedrijf: bedrijfNaam,
                contactPersoon: document.getElementById('contactPersoon').value.trim() || null,
                contactTelefoon: document.getElementById('contactTelefoon').value.trim() || null
            });
        }

        showLoading('Werkbon versturen...');
        
        await sendWerkbon(werkbonId, options);
        
        hideLoading();
        closeWerkbonSendModal();

    } catch (error) {
        hideLoading();
        console.error('Error sending werkbon:', error);
        showToast('Fout bij versturen werkbon: ' + error.message, 'error');
    }
}

window.editMelding = editMelding;
window.deleteMelding = deleteMelding;
window.sendConfirmationEmail = sendConfirmationEmail;
window.viewOnderhoudDetail = viewOnderhoudDetail;
window.createWerkbon = createWerkbon;
window.closeWerkbonPreviewModal = closeWerkbonPreviewModal;
window.confirmCreateWerkbon = confirmCreateWerkbon;
window.viewExistingWerkbon = viewExistingWerkbon;
window.closeWerkbonSendModal = closeWerkbonSendModal;
window.sendWerkbonFromModal = sendWerkbonFromModal;
