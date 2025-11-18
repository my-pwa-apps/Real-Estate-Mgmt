// Financieel Management

let transacties = [];
let contracten = [];
let onderhoud = [];
let currentYear = new Date().getFullYear();

const modal = document.getElementById('transactieModal');
const addInkomstBtn = document.getElementById('addInkomstBtn');
const addUitgaveBtn = document.getElementById('addUitgaveBtn');
const closeModal = document.getElementById('closeModal');
const cancelBtn = document.getElementById('cancelBtn');
const transactieForm = document.getElementById('transactieForm');
const jaarFilter = document.getElementById('jaarFilter');

// Load all data
async function loadAllData() {
    try {
        const [transactiesData, contractenData, onderhoudData] = await Promise.all([
            dbGetAll('transacties'),
            dbGetAll('contracten'),
            dbGetAll('onderhoud')
        ]);

        // Filter transacties for current year
        transacties = transactiesData.filter(t => 
            t.datum && t.datum.startsWith(currentYear.toString())
        );
        contracten = contractenData;
        onderhoud = onderhoudData;

        calculateStatistics();
        renderMaandelijksOverzicht();
        renderRecenteTransacties();
    } catch (error) {
        console.error('Error loading data:', error);
        alert('Fout bij het laden van financiële gegevens');
    }
}

// Calculate statistics
function calculateStatistics() {
    // Filter transacties for current year
    const yearTransacties = transacties.filter(t => {
        return t.datum && t.datum.startsWith(currentYear.toString());
    });

    const inkomsten = yearTransacties
        .filter(t => t.type === 'inkomst')
        .reduce((sum, t) => sum + parseFloat(t.bedrag || 0), 0);

    const uitgaven = yearTransacties
        .filter(t => t.type === 'uitgave')
        .reduce((sum, t) => sum + parseFloat(t.bedrag || 0), 0);

    const netto = inkomsten - uitgaven;

    // Maandelijkse huur from active contracts
    const now = new Date();
    const maandelijks = contracten
        .filter(c => {
            const eindDatum = new Date(c.einddatum);
            return eindDatum > now;
        })
        .reduce((sum, c) => sum + parseFloat(c.huurprijs || 0), 0);

    document.getElementById('totaalInkomsten').textContent = `€${inkomsten.toLocaleString('nl-NL')}`;
    document.getElementById('inkomstenDetail').textContent = `${currentYear}`;
    
    document.getElementById('totaalUitgaven').textContent = `€${uitgaven.toLocaleString('nl-NL')}`;
    document.getElementById('uitgavenDetail').textContent = `${currentYear}`;
    
    document.getElementById('nettoResultaat').textContent = `€${netto.toLocaleString('nl-NL')}`;
    document.getElementById('resultaatDetail').textContent = netto >= 0 ? 'Positief' : 'Negatief';
    
    document.getElementById('maandelijks').textContent = `€${maandelijks.toLocaleString('nl-NL')}`;
    document.getElementById('maandDetail').textContent = `Actieve contracten`;
}

// Render monthly overview
function renderMaandelijksOverzicht() {
    const tbody = document.getElementById('maandelijksTableBody');
    const maanden = ['Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni', 
                     'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'];
    
    document.getElementById('currentYear').textContent = currentYear;

    const rows = maanden.map((maand, index) => {
        const maandNummer = (index + 1).toString().padStart(2, '0');
        const maandTransacties = transacties.filter(t => 
            t.datum && t.datum.startsWith(`${currentYear}-${maandNummer}`)
        );

        const huurInkomsten = maandTransacties
            .filter(t => t.type === 'inkomst' && t.categorie === 'huur')
            .reduce((sum, t) => sum + parseFloat(t.bedrag || 0), 0);

        const onderhoudsKosten = maandTransacties
            .filter(t => t.type === 'uitgave' && t.categorie === 'onderhoud')
            .reduce((sum, t) => sum + parseFloat(t.bedrag || 0), 0);

        const overigeKosten = maandTransacties
            .filter(t => t.type === 'uitgave' && t.categorie !== 'onderhoud')
            .reduce((sum, t) => sum + parseFloat(t.bedrag || 0), 0);

        const netto = huurInkomsten - onderhoudsKosten - overigeKosten;

        return `
            <tr>
                <td>${maand}</td>
                <td>€${huurInkomsten.toLocaleString('nl-NL')}</td>
                <td>€${onderhoudsKosten.toLocaleString('nl-NL')}</td>
                <td>€${overigeKosten.toLocaleString('nl-NL')}</td>
                <td style="font-weight: 600; color: ${netto >= 0 ? 'var(--success-color)' : 'var(--danger-color)'}">
                    €${netto.toLocaleString('nl-NL')}
                </td>
            </tr>
        `;
    }).join('');

    tbody.innerHTML = rows;
}

