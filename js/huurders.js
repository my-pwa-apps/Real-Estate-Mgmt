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

    container.innerHTML = filteredHuurders.map(huurder => `
        <div class="item-card" onclick="viewHuurderDetail('${huurder.id}')">
            <div class="item-card-header">
                <h3>${huurder.voornaam} ${huurder.achternaam}</h3>
                <div class="item-card-actions" onclick="event.stopPropagation();">
                    <span class="action-icon" onclick="editHuurder('${huurder.id}')" title="Bewerken">✏️</span>
                    <span class="action-icon" onclick="deleteHuurder('${huurder.id}')" title="Verwijderen">🗑️</span>
                </div>
            </div>
            <div class="item-card-body">
                <p>📧 ${huurder.email}</p>
                <p>📞 ${huurder.telefoon}</p>
                ${huurder.geboortedatum ? `<p>🎂 ${new Date(huurder.geboortedatum).toLocaleDateString('nl-NL')}</p>` : ''}
                ${huurder.notities ? `<p style="margin-top: 8px; font-style: italic; color: var(--text-muted);">${huurder.notities}</p>` : ''}
            </div>
        </div>
    `).join('');
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
        voornaam: document.getElementById('voornaam').value,
        achternaam: document.getElementById('achternaam').value,
        email: document.getElementById('email').value,
        telefoon: document.getElementById('telefoon').value,
        geboortedatum: document.getElementById('geboortedatum').value || null,
        notities: document.getElementById('notities').value
    };

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

// Delete huurder
async function deleteHuurder(id) {
    const confirmed = await showConfirm('Weet u zeker dat u deze huurder wilt verwijderen?', 'Huurder verwijderen');
    if (!confirmed) return;

    try {
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
