// Onderhoud Management

let meldingen = [];
let panden = [];
let filteredMeldingen = [];

const modal = document.getElementById('meldingModal');
const addMeldingBtn = document.getElementById('addMeldingBtn');
const closeModal = document.getElementById('closeModal');
const cancelBtn = document.getElementById('cancelBtn');
const meldingForm = document.getElementById('meldingForm');

// Load all data
async function loadAllData() {
    try {
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
    } catch (error) {
        console.error('Error loading data:', error);
        alert('Fout bij het laden van gegevens');
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
        
        return `
            <div class="item-card" onclick="viewOnderhoudDetail('${melding.id}')">
                <div class="item-card-header">
                    <h3>${melding.titel}</h3>
                    <div class="item-card-actions" onclick="event.stopPropagation();">
                        <span class="action-icon" onclick="editMelding('${melding.id}')" title="Bewerken">✏️</span>
                        <span class="action-icon" onclick="deleteMelding('${melding.id}')" title="Verwijderen">🗑️</span>
                    </div>
                </div>
                <div class="item-card-body">
                    <p>🏢 ${pand ? pand.adres : 'Onbekend pand'}</p>
                    <p style="margin-top: 8px;">${melding.beschrijving}</p>
                    ${melding.geplande_datum ? `<p>📅 Gepland: ${new Date(melding.geplande_datum).toLocaleDateString('nl-NL')}</p>` : ''}
                    ${melding.kosten ? `<p>💰 Kosten: €${parseFloat(melding.kosten).toLocaleString('nl-NL')}</p>` : ''}
                </div>
                <div class="item-card-footer">
                    <span class="priority-badge ${priorityClass}">${capitalizeFirst(melding.prioriteit || 'normaal')}</span>
                    <span class="status-badge ${statusClass}">${capitalizeFirst(melding.status || 'nieuw')}</span>
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
        titel: document.getElementById('titel').value,
        beschrijving: document.getElementById('beschrijving').value,
        prioriteit: document.getElementById('prioriteit').value,
        status: document.getElementById('status').value,
        geplanddatum: document.getElementById('geplanddatum').value || null,
        kosten: parseFloat(document.getElementById('kosten').value) || null,
        notities: document.getElementById('notities').value
    };

    const meldingId = document.getElementById('meldingId').value;

    try {
        if (meldingId) {
            await dbUpdate('onderhoud', meldingId, meldingData);
        } else {
            await dbAdd('onderhoud', meldingData);
        }

        closeModalWindow();
        await loadAllData();
    } catch (error) {
        console.error('Error saving melding:', error);
        alert('Fout bij het opslaan van de melding');
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
    document.getElementById('prioriteit').value = melding.prioriteit || 'normaal';
    document.getElementById('status').value = melding.status || 'nieuw';
    document.getElementById('geplanddatum').value = melding.geplanddatum || '';
    document.getElementById('kosten').value = melding.kosten || '';
    document.getElementById('notities').value = melding.notities || '';

    modal.classList.add('show');
}

// Delete melding
async function deleteMelding(id) {
    if (!confirm('Weet u zeker dat u deze melding wilt verwijderen?')) return;

    try {
        await dbDelete('onderhoud', id);
        await loadAllData();
    } catch (error) {
        console.error('Error deleting melding:', error);
        alert('Fout bij het verwijderen van de melding');
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

// Helper function
function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
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
            const signIn = confirm('U moet eerst inloggen met Microsoft 365 om emails te versturen. Nu inloggen?');
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
            alert('Geen actief contract gevonden voor dit pand');
            return;
        }

        const huurders = await dbGetAll('huurders');
        const huurder = huurders.find(h => h.id === contract.huurderId);
        
        if (!huurder) {
            alert('Huurder gegevens niet gevonden');
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

        alert('Bevestiging verstuurd naar ' + huurder.email);
        
        // Save email to SharePoint
        const folderPath = `Onderhoud/${new Date().getFullYear()}/${pand.adres.replace(/[^a-z0-9]/gi, '_')}`;
        await saveEmailToSharePoint(emailData, folderPath);

        // Update melding status
        await dbUpdate('onderhoud', meldingId, { status: 'in_behandeling' });
        await loadAllData();

    } catch (error) {
        console.error('Error sending email:', error);
        alert('Fout bij versturen email: ' + error.message);
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

window.editMelding = editMelding;
window.deleteMelding = deleteMelding;
window.sendConfirmationEmail = sendConfirmationEmail;
window.viewOnderhoudDetail = viewOnderhoudDetail;