// Render recent transactions
function renderRecenteTransacties() {
    const recenteInkomsten = transacties
        .filter(t => t.type === 'inkomst')
        .sort((a, b) => new Date(b.datum) - new Date(a.datum))
        .slice(0, 5);

    const recenteUitgaven = transacties
        .filter(t => t.type === 'uitgave')
        .sort((a, b) => new Date(b.datum) - new Date(a.datum))
        .slice(0, 5);

    // Render inkomsten
    const inkomstenContainer = document.getElementById('recenteInkomsten');
    if (recenteInkomsten.length === 0) {
        inkomstenContainer.innerHTML = '<p class="empty-state">Geen recente inkomsten</p>';
    } else {
        inkomstenContainer.innerHTML = recenteInkomsten.map(t => `
            <div class="list-item" onclick="viewTransactieDetail('${t.id}')" style="padding: 12px 0; border-bottom: 1px solid var(--border-color); cursor: pointer;">
                <div style="display: flex; justify-content: space-between;">
                    <div>
                        <strong>${t.omschrijving || t.beschrijving}</strong>
                        <p style="font-size: 12px; color: var(--text-muted);">
                            ${new Date(t.datum).toLocaleDateString('nl-NL')}
                        </p>
                    </div>
                    <strong style="color: var(--success-color);">€${parseFloat(t.bedrag).toLocaleString('nl-NL')}</strong>
                </div>
            </div>
        `).join('');
    }

    // Render uitgaven
    const uitgavenContainer = document.getElementById('recenteUitgaven');
    if (recenteUitgaven.length === 0) {
        uitgavenContainer.innerHTML = '<p class="empty-state">Geen recente uitgaven</p>';
    } else {
        uitgavenContainer.innerHTML = recenteUitgaven.map(t => `
            <div class="list-item" onclick="viewTransactieDetail('${t.id}')" style="padding: 12px 0; border-bottom: 1px solid var(--border-color); cursor: pointer;">
                <div style="display: flex; justify-content: space-between;">
                    <div>
                        <strong>${t.omschrijving || t.beschrijving}</strong>
                        <p style="font-size: 12px; color: var(--text-muted);">
                            ${new Date(t.datum).toLocaleDateString('nl-NL')}
                        </p>
                    </div>
                    <strong style="color: var(--danger-color);">€${parseFloat(t.bedrag).toLocaleString('nl-NL')}</strong>
                </div>
            </div>
        `).join('');
    }
}

// Open modal for new transaction
addInkomstBtn.addEventListener('click', () => {
    openTransactieModal('inkomst');
});

addUitgaveBtn.addEventListener('click', () => {
    openTransactieModal('uitgave');
});

function openTransactieModal(type) {
    document.getElementById('modalTitle').textContent = type === 'inkomst' ? 'Nieuwe Inkomst' : 'Nieuwe Uitgave';
    transactieForm.reset();
    document.getElementById('transactieId').value = '';
    document.getElementById('transactieType').value = type;
    document.getElementById('datum').value = new Date().toISOString().split('T')[0];
    modal.classList.add('show');
}

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

// Save transaction
transactieForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const transactieData = {
        type: document.getElementById('transactieType').value,
        beschrijving: document.getElementById('beschrijving').value,
        bedrag: parseFloat(document.getElementById('bedrag').value),
        datum: document.getElementById('datum').value,
        categorie: document.getElementById('categorie').value,
        notities: document.getElementById('notities').value
    };

    const transactieId = document.getElementById('transactieId').value;

    try {
        if (transactieId) {
            await dbUpdate('transacties', transactieId, transactieData);
        } else {
            await dbAdd('transacties', transactieData);
        }

        closeModalWindow();
        await loadAllData();
    } catch (error) {
        console.error('Error saving transaction:', error);
        alert('Fout bij het opslaan van de transactie');
    }
});

// Year filter
jaarFilter.addEventListener('change', async (e) => {
    currentYear = parseInt(e.target.value);
    await loadAllData();
});

// View transactie detail in side panel
function viewTransactieDetail(transactieId) {
    const transactie = transacties.find(t => t.id === transactieId);
    if (!transactie) return;
    
    if (typeof showDetailPanel === 'function') {
        showDetailPanel('transactie', transactie);
    }
}

window.viewTransactieDetail = viewTransactieDetail;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await ensureAuthenticated();
        jaarFilter.value = currentYear;
        await loadAllData();
    } catch (error) {
        console.error('Initialization error:', error);
    }
});
