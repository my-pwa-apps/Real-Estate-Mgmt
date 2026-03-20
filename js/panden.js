// Panden Management

let panden = [];
let filteredPanden = [];

// Modal elements
const modal = document.getElementById('pandModal');
const addPandBtn = document.getElementById('addPandBtn');
const closeModal = document.getElementById('closeModal');
const cancelBtn = document.getElementById('cancelBtn');
const pandForm = document.getElementById('pandForm');

// Load all panden
async function loadPanden() {
    try {
        showLoading('Panden laden...');
        panden = await dbGetAll('panden');
        // Sort by address
        panden.sort((a, b) => (a.adres || '').localeCompare(b.adres || ''));
        filteredPanden = [...panden];
        renderPanden();
        hideLoading();
    } catch (error) {
        console.error('Error loading panden:', error);
        hideLoading();
        showToast('Fout bij het laden van panden', 'error');
    }
}

// Render panden table
function renderPanden() {
    const tbody = document.getElementById('pandenTableBody');
    
    if (filteredPanden.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Geen panden gevonden</td></tr>';
        return;
    }

    tbody.innerHTML = filteredPanden.map(pand => {
        const s = sanitizeHTML;
        return `
        <tr onclick="viewPandDetail('${pand.id}')" style="cursor: pointer;">
            <td><span class="status-badge ${s(pand.type)}">${pand.type === 'bedrijfspand' ? 'Bedrijfspand' : 'Woning'}</span></td>
            <td>${s(pand.adres)}</td>
            <td>${s(pand.postcode)}</td>
            <td>${s(pand.plaats)}</td>
            <td><span class="status-badge ${s(pand.status)}">${capitalizeFirst(s(pand.status))}</span></td>
            <td>€${parseFloat(pand.huurprijs).toLocaleString('nl-NL')}</td>
            <td class="actions" onclick="event.stopPropagation();">
                ${!isViewerRole() ? `<span class="action-icon" onclick="editPand('${pand.id}')" title="Bewerken">✏️</span>
                <span class="action-icon" onclick="deletePand('${pand.id}')" title="Verwijderen">🗑️</span>` : ''}
            </td>
        </tr>
    `;
    }).join('');
}

// Open modal for new pand
addPandBtn.addEventListener('click', () => {
    if (isViewerRole()) {
        showToast('U heeft geen rechten om panden toe te voegen', 'error');
        return;
    }
    document.getElementById('modalTitle').textContent = 'Nieuw Pand';
    pandForm.reset();
    document.getElementById('pandId').value = '';
    modal.classList.add('show');
});

// Close modal
function closeModalWindow() {
    modal.classList.remove('show');
}

closeModal.addEventListener('click', closeModalWindow);
cancelBtn.addEventListener('click', closeModalWindow);

// Close modal when clicking outside
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModalWindow();
    }
});

// Save pand (create or update)
pandForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const pandData = {
        type: document.getElementById('type').value,
        status: document.getElementById('status').value,
        adres: document.getElementById('adres').value.trim(),
        postcode: document.getElementById('postcode').value.trim(),
        plaats: document.getElementById('plaats').value.trim(),
        oppervlakte: parseInt(document.getElementById('oppervlakte').value) || null,
        kamers: parseInt(document.getElementById('kamers').value) || null,
        bouwjaar: parseInt(document.getElementById('bouwjaar').value) || null,
        energielabel: document.getElementById('energielabel').value || null,
        huurprijs: parseFloat(document.getElementById('huurprijs').value),
        beschrijving: document.getElementById('beschrijving').value.trim()
    };

    // Validate postcode (Dutch format: 1234 AB)
    const postcodeRegex = /^[1-9]\d{3}\s?[A-Za-z]{2}$/;
    if (!postcodeRegex.test(pandData.postcode)) {
        showToast('Voer een geldige postcode in (bijv. 1234 AB)', 'error');
        return;
    }

    // Validate huurprijs is positive
    if (pandData.huurprijs <= 0) {
        showToast('Huurprijs moet een positief bedrag zijn', 'error');
        return;
    }

    // Validate type and status against allowed values
    const validTypes = ['bedrijfspand', 'woning'];
    const validStatuses = ['verhuurd', 'beschikbaar', 'onderhoud'];
    if (!validTypes.includes(pandData.type)) {
        showToast('Ongeldig type geselecteerd', 'error');
        return;
    }
    if (!validStatuses.includes(pandData.status)) {
        showToast('Ongeldige status geselecteerd', 'error');
        return;
    }

    const pandId = document.getElementById('pandId').value;

    try {
        showLoading(pandId ? 'Pand bijwerken...' : 'Pand opslaan...');
        
        if (pandId) {
            // Update existing pand
            await dbUpdate('panden', pandId, pandData);
            showToast('Pand succesvol bijgewerkt', 'success');
        } else {
            // Create new pand
            await dbAdd('panden', pandData);
            showToast('Pand succesvol toegevoegd', 'success');
        }

        closeModalWindow();
        await loadPanden();
    } catch (error) {
        console.error('Error saving pand:', error);
        hideLoading();
        showToast('Fout bij het opslaan van het pand', 'error');
    }
});

