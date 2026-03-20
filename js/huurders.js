// Huurders Management

let huurders = [];
let filteredHuurders = [];

const modal = document.getElementById('huurderModal');
const addHuurderBtn = document.getElementById('addHuurderBtn');
const closeModal = document.getElementById('closeModal');
const cancelBtn = document.getElementById('cancelBtn');
const huurderForm = document.getElementById('huurderForm');

// Load all huurders
async function loadHuurders() {
    try {
        showLoading('Huurders laden...');
        huurders = await dbGetAll('huurders');
        // Sort by last name
        huurders.sort((a, b) => (a.achternaam || '').localeCompare(b.achternaam || ''));
        filteredHuurders = [...huurders];
        renderHuurders();
        hideLoading();
    } catch (error) {
        console.error('Error loading huurders:', error);
        hideLoading();
        showToast('Fout bij het laden van huurders', 'error');
    }
}

// Render huurders as cards
function renderHuurders() {
    const container = document.getElementById('huurdersGrid');
    
    if (filteredHuurders.length === 0) {
        container.innerHTML = '<p class="empty-state">Geen huurders gevonden</p>';
        return;
    }

    container.innerHTML = filteredHuurders.map(huurder => {
        const s = sanitizeHTML;
        return `
        <div class="item-card" onclick="viewHuurderDetail('${huurder.id}')">
            <div class="item-card-header">
                <h3>${s(huurder.voornaam)} ${s(huurder.achternaam)}</h3>
                <div class="item-card-actions" onclick="event.stopPropagation();">
                    ${!isViewerRole() ? `<span class="action-icon" onclick="editHuurder('${huurder.id}')" title="Bewerken">✏️</span>
                    <span class="action-icon" onclick="deleteHuurder('${huurder.id}')" title="Verwijderen">🗑️</span>` : ''}
                </div>
            </div>
            <div class="item-card-body">
                <p>📧 ${s(huurder.email)}</p>
                <p>📞 ${s(huurder.telefoon)}</p>
                ${huurder.geboortedatum ? `<p>🎂 ${new Date(huurder.geboortedatum).toLocaleDateString('nl-NL')}</p>` : ''}
                ${huurder.notities ? `<p style="margin-top: 8px; font-style: italic; color: var(--text-muted);">${s(huurder.notities)}</p>` : ''}
            </div>
        </div>
    `;
    }).join('');
}

// Open modal for new huurder
addHuurderBtn.addEventListener('click', () => {
    document.getElementById('modalTitle').textContent = 'Nieuwe Huurder';
    huurderForm.reset();
    document.getElementById('huurderId').value = '';
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

// Save huurder
huurderForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const huurderData = {
        voornaam: document.getElementById('voornaam').value.trim(),
        achternaam: document.getElementById('achternaam').value.trim(),
        email: document.getElementById('email').value.trim(),
        telefoon: document.getElementById('telefoon').value.trim(),
        geboortedatum: document.getElementById('geboortedatum').value || null,
        notities: document.getElementById('notities').value.trim()
    };

    // Validate email format
    if (!isValidEmail(huurderData.email)) {
        showToast('Voer een geldig emailadres in', 'error');
        return;
    }

    // Validate phone number (Dutch format)
    if (!isValidPhone(huurderData.telefoon)) {
        showToast('Voer een geldig telefoonnummer in (bijv. 06-12345678 of +31612345678)', 'error');
        return;
    }

    const huurderId = document.getElementById('huurderId').value;

    try {
        showLoading(huurderId ? 'Huurder bijwerken...' : 'Huurder opslaan...');
        
        if (huurderId) {
            await dbUpdate('huurders', huurderId, huurderData);
            showToast('Huurder succesvol bijgewerkt', 'success');
        } else {
            await dbAdd('huurders', huurderData);
            showToast('Huurder succesvol toegevoegd', 'success');
        }

        closeModalWindow();
        await loadHuurders();
    } catch (error) {
        console.error('Error saving huurder:', error);
        hideLoading();
        showToast('Fout bij het opslaan van de huurder', 'error');
    }
});

// Edit huurder
async function editHuurder(id) {
    const huurder = huurders.find(h => h.id === id);
    if (!huurder) return;

    document.getElementById('modalTitle').textContent = 'Huurder Bewerken';
    document.getElementById('huurderId').value = huurder.id;
    document.getElementById('voornaam').value = huurder.voornaam;
    document.getElementById('achternaam').value = huurder.achternaam;
    document.getElementById('email').value = huurder.email;
    document.getElementById('telefoon').value = huurder.telefoon;
    document.getElementById('geboortedatum').value = huurder.geboortedatum || '';
    document.getElementById('notities').value = huurder.notities || '';

    modal.classList.add('show');
}

// Delete huurder (with cascading delete protection)
async function deleteHuurder(id) {
    try {
        // Check for active contracts linked to this huurder
        const contracten = await dbGetAll('contracten');
        const activeContracts = contracten.filter(c => c.huurderId === id);
        if (activeContracts.length > 0) {
            showToast('Deze huurder kan niet worden verwijderd omdat er nog contracten aan gekoppeld zijn. Verwijder eerst de contracten.', 'error');
            return;
        }

        const confirmed = await showConfirm('Weet u zeker dat u deze huurder wilt verwijderen?', 'Huurder verwijderen');
        if (!confirmed) return;

        showLoading('Huurder verwijderen...');
        await dbDelete('huurders', id);
        showToast('Huurder succesvol verwijderd', 'success');
        await loadHuurders();
    } catch (error) {
        console.error('Error deleting huurder:', error);
        hideLoading();
        showToast('Fout bij het verwijderen van de huurder', 'error');
    }
}

// Search
document.getElementById('searchInput').addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    
    filteredHuurders = huurders.filter(huurder => {
        return huurder.voornaam.toLowerCase().includes(searchTerm) ||
               huurder.achternaam.toLowerCase().includes(searchTerm) ||
               huurder.email.toLowerCase().includes(searchTerm) ||
               huurder.telefoon.includes(searchTerm);
    });

    renderHuurders();
});

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await ensureAuthenticated();
        await loadHuurders();
        
        // Check if there's a huurder ID in the hash
        const hash = window.location.hash.substring(1);
        if (hash) {
            // Give it a moment for data to load
            setTimeout(() => {
                const huurder = huurders.find(h => h.id === hash);
                if (huurder) {
                    viewHuurderDetail(hash);
                } else {
                    showToast('Huurder niet gevonden', 'error');
                }
                // Clear hash
                history.replaceState(null, null, 'huurders.html');
            }, 500);
        }
    } catch (error) {
        console.error('Initialization error:', error);
    }
});

// View huurder detail
function viewHuurderDetail(huurderId) {
    const huurder = huurders.find(h => h.id === huurderId);
    if (huurder) {
        showDetailPanel('huurder', huurder);
    }
}

window.editHuurder = editHuurder;
window.deleteHuurder = deleteHuurder;
window.viewHuurderDetail = viewHuurderDetail;
