// Contracten Management

let contracten = [];
let huurders = [];
let panden = [];
let filteredContracten = [];

const modal = document.getElementById('contractModal');
const addContractBtn = document.getElementById('addContractBtn');
const closeModal = document.getElementById('closeModal');
const cancelBtn = document.getElementById('cancelBtn');
const contractForm = document.getElementById('contractForm');

// Load all data
async function loadAllData() {
    try {
        showLoading('Gegevens laden...');
        const [contractenData, huurdersData, pandenData] = await Promise.all([
            dbGetAll('contracten'),
            dbGetAll('huurders'),
            dbGetAll('panden')
        ]);

        contracten = contractenData;
        // Sort by start date descending
        contracten.sort((a, b) => (b.startdatum || '').localeCompare(a.startdatum || ''));
        
        huurders = huurdersData;
        panden = pandenData;

        filteredContracten = [...contracten];
        populateDropdowns();
        renderContracten();
        hideLoading();
    } catch (error) {
        console.error('Error loading data:', error);
        hideLoading();
        showToast('Fout bij het laden van gegevens', 'error');
    }
}

// Populate dropdown lists
function populateDropdowns() {
    const huurderSelect = document.getElementById('huurderId');
    const pandSelect = document.getElementById('pandId');

    huurderSelect.innerHTML = '<option value="">Selecteer huurder</option>' +
        huurders.map(h => `<option value="${h.id}">${h.voornaam} ${h.achternaam}</option>`).join('');

    pandSelect.innerHTML = '<option value="">Selecteer pand</option>' +
        panden.map(p => `<option value="${p.id}">${p.adres}, ${p.plaats}</option>`).join('');
}

// Render contracten table
function renderContracten() {
    const tbody = document.getElementById('contractenTableBody');
    
    if (filteredContracten.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-state">Geen contracten gevonden</td></tr>';
        return;
    }

    tbody.innerHTML = filteredContracten.map(contract => {
        const huurder = huurders.find(h => h.id === contract.huurderId);
        const pand = panden.find(p => p.id === contract.pandId);
        const status = getContractStatus(contract);
        
        return `
            <tr onclick="viewContractDetail('${contract.id}')" style="cursor: pointer;">
                <td>${huurder ? `${huurder.voornaam} ${huurder.achternaam}` : 'Onbekend'}</td>
                <td>${pand ? pand.adres : 'Onbekend'}</td>
                <td>${new Date(contract.startdatum).toLocaleDateString('nl-NL')}</td>
                <td>${new Date(contract.einddatum).toLocaleDateString('nl-NL')}</td>
                <td>€${parseFloat(contract.huurprijs).toLocaleString('nl-NL')}</td>
                <td><span class="status-badge ${status}">${capitalizeFirst(status)}</span></td>
                <td>
                    ${contract.documentUrl ? 
                        `<a href="${contract.documentUrl}" target="_blank" title="Document openen">📄</a>` : 
                        '<span style="color: #999;" title="Geen document">-</span>'}
                </td>
                <td class="actions" onclick="event.stopPropagation();">
                    <span class="action-icon" onclick="emailContract('${contract.id}')" title="Email versturen">📧</span>
                    <span class="action-icon" onclick="editContract('${contract.id}')" title="Bewerken">✏️</span>
                    <span class="action-icon" onclick="deleteContract('${contract.id}')" title="Verwijderen">🗑️</span>
                </td>
            </tr>
        `;
    }).join('');
}

// Get contract status
function getContractStatus(contract) {
    const now = new Date();
    const eindDatum = new Date(contract.einddatum);
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

    if (eindDatum < now) return 'verlopen';
    if (eindDatum <= threeMonthsFromNow) return 'verloopt';
    return 'actief';
}

// Open modal for new contract
addContractBtn.addEventListener('click', () => {
    document.getElementById('modalTitle').textContent = 'Nieuw Contract';
    contractForm.reset();
    document.getElementById('contractId').value = '';
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

// Auto-fill huurprijs from pand
document.getElementById('pandId').addEventListener('change', (e) => {
    const pandId = e.target.value;
    const pand = panden.find(p => p.id === pandId);
    if (pand && pand.huurprijs) {
        document.getElementById('huurprijs').value = pand.huurprijs;
    }
});

// Save contract
contractForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const contractData = {
        huurderId: document.getElementById('huurderId').value,
        pandId: document.getElementById('pandId').value,
        startdatum: document.getElementById('startdatum').value,
        einddatum: document.getElementById('einddatum').value,
        huurprijs: parseFloat(document.getElementById('huurprijs').value),
        borg: parseFloat(document.getElementById('borg').value) || 0,
        betalingsdatum: parseInt(document.getElementById('betalingsdatum').value) || 1,
        voorwaarden: document.getElementById('voorwaarden').value
    };

    const contractId = document.getElementById('contractId').value;

    try {
        showLoading(contractId ? 'Contract bijwerken...' : 'Contract opslaan...');
        if (contractId) {
            await dbUpdate('contracten', contractId, contractData);
            showToast('Contract succesvol bijgewerkt', 'success');
        } else {
            await dbAdd('contracten', contractData);
            // Update pand status to 'verhuurd'
            await dbUpdate('panden', contractData.pandId, { status: 'verhuurd' });
            showToast('Contract succesvol toegevoegd', 'success');
        }

        closeModalWindow();
        await loadAllData();
    } catch (error) {
        console.error('Error saving contract:', error);
        hideLoading();
        showToast('Fout bij het opslaan van het contract', 'error');
    }
});