// Edit pand
async function editPand(id) {
    const pand = panden.find(p => p.id === id);
    if (!pand) return;

    document.getElementById('modalTitle').textContent = 'Pand Bewerken';
    document.getElementById('pandId').value = pand.id;
    document.getElementById('type').value = pand.type;
    document.getElementById('status').value = pand.status;
    document.getElementById('adres').value = pand.adres;
    document.getElementById('postcode').value = pand.postcode;
    document.getElementById('plaats').value = pand.plaats;
    document.getElementById('oppervlakte').value = pand.oppervlakte || '';
    document.getElementById('kamers').value = pand.kamers || '';
    document.getElementById('bouwjaar').value = pand.bouwjaar || '';
    document.getElementById('energielabel').value = pand.energielabel || '';
    document.getElementById('huurprijs').value = pand.huurprijs;
    document.getElementById('beschrijving').value = pand.beschrijving || '';

    modal.classList.add('show');
}

// Delete pand (with cascading delete protection)
async function deletePand(id) {
    try {
        // Check for active contracts linked to this pand
        const contracten = await dbGetAll('contracten');
        const activeContracts = contracten.filter(c => c.pandId === id);
        if (activeContracts.length > 0) {
            showToast('Dit pand kan niet worden verwijderd omdat er nog contracten aan gekoppeld zijn. Verwijder eerst de contracten.', 'error');
            return;
        }

        // Check for maintenance requests
        const onderhoudItems = await dbGetAll('onderhoud');
        const linkedOnderhoud = onderhoudItems.filter(o => o.pandId === id && o.status !== 'afgerond');
        if (linkedOnderhoud.length > 0) {
            const proceed = await showConfirm(
                `Er zijn nog ${linkedOnderhoud.length} openstaande onderhoudsmeldingen voor dit pand. Wilt u toch doorgaan met verwijderen?`,
                'Waarschuwing'
            );
            if (!proceed) return;
        }

        const confirmed = await showConfirm('Weet u zeker dat u dit pand wilt verwijderen?', 'Pand verwijderen');
        if (!confirmed) return;

        showLoading('Pand verwijderen...');
        await dbDelete('panden', id);
        showToast('Pand succesvol verwijderd', 'success');
        await loadPanden();
    } catch (error) {
        console.error('Error deleting pand:', error);
        hideLoading();
        showToast('Fout bij het verwijderen van het pand', 'error');
    }
}

// Filters
document.getElementById('typeFilter').addEventListener('change', applyFilters);
document.getElementById('statusFilter').addEventListener('change', applyFilters);
document.getElementById('searchInput').addEventListener('input', applyFilters);

function applyFilters() {
    const typeFilter = document.getElementById('typeFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();

    filteredPanden = panden.filter(pand => {
        const matchesType = !typeFilter || pand.type === typeFilter;
        const matchesStatus = !statusFilter || pand.status === statusFilter;
        const matchesSearch = !searchTerm || 
            pand.adres.toLowerCase().includes(searchTerm) ||
            pand.plaats.toLowerCase().includes(searchTerm) ||
            pand.postcode.toLowerCase().includes(searchTerm);

        return matchesType && matchesStatus && matchesSearch;
    });

    renderPanden();
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await ensureAuthenticated();
        await loadPanden();
    } catch (error) {
        console.error('Initialization error:', error);
    }
});

// View pand detail
function viewPandDetail(pandId) {
    const pand = panden.find(p => p.id === pandId);
    if (pand) {
        showDetailPanel('pand', pand);
    }
}

// Make functions global for onclick handlers
window.editPand = editPand;
window.deletePand = deletePand;
window.viewPandDetail = viewPandDetail;
