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
        if (typeof showLoading === 'function') {
            showLoading('Panden laden...');
        }
        panden = await dbGetAll('panden');
        // Sort by address
        panden.sort((a, b) => (a.adres || '').localeCompare(b.adres || ''));
        filteredPanden = [...panden];
        renderPanden();
        if (typeof hideLoading === 'function') {
            hideLoading();
        }
    } catch (error) {
        console.error('Error loading panden:', error);
        if (typeof hideLoading === 'function') {
            hideLoading();
        }
        if (typeof showToast === 'function') {
            showToast('Fout bij het laden van panden', 'error');
        } else {
            alert('Fout bij het laden van panden');
        }
    }
}

// Render panden table
function renderPanden() {
    const tbody = document.getElementById('pandenTableBody');
    
    if (filteredPanden.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Geen panden gevonden</td></tr>';
        return;
    }

    tbody.innerHTML = filteredPanden.map(pand => `
        <tr onclick="viewPandDetail('${pand.id}')" style="cursor: pointer;">
            <td><span class="status-badge ${pand.type}">${pand.type === 'bedrijfspand' ? 'Bedrijfspand' : 'Woning'}</span></td>
            <td>${pand.adres}</td>
            <td>${pand.postcode}</td>
            <td>${pand.plaats}</td>
            <td><span class="status-badge ${pand.status}">${capitalizeFirst(pand.status)}</span></td>
            <td>€${parseFloat(pand.huurprijs).toLocaleString('nl-NL')}</td>
            <td class="actions" onclick="event.stopPropagation();">
                <span class="action-icon" onclick="editPand('${pand.id}')" title="Bewerken">✏️</span>
                <span class="action-icon" onclick="deletePand('${pand.id}')" title="Verwijderen">🗑️</span>
            </td>
        </tr>
    `).join('');
}

// Open modal for new pand
addPandBtn.addEventListener('click', () => {
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
        adres: document.getElementById('adres').value,
        postcode: document.getElementById('postcode').value,
        plaats: document.getElementById('plaats').value,
        oppervlakte: parseInt(document.getElementById('oppervlakte').value) || null,
        kamers: parseInt(document.getElementById('kamers').value) || null,
        huurprijs: parseFloat(document.getElementById('huurprijs').value),
        beschrijving: document.getElementById('beschrijving').value
    };

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
    document.getElementById('huurprijs').value = pand.huurprijs;
    document.getElementById('beschrijving').value = pand.beschrijving || '';

    modal.classList.add('show');
}

// Delete pand
async function deletePand(id) {
    const confirmed = await showConfirm('Weet u zeker dat u dit pand wilt verwijderen?', 'Pand verwijderen');
    if (!confirmed) return;

    try {
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

// Helper function
function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await ensureAuthenticated();
        await loadAllPanden();
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