// Edit contract
async function editContract(id) {
    const contract = contracten.find(c => c.id === id);
    if (!contract) return;

    document.getElementById('modalTitle').textContent = 'Contract Bewerken';
    document.getElementById('contractId').value = contract.id;
    document.getElementById('huurderId').value = contract.huurderId;
    document.getElementById('pandId').value = contract.pandId;
    document.getElementById('startdatum').value = contract.startdatum;
    document.getElementById('einddatum').value = contract.einddatum;
    document.getElementById('huurprijs').value = contract.huurprijs;
    document.getElementById('borg').value = contract.borg || '';
    document.getElementById('betalingsdatum').value = contract.betalingsdatum || 1;
    document.getElementById('voorwaarden').value = contract.voorwaarden || '';

    modal.classList.add('show');
}

// Delete contract
async function deleteContract(id) {
    const confirmed = await showConfirm('Weet u zeker dat u dit contract wilt verwijderen?', 'Contract verwijderen');
    if (!confirmed) return;

    try {
        showLoading('Contract verwijderen...');
        const contract = contracten.find(c => c.id === id);
        await dbDelete('contracten', id);
        
        // Update pand status to 'beschikbaar' if needed
        if (contract) {
            await dbUpdate('panden', contract.pandId, { status: 'beschikbaar' });
        }
        
        showToast('Contract succesvol verwijderd', 'success');
        await loadAllData();
    } catch (error) {
        console.error('Error deleting contract:', error);
        hideLoading();
        showToast('Fout bij het verwijderen van het contract', 'error');
    }
}

// Filters
document.getElementById('statusFilter').addEventListener('change', applyFilters);
document.getElementById('searchInput').addEventListener('input', applyFilters);

function applyFilters() {
    const statusFilter = document.getElementById('statusFilter').value;
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();

    filteredContracten = contracten.filter(contract => {
        const status = getContractStatus(contract);
        const matchesStatus = !statusFilter || status === statusFilter;
        
        const huurder = huurders.find(h => h.id === contract.huurderId);
        const pand = panden.find(p => p.id === contract.pandId);
        
        const matchesSearch = !searchTerm || 
            (huurder && `${huurder.voornaam} ${huurder.achternaam}`.toLowerCase().includes(searchTerm)) ||
            (pand && pand.adres.toLowerCase().includes(searchTerm));

        return matchesStatus && matchesSearch;
    });

    renderContracten();
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

// Email contract to huurder
async function emailContract(contractId) {
    try {
        // Check if Microsoft signed in
        if (!isMicrosoftSignedIn()) {
            const signIn = await showConfirm('U moet eerst inloggen met Microsoft 365 om emails te versturen. Nu inloggen?', 'Microsoft 365 vereist');
            if (signIn) {
                await signInToMicrosoft();
            }
            return;
        }

        const contract = contracten.find(c => c.id === contractId);
        if (!contract) return;

        const huurder = huurders.find(h => h.id === contract.huurderId);
        const pand = panden.find(p => p.id === contract.pandId);

        if (!huurder || !pand) {
            showToast('Huurder of pand gegevens ontbreken', 'error');
            return;
        }

        // Fill template with data
        const emailData = fillEmailTemplate('huurcontract', {
            huurder: huurder,
            pand: pand,
            contract: contract
        });

        emailData.to = [huurder.email];
        emailData.saveToSharePoint = true;

        // Send email with attachment if document exists
        if (contract.documentUrl) {
            const fileId = contract.sharepointFileId;
            if (fileId) {
                await sendEmailWithSharePointAttachment(emailData, fileId);
            } else {
                await sendEmail(emailData);
            }
        } else {
            await sendEmail(emailData);
        }

        showToast('Email succesvol verstuurd naar ' + huurder.email, 'success');
        
        // Save email to SharePoint Correspondentie folderconst folderPath = `Huurders/${huurder.achternaam}_${huurder.voornaam}/Correspondentie`;
        await saveEmailToSharePoint(emailData, folderPath);

    } catch (error) {
        console.error('Error sending email:', error);
        showToast('Fout bij versturen email: ' + error.message, 'error');
    }
}

// View contract detail in side panel
function viewContractDetail(contractId) {
    const contract = contracten.find(c => c.id === contractId);
    if (!contract) return;
    
    const huurder = huurders.find(h => h.id === contract.huurderId);
    const pand = panden.find(p => p.id === contract.pandId);
    
    const enrichedContract = {
        ...contract,
        huurderNaam: huurder ? `${huurder.voornaam} ${huurder.achternaam}` : 'Onbekend',
        huurderEmail: huurder?.email || '',
        huurderTelefoon: huurder?.telefoon || '',
        pandAdres: pand ? `${pand.adres}, ${pand.plaats}` : 'Onbekend',
        pandType: pand?.type || '',
        status: getContractStatus(contract)
    };
    
    if (typeof showDetailPanel === 'function') {
        showDetailPanel('contract', enrichedContract);
    }
}

window.editContract = editContract;
window.deleteContract = deleteContract;
window.emailContract = emailContract;
window.viewContractDetail = viewContractDetail;
